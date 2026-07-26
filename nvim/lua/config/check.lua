local ok, err = pcall(function()
    assert(Snacks.config.input.enabled, "snacks.input is not enabled")
    assert(Snacks.config.picker.enabled, "snacks.picker is not enabled")
    assert(type(require("opencode").statusline) == "function", "opencode.nvim failed to load")

    local ask_sources = require("blink.cmp.config").sources.per_filetype.opencode_ask
    assert(vim.deep_equal(ask_sources, { "lsp", "buffer" }), "OpenCode prompt completion is not configured")
end)

if not ok then
    vim.api.nvim_err_writeln(err)
    vim.cmd("cquit 1")
end
