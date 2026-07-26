.PHONY: check

check:
	bash -n opencode/session.sh
	jq empty opencode/opencode.json opencode/tui.json
	jq -e -f opencode/check-tui.jq opencode/tui.json >/dev/null
	XDG_CONFIG_HOME=$(CURDIR) opencode debug config >/dev/null
	XDG_CONFIG_HOME=$(CURDIR) nvim --headless -i NONE "+lua require('config.check')" "+qa"
	@server="dotfiles-check-$$$$"; \
		tmux -f /dev/null -L "$$server" new-session -d; \
		code=0; \
		tmux -L "$$server" source-file "$(CURDIR)/tmux/tmux.conf" || code=$$?; \
		tmux -L "$$server" kill-server; \
		exit $$code
	git diff --check
