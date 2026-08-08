import os
import shutil
import sys

target_dir = os.path.expanduser(r"~\AppData\Local\ms-playwright-go\1.57.0")
src_package = r"E:\Downloads\Chatbot\frontend\node_modules\playwright-core"

package_dir = os.path.join(target_dir, "package")
os.makedirs(package_dir, exist_ok=True)

print(f"Copying {src_package} -> {package_dir}...")
if os.path.exists(src_package):
    for item in os.listdir(src_package):
        s = os.path.join(src_package, item)
        d = os.path.join(package_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)

# Write playwright.cmd
cmd_path = os.path.join(target_dir, "playwright.cmd")
with open(cmd_path, "w", encoding="utf-8") as f:
    f.write('@echo off\nnode "%~dp0package\\cli.js" %*\n')

# Write playwright.ps1
ps1_path = os.path.join(target_dir, "playwright.ps1")
with open(ps1_path, "w", encoding="utf-8") as f:
    f.write('& node (Join-Path $PSScriptRoot "package\\cli.js") $args\n')

# Write playwright.sh
sh_path = os.path.join(target_dir, "playwright.sh")
with open(sh_path, "w", encoding="utf-8") as f:
    f.write('#!/bin/sh\nbasedir=$(dirname "$0")\nnode "$basedir/package/cli.js" "$@"\n')

print("Playwright driver files created successfully:")
for f in os.listdir(target_dir):
    print(" -", f)
