/** @jsxImportSource @opentui/solid */
//
// OpenCode V2 CLI plugin: provider quota in the session sidebar.
//
// Shows remaining usage for:
//   - OpenCode Go  (GET https://opencode.ai/zen/go/v1/usage)
//   - OpenAI       (GET https://chatgpt.com/backend-api/wham/usage)
//
// Each quota window is drawn as a block bar. Provider rows compare the
// month-to-date API-equivalent cost with the configured monthly plan price;
// both providers use the OpenCode Go billing cycle when it is available.
//
// Credentials come from OpenCode's own store, so nothing is stored here:
//   ~/.local/share/opencode/auth.json  (or $XDG_DATA_HOME/opencode/auth.json)
//
// Surfaces: `sidebar.content` only, plus /quota and a palette refresh command.
import { Plugin, usePlugin } from "@opencode/plugin/tui"
import { createSignal, For, Show } from "solid-js"
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { providerApiCost, type CostRange } from "./cost"

const REFRESH_MS = 60_000
// The session sidebar's content area is a fixed ~37 columns wide regardless of
// terminal size, so the bar length is a constant that leaves room for the
// right-aligned percentage.
const BAR_WIDTH = 31
const DETAIL_INDENT = "  "

// Neither provider API reports plan prices. Override these monthly values with
// the plugin's `subscription` option, using either { "openai": 100 } or
// { "openai": { "price": 100, "period": "month" } }.
const DEFAULT_PLAN_PRICE: Record<string, number> = {
  "opencode-go": 10,
  openai: 100,
}
let pluginOptions: Record<string, any> = {}

const GO_USAGE_URL = "https://opencode.ai/zen/go/v1/usage"
const OPENAI_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"

type QuotaWindow = {
  name: string
  remaining: number
  resetsAt?: number
  limited?: boolean
}

type ProviderQuota = {
  id: string
  label: string
  windows: QuotaWindow[]
  apiCost?: number
  error?: string
}

type Quota = {
  providers: ProviderQuota[]
  costRange?: CostRange & { approximate: boolean }
  updatedAt: number
}

const [quota, setQuota] = createSignal<Quota>({ providers: [], updatedAt: 0 })
const [loading, setLoading] = createSignal(false)

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function authFile() {
  const base = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share")
  return join(base, "opencode", "auth.json")
}

function readAuth(): Record<string, any> {
  try {
    return JSON.parse(readFileSync(authFile(), "utf8")) as Record<string, any>
  } catch {
    return {}
  }
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
  if (typeof window?.reset_after_seconds === "number" && window.reset_after_seconds > 0) {
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

async function fetchGo(auth: Record<string, any>): Promise<ProviderQuota> {
  const id = "opencode-go"
  const label = "OpenCode Go"
  const key = typeof auth[id]?.key === "string" ? auth[id].key : undefined
  if (!key) return { id, label, windows: [], error: "no API key in auth.json" }

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
        resetsAt: typeof window.resetsAt === "string" ? Date.parse(window.resetsAt) : undefined,
        limited: window.status === "rate-limited",
      })
    }
    if (!windows.length) return { id, label, windows: [], error: "unexpected response" }
    return { id, label, windows }
  } catch (error) {
    return { id, label, windows: [], error: message(error) }
  }
}

async function fetchOpenAI(auth: Record<string, any>): Promise<ProviderQuota> {
  const id = "openai"
  const label = "OpenAI"
  const entry = auth[id]
  const access = typeof entry?.access === "string" ? entry.access : undefined
  if (!access) return { id, label, windows: [], error: "not signed in (auth.json)" }
  if (typeof entry?.expires === "number" && Date.now() > entry.expires) {
    return { id, label, windows: [], error: "token expired — use OpenAI once to refresh" }
  }

  const accountId =
    entry?.accountId ?? jwtClaim(access, "https://api.openai.com/auth", "chatgpt_account_id")
  const headers: Record<string, string> = {
    Authorization: `Bearer ${access}`,
    Accept: "application/json",
  }
  if (accountId) headers["ChatGPT-Account-Id"] = String(accountId)

  try {
    const response = await fetch(OPENAI_USAGE_URL, { headers })
    if (response.status === 401 || response.status === 403) {
      return { id, label, windows: [], error: "session expired — sign in again" }
    }
    if (!response.ok) return { id, label, windows: [], error: `HTTP ${response.status}` }

    const data: any = await response.json()
    const windows: QuotaWindow[] = []
    for (const field of ["primary_window", "secondary_window"] as const) {
      const window = data?.rate_limit?.[field]
      if (typeof window?.used_percent !== "number") continue
      if (typeof window.limit_window_seconds !== "number" || window.limit_window_seconds <= 0) continue
      windows.push({
        name: durationLabel(window.limit_window_seconds),
        remaining: clamp(100 - window.used_percent),
        resetsAt: resetFromWindow(window),
      })
    }
    if (!windows.length) return { id, label, windows: [], error: "unexpected response" }
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

function monthlyCostRange(go: ProviderQuota, end: number): CostRange & { approximate: boolean } {
  const reset = go.windows.find((window) => window.name === "Monthly")?.resetsAt
  if (typeof reset === "number" && Number.isFinite(reset) && reset > end) {
    const start = subtractCalendarMonth(reset)
    if (start < end) return { start, end, approximate: false }
  }
  return { start: subtractCalendarMonth(end), end, approximate: true }
}

async function attachCost(provider: ProviderQuota, range: CostRange) {
  try {
    provider.apiCost = await providerApiCost(provider.id, range)
  } catch {
    // Pricing or database unavailable; the UI simply omits the cost field.
  }
}

let inFlight: Promise<void> | undefined
function refresh() {
  if (inFlight) return inFlight
  setLoading(true)
  inFlight = (async () => {
    const auth = readAuth()
    const providers = await Promise.all([fetchGo(auth), fetchOpenAI(auth)])
    const costRange = monthlyCostRange(providers[0], Date.now())
    await Promise.all(providers.map((provider) => attachCost(provider, costRange)))
    setQuota({ providers, costRange, updatedAt: Date.now() })
  })().finally(() => {
    setLoading(false)
    inFlight = undefined
  })
  return inFlight
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

function resetText(window: QuotaWindow) {
  if (window.limited) return "rate-limited"
  if (!window.resetsAt) return undefined
  return countdown(window.resetsAt - Date.now())
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

function planPrice(providerID: string): number | undefined {
  const configured = pluginOptions?.subscription?.[providerID]
  if (typeof configured === "number" && Number.isFinite(configured) && configured >= 0) {
    return configured
  }
  if (configured && typeof configured === "object") {
    const price = Number(configured.price)
    const period = configured.period
    if (
      Number.isFinite(price) &&
      price >= 0 &&
      (period === undefined || period === "month" || period === "monthly")
    ) {
      return price
    }
  }
  return DEFAULT_PLAN_PRICE[providerID]
}

function planLabel(provider: ProviderQuota): string | undefined {
  const price = planPrice(provider.id)
  if (typeof price !== "number") return undefined
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`
}

function providerCostLabel(provider: ProviderQuota): string | undefined {
  if (typeof provider.apiCost !== "number") return undefined
  const plan = planLabel(provider)
  return plan ? `API ${money(provider.apiCost)} · Plan ${plan}` : `API ${money(provider.apiCost)}`
}

function WindowRow(props: { window: QuotaWindow }) {
  const context = usePlugin()
  const muted = () => toHex((context.theme as any).text?.muted)
  const base = () => toHex((context.theme as any).text?.base)
  const percent = () => `${Math.round(props.window.remaining)}%`.padStart(4)

  return (
    <box flexDirection="column">
      <box flexDirection="row">
        <text fg={muted()}>{DETAIL_INDENT}{props.window.name}</text>
        <box flexGrow={1} />
        <text fg={muted()}>{resetText(props.window) ?? ""}</text>
      </box>
      <box flexDirection="row">
        <text fg={muted()}>{DETAIL_INDENT}{bar(props.window.remaining, BAR_WIDTH)}</text>
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
    return toHex(provider.error ? feedback?.error?.base : feedback?.success?.base)
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
          fallback={<text fg={muted()}> {loading() ? "loading…" : "no data"}</text>}
        >
          <Show when={quota().costRange?.approximate}>
            <text fg={muted()}> API costs · trailing month (approx.)</text>
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
                    {" "}<b>{provider.label}</b>
                  </text>
                  <box flexGrow={1} />
                  {(() => {
                    if (typeof provider.apiCost !== "number") return null
                    const plan = planLabel(provider)
                    return (
                      <>
                        <text fg={muted()}>API </text>
                        <text fg={base()}>{money(provider.apiCost)}</text>
                        {plan ? (
                          <>
                            <text fg={muted()}> · Plan </text>
                            <text fg={base()}>{plan}</text>
                          </>
                        ) : null}
                      </>
                    )
                  })()}
                </box>
                {provider.error ? (
                  <text fg={muted()}>{DETAIL_INDENT}{provider.error}</text>
                ) : (
                  <For each={provider.windows}>{(window) => <WindowRow window={window} />}</For>
                )}
              </box>
            )}
          </For>
        </Show>
      </Show>
    </box>
  )
}

function quotaText(state: Quota) {
  const lines: string[] = []
  if (state.costRange?.approximate) lines.push("API costs: trailing month (approx.)", "")
  for (const provider of state.providers) {
    const label = providerCostLabel(provider)
    lines.push(`${provider.label}${label ? `   ${label}` : ""}`)
    if (provider.error) lines.push(`  ${provider.error}`)
    for (const window of provider.windows) {
      const pct = `${Math.round(window.remaining)}%`
      const reset = resetText(window)
      lines.push(`  ${window.name.padEnd(8)} ${pct.padStart(4)}${reset ? `   (${reset})` : ""}`)
    }
  }
  if (!state.providers.length) lines.push("No quota data.")
  return lines.join("\n")
}

export default Plugin.define({
  id: "quota.sidebar",
  setup(context) {
    pluginOptions = context.options ?? {}

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
      render: () => <QuotaPanel visible={settings.visible} onToggle={() => void toggle()} />,
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
                  context.ui.toast.show({ message: "Quota refreshed", variant: "success" })
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
