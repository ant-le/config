vim.wo.number = true
vim.o.winborder = 'rounded'

local opt = vim.opt -- for conciseness

-- tabs & indentation
opt.tabstop = 4        -- 4 spaces for tabs (prettier default)
opt.shiftwidth = 4     -- 4 spaces for indent width
opt.softtabstop = 4
opt.expandtab = true   -- expand tab to spaces
opt.smartindent = true -- copy indent from current line when starting new one

-- line wrapping
opt.wrap = false -- disable line wrapping

-- search settings
opt.ignorecase = true -- ignore case when searching
opt.smartcase = true  -- if you include mixed case in your search, assumes you want case-sensitive

opt.termguicolors = true
opt.scrolloff = 8
opt.signcolumn = "yes"
opt.colorcolumn = "80"

-- backspace
opt.backspace = "indent,eol,start" -- allow backspace on indent, end of line or insert mode start position

-- split windows
opt.splitright = true -- split vertical window to the right
opt.splitbelow = true -- split horizontal window to the bottom

-- turn off swapfile
opt.swapfile = false
opt.updatetime = 50

