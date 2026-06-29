return {
    "nvim-lualine/lualine.nvim",
    dependencies = { 'nvim-tree/nvim-web-devicons', 'catppuccin' },
    config = function()
        require("lualine").setup({
            options = {
                theme = "auto",
            },
            sections = {
                lualine_c = {},
                lualine_x = { 'encoding', 'fileformat' },
                lualine_y = { 'filetype' },
                lualine_z = {},
            },
            inactive_sections = {
                lualine_c = { 'diff', 'diagnostics' },
                lualine_x = { 'filetype' },
            },
        })
    end,
}
