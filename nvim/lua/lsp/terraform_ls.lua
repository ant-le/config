local capabilities = vim.lsp.protocol.make_client_capabilities()
capabilities.workspace.didChangeWatchedFiles.dynamicRegistration = false

return {
    cmd = { "terraform-ls", "serve" },
    filetypes = { "terraform", "terraform-vars" },
    root_markers = { ".terraform.lock.hcl", ".terraform", ".git" },
    capabilities = capabilities,
    init_options = {
        indexing = {
            ignoreDirectoryNames = {
                "node_modules",
                "venv",
                ".venv",
                "build",
                "dist",
                ".terragrunt-cache",
            }
        }
    },

    -- THE NEW KILL SWITCH:
    -- The moment the LSP connects, tell Neovim to ignore semantic tokens entirely
    on_init = function(client)
        client.server_capabilities.semanticTokensProvider = nil
    end,
}
