return {
    "catppuccin/nvim",
    lazy = true,
    name = "catppuccin",
    priority = 1000,
    opts = {
        integrations =  {
            mason = true,
            blink_cmp = true,
        },
    },
  config = function()
    require("catppuccin").setup({
        flavour = "macchiato",
        background = {
            light = "machhiato",
            dark = "macchiato",
        },
        transparent_background = true, -- disables setting the background color.
        term_colors = false, -- sets terminal colors
    })

    -- Set the colorscheme
    vim.cmd.colorscheme "catppuccin"
  end,
}
