return {
	cmd = { "lua-language-server", "--stdio" },
	filetypes = { "lua" },
	root_markers = {
		".git",
		".luacheckrc",
		".luarc.json",
		".luarc.jsonc",
		".stylua.toml",
		"selene.toml",
		"selene.yml",
		"stylua.toml",
	},
   settings = {
        Lua = {
            diagnostics = {
                disable = { "missing-fields" },
                globals = {
                    "vim",
                    "Snacks",
                },
            },
            hint = {
                enable = true,
                setType = false,
                paramType = true,
                paramName = "Disable",
                semicolon = "Disable",
                arrayIndex = "Disable",
            },
        },
    },
	single_file_support = true,
	log_level = vim.lsp.protocol.MessageType.Warning,
}
