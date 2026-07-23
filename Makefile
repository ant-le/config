.PHONY: check

check:
	bash -n opencode/session.sh
	XDG_CONFIG_HOME=$(CURDIR) opencode debug config >/dev/null
	XDG_CONFIG_HOME=$(CURDIR) nvim --headless -i NONE "+qa"
	git diff --check
