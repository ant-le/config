return {
    "akinsho/bufferline.nvim",
    after = "catppuccin",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    version = "*",
    config = function()
        require("bufferline").setup({
            options = {
                mode = "tabs",
                separator_style = "slant",
                diagnostics = "nvim_lsp",
                offsets = {
                    {
                        filetype = "NvimTree",
                        text = "File Explorer",
                        text_align = "left",
                        separator = true,
                    },
                },
            },
            highlights = require("catppuccin.special.bufferline").get_theme()
        })
    end,
}
