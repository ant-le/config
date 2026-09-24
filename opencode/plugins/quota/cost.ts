// API-equivalent cost for a provider over one billing range.
//
// Reads OpenCode's own usage database (read-only) and prices the tokens at
// current Models.dev list rates, so subscription usage can be compared with
// pay-as-you-go API pricing.
//
// This mirrors the logic in plugins/cost-estimate.ts (same DB, same pricing
// rules) but stays self-contained and is scoped to one subscription and range.
import { openDatabase } from "./database"

export type CostRange = { start: number; end: number }

type Rate = {
  input?: number
  output?: number
  reasoning?: number
  cache_read?: number
  cache_write?: number
  context_over_200k?: Rate
  tiers?: Array<Rate & { tier?: { type?: string; size?: number } }>
}

type Catalog = Record<
  string,
  { models?: Record<string, { id?: string; cost?: Rate }> }
>

type UsageRow = {
  created: number
  providerID: string
  modelID: string
  input: number
  output: number
  reasoning: number
  cacheRead: number
  cacheWrite: number
}

const CATALOG_TTL_MS = 15 * 60 * 1000
const COST_TTL_MS = 5 * 60 * 1000

let catalogCache: { value: Catalog; expires: number } | undefined
const costCache = new Map<
  string,
  { at: number; start: number; result: ProviderApiCost }
>()

export type ProviderApiCost = {
  total: number
  unpricedTokens: number
}

async function loadCatalog(): Promise<Catalog> {
  if (catalogCache && catalogCache.expires > Date.now())
    return catalogCache.value
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(new Error("models.dev timed out")),
    10_000,
  )
  try {
    const response = await fetch("https://models.dev/api.json", {
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`models.dev HTTP ${response.status}`)
    const value = (await response.json()) as Catalog
    catalogCache = { value, expires: Date.now() + CATALOG_TTL_MS }
    return value
  } finally {
    clearTimeout(timeout)
  }
}

// V2 canonical store is session_message; the legacy `message` table is a
// compatibility mirror. Union both, keep one row per message id preferring the
// V2 row, so migration-era and pre-migration usage each count exactly once.
const USAGE_SQL = `
  SELECT * FROM (
    SELECT sm.id AS id, sm.time_created AS created,
      json_extract(sm.data, '$.model.providerID') AS providerID,
      json_extract(sm.data, '$.model.id') AS modelID,
      COALESCE(json_extract(sm.data, '$.tokens.input'), 0) AS input,
      COALESCE(json_extract(sm.data, '$.tokens.output'), 0) AS output,
      COALESCE(json_extract(sm.data, '$.tokens.reasoning'), 0) AS reasoning,
      COALESCE(json_extract(sm.data, '$.tokens.cache.read'), 0) AS cacheRead,
      COALESCE(json_extract(sm.data, '$.tokens.cache.write'), 0) AS cacheWrite,
      0 AS rank
    FROM session_message sm
    WHERE sm.type = 'assistant'
      AND sm.time_created >= ? AND sm.time_created < ?
      AND json_extract(sm.data, '$.model.providerID') = ?
    UNION ALL
    SELECT m.id AS id, m.time_created AS created,
      json_extract(m.data, '$.providerID') AS providerID,
      json_extract(m.data, '$.modelID') AS modelID,
      COALESCE(json_extract(m.data, '$.tokens.input'), 0) AS input,
      COALESCE(json_extract(m.data, '$.tokens.output'), 0) AS output,
      COALESCE(json_extract(m.data, '$.tokens.reasoning'), 0) AS reasoning,
      COALESCE(json_extract(m.data, '$.tokens.cache.read'), 0) AS cacheRead,
      COALESCE(json_extract(m.data, '$.tokens.cache.write'), 0) AS cacheWrite,
      1 AS rank
    FROM message m
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND m.time_created >= ? AND m.time_created < ?
      AND json_extract(m.data, '$.providerID') = ?
  )
  GROUP BY id
  ORDER BY created
`

function queryUsage(
  providerID: string,
  start: number,
  end: number,
): UsageRow[] {
  return openDatabase()
    .query(USAGE_SQL)
    .all(start, end, providerID, start, end, providerID) as UsageRow[]
}

function modelRates(catalog: Catalog, row: UsageRow): Rate | undefined {
  const models = catalog[row.providerID]?.models
  if (!models) return undefined
  const direct =
    models[row.modelID] || models[`${row.providerID}/${row.modelID}`]
  const model =
    direct ||
    Object.values(models).find(
      (item) =>
        item.id === row.modelID ||
        item.id === `${row.providerID}/${row.modelID}`,
    )
  if (!model?.cost) return undefined

  const contextTokens = row.input + row.cacheRead + row.cacheWrite
  const tier = model.cost.tiers
    ?.filter(
      (item) =>
        item.tier?.type === "context" &&
        contextTokens >= (item.tier?.size ?? Infinity),
    )
    .sort((a, b) => (b.tier?.size ?? 0) - (a.tier?.size ?? 0))[0]
  if (tier) return { ...model.cost, ...tier }
  if (contextTokens >= 200_000 && model.cost.context_over_200k) {
    return { ...model.cost, ...model.cost.context_over_200k }
  }
  return model.cost
}

function equivalentCost(row: UsageRow, rates?: Rate) {
  const components: Array<[number, number | undefined]> = [
    [row.input, rates?.input],
    [row.output, rates?.output],
    [row.reasoning, rates?.reasoning ?? rates?.output],
    [row.cacheRead, rates?.cache_read],
    [row.cacheWrite, rates?.cache_write],
  ]
  let cost = 0
  let unpricedTokens = 0
  for (const [tokens, rate] of components) {
    if (!tokens) continue
    if (typeof rate === "number" && Number.isFinite(rate)) {
      cost += (tokens * rate) / 1_000_000
    } else {
      unpricedTokens += tokens
    }
  }
  return { cost, unpricedTokens }
}

/** API-equivalent cost in USD, cached briefly for frequent UI refreshes. */
export async function providerApiCost(
  providerIDs: string | readonly string[],
  range: CostRange,
): Promise<ProviderApiCost> {
  const ids = [
    ...new Set(typeof providerIDs === "string" ? [providerIDs] : providerIDs),
  ].sort()
  if (ids.length === 0) return { total: 0, unpricedTokens: 0 }

  const cacheKey = ids.join("\u0000")
  const cached = costCache.get(cacheKey)
  if (
    cached &&
    Date.now() - cached.at < COST_TTL_MS &&
    Math.abs(cached.start - range.start) < COST_TTL_MS
  ) {
    return cached.result
  }

  const rows = ids.flatMap((providerID) =>
    queryUsage(providerID, range.start, range.end),
  )
  const catalog = await loadCatalog()

  const result: ProviderApiCost = { total: 0, unpricedTokens: 0 }
  for (const row of rows) {
    const rowCost = equivalentCost(row, modelRates(catalog, row))
    result.total += rowCost.cost
    result.unpricedTokens += rowCost.unpricedTokens
  }

  costCache.set(cacheKey, { at: Date.now(), start: range.start, result })
  return result
}
