vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

vim.g.python3_host_prog = "/Users/anton/.pyenv/versions/nvim/bin/python"

local keymap = vim.keymap -- 

keymap.set("n", "<leader>pv", vim.cmd.Ex)
keymap.set('n', '<leader>fm', vim.lsp.buf.format, { desc = 'Format buffer' })


keymap.set("v", "J", ":m '>+1<CR>gv=gv")
keymap.set("v", "K", ":m '<-2<CR>gv=gv")

keymap.set("n", "J", "mzJ`z")
keymap.set("n", "<C-d>", "<C-d>zz")
keymap.set("n", "<C-u>", "<C-u>zz")

-- greatest remap ever
keymap.set("x", "<leader>p", [["_dP]])

-- next greatest remap ever : asbjornHaland
keymap.set({ "n", "v" }, "<leader>y", [["+y]])
keymap.set("n", "<leader>Y", [["+Y]])
keymap.set({ "n", "v" }, "<leader>d", [["_d]])

keymap.set("n", "<leader>s", [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]])
