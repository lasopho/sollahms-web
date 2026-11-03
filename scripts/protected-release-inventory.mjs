import { readFileSync, existsSync, lstatSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readMainBaseline } from "./leon-main-publication.mjs";
// Read-only. Historical references support historical assertions only; they
// never restore retired public routes or grant current publication rights.
const root = fileURLToPath(new URL("../", import.meta.url)),
  baseline = readMainBaseline(root),
  references = new Map();
const manifests = [
  "data/brochures-aj-urbana.json",
  "data/brochures-ingevec.json",
  "data/brochures-ecasa.json",
  "data/brochures-leben.json",
  "data/brochures-leon.json",
  "data/ecasa-official-originals.json",
];
function add(path, source, sha256) {
  if (typeof path !== "string") return;
  const candidate = path.replace(/^\//, "");
  if (!candidate.startsWith("assets/")) return;
  // Source-package directory/glob descriptions are not literal asset files.
  if (
    !/\.(?:webp|png|jpe?g|pdf|svg|avif)$/i.test(candidate) ||
    /[*?]/.test(candidate)
  )
    return;
  if (/[\0\r\n\\]/.test(candidate) || candidate.split("/").includes(".."))
    throw new Error("Unsafe protected resource path");
  if (!references.has(candidate))
    references.set(candidate, {
      path: candidate,
      sources: new Set(),
      expectedHashes: new Set(),
    });
  const item = references.get(candidate);
  item.sources.add(source);
  if (typeof sha256 === "string" && /^[a-f0-9]{64}$/.test(sha256))
    item.expectedHashes.add(sha256);
}
function visit(value, source) {
  if (typeof value === "string") {
    add(value, source);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => visit(v, source));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (value.localPath) add(value.localPath, source, value.sha256);
  Object.values(value).forEach((v) => visit(v, source));
}
for (const file of manifests) {
  if (existsSync(resolve(root, file)))
    visit(
      JSON.parse(readFileSync(resolve(root, file), "utf8")),
      "current:" + file,
    );
  const exists = execFileSync(
    "git",
    ["ls-tree", "--name-only", baseline.mainCommit, "--", file],
    { cwd: root, encoding: "utf8" },
  ).trim();
  if (exists)
    visit(
      JSON.parse(
        execFileSync("git", ["show", baseline.mainCommit + ":" + file], {
          cwd: root,
          encoding: "utf8",
          maxBuffer: 16 * 1024 * 1024,
        }),
      ),
      "historical:" + baseline.mainCommit + ":" + file,
    );
}
const assets = [...references.values()]
  .sort((a, b) => a.path.localeCompare(b.path))
  .map((item) => {
    const path = resolve(root, item.path);
    if (relative(root, path).startsWith(".."))
      throw new Error("Resource escaped checkout");
    let state = "missing",
      actualSha256;
    if (existsSync(path)) {
      if (lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile())
        state = "unsafe";
      else {
        actualSha256 = createHash("sha256")
          .update(readFileSync(path))
          .digest("hex");
        state =
          item.expectedHashes.size === 0
            ? "present_unbound"
            : item.expectedHashes.has(actualSha256)
              ? "verified"
              : "mismatch";
      }
    }
    return {
      path: item.path,
      sources: [...item.sources],
      expectedSha256: [...item.expectedHashes],
      state,
      ...(actualSha256 ? { actualSha256 } : {}),
    };
  });
const selection = JSON.parse(
  readFileSync(resolve(root, "tests/git-ci-selection.json"), "utf8"),
);
console.log(
  JSON.stringify(
    {
      scope:
        "current and pinned historical protected resources; not publication approval",
      baselineCommit: baseline.mainCommit,
      releaseCases: selection.selectedSuites.flatMap((s) =>
        s.releaseRequired.map((c) => ({ file: s.file, ...c })),
      ),
      assets,
      summary: Object.fromEntries(
        ["missing", "verified", "present_unbound", "mismatch", "unsafe"].map(
          (state) => [state, assets.filter((a) => a.state === state).length],
        ),
      ),
      publicationAuthorized: false,
      hostedVerified: false,
    },
    null,
    2,
  ),
);
