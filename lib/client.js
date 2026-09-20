/* dsh-env-switcher client bundle - Windows | WSL environment switcher
 * Injects a "çŽ¯å¢ƒ" tab (conversation.view, order 30) and, via DOM graft, a
 * "è¿è¡ŒçŽ¯å¢ƒ" entry in the sidebar main column (above the workspace block,
 * i.e. between the quick entries and the Workspace section).
 * The sidebar "workspaces" slot is kind:"single", so a slot registration cannot
 * be placed mid-column; we graft a DOM node instead. No build step.
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
        tab: "çŽ¯å¢ƒ",
        footer: "è¿è¡ŒçŽ¯å¢ƒ",
        windows: "Windows",
        wsl: "WSL",
        unknown: "æœªçŸ¥",
        opening: "æ­£åœ¨æ‰“å¼€ç›®æ ‡çŽ¯å¢ƒ...",
        done: "å·²æ‰“å¼€ç›®æ ‡çŽ¯å¢ƒ",
        failed: "æ‰“å¼€å¤±è´¥ï¼Œè¯·æŸ¥çœ‹æ—¥å¿—",
        state: "å½“å‰çŽ¯å¢ƒ",
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
        fetch("/env/api/switch?target=" + target)
          .then((r) => r.json())
          .then((d) => {
            setMsg(t("done"));
            const dest = d.url || peerUrl || (target === "windows" ? "http://127.0.0.1:8080/?token=dsh-master-sovereign-token" : "http://127.0.0.1:8081/?token=dsh-master-sovereign-token");
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
          t("state") + (env ? "ï¼š" + (env === "windows" ? t("windows") : t("wsl")) : "â€¦")
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

    // Collapse-aware: hide the grafted entry when the sidebar is collapsed.
    function injectCollapseCss() {
      if (document.getElementById("dsh-env-switcher-style")) return;
      const style = document.createElement("style");
      style.id = "dsh-env-switcher-style";
      style.textContent =
        "#dsh-env-switcher-middle{display:flex;}" +
        "[data-sidebar-collapsed] #dsh-env-switcher-middle{display:none!important;}";
      (document.head || document.documentElement).appendChild(style);
    }

    // ---- DOM-grafted sidebar entry (native DOM, idempotent) ----
    function buildDomSwitcher(t) {
      const root = document.createElement("div");
      root.id = "dsh-env-switcher-middle";
      root.style.cssText = "padding:6px 10px;display:flex;flex-direction:column;gap:6px;";

      const label = document.createElement("div");
      label.style.cssText = "font-size:11px;opacity:.6;";
      label.textContent = t("footer");
      root.appendChild(label);

      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:6px;";
      const btns = {};
      for (const key of ["windows", "wsl"]) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = t(key);
        b.dataset.env = key;
        b.style.cssText = "flex:1 1 0;padding:6px 10px;font-size:13px;border-radius:6px;border:1px solid rgba(128,128,128,.45);background:transparent;color:inherit;cursor:pointer;";
        b.addEventListener("click", () => {
          row.querySelectorAll("button").forEach((x) => { x.style.opacity = "0.7"; x.style.cursor = "wait"; });
          fetch("/env/api/switch?target=" + key)
            .then((r) => r.json())
            .then((d) => {
              const dest = d.url || (key === "windows" ? "http://127.0.0.1:8080/?token=dsh-master-sovereign-token" : "http://127.0.0.1:8081/?token=dsh-master-sovereign-token");
              setTimeout(() => { window.location.href = dest; }, 600);
            })
            .catch(() => { row.querySelectorAll("button").forEach((x) => { x.style.opacity = "1"; x.style.cursor = "pointer"; }); });
        });
        row.appendChild(b);
        btns[key] = b;
      }
      root.appendChild(row);

      fetch("/env/api/state")
        .then((r) => r.json())
        .then((d) => {
          const active = btns[d.env];
          if (active) {
            active.style.color = "#fff";
            active.style.background = "#4D6BFE";
            active.style.borderColor = "#4D6BFE";
          }
        })
        .catch(() => {});
      return root;
    }

    function mountDomSwitcher(t) {
      const anchor = document.querySelector('[data-slot="sidebar.workspaces"]');
      if (!anchor || !anchor.parentNode) return false;
      if (document.getElementById("dsh-env-switcher-middle")) return true;
      const node = buildDomSwitcher(t);
      anchor.parentNode.insertBefore(node, anchor);
      return true;
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

      // Sidebar middle graft: watch for the workspaces block, insert above it.
      ctx.effect(() => {
        injectCollapseCss();
        let obs = null;
        let collapseObs = null;
        const syncCollapse = () => {
          const frame = document.querySelector('[data-sidebar-collapsed]');
          const node = document.getElementById("dsh-env-switcher-middle");
          if (!node) return;
          const collapsed = frame ? frame.hasAttribute("data-sidebar-collapsed") : false;
          node.style.display = collapsed ? "none" : "flex";
        };
        const attachCollapse = () => {
          // Watch the document for the frame's `data-sidebar-collapsed`
          // attribute, so a live collapse/expand in EITHER direction is caught
          // (the attribute is absent while expanded, so targeting the frame
          // directly would miss the expand->collapse transition).
          const container = document.body || document.documentElement;
          if (!container) return;
          if (collapseObs) collapseObs.disconnect();
          syncCollapse();
          collapseObs = new MutationObserver(syncCollapse);
          collapseObs.observe(container, { attributes: true, subtree: true, attributeFilter: ["data-sidebar-collapsed"] });
        };
        const attempt = () => { if (mountDomSwitcher(t)) attachCollapse(); };
        const boot = () => {
          if (typeof MutationObserver === "undefined") { attempt(); return () => {}; }
          obs = new MutationObserver(() => { attempt(); });
          obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
          attempt();
          return () => { if (obs) obs.disconnect(); if (collapseObs) collapseObs.disconnect(); };
        };
        if (document.readyState === "loading") {
          const onReady = () => window.setTimeout(boot, 0);
          document.addEventListener("DOMContentLoaded", onReady, { once: true });
          return () => document.removeEventListener("DOMContentLoaded", onReady);
        }
        return boot();
      }, NS + ":sidebar-graft");
    }

    module.exports = { name: NS, inject: ["slots", "locale"], apply };
    return module.exports;
  },
});
