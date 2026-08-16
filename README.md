# dsh-env-switcher

> One-click Windows / WSL2 environment switcher for DeepSeek Harness (coexistence mode)

**English** · [简体中文](./README.zh-CN.md)

A DeepSeek Harness (DSH) plugin that switches freely between the **native
Windows environment** and the **WSL2 (Linux) environment** from the web UI with
a `| Windows | WSL |` segmented selector — both environments run
**simultaneously and independently**, and switching **never kills any process**.

---

## 🧠 Motivation

This project grew out of a practical observation during development:

> **DeepSeek V4 Pro GA performs better in a Linux environment.**

In side-by-side tests between native Windows and WSL2 (Ubuntu), V4 Pro showed
better trajectory quality, more stable tool usage, and better overall
performance on Linux. But abandoning the Windows environment entirely was not
an option — day-to-day files, the software ecosystem, and desktop apps (like
the companion Electron client in this repo's workflow) all depend on the
Windows side.

So we needed infrastructure where **both environments stay online and you can
switch at any moment**:

- Two DSH instances run independently, each with its own session history and working directory
- One click to switch, without interrupting the other environment's work
- This tool became this plugin, along with a complete from-scratch guide for
  setting up the WSL2 + DSH dual environment (below)

---

## ✨ Features

- 🖥️ **Coexistence**: Windows DSH (`127.0.0.1:3080`) and WSL DSH (`127.0.0.1:3081`) run at the same time
- 🔀 **One-click switch**: `| Windows | WSL |` selector in the web UI; the current tab navigates directly — no kills, no popup windows
- 📌 **Two UI entries**:
  - **「环境」 tab** above the conversation (always visible, unaffected by sidebar collapse)
  - **Left-sidebar footer switcher** (auto-hidden when the sidebar collapses)
- ⚙️ **Fully configurable**: ports, WSL distro, node path, log paths via `cordis.patch.yml`
- 🌏 **Bilingual UI**: follows the DSH language automatically (zh/en)
- 🧩 **Self-contained**: the host half ensures servers are running with plain Node — no external scripts

---

## 🚀 From scratch: WSL2 + DSH dual-environment setup

### 0. Requirements

| Item | Requirement |
|---|---|
| Windows | Windows 10 2004+ / Windows 11 |
| Virtualization | Virtualization enabled in BIOS/UEFI (VT-x/AMD-V) |
| WSL2 | "Virtual Machine Platform" feature enabled (`wsl --install` handles this) |
| Disk | ≥ 10GB free space recommended for the WSL distro |

### 1. Install WSL2 + Ubuntu

Run in an **administrator PowerShell**:

```powershell
wsl --install -d Ubuntu-24.04
```

- The first install requires a **reboot**
- After reboot, follow the prompts to create a Linux username and password
- Verify the installation:

```powershell
wsl -l -v
#   NAME            STATE           VERSION
# * Ubuntu-24.04    Running         2        ← VERSION must be 2 (WSL2)
```

> If VERSION is 1, run `wsl --set-version Ubuntu-24.04 2`.

### 2. Install Node.js ≥ 22 inside WSL

DSH requires **Node ≥ 22** (Node 20 crashes — missing `createZstdDecompress`,
`Promise.withResolvers` and other APIs).

**Option A: nvm (recommended, user-level install)**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
nvm install 24
nvm alias default 24
```

> If GitHub is unreachable, download the Node binary directly from npmmirror:
> ```bash
> curl -fsSL -o /tmp/node.tar.xz "https://registry.npmmirror.com/-/binary/node/latest-v24.x/node-v24.0.0-linux-x64.tar.xz"
> mkdir -p ~/.node && tar -xJf /tmp/node.tar.xz -C ~/.node
> echo 'export PATH="$HOME/.node/node-v24.0.0-linux-x64/bin:$PATH"' >> ~/.bashrc
> ```

**Install the build toolchain** (DSH's node-pty dependency needs native compilation):

```bash
sudo apt-get update && sudo apt-get install -y build-essential
# or passwordless WSL root: wsl -d Ubuntu-24.04 -u root -- apt-get install -y build-essential
```

### 3. Install DSH inside WSL

```bash
npm install -g pnpm --registry=https://registry.npmmirror.com
npm install -g @deepseek-ai/dsh --registry=https://registry.npmmirror.com
dsh --version
```

First launch initializes the profile (installs the base bundles automatically):

```bash
setsid nohup dsh web --port 3081 >~/dsh-web.log 2>&1 < /dev/null &
```

> `setsid` keeps the server alive after the terminal session exits;
> `--port 3081` avoids colliding with the Windows side's 3080 — this is how the
> two environments coexist.

### 4. Install DSH on Windows

```powershell
npm install -g @deepseek-ai/dsh
dsh web          # default port 3080
```

> Alternatively, use the full `@deepseek-ai/*` set in `C:\Users\<you>\node_modules` as the global install (this machine uses that approach).

### 5. Install this plugin

```bash
# Option 1: npm install (once published)
dsh plugin --profile web add dsh-env-switcher

# Option 2: local source install
dsh plugin --profile web add file:/path/to/dsh-env-switcher
```

**Install it in BOTH environments** (each profile):

```powershell
# Windows PowerShell
dsh plugin --profile web add file:D:\path\to\dsh-env-switcher
```

```bash
# WSL
dsh plugin --profile web add file:/mnt/d/path/to/dsh-env-switcher
```

After installing, **restart the DSH server** and hard-refresh the browser (Ctrl+Shift+R).

---

## ⚙️ Configuration

All fields are optional; the defaults fit a typical Windows + WSL2 machine:

```yaml
# cordis.patch.yml
- insert:
    - id: dsh-env-switcher
      name: dsh-env-switcher
      config:
        winPort: 3080                         # Windows DSH port
        wslPort: 3081                         # WSL DSH port
        wslDistro: Ubuntu-24.04               # WSL distro name (see wsl -l -v)
        wslNodeBin: /home/fsc/.node/node-v24.0.0-linux-x64/bin   # WSL node bin dir
        wslLog: /home/fsc/dsh-web.log         # WSL server log path (inside WSL)
        winLog: D:\deepseek-harness\logs\dsh-web-win.log        # Windows server log path
        winWorkingDir: C:\Users\61468         # Windows npx launcher working dir
```

> ⚠️ Restart the DSH server after changing the configuration.

---

## 🎯 Usage

### Switch from the web UI

1. The **「环境」** tab appears in the tab bar above the conversation (alongside 「对话」/「轨迹」 etc.)
2. Open it to see the `| Windows | WSL |` selector and the current environment indicator
3. Click a target environment → the current tab navigates automatically (the target server is ensured to be running first)

There is also a mini **「运行环境」** switcher at the bottom of the left sidebar (hidden when the sidebar is collapsed).

### Host API

| Endpoint | Description |
|---|---|
| `GET /env/api/state` | Returns `{ env, ownUrl, peerUrl }` (current environment and both URLs) |
| `GET /env/api/switch?target=windows\|wsl` | Ensures the target server is running (no kills, no browser popup); the client navigates itself |

### Desktop shortcuts (optional)

A standalone shortcut script ships alongside the plugin (decoupled, in the `scripts/` dir):

```powershell
# Windows PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\switch-env.ps1 -Target wsl [-Visible] [-NoOpen]
```

---

## 🏗️ Architecture

```
┌─────────────────────────────── Windows ───────────────────────────────┐
│  DSH (Windows)  ── 127.0.0.1:3080       browser ── localhost:3080     │
│      │ plugin host: /env/api/*                                       │
│      └── ensure the peer is up (powershell.exe / wsl.exe, start only) │
└───────────────────────────────────────────────────────────────────────┘
                 ▲ wsl.exe / bash (start/check)
┌─────────────────────────────── WSL2 ─────────────────────────────────┐
│  DSH (Linux)  ── 127.0.0.1:3081 (inside the VM) → reachable from     │
│                 Windows via localhost forwarding                      │
└───────────────────────────────────────────────────────────────────────┘
```

- **Port separation**: Windows on 3080, WSL on 3081 (the VM has its own network stack — no conflict)
- **Coexistence**: both instances run at once, each keeps its own session history
- **Switch = navigation**: click target → ensure the server is up → the current tab navigates
- **No side effects**: no kills, no VM restarts, no extra windows

---

## ❓ FAQ

**Q: The switch reports the target port unreachable?**
Check whether the target server is actually running: `curl http://127.0.0.1:3081` (WSL side). If the WSL server is not up, inspect the log file configured by `wslLog`.

**Q: Can the WSL environment access files on the Windows machine?**
Yes. Windows drives are mounted at `/mnt/<letter>` (e.g. `D:` → `/mnt/d/`), with permissions matching your Windows user.

**Q: I run Clash or other proxy software and localhost forwarding is flaky?**
WSL2's localhost forwarding is occasionally disturbed by proxy software (the "localhost proxy detected" warning at startup). This plugin's dual-port coexistence model does not rely on a single forwarded port — even if forwarding misbehaves, Windows side 3080 and WSL side 3081 stay independent.

**Q: Why can't the WSL instance bind 0.0.0.0 and be accessed by IP?**
DSH intentionally **blocks** `--host 0.0.0.0` for security (it would expose remote code execution to the LAN); only 127.0.0.1 is allowed, so access must go through localhost forwarding.

**Q: Where are the logs?**
- Windows server: the `winLog` path (default `D:\deepseek-harness\logs\dsh-web-win.log`)
- WSL server: `wslLog` (default `/home/fsc/dsh-web.log`)
- The plugin script itself: `logs\switch-env.log` (used by the standalone shortcut script)

---

## 🛠️ Development

```
dsh-env-switcher/
├── package.json          # v1.1.0, publishable (npm publish)
├── cordis.patch.yml      # bundle declaration + defaults
├── README.md             # English docs
├── README.zh-CN.md       # Chinese docs
└── lib/
    ├── index.js          # host: /env/api/state + /env/api/switch + ensure
    └── client.js         # client: env tab + sidebar switcher (hand-written bundle, no build step)
```

- Host: pure Node stdlib, zero third-party dependencies
- Client: hand-written `window.__ModuleLoader__` bundle; DSH's HMR watcher refreshes the revision automatically
- After editing, sync to the profile's `node_modules/dsh-env-switcher/` and restart DSH

---

## 📄 License

[MIT](./LICENSE)
