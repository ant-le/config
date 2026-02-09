return {
    cmd = { "terraform-ls", "serve" },
    filetypes = { "terraform", "terraform-vars" },
    root_markers = { ".terraform.lock.hcl", ".terraform", ".git" },
}
