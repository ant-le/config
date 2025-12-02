require("config.options")
require("config.keymaps")
require("core.lazy")
require("core.lsp")

local actions = require("telescope.actions")

local open_after_tree = function(prompt_bufnr)
    actions.select_default(prompt_bufnr)
end

require("telescope").setup({
    defaults = {
        mappings = {
            i = { ["<CR>"] = open_after_tree },
            n = { ["<CR>"] = open_after_tree },
        },
    },
})
