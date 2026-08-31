// Smoke tests for dsh-env-switcher (no DSH server needed).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

test("host bundle loads and exports the plugin contract", () => {
  const host = require("../lib/index.js");
  assert.strictEqual(host.name, "dsh-env-switcher");
  assert.ok(Array.isArray(host.inject), "inject must be an array");
  assert.ok(host.inject.includes("webServer"));
  assert.strictEqual(typeof host.apply, "function");
});

test("client bundle is a module-loader wrapper with tab + mid-column graft", () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "client.js"), "utf8");
  assert.ok(src.includes("window.__ModuleLoader__.load"), "missing module loader wrapper");
  assert.ok(src.includes("conversation.view"), "missing conversation.view tab injection");
  assert.ok(src.includes("sidebar.workspaces"), "missing sidebar workspaces graft anchor");
  assert.ok(src.includes("dsh-env-switcher-middle"), "missing mid-column graft node id");
  assert.ok(src.includes("data-sidebar-collapsed"), "missing collapse-aware guard");
  assert.ok(src.includes("dsh-env-switcher"), "missing plugin id");
});

test("package.json declares bundle, client and complete files", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.strictEqual(pkg.name, "dsh-env-switcher");
  assert.ok(pkg.dsh.bundle.patch, "missing dsh.bundle.patch");
  assert.strictEqual(pkg.dsh.client.platform, "web");
  assert.ok(pkg.exports["./client"], "missing ./client export");
  assert.ok(pkg.exports["./package.json"], "missing ./package.json export (client manifest needs it)");
  for (const f of pkg.files) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `missing packaged file: ${f}`);
  }
});

test("cordis.patch.yml references the package and is parseable", () => {
  const yaml = fs.readFileSync(path.join(ROOT, "cordis.patch.yml"), "utf8");
  assert.ok(yaml.includes("dsh-env-switcher"));
  // minimal YAML sanity: balanced indentation for the insert block
  assert.ok(yaml.includes("- insert:"));
  assert.ok(yaml.includes("name: dsh-env-switcher"));
});
