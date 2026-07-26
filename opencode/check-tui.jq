type == "object" and
((keys - ["$schema", "attention", "diff_style", "mouse", "scroll_acceleration", "theme"]) | length == 0) and
(."$schema" == "https://opencode.ai/tui.json") and
(.theme | type == "string" and length > 0) and
(.scroll_acceleration |
  type == "object" and
  ((keys - ["enabled"]) | length == 0) and
  (.enabled | type == "boolean")) and
(.diff_style == "auto" or .diff_style == "stacked") and
(.mouse | type == "boolean") and
(.attention |
  type == "object" and
  ((keys - ["enabled", "notifications", "sound"]) | length == 0) and
  (.enabled | type == "boolean") and
  (.notifications | type == "boolean") and
  (.sound | type == "boolean"))
