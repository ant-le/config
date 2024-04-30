    return {
    "iamcco/markdown-preview.nvim",
    cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
    ft = { "markdown" },
    build = function() vim.fn["mkdp#util#install"]() end,
    opts = {
        vim.keymap.set("n", "<leader>md", vim.cmd.MarkdownPreview)
    }
}
