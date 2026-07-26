return {
  "nickjvandyke/opencode.nvim",
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
    local function ask(prompt)
      vim.cmd("update")
      require("opencode").ask(prompt)
    end

    map({ "n", "x" }, "<leader>oa", function()
      ask("@this: ")
    end, { desc = "Ask OpenCode about current symbol" })

    map({ "n", "x" }, "<leader>ob", function()
      ask("@buffer: ")
    end, { desc = "Ask OpenCode about current buffer" })

    map({ "n", "x" }, "<leader>oB", function()
      ask("@buffers: ")
    end, { desc = "Ask OpenCode about all buffers" })

    map({ "n", "x" }, "<leader>od", function()
      ask("@diagnostics: ")
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

    map("n", "<S-C-u>", function()
      require("opencode").command("session.half.page.up")
    end, { desc = "Scroll OpenCode up" })

    map("n", "<S-C-d>", function()
      require("opencode").command("session.half.page.down")
    end, { desc = "Scroll OpenCode down" })

    map("n", "<leader>oi", function()
      require("opencode").command("session.interrupt")
    end, { desc = "Interrupt OpenCode" })

    map("n", "<leader>ou", function()
      require("opencode").command("session.undo")
    end, { desc = "Undo OpenCode action" })

    map("n", "<leader>on", function()
      require("opencode").command("session.new")
    end, { desc = "New OpenCode session" })

    map("n", "<leader>oc", function()
      require("opencode").command("session.compact")
    end, { desc = "Compact OpenCode session" })

    -- opencode runs in a tmux pane; toggle focus via tmux
    map("n", "<leader>ot", function()
      vim.cmd("silent !tmux last-pane")
    end, { desc = "Switch to OpenCode tmux pane" })
  end,
}
