-- Core LSP configuration for Neovim 0.11+ (Native LSP)

-- Prepend mason bin to PATH
local mason_bin = vim.fn.stdpath("data") .. "/mason/bin"
vim.env.PATH = mason_bin .. ":" .. vim.env.PATH

local servers = {
    "gopls",
    "lua_ls",
    "terraform_ls",
    "svelte_ls",
    "css_ls",
    "html_ls",
    "json_ls",
    "ts_ls",
    "tailwindcss",
    "pylsp",
}

-- Iterate over servers and start them using native vim.lsp.start
for _, server in ipairs(servers) do
    local ok, config = pcall(require, "lsp." .. server)
    if ok then
        -- Ensure the name is set for the client
        config.name = config.name or server

        -- Inject blink.cmp capabilities
        local blink_ok, blink = pcall(require, "blink.cmp")
        if blink_ok then
            config.capabilities = blink.get_lsp_capabilities(config.capabilities)
        end

        -- Create autocommand to start the client when matching filetype is opened
        vim.api.nvim_create_autocmd("FileType", {
            pattern = config.filetypes,
            callback = function(args)
                local client_config = vim.deepcopy(config)
                if client_config.root_markers then
                    client_config.root_dir = vim.fs.root(args.buf, client_config.root_markers) or vim.fn.getcwd()
                end
                vim.lsp.start(client_config, { bufnr = args.buf })
            end,
        })
    else
        vim.notify("Failed to load config for " .. server, vim.log.levels.WARN)
    end
end

vim.diagnostic.config({
    -- virtual_lines = true,
    virtual_text = true,
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
vim.api.nvim_create_autocmd("LspAttach", {
    callback = function(args)
        local client = vim.lsp.get_client_by_id(args.data.client_id)
        if not client then return end

        if client:supports_method("textDocument/formatting") then
            vim.api.nvim_create_autocmd("BufWritePre", {
                buffer = args.buf,
                callback = function()
                    vim.lsp.buf.format({ bufnr = args.buf, id = client.id })
                end,
            })
        end

        local opts = { buffer = args.buf, remap = false }

        vim.keymap.set("n", "<leader>gd", function() vim.lsp.buf.definition() end, opts)
        vim.keymap.set("n", "K", function() vim.lsp.buf.hover() end, opts)
        vim.keymap.set("n", "<leader>vws", function() vim.lsp.buf.workspace_symbol() end, opts)
        vim.keymap.set("n", "<leader>vd", function() vim.diagnostic.open_float() end, opts)
        vim.keymap.set("n", "[d", function() vim.diagnostic.goto_next() end, opts)
        vim.keymap.set("n", "]d", function() vim.diagnostic.goto_prev() end, opts)
        vim.keymap.set("n", "<leader>vca", function() vim.lsp.buf.code_action() end, opts)
        vim.keymap.set("n", "<leader>vrr", function() vim.lsp.buf.references() end, opts)
        vim.keymap.set("n", "<leader>vrn", function() vim.lsp.buf.rename() end, opts)
        vim.keymap.set("i", "<C-h>", function() vim.lsp.buf.signature_help() end, opts)
    end,
})
