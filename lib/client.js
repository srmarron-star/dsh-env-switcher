/* dsh-env-switcher client bundle - Windows | WSL environment switcher
 * Injects a "环境" tab (conversation.view, order 30) and a left-sidebar
 * footer entry (sidebar.footer.action). Hand-written bundle, no build step.
 */
window.__ModuleLoader__.load({
  id: "dsh-env-switcher",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    "use strict";

    const react = require("react");
    const h = react.createElement;
    const { useEffect, useState } = react;

    const NS = "dsh-env-switcher";
    const DICT = {
      zh: {
        tab: "环境",
        footer: "运行环境",
        windows: "Windows",
        wsl: "WSL",
        unknown: "未知",
        opening: "正在打开目标环境...",
        done: "已打开目标环境",
        failed: "打开失败，请查看日志",
        state: "当前环境",
      },
      en: {
        tab: "Environment",
        footer: "Runtime",
        windows: "Windows",
        wsl: "WSL",
        unknown: "unknown",
        opening: "Opening target environment...",
        done: "Opened",
        failed: "Failed to open",
        state: "Current",
      },
    };

    function segStyle(active, busy) {
      return {
        flex: "1 1 0",
        padding: "6px 10px",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        color: active ? "#fff" : "inherit",
        background: active ? "#4D6BFE" : "transparent",
        border: "1px solid " + (active ? "#4D6BFE" : "rgba(128,128,128,.45)"),
        borderRadius: "6px",
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.7 : 1,
        textAlign: "center",
        whiteSpace: "nowrap",
      };
    }

    function EnvSwitcher(props) {
      const t = props.t || ((k) => k);
      const [env, setEnv] = useState(null);
      const [peerUrl, setPeerUrl] = useState(null);
      const [busy, setBusy] = useState(false);
      const [msg, setMsg] = useState("");

      useEffect(() => {
        let cancelled = false;
        fetch("/env/api/state")
          .then((r) => r.json())
          .then((d) => {
            if (cancelled) return;
            setEnv(d.env);
            setPeerUrl(d.peerUrl || null);
          })
          .catch(() => { if (!cancelled) setEnv("unknown"); });
        return () => { cancelled = true; };
      }, []);

      const doSwitch = (target) => {
        if (busy || target === env) return;
        setBusy(true);
        setMsg(t("opening"));
        // Ensure the target server is running, then navigate to it.
        // Coexistence: nothing is killed; both environments stay alive.
        fetch("/env/api/switch?target=" + target)
          .then((r) => r.json())
          .then((d) => {
            setMsg(t("done"));
            const dest = d.url || peerUrl || (target === "windows" ? "http://127.0.0.1:3080" : "http://127.0.0.1:3081");
            setTimeout(() => { window.location.href = dest; }, 600);
          })
          .catch(() => { setMsg(t("failed")); setBusy(false); });
      };

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "8px", padding: "12px 14px", maxWidth: 320 } },
        h(
          "div",
          { style: { fontSize: "12px", opacity: 0.65 } },
          t("state") + (env ? "：" + (env === "windows" ? t("windows") : t("wsl")) : "…")
        ),
        h(
          "div",
          { style: { display: "flex", gap: "6px" } },
          h("button", { style: segStyle(env === "windows", busy), disabled: busy, onClick: () => doSwitch("windows") }, t("windows")),
          h("button", { style: segStyle(env === "wsl", busy), disabled: busy, onClick: () => doSwitch("wsl") }, t("wsl"))
        ),
        msg ? h("div", { style: { fontSize: "12px", opacity: 0.8 } }, msg) : null
      );
    }

    function EnvFooter(props) {
      // Sidebar collapsed (narrow rail): the footer slot passes wide=false.
      // Hide the switcher entirely instead of overflowing the rail.
      if (props.wide !== true) return null;
      const t = props.t || ((k) => k);
      return h(
        "div",
        { style: { padding: "6px 10px" } },
        h(
          "div",
          { style: { display: "flex", gap: "4px", alignItems: "center" } },
          h("span", { style: { fontSize: "11px", opacity: 0.6, marginRight: "4px" } }, t("footer")),
          h(EnvSwitcher, { t })
        )
      );
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, DICT), NS + ":dicts");
      const t = ctx.locale.bind(NS);

      ctx.slots.inject("conversation.view", () =>
        ctx.slots.register(
          { name: "conversation.view", id: "env-switcher", order: 30, label: () => t("tab") },
          (props) => h(EnvSwitcher, Object.assign({ t }, props))
        )
      );

      ctx.slots.inject("sidebar.footer.action", () =>
        ctx.slots.register(
          { name: "sidebar.footer.action", id: "env-switcher-footer", locale: NS },
          (props) => h(EnvFooter, Object.assign({ t }, props))
        )
      );
    }

    module.exports = { name: NS, inject: ["slots", "locale"], apply };
    return module.exports;
  },
});
