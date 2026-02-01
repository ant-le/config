return {
    cmd = { "vscode-json-language-server", "--stdio" },
    filetypes = { "json", "jsonc" },
    root_markers = { "package.json", ".git" },
    init_options = {
        provideFormatter = true,
    },
    settings = {
        json = {
            schemas = {},
            validate = { enable = true },
            format = { enable = true },
        },
    },
    single_file_support = true,
}
