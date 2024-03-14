return {
    "folke/trouble.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    opts = {
        vim.keymap.set("n", "<leader>gt", "<cmd>TroubleToggle quickfix<cr>",
            { silent = true, noremap = true }
        )
    },
}
