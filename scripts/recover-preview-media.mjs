import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  readFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  writeFileSync,
  realpathSync,
} from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { pathToFileURL } from "node:url";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const manifests = ["ingevec", "ecasa", "leben", "leon"].map(
  (name) => "data/brochures-" + name + ".json",
);
// No network, downloads, publication or changes to manifests. Only exact reviewed
// privacy-safe bytes already present in explicitly selected local Git history.
export function recoverPreviewMedia({ root, refs, write = false }) {
  root = realpathSync(root);
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
  if (
    git("rev-parse", "--show-toplevel").toString().trim() !== root ||
    !refs?.length ||
    refs.some(
      (ref) =>
        typeof ref !== "string" ||
        !/^[-\w/.]+$/.test(ref) ||
        ref.startsWith("-"),
    )
  )
    throw new Error("Explicit repository root and local Git refs required");
  const reviewed = new Map();
  function visit(value) {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (
      typeof value.localPath === "string" &&
      value.sha256 &&
      value.privacySafe === true
    ) {
      const path = value.localPath.slice(1);
      if (
        !/^assets\/propiedades\/(?:ingevec|ecasa|leben)-preview\/[a-z0-9_/-]+\.(?:webp|png|jpe?g)$/.test(
          path,
        ) ||
        path.includes("..") ||
        !/^[a-f0-9]{64}$/.test(value.sha256)
      )
        throw new Error("Unsafe reviewed media metadata");
      const prior = reviewed.get(path);
      if (prior && prior !== value.sha256)
        throw new Error("Conflicting reviewed media hashes");
      reviewed.set(path, value.sha256);
    }
    Object.values(value).forEach(visit);
  }
  for (const file of manifests)
    if (existsSync(resolve(root, file)))
      visit(JSON.parse(readFileSync(resolve(root, file), "utf8")));
  const commits = refs.map((ref) => ({
    ref,
    commit: git("rev-parse", "--verify", ref + "^{commit}")
      .toString()
      .trim(),
  }));
  const objects = new Map();
  for (const line of git(
    "rev-list",
    "--objects",
    ...commits.map((c) => c.commit),
    "--",
    "assets/propiedades",
  )
    .toString()
    .split("\n")) {
    const at = line.indexOf(" ");
    if (at < 0) continue;
    const oid = line.slice(0, at),
      path = line.slice(at + 1);
    if (!reviewed.has(path) || !/^[a-f0-9]{40}$/.test(oid)) continue;
    if (!objects.has(path)) objects.set(path, []);
    objects.get(path).push(oid);
  }
  function safePath(path) {
    let current = root;
    for (const part of path.split("/")) {
      current = resolve(current, part);
      if (!relative(root, current) || relative(root, current).startsWith(".."))
        throw new Error("Media path escaped repository");
      if (existsSync(current) && lstatSync(current).isSymbolicLink())
        throw new Error("Media symlink rejected");
    }
    return current;
  }
  const results = [];
  for (const [path, sha256] of reviewed) {
    const destination = safePath(path);
    if (existsSync(destination)) {
      results.push({
        path,
        sha256,
        state:
          digest(readFileSync(destination)) === sha256 ? "present" : "mismatch",
      });
      continue;
    }
    let found;
    for (const oid of new Set(objects.get(path) ?? [])) {
      const size = Number(git("cat-file", "-s", oid).toString());
      if (!Number.isSafeInteger(size) || size < 1 || size > 16 * 1024 * 1024)
        continue;
      const bytes = git("cat-file", "blob", oid);
      if (digest(bytes) !== sha256) continue;
      if (write) {
        // Private originals stay ignored. Never add them to Git or overwrite bytes.
        git("check-ignore", "--no-index", "--quiet", "--", path);
        mkdirSync(dirname(destination), { recursive: true });
        safePath(path);
        writeFileSync(destination, bytes, { flag: "wx", mode: 0o600 });
      }
      found = {
        path,
        sha256,
        gitObject: oid,
        bytes: bytes.length,
        state: write ? "recovered" : "recoverable",
      };
      break;
    }
    results.push(found ?? { path, sha256, state: "missing" });
  }
  const counts = Object.fromEntries(
    ["present", "recoverable", "recovered", "missing", "mismatch"].map(
      (state) => [state, results.filter((r) => r.state === state).length],
    ),
  );
  return {
    scope: "reviewed media recovery only; not release or publishing approval",
    commits,
    writeIgnoredOnly: write,
    counts,
    results,
    publicationAuthorized: false,
  };
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    const args = process.argv.slice(2),
      refs = [];
    let write = false;
    for (let i = 0; i < args.length; i++)
      if (args[i] === "--ref" && args[i + 1]) refs.push(args[++i]);
      else if (args[i] === "--write-ignored") write = true;
      else throw new Error("Use --ref <local-ref> [--write-ignored]");
    console.log(
      JSON.stringify(
        recoverPreviewMedia({ root: process.cwd(), refs, write }),
        null,
        2,
      ),
    );
  } catch {
    console.error("Reviewed media recovery failed; no publication authorized.");
    process.exitCode = 1;
  }
}
