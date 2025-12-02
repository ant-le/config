-- Core LSP configuration for Neovim 0.11+ (Native LSP)

local servers = {
    "gopls",
    "lua_ls",
    "svelte_ls",
    "css_ls",
    "html_ls",
    "ts_ls",
    "tailwindcss" -- Added tailwindcss found in file structure but missing in original list
}

-- Iterate over servers and start them using native vim.lsp.start
for _, server in ipairs(servers) do
    local ok, config = pcall(require, "lsp." .. server)
    if ok then
        -- Ensure the name is set for the client
        config.name = config.name or server
        
        -- Create autocommand to start the client when matching filetype is opened
        vim.api.nvim_create_autocmd("FileType", {
            pattern = config.filetypes,
            callback = function(args)
                vim.lsp.start(config, { bufnr = args.buf })
            end,
        })
    else
        vim.notify("Failed to load config for " .. server, vim.log.levels.WARN)
    end
end

vim.diagnostic.config({
    virtual_lines = true,
    -- virtual_text = true,
    underline = true,
    update_in_insert = false,
    severity_sort = true,
    float = {
        border = "rounded",
        source = true,
    },
    signs = {
        text = {
            [vim.diagnostic.severity.ERROR] = "󰅚 ",
            [vim.diagnostic.severity.WARN] = "󰀪 ",
            [vim.diagnostic.severity.INFO] = "󰋽 ",
            [vim.diagnostic.severity.HINT] = "󰌶 ",
        },
        numhl = {
            [vim.diagnostic.severity.ERROR] = "ErrorMsg",
            [vim.diagnostic.severity.WARN] = "WarningMsg",
        },
    },
})