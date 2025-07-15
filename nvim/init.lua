require("config.options")
require("config.keymaps")
require("core.lazy")
require("core.lsp")

local actions = require("telescope.actions")

local open_after_tree = function(prompt_bufnr)
    vim.defer_fn(function()
        actions.select_default(prompt_bufnr)
    end, 100) -- Delay allows filetype and plugins to settle before opening
end

require("telescope").setup({
    defaults = {
        mappings = {
            i = { ["<CR>"] = open_after_tree },
            n = { ["<CR>"] = open_after_tree },
        },
    },
})
