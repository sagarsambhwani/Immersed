---
trigger: always_on
---

# Git & Terminal Execution Guidelines

## 1. Granular Commits Policy
* When committing multiple changed files individually, stage (`git add <file>`) and commit (`git commit -m "..."`) each file one-by-one with semantic commit prefixes (`feat`, `fix`, `docs`, `style`, `test`, `chore`).
* **Push at the end**: Defer `git push` until all individual file commits are completed in the local working tree.

## 2. Windows PowerShell Syntax
* On Windows PowerShell, avoid using `&&` for command chaining. Use `;` or execute commands sequentially.
