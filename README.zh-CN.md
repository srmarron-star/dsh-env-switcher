# dsh-env-switcher

> Windows / WSL2 双环境一键切换的 DeepSeek Harness 插件（双环境共存模式）

[English](./README.md) · **简体中文**

一个 DeepSeek Harness（DSH）插件：在 Web UI 里以 `| Windows | WSL |` 分段选择器的形式，在 **Windows 原生环境**与 **WSL2 (Linux) 环境**之间自由切换——两个环境**同时运行、互不干扰**，切换时**不杀任何进程**。

---

## 🧠 开发动机

本项目源于一个实际开发中的观察：

> **DeepSeek V4 Pro 正式版在 Linux 环境下表现更好。**

在 Windows 原生环境与 WSL2 (Ubuntu) 环境下的对比测试中，V4 Pro 在 Linux 环境中的轨迹质量、工具调用稳定性与整体表现更优。但完全放弃 Windows 环境又不可取——日常文件、软件生态、桌面应用（如本仓库配套的 Electron 客户端）都依赖 Windows 侧。

因此需要一套能让 **两个环境同时在线、随时切换** 的基础设施：

- 两个 DSH 实例各自独立运行，各有各的会话历史与工作目录
- 想用哪个环境，一个按钮切换，不打断另一个环境的工作
- 这套工具最终沉淀为这个插件，并附带从零搭建 WSL2 + DSH 双环境的完整指南（见下文）

---

## ✨ 功能特性

- 🖥️ **双环境共存**：Windows DSH（`127.0.0.1:3080`）与 WSL DSH（`127.0.0.1:3081`）同时运行
- 🔀 **一键切换**：Web UI 内 `| Windows | WSL |` 选择器，当前标签页直接跳转，**不杀进程、不弹新窗口**
- 📌 **双入口 UI**：
  - 对话区上方的 **「环境」标签页**（始终可见，侧栏收起也不影响）
  - 左侧栏底部的 **「运行环境」迷你切换器**（侧栏收起时自动隐藏）
- ⚙️ **全配置化**：端口、WSL 发行版、Node 路径、日志路径均可通过 `cordis.patch.yml` 配置
- 🌏 **中英双语**：界面文案跟随 DSH 语言自动切换
- 🧩 **自包含**：宿主端用 Node 原生实现"确保服务运行"，不依赖任何外部脚本

---

## 🚀 从零开始：WSL2 + DSH 双环境搭建

### 0. 环境要求

| 项目 | 要求 |
|---|---|
| Windows | Windows 10 2004+ / Windows 11 |
| 虚拟化 | BIOS/UEFI 中开启虚拟化（VT-x/AMD-V） |
| WSL2 | 需启用「虚拟机平台」功能（`wsl --install` 会自动处理） |
| 磁盘 | WSL 发行版建议 ≥ 10GB 可用空间 |

### 1. 安装 WSL2 + Ubuntu

在**管理员 PowerShell** 中执行：

```powershell
wsl --install -d Ubuntu-24.04
```

- 首次安装会要求**重启电脑**
- 重启后按提示创建 Linux 用户名和密码
- 验证安装：

```powershell
wsl -l -v
#   NAME            STATE           VERSION
# * Ubuntu-24.04    Running         2        ← VERSION 必须是 2（WSL2）
```

> 如果 VERSION 是 1，执行 `wsl --set-version Ubuntu-24.04 2`。

### 2. 在 WSL 中安装 Node.js ≥ 22

DSH 要求 **Node ≥ 22**（Node 20 会因缺少 `createZstdDecompress`、`Promise.withResolvers` 等 API 而崩溃）。

**方案 A：nvm（推荐，用户级安装）**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
nvm install 24
nvm alias default 24
```

> 国内网络无法访问 GitHub 时，可从 npmmirror 直接下载 Node 二进制：
> ```bash
> curl -fsSL -o /tmp/node.tar.xz "https://registry.npmmirror.com/-/binary/node/latest-v24.x/node-v24.0.0-linux-x64.tar.xz"
> mkdir -p ~/.node && tar -xJf /tmp/node.tar.xz -C ~/.node
> echo 'export PATH="$HOME/.node/node-v24.0.0-linux-x64/bin:$PATH"' >> ~/.bashrc
> ```

**安装构建工具链**（DSH 依赖的 node-pty 需要原生编译）：

```bash
sudo apt-get update && sudo apt-get install -y build-essential
# 或使用 WSL root 免密：wsl -d Ubuntu-24.04 -u root -- apt-get install -y build-essential
```

### 3. 在 WSL 中安装 DSH

```bash
npm install -g pnpm --registry=https://registry.npmmirror.com
npm install -g @deepseek-ai/dsh --registry=https://registry.npmmirror.com
dsh --version
```

首次启动初始化 profile（会自动安装基础 bundles）：

```bash
setsid nohup dsh web --port 3081 >~/dsh-web.log 2>&1 < /dev/null &
```

> `setsid` 使服务脱离终端会话存活；`--port 3081` 与 Windows 侧的 3080 错开，实现双环境共存。

### 4. 在 Windows 中安装 DSH

```powershell
npm install -g @deepseek-ai/dsh
dsh web          # 默认端口 3080
```

> 也可以把 `C:\Users\<你>\node_modules` 里的 `@deepseek-ai/*` 全套作为全局安装（本机即采用此方式）。

### 5. 安装本插件

```bash
# 方式一：npm 安装（发布后）
dsh plugin --profile web add dsh-env-switcher

# 方式二：本地源码安装
dsh plugin --profile web add file:/path/to/dsh-env-switcher
```

**两个环境都要安装**（Windows 与 WSL 各自的 profile）：

```powershell
# Windows PowerShell
dsh plugin --profile web add file:D:\path\to\dsh-env-switcher
```

```bash
# WSL
dsh plugin --profile web add file:/mnt/d/path/to/dsh-env-switcher
```

安装完成后**重启 DSH 服务**并硬刷新浏览器（Ctrl+Shift+R）。

---

## ⚙️ 配置说明

所有字段均可选，默认值适配典型的 Windows + WSL2 机器：

```yaml
# cordis.patch.yml
- insert:
    - id: dsh-env-switcher
      name: dsh-env-switcher
      config:
        winPort: 3080                         # Windows 版 DSH 端口
        wslPort: 3081                         # WSL 版 DSH 端口
        wslDistro: Ubuntu-24.04               # WSL 发行版名称（wsl -l -v 查看）
        wslNodeBin: /home/fsc/.node/node-v24.0.0-linux-x64/bin   # WSL 内 node bin 目录
        wslLog: /home/fsc/dsh-web.log         # WSL 服务日志路径（WSL 内）
        winLog: D:\deepseek-harness\logs\dsh-web-win.log        # Windows 服务日志路径
        winWorkingDir: C:\Users\61468         # Windows npx 启动器工作目录
```

> ⚠️ 修改配置后需重启 DSH 服务生效。

---

## 🎯 使用说明

### Web UI 切换

1. 对话区上方标签栏出现 **「环境」** 标签（与「对话」「轨迹」等并列）
2. 点击进入，看到 `| Windows | WSL |` 选择器与当前环境指示
3. 点击目标环境 → 当前标签页自动跳转（切换前会确保目标服务在运行）

左侧栏底部也有迷你版「运行环境」切换器（侧栏收起时隐藏）。

### 宿主 API

| 端点 | 说明 |
|---|---|
| `GET /env/api/state` | 返回 `{ env, ownUrl, peerUrl }`（当前环境与双端地址） |
| `GET /env/api/switch?target=windows\|wsl` | 确保目标环境服务在运行（不杀进程、不打开浏览器），客户端自行导航 |

### 桌面快捷方式（可选）

插件配套的独立快捷方式脚本（与插件解耦，放在 `scripts/` 目录）：

```powershell
# Windows PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\switch-env.ps1 -Target wsl [-Visible] [-NoOpen]
```

---

## 🏗️ 架构说明

```
┌─────────────────────────────── Windows ───────────────────────────────┐
│  DSH (Windows)  ── 127.0.0.1:3080       浏览器 ── localhost:3080      │
│      │ 插件 host：/env/api/*                                        │
│      └── 确保对方在跑（powershell.exe / wsl.exe，仅启动不杀）          │
└───────────────────────────────────────────────────────────────────────┘
                 ▲ wsl.exe / bash（启动/检查）
┌─────────────────────────────── WSL2 ─────────────────────────────────┐
│  DSH (Linux)  ── 127.0.0.1:3081（虚拟机内）→ Windows 经 localhost     │
│                 转发可访问 localhost:3081                              │
└───────────────────────────────────────────────────────────────────────┘
```

- **端口分离**：Windows 版 3080，WSL 版 3081（虚拟机独立网络栈，互不冲突）
- **共存**：两个实例同时运行，各自保留会话历史
- **切换 = 导航**：点击目标 → 确保服务在跑 → 当前标签页跳转
- **无副作用**：不杀进程、不重启虚拟机、不弹多余窗口

---

## ❓ 常见问题

**Q：切换时提示目标端口连不上？**
检查目标环境服务是否真的在运行：`curl http://127.0.0.1:3081`（WSL 侧）。若 WSL 服务未启动，检查 `wslLog` 指定的日志文件。

**Q：WSL 环境能访问 Windows 的文件吗？**
可以。Windows 盘符挂载在 `/mnt/<盘符>`（如 `D:` → `/mnt/d/`），权限与你的 Windows 用户一致。

**Q：本机有 Clash 等代理软件，localhost 转发不稳定？**
WSL2 的 localhost 转发偶尔会被代理软件干扰（启动时会出现 "检测到 localhost 代理配置" 警告）。本插件的双端口共存模式不依赖单一端口的转发，即使转发异常，Windows 侧 3080 与 WSL 侧 3081 各自独立，互不影响。

**Q：为什么 WSL 版不能直接绑 0.0.0.0 通过 IP 访问？**
DSH 出于安全设计**禁止** `--host 0.0.0.0`（会向局域网暴露远程代码执行能力），只能绑定 127.0.0.1，因此必须通过 localhost 转发访问。

**Q：日志在哪里？**
- Windows 服务：`winLog` 配置的路径（默认 `D:\deepseek-harness\logs\dsh-web-win.log`）
- WSL 服务：`wslLog`（默认 `/home/fsc/dsh-web.log`）
- 插件自身：`logs\switch-env.log`（独立快捷方式脚本使用）

---

## 🛠️ 开发

```
dsh-env-switcher/
├── package.json          # v1.1.0，可发布（npm publish）
├── cordis.patch.yml      # bundle 声明 + 默认配置
├── README.md             # 英文文档
├── README.zh-CN.md       # 中文文档（本文件）
└── lib/
    ├── index.js          # 宿主端：/env/api/state + /env/api/switch + ensure
    └── client.js         # 客户端：环境标签页 + 侧栏切换器（手写 bundle，无构建步骤）
```

- 宿主端无第三方依赖，纯 Node 标准库
- 客户端为手写 `window.__ModuleLoader__` bundle，修改后由 DSH 的 HMR 观察器自动刷新版本号
- 修改后同步到 profile：`node_modules/dsh-env-switcher/` 并重启 DSH

---

## 📄 License

[MIT](./LICENSE)
