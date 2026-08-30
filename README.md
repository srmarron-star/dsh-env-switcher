# dsh-env-switcher

**English** · [简体中文](README.zh-CN.md)

A DeepSeek Harness plugin that lets you switch between a Windows DSH instance
and a WSL2 (Linux) DSH instance from the web UI — **both running at the same
time** (coexistence model).

> **v1.2.0** — the sidebar switcher moved to the **main column** (between the
> quick entries and the Workspace block) and now **hides when the sidebar is
> collapsed**.

## How it works

| Environment | URL | Port |
|---|---|---|
| Windows DSH | `http://127.0.0.1:3080` | 3080 |
| WSL DSH | `http://127.0.0.1:3081` | 3081 |

- Both servers run simultaneously; nothing is ever killed.
- The web UI gets an **「环境」 tab** (above the conversation) and a
  **「运行环境」 entry in the sidebar main column** (`| Windows | WSL |`),
  placed **above the Workspace block** (i.e. between the quick entries and
  Workspace).
- **Collapse-aware**: when the sidebar is collapsed, the「运行环境」entry is
  hidden; it reappears when the sidebar is expanded.
- Clicking a target ensures that environment's server is running, then the
  current tab navigates to its URL.
- Each environment keeps its own session history.

## Host API

- `GET /env/api/state` → `{ env, ownUrl, peerUrl }`
- `GET /env/api/switch?target=windows|wsl` → ensures the target server is up
  (no kill, no browser opening — the client navigates itself)

## Install

```sh
dsh plugin --profile web add dsh-env-switcher
```

For a local checkout:

```sh
dsh plugin --profile web add file:/path/to/dsh-env-switcher
```

Restart the server, then hard-refresh the browser.

## Configuration

All values are optional; defaults match a typical Windows + WSL2 machine:

```yaml
# cordis.patch.yml
- insert:
    - id: dsh-env-switcher
      name: dsh-env-switcher
      config:
        winPort: 3080        # Windows DSH port
        wslPort: 3081        # WSL DSH port
        wslDistro: Ubuntu-24.04
        wslNodeBin: /home/fsc/node-v24.17.0-linux-x64/bin
        wslLog: /home/fsc/dsh-web.log
        winLog: D:\deepseek-harness\logs\dsh-web-win.log
        winWorkingDir: C:\Users\61468
```

## Requirements

- Windows with WSL2 and a Linux distro (e.g. Ubuntu 24.04)
- A DSH installation in **both** environments (Windows + inside WSL)
- The WSL instance is started with `dsh web --port 3081` (the plugin does this
  automatically when needed)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
