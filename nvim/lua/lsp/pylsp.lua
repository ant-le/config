return {
    cmd = { "pylsp" },
    filetypes = { "python" },
    root_markers = { "pyproject.toml", "setup.py", ".git", "requirements.txt" },
    settings = {
        pylsp = {
            plugins = {
                pycodestyle = { enabled = false },
                mccabe = { enabled = false },
                pyflakes = { enabled = true },
                black = { enabled = true },
                isort = { enabled = true },
                autopep8 = { enabled = false },
            }
        }
    }
}
