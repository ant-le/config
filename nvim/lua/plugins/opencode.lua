return {
  "git@github.com:nickjvandyke/opencode.nvim",
  version = "*",
  config = function()
    vim.g.opencode_opts = {
      contexts = {
        ["@this"] = require("opencode.context.builtins").this,
        ["@buffer"] = require("opencode.context.builtins").buffer,
        ["@buffers"] = require("opencode.context.builtins").buffers,
        ["@diagnostics"] = require("opencode.context.builtins").diagnostics,
        ["@visible"] = require("opencode.context.builtins").visible_text,
      },
      select = {
        prompts = {
          ask = "...",
          explain = "Explain @this and its context",
          review = "Review @this for correctness and readability",
          fix = "Fix @this",
          test = "Add tests for @this",
          document = "Add comments documenting @this",
          implement = "Implement @this",
          diagnostics = "Explain @diagnostics",
        },
      },
      events = {
        enabled = true,
        reload = true,
        permissions = {
          enabled = true,
          edits = {
            enabled = true,
          },
        },
      },
    }

    vim.o.autoread = true

    local map = vim.keymap.set

    map({ "n", "x" }, "<leader>oa", function()
      require("opencode").ask("@this: ")
    end, { desc = "Ask OpenCode about current symbol" })

    map({ "n", "x" }, "<leader>ob", function()
      require("opencode").ask("@buffer: ")
    end, { desc = "Ask OpenCode about current buffer" })

    map({ "n", "x" }, "<leader>oB", function()
      require("opencode").ask("@buffers: ")
    end, { desc = "Ask OpenCode about all buffers" })

    map({ "n", "x" }, "<leader>od", function()
      require("opencode").ask("@diagnostics: ")
    end, { desc = "Ask OpenCode about diagnostics" })

    map({ "n", "x" }, "<leader>os", function()
      require("opencode").select()
    end, { desc = "OpenCode quick actions" })

    map({ "n", "x" }, "go", function()
      return require("opencode").operator("@this ")
    end, { expr = true, desc = "Send visual selection to OpenCode" })

    map("n", "goo", function()
      return require("opencode").operator("@this ") .. "_"
    end, { expr = true, desc = "Send current line to OpenCode" })

    -- opencode runs in a tmux pane; toggle focus via tmux
    map("n", "<leader>ot", function()
      vim.cmd("silent !tmux last-pane")
    end, { desc = "Switch to OpenCode tmux pane" })
  end,
}
