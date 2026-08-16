# dsh-env-switcher

> One-click Windows / WSL2 environment switcher for DeepSeek Harness (coexistence mode)

**English** · [简体中文](./README.zh-CN.md)

A DeepSeek Harness (DSH) plugin that switches between the **native Windows
environment** and the **WSL2 (Linux) environment** from the web UI with a
`| Windows | WSL |` segmented selector — both environments run **simultaneously
and independently**, and switching **never kills any process**.

## 🧠 Motivation

This project grew out of a practical observation during development:

> **DeepSeek V4 Pro (production) performs better in a Linux environment.**

In side-by-side tests between native Windows and WSL2 (Ubuntu), V4 Pro showed
better trajectory quality and more stable tool usage on Linux. But abandoning
Windows entirely was not an option — day-to-day files, desktop software, and
apps (like the companion Electron client) depend on the Windows side.

So we needed infrastructure where **both environments stay online and you can
switch at any moment**:

- Two DSH instances, each with its own session history and working directory
- One click to switch, without interrupting the other environment
- This tool became this plugin, with a complete from-scratch guide for setting
  up WSL2 + DSH dual environments (see [README.zh-CN.md](./README.zh-CN.md))

## ✨ Features

- 🖥️ **Coexistence**: Windows DSH (`127.0.0.1:3080`) and WSL DSH (`127.0.0.1:3081`) run at the same time
- 🔀 **One-click switch**: `| Windows | WSL |` selector in the web UI; the current tab navigates — no kills, no extra windows
- 📌 **Two UI entries**:
  - **「环境」 tab** above the conversation (always visible, survives sidebar collapse)
  - **Left-sidebar footer switcher** (auto-hidden when the sidebar collapses)
- ⚙️ **Fully configurable**: ports, WSL distro, node path, log paths via `cordis.patch.yml`
- 🌏 **Bilingual UI**: follows the DSH language (zh/en)
- 🧩 **Self-contained**: the host half ensures servers are running using plain Node — no external scripts

## 🚀 Quick start (summary)

Full from-zero guide (WSL install → Node ≥ 22 → DSH in both environments):
see [README.zh-CN.md](./README.zh-CN.md) (Chinese, detailed).

```bash
# Windows PowerShell
dsh plugin --profile web add dsh-env-switcher        # or: file:/path/to/dsh-env-switcher
# inside WSL (same command against the WSL profile)
dsh plugin --profile web add dsh-env-switcher
```

Restart the server and hard-refresh the browser.

## ⚙️ Configuration

All fields optional; defaults fit a typical Windows + WSL2 machine:

```yaml
- insert:
    - id: dsh-env-switcher
      name: dsh-env-switcher
      config:
        winPort: 3080                 # Windows DSH port
        wslPort: 3081                 # WSL DSH port
        wslDistro: Ubuntu-24.04       # WSL distro (wsl -l -v)
        wslNodeBin: /home/fsc/.node/node-v24.0.0-linux-x64/bin
        wslLog: /home/fsc/dsh-web.log
        winLog: D:\deepseek-harness\logs\dsh-web-win.log
        winWorkingDir: C:\Users\61468
```

## 🎯 Usage

- **「环境」 tab** above the conversation: pick `Windows` or `WSL`; the current tab navigates to the target (the plugin ensures the target server is up first).
- Host API:
  - `GET /env/api/state` → `{ env, ownUrl, peerUrl }`
  - `GET /env/api/switch?target=windows|wsl` → ensure target is running (no kill, no browser popup; the client navigates itself)

## 🏗️ Architecture

- **Port separation**: Windows on 3080, WSL on 3081 (the WSL2 VM has its own network stack — no conflict)
- **Coexistence**: both instances run at once, each keeps its own session history
- **Switch = navigation**: ensure target is up → navigate the current tab
- **No side effects**: nothing is killed, no VM restarts, no extra windows

## ❓ FAQ

- **WSL can't reach Windows files?** It can: drives mount at `/mnt/<letter>` (e.g. `D:` → `/mnt/d/`), permissions match your Windows user.
- **Proxy software (Clash etc.) interfering with localhost forwarding?** The coexistence model doesn't rely on a single forwarded port, so the two environments stay independent even if forwarding misbehaves.
- **Why can't the WSL instance bind 0.0.0.0?** DSH intentionally blocks `--host 0.0.0.0` for security (it would expose remote code execution to the LAN), so loopback + localhost forwarding is the only path.
- **Where are the logs?** Windows: `winLog`; WSL: `wslLog`; plugin script: `logs\switch-env.log`.

## 🛠️ Development

```
dsh-env-switcher/
├── package.json          # v1.1.0, publishable
├── cordis.patch.yml      # bundle declaration + defaults
├── README.md / README.zh-CN.md
└── lib/
    ├── index.js          # host: /env/api/state + /env/api/switch + ensure
    └── client.js         # client: env tab + sidebar switcher (hand-written bundle, no build step)
```

- Host: pure Node stdlib, zero dependencies
- Client: hand-written `window.__ModuleLoader__` bundle; DSH's HMR watcher refreshes the rev automatically
- After editing, sync to the profile's `node_modules/dsh-env-switcher/` and restart DSH

## 📄 License

[MIT](./LICENSE)
