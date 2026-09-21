import { Plugin } from "@opencode/plugin";
import { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { basename, isAbsolute, join } from "node:path";

type GroupBy =
  "day" | "week" | "month" | "provider" | "model" | "project" | "session";

type UsageRow = {
  sessionID: string;
  sessionTitle: string;
  directory: string;
  projectID: string;
  projectName: string | null;
  worktree: string;
  created: number;
  providerID: string;
  modelID: string;
  recordedCost: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
};

type Rates = {
  input?: number;
  output?: number;
  reasoning?: number;
  cache_read?: number;
  cache_write?: number;
  context_over_200k?: Rates;
  tiers?: Array<Rates & { tier: { type: "context"; size: number } }>;
};

type Catalog = Record<
  string,
  { models?: Record<string, { id?: string; cost?: Rates }> }
>;

type Totals = {
  calls: number;
  recorded: number;
  equivalent: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
  unpricedInput: number;
  unpricedOutput: number;
  unpricedReasoning: number;
  unpricedCacheRead: number;
  unpricedCacheWrite: number;
};

type Group = { label: string; totals: Totals };

type Range = { start: Date; end: Date; label: string };

let catalogCache: { value: Catalog; expires: number } | undefined;

const emptyTotals = (): Totals => ({
  calls: 0,
  recorded: 0,
  equivalent: 0,
  input: 0,
  output: 0,
  reasoning: 0,
  cacheRead: 0,
  cacheWrite: 0,
  unpricedInput: 0,
  unpricedOutput: 0,
  unpricedReasoning: 0,
  unpricedCacheRead: 0,
  unpricedCacheWrite: 0,
});

function startOfDay(value: Date) {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function parseBoundary(value: string, end: boolean) {
  const trimmed = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const parsed = dateOnly ? new Date(`${trimmed}T00:00:00`) : new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${trimmed}`);
  if (dateOnly) {
    const [year, month, day] = trimmed.split("-").map(Number);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() + 1 !== month ||
      parsed.getDate() !== day
    ) {
      throw new Error(`Invalid calendar date: ${trimmed}`);
    }
  }
  return end && dateOnly ? addDays(parsed, 1) : parsed;
}

function subtractMonths(value: Date, months: number) {
  const result = new Date(value);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() - months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function parseRange(input: string | undefined): Range {
  const now = new Date();
  const value = (input || "month").trim().toLowerCase();
  if (value === "all") return { start: new Date(0), end: now, label: "all time" };

  if (value.includes("..")) {
    const [rawStart, rawEnd, extra] = value.split("..");
    if (!rawStart || !rawEnd || extra !== undefined) {
      throw new Error("Explicit ranges must use START..END");
    }
    const start = parseBoundary(rawStart, false);
    const end = parseBoundary(rawEnd, true);
    if (start >= end) throw new Error("Range start must be before range end");
    return { start, end, label: input! };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const start = parseBoundary(value, false);
    return { start, end: addDays(start, 1), label: value };
  }

  if (value === "today" || value === "day") {
    return { start: startOfDay(now), end: now, label: "today" };
  }
  if (value === "yesterday") {
    const end = startOfDay(now);
    return { start: addDays(end, -1), end, label: "yesterday" };
  }
  if (value === "week" || value === "this week") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return { start, end: now, label: "this week" };
  }
  if (value === "month" || value === "this month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
      label: "this month",
    };
  }

  const relative = value.match(
    /^(?:last\s+)?(\d+)\s*(h|hours?|d|days?|w|weeks?|mo|months?)$/,
  );
  if (!relative) {
    throw new Error(
      "Unsupported range. Use today, yesterday, week, month, all, 24h, 7d, last 3 months, YYYY-MM-DD, or START..END.",
    );
  }
  const amount = Number(relative[1]);
  if (amount < 1) throw new Error("Relative range must be at least 1");
  const unit = relative[2];
  let start = new Date(now);
  if (unit.startsWith("h"))
    start = new Date(now.getTime() - amount * 60 * 60 * 1000);
  else if (unit === "mo" || unit.startsWith("month"))
    start = subtractMonths(now, amount);
  else start.setDate(start.getDate() - amount * (unit.startsWith("w") ? 7 : 1));
  return { start, end: now, label: input! };
}

function databasePath() {
  const dataHome = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  const configured = process.env.OPENCODE_DB;
  if (!configured) return join(dataHome, "opencode", "opencode.db");
  if (configured === ":memory:") {
    throw new Error(
      "Cost analysis is unavailable when OPENCODE_DB=:memory: because tool connections cannot access OpenCode's in-memory database.",
    );
  }
  return isAbsolute(configured)
    ? configured
    : join(dataHome, "opencode", configured);
}

function dateKey(timestamp: number, groupBy: GroupBy) {
  const date = startOfDay(new Date(timestamp));
  if (groupBy === "week")
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  if (groupBy === "month") date.setDate(1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function groupIdentity(row: UsageRow, groupBy: GroupBy) {
  if (groupBy === "day" || groupBy === "week" || groupBy === "month") {
    const date = dateKey(row.created, groupBy);
    return { key: date, label: date };
  }
  if (groupBy === "provider")
    return { key: row.providerID, label: row.providerID };
  if (groupBy === "model") {
    const model = `${row.providerID}/${row.modelID}`;
    return { key: model, label: model };
  }
  if (groupBy === "project") {
    return {
      key: row.projectID,
      label: `${row.projectName || basename(row.worktree) || row.projectID} (${row.projectID.slice(0, 8)})`,
    };
  }
  return {
    key: row.sessionID,
    label: `${row.sessionTitle || "Untitled"} (${row.sessionID.slice(0, 12)})`,
  };
}

function modelRates(catalog: Catalog, row: UsageRow) {
  const models = catalog[row.providerID]?.models;
  if (!models) return undefined;
  const direct =
    models[row.modelID] || models[`${row.providerID}/${row.modelID}`];
  const model =
    direct ||
    Object.values(models).find(
      (item) =>
        item.id === row.modelID ||
        item.id === `${row.providerID}/${row.modelID}`,
    );
  if (!model?.cost) return undefined;

  const contextTokens = row.input + row.cacheRead + row.cacheWrite;
  const tier = model.cost.tiers
    ?.filter(
      (item) => item.tier?.type === "context" && contextTokens >= item.tier.size,
    )
    .sort((a, b) => b.tier.size - a.tier.size)[0];
  if (tier) return { ...model.cost, ...tier };
  if (contextTokens >= 200_000 && model.cost.context_over_200k) {
    return { ...model.cost, ...model.cost.context_over_200k };
  }
  return model.cost;
}

function addUsage(total: Totals, row: UsageRow, rates?: Rates) {
  total.calls += 1;
  total.recorded += row.recordedCost;
  total.input += row.input;
  total.output += row.output;
  total.reasoning += row.reasoning;
  total.cacheRead += row.cacheRead;
  total.cacheWrite += row.cacheWrite;

  const components: Array<[keyof UsageRow, number | undefined, keyof Totals]> = [
    ["input", rates?.input, "unpricedInput"],
    ["output", rates?.output, "unpricedOutput"],
    ["reasoning", rates?.reasoning ?? rates?.output, "unpricedReasoning"],
    ["cacheRead", rates?.cache_read, "unpricedCacheRead"],
    ["cacheWrite", rates?.cache_write, "unpricedCacheWrite"],
  ];
  for (const [field, rate, unpricedField] of components) {
    const tokenCount = row[field] as number;
    if (!tokenCount) continue;
    if (typeof rate === "number" && Number.isFinite(rate))
      total.equivalent += (tokenCount * rate) / 1_000_000;
    else total[unpricedField] += tokenCount;
  }
}

function money(value: number) {
  if (value === 0) return "$0.00";
  if (Math.abs(value) < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function tokens(value: number) {
  return value.toLocaleString("en-US");
}

function matches(value: string, filter: string | undefined) {
  return !filter || value.toLowerCase().includes(filter.toLowerCase());
}

function tableCell(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|");
}

async function loadCatalog() {
  if (catalogCache && catalogCache.expires > Date.now()) return catalogCache.value;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error("Models.dev request timed out")),
    10_000,
  );
  try {
    const response = await fetch("https://models.dev/api.json", {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const value = (await response.json()) as Catalog;
    catalogCache = { value, expires: Date.now() + 15 * 60 * 1000 };
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

type QueryContext = {
  sessionID: string;
  directory: string;
  worktree: string;
};

function queryUsage(
  args: Record<string, unknown>,
  context: QueryContext,
): { rows: UsageRow[]; range: Range; groupBy: GroupBy } {
  const range = parseRange(args.range as string | undefined);
  const groupBy = (args.group_by as GroupBy) || "day";
  const currentProject = args.project === "current";
  const currentSession = args.session === "current";
  const projectFilter = currentProject ? undefined : (args.project as string);
  const sessionFilter = currentSession ? undefined : (args.session as string);

  const db = new Database(databasePath(), { readonly: true });
  let rows: UsageRow[];
  try {
    // V2 canonical store is session_message; the legacy `message` table is a
    // compatibility mirror. Union both and keep one row per message id,
    // preferring the V2 row, so migration-era and pre-migration usage each
    // count exactly once.
    const tail = `${currentSession ? "AND s.id = ?" : ""}${
      currentProject ? "AND (p.worktree = ? OR s.directory = ?)" : ""
    }`;
    const extra = [
      ...(currentSession ? [context.sessionID] : []),
      ...(currentProject ? [context.worktree, context.directory] : []),
    ];
    rows = db
      .query(
        `SELECT * FROM (
           SELECT sm.id AS id,
             s.id AS sessionID, s.title AS sessionTitle, s.directory AS directory,
             p.id AS projectID, p.name AS projectName, p.worktree AS worktree,
             sm.time_created AS created,
             json_extract(sm.data, '$.model.providerID') AS providerID,
             json_extract(sm.data, '$.model.id') AS modelID,
             COALESCE(json_extract(sm.data, '$.cost'), 0) AS recordedCost,
             COALESCE(json_extract(sm.data, '$.tokens.input'), 0) AS input,
             COALESCE(json_extract(sm.data, '$.tokens.output'), 0) AS output,
             COALESCE(json_extract(sm.data, '$.tokens.reasoning'), 0) AS reasoning,
             COALESCE(json_extract(sm.data, '$.tokens.cache.read'), 0) AS cacheRead,
             COALESCE(json_extract(sm.data, '$.tokens.cache.write'), 0) AS cacheWrite,
             0 AS rank
           FROM session_message sm
           JOIN session s ON s.id = sm.session_id
           JOIN project p ON p.id = s.project_id
           WHERE sm.type = 'assistant' AND sm.time_created >= ? AND sm.time_created < ? ${tail}
           UNION ALL
           SELECT m.id AS id,
             s.id AS sessionID, s.title AS sessionTitle, s.directory AS directory,
             p.id AS projectID, p.name AS projectName, p.worktree AS worktree,
             m.time_created AS created,
             json_extract(m.data, '$.providerID') AS providerID,
             json_extract(m.data, '$.modelID') AS modelID,
             COALESCE(json_extract(m.data, '$.cost'), 0) AS recordedCost,
             COALESCE(json_extract(m.data, '$.tokens.input'), 0) AS input,
             COALESCE(json_extract(m.data, '$.tokens.output'), 0) AS output,
             COALESCE(json_extract(m.data, '$.tokens.reasoning'), 0) AS reasoning,
             COALESCE(json_extract(m.data, '$.tokens.cache.read'), 0) AS cacheRead,
             COALESCE(json_extract(m.data, '$.tokens.cache.write'), 0) AS cacheWrite,
             1 AS rank
           FROM message m
           JOIN session s ON s.id = m.session_id
           JOIN project p ON p.id = s.project_id
           WHERE json_extract(m.data, '$.role') = 'assistant' AND m.time_created >= ? AND m.time_created < ? ${tail}
         )
         GROUP BY id
         ORDER BY created`,
      )
      .all(
        range.start.getTime(),
        range.end.getTime(),
        ...extra,
        range.start.getTime(),
        range.end.getTime(),
        ...extra,
      ) as UsageRow[];
  } finally {
    db.close();
  }

  rows = rows.filter(
    (row) =>
      matches(row.providerID, args.provider as string | undefined) &&
      matches(row.modelID, args.model as string | undefined) &&
      matches(
        `${row.projectID} ${row.projectName || ""} ${row.worktree} ${row.directory}`,
        projectFilter,
      ) &&
      matches(`${row.sessionID} ${row.sessionTitle}`, sessionFilter),
  );

  return { rows, range, groupBy };
}

export default Plugin.define({
  id: "cost-estimate",
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "cost-estimate",
        description:
          "Analyze OpenCode token usage and cost by day, week, month, provider, model, project, or session. Compares recorded costs with current Models.dev API-equivalent prices and reports reasoning, cache, and unpriced tokens.",
        input: {
          type: "object",
          properties: {
            range: {
              type: "string",
              description:
                "Date range: today, yesterday, week, month, all, 24h, 7d, last 3 months, YYYY-MM-DD, or START..END",
            },
            group_by: {
              type: "string",
              enum: [
                "day",
                "week",
                "month",
                "provider",
                "model",
                "project",
                "session",
              ],
              description: "Aggregation dimension (default: day)",
            },
            provider: {
              type: "string",
              description: "Only provider IDs containing this value",
            },
            model: {
              type: "string",
              description: "Only model IDs containing this value",
            },
            project: {
              type: "string",
              description:
                "Project ID, name, or path; use current for this worktree",
            },
            session: {
              type: "string",
              description:
                "Session ID or title; use current for the active session",
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 500,
              description: "Maximum groups to display (default: 100)",
            },
          },
          additionalProperties: false,
        },
        async execute(input, toolContext) {
          const args = (input ?? {}) as Record<string, unknown>;
          const { rows, range, groupBy } = queryUsage(args, {
            sessionID: toolContext.sessionID,
            directory: ctx.location.directory,
            worktree: ctx.location.directory,
          });

          if (!rows.length) {
            return {
              content: `No assistant usage found for ${range.label} with the requested filters.`,
            };
          }

          let catalog: Catalog = {};
          let pricingWarning = "";
          try {
            catalog = await loadCatalog();
          } catch (error) {
            pricingWarning = `\n> Models.dev pricing unavailable (${error instanceof Error ? error.message : String(error)}); API-equivalent cost is incomplete.\n`;
          }

          const groups = new Map<string, Group>();
          const total = emptyTotals();
          for (const row of rows) {
            const rates = modelRates(catalog, row);
            const identity = groupIdentity(row, groupBy);
            const entry = groups.get(identity.key) || {
              label: identity.label,
              totals: emptyTotals(),
            };
            addUsage(entry.totals, row, rates);
            addUsage(total, row, rates);
            groups.set(identity.key, entry);
          }

          const temporal =
            groupBy === "day" || groupBy === "week" || groupBy === "month";
          const tokenTotal = (value: Totals) =>
            value.input +
            value.output +
            value.reasoning +
            value.cacheRead +
            value.cacheWrite;
          const sorted = [...groups.entries()].sort(([keyA, a], [keyB, b]) => {
            if (temporal) return keyA.localeCompare(keyB);
            return (
              b.totals.equivalent - a.totals.equivalent ||
              b.totals.recorded - a.totals.recorded ||
              tokenTotal(b.totals) - tokenTotal(a.totals) ||
              keyA.localeCompare(keyB)
            );
          });
          const limit = (args.limit as number) || 100;
          const visible = sorted.slice(0, limit);
          const lines = visible.map(([, group]) => {
            const value = group.totals;
            const unpriced =
              value.unpricedInput +
              value.unpricedOutput +
              value.unpricedReasoning +
              value.unpricedCacheRead +
              value.unpricedCacheWrite;
            return `| ${tableCell(group.label)} | ${tokens(value.calls)} | ${money(value.recorded)} | ${money(value.equivalent)} | ${tokens(value.input)} | ${tokens(value.output)} | ${tokens(value.reasoning)} | ${tokens(value.cacheRead)} | ${tokens(value.cacheWrite)} | ${tokens(unpriced)} |`;
          });
          const unpricedTotal =
            total.unpricedInput +
            total.unpricedOutput +
            total.unpricedReasoning +
            total.unpricedCacheRead +
            total.unpricedCacheWrite;
          const endDisplay = new Date(range.end.getTime() - 1);
          const dateFormat = new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          });

          await toolContext.progress({ title: `Costs by ${groupBy}` });
          return {
            content: `## OpenCode costs by ${groupBy}

**Range:** ${dateFormat.format(range.start)} to ${dateFormat.format(endDisplay)}  
**Calls:** ${tokens(total.calls)}  
**Recorded cost:** ${money(total.recorded)}  
**API-equivalent cost:** ${money(total.equivalent)} at current Models.dev prices${unpricedTotal ? " (partial)" : ""}  
**Tokens:** ${tokens(total.input)} input, ${tokens(total.output)} output, ${tokens(total.reasoning)} reasoning, ${tokens(total.cacheRead)} cache read, ${tokens(total.cacheWrite)} cache write
${pricingWarning}
| ${groupBy} | Calls | Recorded | API equivalent | Input | Output | Reasoning | Cache read | Cache write | Unpriced |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${lines.join("\n")}
${sorted.length > visible.length ? `\nShowing ${tokens(visible.length)} of ${tokens(sorted.length)} groups. Increase limit (maximum 500) to show more.\n` : ""}

${unpricedTotal ? `Unpriced tokens: ${tokens(total.unpricedInput)} input, ${tokens(total.unpricedOutput)} output, ${tokens(total.unpricedReasoning)} reasoning, ${tokens(total.unpricedCacheRead)} cache read, ${tokens(total.unpricedCacheWrite)} cache write. Missing rates are not treated as zero.` : "All nonzero token categories had a current published rate."}

Recorded cost is the value stored by OpenCode at request time. API equivalent is recalculated from current Models.dev per-million-token rates; reasoning uses its published rate or the output rate when no separate reasoning rate exists.`,
          };
        },
      });
    });
  },
});
