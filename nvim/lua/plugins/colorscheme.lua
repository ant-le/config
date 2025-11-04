return {
    "catppuccin/nvim",
    name = "catppuccin",
    priority = 1000,
    config = function()
        require("catppuccin").setup({
            flavour = "macchiato",
            background = {
                light = "machhiato",
                dark = "macchiato",
            },
            transparent_background = true, -- disables setting the background color.
            term_colors = false,           -- sets terminal colors
            auto_integrations = true,
        })

        -- Set the colorscheme
        vim.cmd.colorscheme "catppuccin"
    end,
}
