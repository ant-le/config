import type { CostRange } from "./cost"

export type QuotaWindow = {
  name: string
  remaining: number
  resetsAt?: number
  limited?: boolean
}

export type CostComparison = {
  kind: "plan" | "credit"
  amount: number
}

export type ProviderQuota = {
  id: string
  label: string
  windows: QuotaWindow[]
  apiCost?: number
  unpricedTokens?: number
  comparison?: CostComparison
  warning?: string
  error?: string
}

export type DisplayCostRange = CostRange & { approximate: boolean }

export type ActiveConnection =
  | { type: "credential"; id: string; label?: string }
  | { type: "env"; name: string }

export type ActiveIntegration = {
  id: string
  connections: readonly ActiveConnection[]
}

export type ActiveProvider = {
  id: string
  integrationID?: string
}

export type SourceCredential =
  | { type: "key"; key: string; metadata?: Record<string, unknown> }
  | {
      type: "oauth"
      access: string
      refresh: string
      expires: number
      metadata?: Record<string, unknown>
    }

export function credentialFromValue(
  input: unknown,
): SourceCredential | undefined {
  let value = input
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return undefined
    }
  }
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : undefined
  if (
    (record.type === "key" || record.type === "api") &&
    typeof record.key === "string"
  ) {
    return { type: "key", key: record.key, metadata }
  }
  if (
    record.type === "oauth" &&
    typeof record.access === "string" &&
    typeof record.refresh === "string" &&
    typeof record.expires === "number"
  ) {
    return {
      type: "oauth",
      access: record.access,
      refresh: record.refresh,
      expires: record.expires,
      metadata,
    }
  }
  return undefined
}

export type ConnectionSnapshot = {
  integrations: readonly ActiveIntegration[]
  providers: readonly ActiveProvider[]
}

type ComparisonDefinition = {
  kind: CostComparison["kind"]
  defaultMonthly?: number
}

export type SourceLoadContext = {
  credential?: SourceCredential
  now: number
  comparison?: CostComparison
}

export type SourceRangeContext = {
  providers: readonly ProviderQuota[]
  now: number
}

export type QuotaSource = {
  /** OpenCode integration IDs. At least one must have an active connection. */
  integrationIDs: readonly string[]
  /** Provider IDs whose local usage should be priced for this source. */
  providerIDs: readonly string[]
  id: string
  label: string
  comparison?: ComparisonDefinition
  /** Optional narrowing when an integration supports non-subscription connections. */
  acceptsConnection?: (connection: ActiveConnection) => boolean
  load: (context: SourceLoadContext) => Promise<ProviderQuota>
  costRange: (
    provider: ProviderQuota,
    context: SourceRangeContext,
  ) => DisplayCostRange
  finalize?: (provider: ProviderQuota, context: SourceRangeContext) => void
}

const GO_USAGE_URL = "https://opencode.ai/zen/go/v1/usage"
const OPENAI_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function jwtClaim(token: string, namespace: string, claim: string) {
  try {
    const part = token.split(".")[1]
    if (!part) return undefined
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded))?.[namespace]?.[claim]
  } catch {
    return undefined
  }
}

function resetFromWindow(window: any): number | undefined {
  if (typeof window?.reset_at === "number" && window.reset_at > 0) {
    return Math.round(window.reset_at * 1000)
  }
  if (
    typeof window?.reset_after_seconds === "number" &&
    window.reset_after_seconds > 0
  ) {
    return Date.now() + Math.round(window.reset_after_seconds * 1000)
  }
  return undefined
}

function durationLabel(seconds: number) {
  if (seconds === 18_000) return "5h"
  if (seconds === 604_800) return "Weekly"
  const hours = Math.round(seconds / 3600)
  return hours >= 24 ? `${Math.round(hours / 24)}d` : `${hours}h`
}

async function fetchGo(credential?: SourceCredential): Promise<ProviderQuota> {
  const id = "opencode-go"
  const label = "OpenCode Go"
  if (credential?.type !== "key") {
    return { id, label, windows: [], error: "active API key unavailable" }
  }
  const key = credential.key

  try {
    const response = await fetch(GO_USAGE_URL, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    })
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      if (response.status === 403 && text.includes("EntitlementError")) {
        return { id, label, windows: [], error: "not subscribed" }
      }
      return { id, label, windows: [], error: `HTTP ${response.status}` }
    }

    const data: any = await response.json()
    const usage = data?.usage ?? {}
    const windows: QuotaWindow[] = []
    for (const [key, name] of [
      ["rolling", "5h"],
      ["weekly", "Weekly"],
      ["monthly", "Monthly"],
    ] as const) {
      const window = usage[key]
      if (typeof window?.percent !== "number") continue
      windows.push({
        name,
        remaining: clamp(100 - window.percent),
        resetsAt:
          typeof window.resetsAt === "string"
            ? Date.parse(window.resetsAt)
            : undefined,
        limited: window.status === "rate-limited",
      })
    }
    if (!windows.length)
      return { id, label, windows: [], error: "unexpected response" }
    return { id, label, windows }
  } catch (error) {
    return { id, label, windows: [], error: message(error) }
  }
}

async function fetchOpenAI(
  credential?: SourceCredential,
): Promise<ProviderQuota> {
  const id = "openai"
  const label = "OpenAI"
  if (credential?.type !== "oauth") {
    return {
      id,
      label,
      windows: [],
      error: "active OAuth connection unavailable",
    }
  }
  const access = credential.access
  if (Date.now() > credential.expires) {
    return {
      id,
      label,
      windows: [],
      error: "token expired — use OpenAI once to refresh",
    }
  }

  const metadataAccountID = credential.metadata?.accountID
  const accountId =
    (typeof metadataAccountID === "string" ? metadataAccountID : undefined) ??
    jwtClaim(access, "https://api.openai.com/auth", "chatgpt_account_id")
  const headers: Record<string, string> = {
    Authorization: `Bearer ${access}`,
    Accept: "application/json",
  }
  if (accountId) headers["ChatGPT-Account-Id"] = String(accountId)

  try {
    const response = await fetch(OPENAI_USAGE_URL, { headers })
    if (response.status === 401 || response.status === 403) {
      return {
        id,
        label,
        windows: [],
        error: "session expired — sign in again",
      }
    }
    if (!response.ok)
      return { id, label, windows: [], error: `HTTP ${response.status}` }

    const data: any = await response.json()
    const windows: QuotaWindow[] = []
    for (const field of ["primary_window", "secondary_window"] as const) {
      const window = data?.rate_limit?.[field]
      if (typeof window?.used_percent !== "number") continue
      if (
        typeof window.limit_window_seconds !== "number" ||
        window.limit_window_seconds <= 0
      )
        continue
      windows.push({
        name: durationLabel(window.limit_window_seconds),
        remaining: clamp(100 - window.used_percent),
        resetsAt: resetFromWindow(window),
      })
    }
    if (!windows.length)
      return { id, label, windows: [], error: "unexpected response" }
    return { id, label, windows }
  } catch (error) {
    return { id, label, windows: [], error: message(error) }
  }
}

function subtractCalendarMonth(timestamp: number) {
  const date = new Date(timestamp)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() - 1)
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate()
  date.setUTCDate(Math.min(day, lastDay))
  return date.getTime()
}

export function monthlyCostRange(
  go: ProviderQuota | undefined,
  end: number,
): DisplayCostRange {
  const reset = go?.windows.find(
    (window) => window.name === "Monthly",
  )?.resetsAt
  if (typeof reset === "number" && Number.isFinite(reset) && reset > end) {
    const start = subtractCalendarMonth(reset)
    if (start < end) return { start, end, approximate: false }
  }
  return { start: subtractCalendarMonth(end), end, approximate: true }
}

export function calendarMonth(end: number): DisplayCostRange {
  const date = new Date(end)
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
  return { start, end, approximate: false }
}

function nextCalendarMonth(end: number) {
  const date = new Date(end)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
}

function comparisonAmount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0)
    return value
  if (!value || typeof value !== "object") return undefined
  const configured = value as {
    price?: unknown
    amount?: unknown
    value?: unknown
    period?: unknown
  }
  const amount = Number(
    configured.price ?? configured.amount ?? configured.value,
  )
  if (!Number.isFinite(amount) || amount < 0) return undefined
  if (
    configured.period !== undefined &&
    configured.period !== "month" &&
    configured.period !== "monthly"
  ) {
    return undefined
  }
  return amount
}

export function resolveComparison(
  source: QuotaSource,
  options: Record<string, any>,
): CostComparison | undefined {
  const definition = source.comparison
  if (!definition) return undefined
  const group =
    definition.kind === "plan" ? options.subscription : options.credit
  const configured = comparisonAmount(group?.[source.id])
  const amount = configured ?? definition.defaultMonthly
  if (amount === undefined || !Number.isFinite(amount) || amount < 0)
    return undefined
  return { kind: definition.kind, amount }
}

function finishGoogle(provider: ProviderQuota, { now }: SourceRangeContext) {
  if (
    typeof provider.apiCost !== "number" ||
    provider.unpricedTokens ||
    !provider.comparison
  ) {
    return
  }
  provider.windows.push({
    name: "Calendar month",
    remaining:
      provider.comparison.amount === 0
        ? 0
        : clamp(
            ((provider.comparison.amount - provider.apiCost) /
              provider.comparison.amount) *
              100,
          ),
    resetsAt: nextCalendarMonth(now),
  })
}

/**
 * Add a new subscription by appending one adapter here. The shared refresh
 * pipeline handles active-connection filtering, cost lookup, and rendering.
 */
export const QUOTA_SOURCES: readonly QuotaSource[] = [
  {
    id: "opencode-go",
    label: "OpenCode Go",
    integrationIDs: ["opencode-go", "opencode"],
    providerIDs: ["opencode-go"],
    comparison: { kind: "plan", defaultMonthly: 10 },
    load: ({ credential }) => fetchGo(credential),
    costRange: (provider, { now }) => monthlyCostRange(provider, now),
  },
  {
    id: "openai",
    label: "OpenAI",
    integrationIDs: ["openai"],
    providerIDs: ["openai"],
    comparison: { kind: "plan", defaultMonthly: 100 },
    acceptsConnection: (connection) =>
      connection.type === "credential" && /oauth/i.test(connection.label ?? ""),
    load: ({ credential }) => fetchOpenAI(credential),
    costRange: (_provider, { providers, now }) =>
      monthlyCostRange(
        providers.find((provider) => provider.id === "opencode-go"),
        now,
      ),
  },
  {
    // Google exposes neither prepaid balance nor a provider-reported cycle
    // here. The optional credit option is explicitly a calendar-month budget.
    id: "google",
    label: "Google / Vertex",
    integrationIDs: ["google", "google-vertex", "google-vertex-anthropic"],
    providerIDs: ["google", "google-vertex", "google-vertex-anthropic"],
    comparison: { kind: "credit" },
    load: () =>
      Promise.resolve({ id: "google", label: "Google / Vertex", windows: [] }),
    costRange: (_provider, { now }) => calendarMonth(now),
    finalize: finishGoogle,
  },
]

export type ActiveQuotaSource = {
  source: QuotaSource
  providerIDs: string[]
  connection: ActiveConnection
}

export function activeQuotaSources(
  sources: readonly QuotaSource[],
  snapshot: ConnectionSnapshot,
): ActiveQuotaSource[] {
  const integrations = new Map(
    snapshot.integrations.map((integration) => [integration.id, integration]),
  )
  const providers = new Map(
    snapshot.providers.map((provider) => [provider.id, provider]),
  )

  return sources.flatMap((source) => {
    const activeProviders = source.providerIDs.flatMap((providerID) => {
      const provider = providers.get(providerID)
      return provider ? [provider] : []
    })
    if (activeProviders.length === 0) return []

    for (const provider of activeProviders) {
      const integrationID =
        provider.integrationID ??
        (source.integrationIDs.length === 1
          ? source.integrationIDs[0]
          : undefined)
      if (!integrationID || !source.integrationIDs.includes(integrationID))
        continue
      // OpenCode orders integrations with the selected connection first; later
      // entries are saved alternatives and must not make a source visible.
      const connection = integrations.get(integrationID)?.connections[0]
      if (!connection) continue
      if (source.acceptsConnection && !source.acceptsConnection(connection))
        continue
      return [
        {
          source,
          providerIDs: activeProviders.map(
            (activeProvider) => activeProvider.id,
          ),
          connection,
        },
      ]
    }
    return []
  })
}
