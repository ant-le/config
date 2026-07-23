return {
    "folke/trouble.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    cmd = "Trouble",
    keys = {
        { "<leader>xq", "<cmd>Trouble qflist toggle<cr>", desc = "Quickfix list (Trouble)" },
    },
    opts = {},
}
