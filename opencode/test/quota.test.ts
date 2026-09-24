import assert from "node:assert/strict"
import {
  QUOTA_SOURCES,
  activeQuotaSources,
  calendarMonth,
  credentialFromValue,
  monthlyCostRange,
  resolveComparison,
  type ProviderQuota,
  type QuotaSource,
} from "../plugins/quota/sources.ts"

let failures = 0

async function check(name: string, test: () => void | Promise<void>) {
  try {
    await test()
    console.log(`ok   ${name}`)
  } catch (error) {
    console.error(
      `FAIL ${name}: ${error instanceof Error ? error.message : error}`,
    )
    failures += 1
  }
}

function source(id: string, overrides: Partial<QuotaSource> = {}): QuotaSource {
  return {
    id,
    label: id,
    integrationIDs: [id],
    providerIDs: [id],
    load: async () => ({ id, label: id, windows: [] }),
    costRange: (_provider, { now }) => ({
      start: now - 1,
      end: now,
      approximate: false,
    }),
    ...overrides,
  }
}

function sourceIDs(entries: ReturnType<typeof activeQuotaSources>) {
  return entries.map((entry) => entry.source.id)
}

await check("inactive providers produce no sources", () => {
  const inactive = source("inactive")
  let loads = 0
  inactive.load = async () => {
    loads += 1
    return { id: inactive.id, label: inactive.label, windows: [] }
  }

  const selected = activeQuotaSources([inactive], {
    integrations: [
      { id: "inactive", connections: [{ type: "credential", id: "saved" }] },
    ],
    providers: [],
  })
  void Promise.all(
    selected.map((entry) =>
      entry.source.load({ now: Date.now(), credential: undefined }),
    ),
  )

  assert.deepEqual(selected, [])
  assert.equal(loads, 0)
})

await check(
  "only the selected active connection makes a source visible",
  () => {
    const selected = activeQuotaSources(QUOTA_SOURCES, {
      providers: [
        { id: "opencode-go", integrationID: "opencode-go" },
        { id: "openai", integrationID: "openai" },
        { id: "google-vertex", integrationID: "google-vertex" },
      ],
      integrations: [
        {
          id: "opencode-go",
          connections: [{ type: "credential", id: "go", label: "API key" }],
        },
        {
          id: "openai",
          connections: [
            { type: "env", name: "OPENAI_API_KEY" },
            { type: "credential", id: "saved-oauth", label: "OAuth" },
          ],
        },
        { id: "google", connections: [] },
        {
          id: "google-vertex",
          connections: [{ type: "env", name: "GOOGLE_VERTEX_API_KEY" }],
        },
      ],
    })

    assert.deepEqual(sourceIDs(selected), ["opencode-go", "google"])
    assert.deepEqual(selected[1]?.providerIDs, ["google-vertex"])
  },
)

await check(
  "OpenAI pay-as-you-go keys do not masquerade as subscriptions",
  () => {
    const oauth = activeQuotaSources(QUOTA_SOURCES, {
      providers: [{ id: "openai", integrationID: "openai" }],
      integrations: [
        {
          id: "openai",
          connections: [{ type: "credential", id: "oauth", label: "OAuth" }],
        },
      ],
    })
    const apiKey = activeQuotaSources(QUOTA_SOURCES, {
      providers: [{ id: "openai", integrationID: "openai" }],
      integrations: [
        {
          id: "openai",
          connections: [{ type: "env", name: "OPENAI_API_KEY" }],
        },
      ],
    })

    assert.deepEqual(sourceIDs(oauth), ["openai"])
    assert.deepEqual(apiKey, [])
  },
)

await check("provider metadata maps an alias to its integration", () => {
  const copilot = source("github-copilot", {
    label: "GitHub Copilot",
    providerIDs: ["copilot-models"],
    comparison: { kind: "plan", defaultMonthly: 10 },
  })
  const selected = activeQuotaSources([copilot], {
    integrations: [
      {
        id: "github-copilot",
        connections: [{ type: "credential", id: "copilot", label: "OAuth" }],
      },
    ],
    providers: [{ id: "copilot-models", integrationID: "github-copilot" }],
  })

  assert.deepEqual(sourceIDs(selected), ["github-copilot"])
  assert.deepEqual(selected[0]?.providerIDs, ["copilot-models"])
})

await check("V2 credential values resolve into safe adapter inputs", () => {
  assert.deepEqual(
    credentialFromValue(JSON.stringify({ type: "key", key: "test-key" })),
    { type: "key", key: "test-key", metadata: undefined },
  )
  assert.deepEqual(
    credentialFromValue({
      type: "oauth",
      access: "test-access",
      refresh: "test-refresh",
      expires: 123,
      metadata: { accountID: "test-account" },
    }),
    {
      type: "oauth",
      access: "test-access",
      refresh: "test-refresh",
      expires: 123,
      metadata: { accountID: "test-account" },
    },
  )
  assert.equal(credentialFromValue({ type: "oauth" }), undefined)
})

await check("Google uses only an explicit calendar-month budget", () => {
  const google = QUOTA_SOURCES.find((candidate) => candidate.id === "google")
  assert.ok(google)
  assert.deepEqual(google.providerIDs, [
    "google",
    "google-vertex",
    "google-vertex-anthropic",
  ])
  assert.equal(resolveComparison(google, {}), undefined)
  assert.deepEqual(resolveComparison(google, { credit: { google: 25 } }), {
    kind: "credit",
    amount: 25,
  })

  const provider: ProviderQuota = {
    id: "google",
    label: "Google / Vertex",
    windows: [],
  }
  google.finalize?.(provider, {
    providers: [provider],
    now: Date.UTC(2026, 8, 24),
  })
  assert.equal(provider.windows.length, 0)

  provider.apiCost = 40
  provider.comparison = { kind: "credit", amount: 25 }
  provider.unpricedTokens = 1
  google.finalize?.(provider, {
    providers: [provider],
    now: Date.UTC(2026, 8, 24),
  })
  assert.equal(provider.windows.length, 0)

  provider.unpricedTokens = 0
  google.finalize?.(provider, {
    providers: [provider],
    now: Date.UTC(2026, 8, 24),
  })
  assert.equal(provider.windows[0]?.name, "Calendar month")
  assert.equal(provider.windows[0]?.remaining, 0)
  assert.equal(provider.windows[0]?.resetsAt, Date.UTC(2026, 9, 1))
})

await check("billing ranges are explicit", () => {
  const now = Date.UTC(2026, 8, 24, 12)
  const month = calendarMonth(now)
  assert.equal(month.start, Date.UTC(2026, 8, 1))
  assert.equal(month.end, now)
  assert.equal(month.approximate, false)

  const go: ProviderQuota = {
    id: "opencode-go",
    label: "OpenCode Go",
    windows: [
      { name: "Monthly", remaining: 50, resetsAt: Date.UTC(2026, 9, 15) },
    ],
  }
  const cycle = monthlyCostRange(go, now)
  assert.equal(cycle.start, Date.UTC(2026, 8, 15))
  assert.equal(cycle.end, now)
  assert.equal(cycle.approximate, false)
  assert.equal(monthlyCostRange(undefined, now).approximate, true)
})

if (failures) {
  console.error(`${failures} test(s) failed`)
  process.exit(1)
}
console.log("all quota checks passed")
