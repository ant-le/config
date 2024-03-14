-- https://github.com/nvim-tree/nvim-tree.lua
return {
    "nvim-tree/nvim-tree.lua",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    config = function()
        local nvimtree = require("nvim-tree")

        -- recommended settings from nvim-tree documentation
        vim.g.loaded_netrw = 1
        vim.g.loaded_netrwPlugin = 1

        vim.opt.termguicolors = true

        -- configure nvim-tree
        nvimtree.setup({
            view = {
                width = 35,
            },
            renderer = {
                indent_markers = {
                    enable = true,
                },
                icons = {
                    glyphs = {
                        folder = {
                            arrow_closed = ">",
                            arrow_open = "",
                        },
                    },
                },
            },
            actions = {
                open_file = {
                    window_picker = {
                        enable = false,
                    },
                },
            },
            filters = {
                custom = { ".DS_Store", ".git", ".python-version" },
            },
            git = {
                ignore = false,
            },
        })

        vim.keymap.set("n", "<leader>b", "<cmd>NvimTreeToggle<CR>")
        vim.keymap.set("n", "<leader>c", "<cmd>NvimTreeCollapse<CR>")
    end,
}
