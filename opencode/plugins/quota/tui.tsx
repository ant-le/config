/** @jsxImportSource @opentui/solid */
//
// OpenCode V2 CLI plugin: provider quota in the session sidebar.
//
// Each subscription is implemented as one adapter in ./sources.ts. The
// shared refresh pipeline only loads adapters with an active OpenCode
// integration connection and active provider, prices their local usage, and
// renders the result. Adding another subscription therefore does not require
// changes to this file.
//
// Surfaces: `sidebar.content` only, plus /quota and a palette refresh command.
import { Plugin, usePlugin } from "@opencode/plugin/tui"
import { createSignal, For, Show } from "solid-js"
import { resolveConnectionCredential } from "./connections"
import { providerApiCost } from "./cost"
import {
  QUOTA_SOURCES,
  activeQuotaSources,
  resolveComparison,
  type ActiveIntegration,
  type ActiveProvider,
  type ProviderQuota,
} from "./sources"

const REFRESH_MS = 60_000
// The session sidebar's content area is a fixed ~37 columns wide regardless of
// terminal size, so the bar length is a constant that leaves room for the
// right-aligned percentage.
const BAR_WIDTH = 30
const DETAIL_INDENT = "  "

type Location = { directory: string }

type ConnectionClient = {
  provider: {
    list: (input: { location: Location }) => Promise<{ data: ActiveProvider[] }>
  }
  integration: {
    list: (input: {
      location: Location
    }) => Promise<{ data: ActiveIntegration[] }>
  }
}

type Quota = {
  providers: ProviderQuota[]
  costRange?: { approximate: boolean }
  error?: string
  updatedAt: number
}

const [quota, setQuota] = createSignal<Quota>({ providers: [], updatedAt: 0 })
const [loading, setLoading] = createSignal(false)

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function createRefresher(
  client: ConnectionClient,
  location: Location,
  options: Record<string, any>,
) {
  let inFlight: Promise<void> | undefined

  return function refresh(): Promise<void> {
    if (inFlight) return inFlight
    setLoading(true)
    inFlight = (async () => {
      const now = Date.now()
      try {
        const [providerResponse, integrationResponse] = await Promise.all([
          client.provider.list({ location }),
          client.integration.list({ location }),
        ])
        const activeSources = activeQuotaSources(QUOTA_SOURCES, {
          providers: providerResponse.data,
          integrations: integrationResponse.data,
        })

        if (activeSources.length === 0) {
          setQuota({ providers: [], updatedAt: now })
          return
        }

        const providers = await Promise.all(
          activeSources.map(async ({ source, connection }) => {
            const comparison = resolveComparison(source, options)
            const credential = resolveConnectionCredential(connection)
            try {
              const provider = await source.load({
                credential,
                now,
                comparison,
              })
              provider.comparison ??= comparison
              return provider
            } catch (error) {
              return {
                id: source.id,
                label: source.label,
                windows: [],
                comparison,
                error: message(error),
              }
            }
          }),
        )

        const ranges = await Promise.all(
          activeSources.map(async ({ source, providerIDs }, index) => {
            const provider = providers[index]!
            const range = source.costRange(provider, { providers, now })
            try {
              const result = await providerApiCost(providerIDs, range)
              provider.apiCost = result.total
              provider.unpricedTokens = result.unpricedTokens
              if (result.unpricedTokens > 0) {
                provider.warning = "pricing partial"
              }
            } catch {
              provider.warning = "pricing unavailable"
            }
            source.finalize?.(provider, { providers, now })
            return range
          }),
        )
        const approximate = ranges.some((range) => range.approximate)
        setQuota({ providers, costRange: { approximate }, updatedAt: now })
      } catch (error) {
        setQuota({ providers: [], error: message(error), updatedAt: now })
      }
    })().finally(() => {
      setLoading(false)
      inFlight = undefined
    })
    return inFlight
  }
}

function comparisonLabel(provider: ProviderQuota) {
  if (!provider.comparison) return undefined
  const amount = provider.comparison.amount
  const value = Number.isInteger(amount)
    ? `$${amount}*`
    : `$${amount.toFixed(2)}*`
  const kind = provider.comparison.kind === "credit" ? "Budget" : "Plan"
  return { kind, value }
}

function providerCostLabel(provider: ProviderQuota): string | undefined {
  if (typeof provider.apiCost !== "number") return undefined
  const comparison = comparisonLabel(provider)
  const api = `API ${provider.unpricedTokens ? "≥ " : ""}${money(provider.apiCost)}`
  return comparison ? `${api} · ${comparison.kind} ${comparison.value}` : api
}

function hasApiCost(providers: readonly ProviderQuota[]) {
  return providers.some(
    (provider) =>
      typeof provider.apiCost === "number" ||
      typeof provider.warning === "string",
  )
}

function countdown(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "now"
  const minutes = Math.floor(ms / 60_000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}d${hours}h`
  if (hours > 0) return `${hours}h${mins}m`
  return `${mins}m`
}

function money(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function bar(percentRemaining: number, width: number) {
  const percent = Math.max(0, Math.min(100, Math.round(percentRemaining)))
  const filled = Math.round((percent / 100) * width)
  return "▬".repeat(filled) + "─".repeat(Math.max(0, width - filled))
}

function resetText(providerWindow: ProviderQuota["windows"][number]) {
  if (providerWindow.limited) return "rate-limited"
  if (!providerWindow.resetsAt) return undefined
  return countdown(providerWindow.resetsAt - Date.now())
}

function toHex(token: any): string | undefined {
  const buffer = token?.buffer
  if (!buffer || typeof buffer[0] !== "number") return undefined
  const hex = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0")
  return `#${hex(buffer[0])}${hex(buffer[1])}${hex(buffer[2])}`
}

function WindowRow(props: { window: ProviderQuota["windows"][number] }) {
  const context = usePlugin()
  const muted = () => toHex((context.theme as any).text?.muted)
  const base = () => toHex((context.theme as any).text?.base)
  const percent = () => `${Math.round(props.window.remaining)}%`.padStart(4)

  return (
    <box flexDirection="column">
      <box flexDirection="row">
        <text fg={muted()}>
          {DETAIL_INDENT}
          {props.window.name}
        </text>
        <box flexGrow={1} />
        <text fg={muted()}>{resetText(props.window) ?? ""}</text>
      </box>
      <box flexDirection="row">
        <text fg={muted()}>
          {DETAIL_INDENT}
          {bar(props.window.remaining, BAR_WIDTH)}
        </text>
        <box flexGrow={1} />
        <text fg={base()}>{percent()}</text>
      </box>
    </box>
  )
}

function QuotaPanel(props: { visible: boolean; onToggle: () => void }) {
  const context = usePlugin()
  const base = () => toHex((context.theme as any).text?.base)
  const muted = () => toHex((context.theme as any).text?.muted)
  // Same treatment as the MCP sidebar rows: a status dot, green when healthy,
  // red when the provider errored.
  const dot = (provider: ProviderQuota) => {
    const feedback = (context.theme as any).text?.feedback
    return toHex(
      provider.error ? feedback?.error?.base : feedback?.success?.base,
    )
  }

  return (
    <box flexDirection="column">
      <box flexDirection="row" onMouseDown={props.onToggle}>
        <text fg={props.visible ? base() : muted()}>
          {props.visible ? <b>Quota</b> : "Quota"}
        </text>
        <box flexGrow={1} />
      </box>
      <Show when={props.visible}>
        <Show
          when={quota().updatedAt > 0}
          fallback={
            <text fg={muted()}> {loading() ? "loading…" : "no data"}</text>
          }
        >
          <Show
            when={!quota().error}
            fallback={<text fg={muted()}> {quota().error}</text>}
          >
            <Show
              when={quota().providers.length > 0}
              fallback={<text fg={muted()}> no active connections</text>}
            >
              <Show when={hasApiCost(quota().providers)}>
                <text fg={muted()}> API costs · all local accounts</text>
                <Show when={quota().costRange?.approximate}>
                  <text fg={muted()}> Range: trailing month (approx.)</text>
                </Show>
              </Show>
              <For each={quota().providers}>
                {(provider, index) => (
                  <box flexDirection="column">
                    <Show when={index() > 0}>
                      <text> </text>
                    </Show>
                    <box flexDirection="row">
                      <text fg={dot(provider)}>•</text>
                      <text fg={base()}>
                        {" "}
                        <b>{provider.label}</b>
                      </text>
                      <box flexGrow={1} />
                      {(() => {
                        if (typeof provider.apiCost !== "number") return null
                        const comparison = comparisonLabel(provider)
                        return (
                          <>
                            <text fg={muted()}>
                              API {provider.unpricedTokens ? "≥ " : ""}
                            </text>
                            <text fg={base()}>{money(provider.apiCost)}</text>
                            {comparison ? (
                              <>
                                <text fg={muted()}> · {comparison.kind} </text>
                                <text fg={base()}>{comparison.value}</text>
                              </>
                            ) : null}
                          </>
                        )
                      })()}
                    </box>
                    {provider.warning ? (
                      <text fg={muted()}>
                        {DETAIL_INDENT}
                        {provider.warning}
                      </text>
                    ) : null}
                    {provider.error ? (
                      <text fg={muted()}>
                        {DETAIL_INDENT}
                        {provider.error}
                      </text>
                    ) : (
                      <For each={provider.windows}>
                        {(window) => <WindowRow window={window} />}
                      </For>
                    )}
                  </box>
                )}
              </For>
            </Show>
          </Show>
        </Show>
      </Show>
    </box>
  )
}

function quotaText(state: Quota) {
  if (state.error) return `Unable to refresh active connections: ${state.error}`
  const lines: string[] = []
  if (hasApiCost(state.providers)) {
    lines.push("API costs include usage from all local provider accounts.")
    if (state.costRange?.approximate) {
      lines.push("Range: trailing month (approx.)")
    }
    lines.push("")
  }
  for (const provider of state.providers) {
    const label = providerCostLabel(provider)
    lines.push(`${provider.label}${label ? `   ${label}` : ""}`)
    if (provider.warning) lines.push(`  ${provider.warning}`)
    if (provider.error) lines.push(`  ${provider.error}`)
    for (const providerWindow of provider.windows) {
      const pct = `${Math.round(providerWindow.remaining)}%`
      const reset = resetText(providerWindow)
      lines.push(
        `  ${providerWindow.name.padEnd(8)} ${pct.padStart(4)}${reset ? `   (${reset})` : ""}`,
      )
    }
  }
  if (!state.providers.length) lines.push("No active quota connections.")
  return lines.join("\n")
}

export default Plugin.define({
  id: "quota.sidebar",
  setup(context) {
    const location = context.location ?? context.data.location.default()
    const refresh = createRefresher(
      context.client,
      location,
      (context.options ?? {}) as Record<string, any>,
    )

    const [settings, updateSettings] = context.storage.store("quota", {
      initial: { visible: true },
    })

    const toggle = async () => {
      await updateSettings((draft) => {
        draft.visible = !draft.visible
      })
    }

    const disposeSidebar = context.ui.slot({
      append: "sidebar.content",
      render: () => (
        <QuotaPanel visible={settings.visible} onToggle={() => void toggle()} />
      ),
    })

    // Keymap layers use the host's Solid context, so register them from a render.
    let keymapRegistered = false
    const disposeKeymap = context.ui.slot({
      append: "app",
      render: () => {
        if (!keymapRegistered) {
          keymapRegistered = true
          context.keymap.layer(() => ({
            mode: "global",
            priority: 50,
            commands: [
              {
                id: "quota.show",
                title: "Show AI quota",
                group: "Quota",
                palette: true,
                slash: { name: "quota" },
                run: async () => {
                  await refresh()
                  await context.ui.dialog.alert({
                    title: "AI quota",
                    message: quotaText(quota()),
                  })
                },
              },
              {
                id: "quota.refresh",
                title: "Refresh AI quota",
                group: "Quota",
                palette: true,
                run: async () => {
                  await refresh()
                  const failed = Boolean(quota().error)
                  const warning = quota().providers.some((provider) =>
                    Boolean(provider.warning),
                  )
                  context.ui.toast.show({
                    message: failed
                      ? "Quota refresh failed"
                      : warning
                        ? "Quota refreshed with warnings"
                        : "Quota refreshed",
                    variant: failed ? "error" : warning ? "warning" : "success",
                  })
                },
              },
            ],
          }))
        }
        return null
      },
    })

    void refresh()
    const timer = setInterval(() => void refresh(), REFRESH_MS)

    return () => {
      clearInterval(timer)
      disposeSidebar()
      disposeKeymap()
    }
  },
})
