return {
    "nvim-lualine/lualine.nvim",
    config = function()
        require("lualine").setup({
            options = {
                theme = "catppuccin",
            },
            sections = {
                lualine_c = {},
                lualine_x = { 'encoding', 'fileformat' },
                lualine_y = { 'filetype' },
                lualine_z = {},
            },
            inactive_sections = {
                lualine_c = {'diff', 'diagnostics'},
                lualine_x = {'filetype'},
            },
        })
    end,
}
