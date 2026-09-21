---
description: Analyze OpenCode token usage and recorded versus API-equivalent costs.
---

Use the `cost-estimate` tool to report OpenCode usage and costs.

Interpret `$ARGUMENTS` as a concise request for any supported date range, aggregation, or filters. Supported aggregation dimensions are day, week, month, provider, model, project, and session. Supported ranges include relative values such as today, yesterday, week, month, 24h, 7d, and last 3 months, plus explicit `YYYY-MM-DD` or `START..END` ranges. Date-only explicit end values include that entire local calendar day; timestamp end values are exclusive. A request for "this project" or "this session" should use the tool's `current` filter.

If no arguments are provided, report this month's usage grouped by day. Return the tool's report directly, followed only by a brief explanation if the user requested one.
