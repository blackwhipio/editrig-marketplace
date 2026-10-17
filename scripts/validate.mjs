// Checks index.json and every pack it lists: required fields, an allowed licence, a pinned commit,
// safe paths, and that every file a manifest lists is there with the sha256 it names.
// Usage: node scripts/validate.mjs [index.json] [--only <pack id>]
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const LICENSES = new Set(["CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "MIT", "Apache-2.0"]);
const KINDS = new Set(["characters", "backgrounds", "props", "models", "styles", "voices", "plugins", "templates", "mixed"]);
const FIELDS = ["id", "name", "kind", "description", "author", "license", "version", "base", "page"];

const file = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "index.json";
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const index = JSON.parse(readFileSync(file, "utf8"));
const errors = [];
const fail = (id, msg) => errors.push(`${id}: ${msg}`);
const safe = (p) => typeof p === "string" && p.length > 0 && !p.includes("\\") && !p.startsWith("/") && !/^[a-z]:/i.test(p) && p.split("/").every((s) => s && s !== "." && s !== "..");

if (index.editrigIndex !== 1 || !Array.isArray(index.packs)) throw new Error("index.json must be { editrigIndex: 1, packs: [...] }");
const ids = new Set();
for (const p of index.packs) {
  const id = p.id ?? "(no id)";
  if (ids.has(id)) fail(id, "listed twice");
  ids.add(id);
  if (only && id !== only) continue;
  for (const f of FIELDS) if (typeof p[f] !== "string" || (f !== "description" && !p[f].trim())) fail(id, `missing ${f}`);
  if (!LICENSES.has(p.license)) fail(id, `licence ${p.license} is not one of ${[...LICENSES].join(", ")}`);
  if (!KINDS.has(p.kind)) fail(id, `kind ${p.kind} is not one of ${[...KINDS].join(", ")}`);
  if (!/^https:\/\//.test(p.base ?? "")) fail(id, "base must be an https URL");
  // a 40-character commit in the URL: the pack cannot change after review
  if (!/\/[0-9a-f]{40}\//.test(p.base ?? "")) fail(id, "base must point at a commit, not a branch");
  try {
    const base = p.base.endsWith("/") ? p.base : `${p.base}/`;
    const res = await fetch(`${base}editrig-pack.json`);
    if (!res.ok) {
      fail(id, `editrig-pack.json: ${res.status}`);
      continue;
    }
    const m = await res.json();
    if (m.id !== p.id) fail(id, `the manifest's id is ${m.id}`);
    if (m.license !== p.license) fail(id, `the manifest's licence is ${m.license}`);
    for (const it of m.items ?? []) if (!safe(it.path)) fail(id, `unsafe item path ${it.path}`);
    for (const f of m.files ?? []) {
      if (!safe(f.path)) {
        fail(id, `unsafe file path ${f.path}`);
        continue;
      }
      const r = await fetch(base + f.path.split("/").map(encodeURIComponent).join("/"));
      if (!r.ok) {
        fail(id, `${f.path}: ${r.status}`);
        continue;
      }
      const sha = createHash("sha256").update(Buffer.from(await r.arrayBuffer())).digest("hex");
      if (sha !== f.sha256) fail(id, `${f.path} does not match its sha256`);
    }
    console.log(`ok ${id} (${(m.files ?? []).length} files)`);
  } catch (e) {
    fail(id, String(e));
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`${index.packs.length} packs checked`);
