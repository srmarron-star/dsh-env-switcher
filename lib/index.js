// dsh-env-switcher - host half (self-contained, no external scripts)
// Coexistence model: Windows DSH on winPort, WSL DSH on wslPort; both run at
// once. The host manages everything itself:
//   GET /env/api/state   -> { env, ownUrl, peerUrl }
//   GET /env/api/switch  -> ensure the target environment's server is running
//                           (never kills anything), the client navigates.
"use strict";

const { execFile } = require("child_process");

const NS = "dsh-env-switcher";

const DEFAULTS = {
  winPort: 3080,
  wslPort: 3081,
  wslDistro: "Ubuntu-24.04",
  // Path to the WSL node bin dir (dsh lives there); used to start the WSL server.
  wslNodeBin: "/home/fsc/.node/node-v24.0.0-linux-x64/bin",
  // Where the WSL server logs (inside the WSL home).
  wslLog: "/home/fsc/dsh-web.log",
  // Where the Windows server logs.
  winLog: "D:\\deepseek-harness\\logs\\dsh-web-win.log",
  // Working directory for the Windows npx launcher.
  winWorkingDir: "C:\\Users\\61468",
};

exports.name = NS;
exports.inject = ["webServer"];

function currentEnv() {
  return process.platform === "win32" ? "windows" : "wsl";
}
function winUrl(cfg) {
  return `http://127.0.0.1:${cfg.winPort}`;
}
function wslUrl(cfg) {
  return `http://127.0.0.1:${cfg.wslPort}`;
}
function ownUrl(env, cfg) {
  return env === "windows" ? winUrl(cfg) : wslUrl(cfg);
}
function peerUrl(env, cfg) {
  return env === "windows" ? wslUrl(cfg) : winUrl(cfg);
}

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-cache",
  });
  res.end(JSON.stringify(body));
}

// Ensure the WINDOWS DSH server runs on winPort (start hidden if not).
// Works from the Windows host directly and from WSL via interop.
function ensureWindows(cfg) {
  const ps = [
    "-NoProfile",
    "-WindowStyle",
    "Hidden",
    "-Command",
    `$p=${cfg.winPort}; ` +
      `if (-not (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue)) { ` +
      `Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npx -y @deepseek-ai/dsh web' ` +
      `-WorkingDirectory '${cfg.winWorkingDir}' -WindowStyle Hidden ` +
      `-RedirectStandardOutput '${cfg.winLog}' -RedirectStandardError '${cfg.winLog}.err'; }`,
  ];
  execFile("powershell.exe", ps, { windowsHide: true, timeout: 30000 }, () => { /* ignore */ });
}

// Ensure the WSL DSH server runs on wslPort (setsid-detached inside the VM).
function ensureWsl(cfg) {
  const bashCmd =
    `export PATH="${cfg.wslNodeBin}:$PATH"; ` +
    `if ! pgrep -f '[d]sh web' >/dev/null 2>&1; then ` +
    `setsid nohup dsh web --port ${cfg.wslPort} >${cfg.wslLog} 2>&1 < /dev/null & fi`;
  const args = process.platform === "win32"
    ? ["-d", cfg.wslDistro, "--", "bash", "-lc", bashCmd]
    : ["-lc", bashCmd];
  const bin = process.platform === "win32" ? "wsl.exe" : "bash";
  execFile(bin, args, { windowsHide: true, timeout: 60000 }, () => { /* ignore */ });
}

exports.apply = function (ctx, config) {
  const cfg = Object.assign({}, DEFAULTS, config || {});

  ctx.webServer.register({
    kind: "exact",
    path: "/env/api/state",
    handler: (req, res) => {
      const env = currentEnv();
      json(res, 200, {
        env,
        platform: process.platform,
        ownUrl: ownUrl(env, cfg),
        peerUrl: peerUrl(env, cfg),
      });
    },
  });

  ctx.webServer.register({
    kind: "exact",
    path: "/env/api/switch",
    handler: (req, res) => {
      let target = "wsl";
      try {
        target = new URL(req.url, "http://dsh.internal").searchParams.get("target") || "wsl";
      } catch (e) {
        /* keep default */
      }
      if (target !== "windows" && target !== "wsl") {
        json(res, 400, { ok: false, error: "invalid target" });
        return;
      }
      const env = currentEnv();
      const url = target === "windows" ? winUrl(cfg) : wslUrl(cfg);
      json(res, 200, { ok: true, target, url, same: target === env });
      // Never kills anything: just make sure the target server is up.
      if (target === "windows") ensureWindows(cfg);
      else ensureWsl(cfg);
    },
  });
};
