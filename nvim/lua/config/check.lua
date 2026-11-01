local ok, err = pcall(function()
    assert(Snacks.config.input.enabled, "snacks.input is not enabled")
    assert(Snacks.config.picker.enabled, "snacks.picker is not enabled")
    assert(type(require("blink.cmp").get_lsp_capabilities) == "function", "completion failed to load")
    assert(type(require("lualine").get_config) == "function", "statusline failed to load")
end)

if not ok then
    vim.api.nvim_err_writeln(err)
    vim.cmd("cquit 1")
end
