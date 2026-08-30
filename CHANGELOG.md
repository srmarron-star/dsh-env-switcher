# Changelog

All notable changes to `dsh-env-switcher` are documented here.

## [1.2.0] - 2026-08-30

### Changed
- **Sidebar switcher moved to the main column.** The「运行环境」entry is no
  longer a `sidebar.footer.action` slot entry; it is now DOM-grafted **above
  the Workspace block** (between the quick entries and Workspace). Works
  because the `sidebar.workspaces` slot is `kind:"single"` and cannot be
  mid-column sorted via slot `order`.
- **Collapse-aware.** The entry is hidden when the sidebar is collapsed
  (`[data-dsh-frame][data-sidebar-collapsed]`) via injected CSS **and** a
  JS `MutationObserver` that toggles `display` for reliability.

### Fixed (server `lib/index.js`)
- **WSL server never started** — `ensureWsl` used `pgrep -f '[d]sh web'`, which
  self-matched the hosting `bash -lc` command line, so it always thought the
  server was already running. Now checks the port with `ss -tln`.
- **`wslNodeBin` pointed at a legacy Node install** (`~/.node/node-v24.0.0`);
  now defaults to `~/.node`-style `node-v24.17.0` path
  (`/home/fsc/node-v24.17.0-linux-x64/bin`).
- **Windows start command not pinned** — `ensureWindows` now pins
  `@deepseek-ai/dsh@0.1.1-rc.1` and passes an explicit `--port`.
- **xdg-open stall on WSL** — the WSL start command now passes `--no-open`.
- **wsl.exe detach race** — added a `sleep 3` after the `setsid nohup` launch
  so the WSL server stabilises before the launching bash exits (previously the
  freshly-spawned process could be torn down).

## [1.1.0]

### Added
- Initial Windows/WSL coexistence switcher: `「环境」` tab
  (`conversation.view`) + sidebar footer entry (`sidebar.footer.action`).
- Host API `GET /env/api/state` and `GET /env/api/switch?target=windows|wsl`.

---

## Summary of what changed vs 1.1.0

| Area | 1.1.0 | 1.2.0 |
|---|---|---|
| Sidebar entry location | footer (`sidebar.footer.action`) | main column, above Workspace (DOM graft) |
| Collapsed sidebar | entry remained visible | entry hidden |
| WSL auto-start | broken (`pgrep` self-match race) | fixed (port check + settle delay) |
| Node path | `node-v24.0.0` | `node-v24.17.0` |
| Windows launcher | unpinned `@deepseek-ai/dsh` | pinned `@0.1.1-rc.1` + explicit port |
