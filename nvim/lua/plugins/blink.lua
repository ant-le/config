return {
    'saghen/blink.cmp',
    dependencies = { 'rafamadriz/friendly-snippets' },
    version = '1.*',

    ---@module 'blink.cmp'
    ---@type blink.cmp.Config
    opts = {
        keymap = { preset = 'enter' },
        appearance = {
            nerd_font_variant = 'mono'
        },

        completion =
        {
            documentation = { auto_show = false },
            list = { selection = { preselect = false, auto_insert = false } }
        },

        cmdline = {
            sources = function()
                local type = vim.fn.getcmdtype()
                -- Search forward and backward
                if type == "/" or type == "?" then return { "buffer" } end
                -- Commands
                if type == ":" or type == "@" then return { "cmdline" } end
                return {}
            end
        },

        sources = {
            default = { 'lsp', 'path', 'snippets', 'buffer' },
        },

        fuzzy = { implementation = "prefer_rust_with_warning" }
    },
    opts_extend = { "sources.default" },
}
