import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { recoverPreviewMedia } from "../scripts/recover-preview-media.mjs";
function fixture(t, { hashMismatch = false, ignored = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "sollahms-media-fixture-"));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, stdio: "pipe" });
  git("init", "-q");
  git("config", "user.name", "Synthetic Fixture");
  git("config", "user.email", "fixture@example.invalid");
  const path = "assets/propiedades/ecasa-preview/fixture/image.webp",
    bytes = Buffer.from("synthetic reviewed bytes");
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), bytes);
  git("add", ".");
  git("commit", "-qm", "Synthetic reviewed media");
  git("rm", "-q", path);
  writeFileSync(
    join(root, ".gitignore"),
    ignored ? "/assets/propiedades/ecasa-preview/\n" : "",
  );
  mkdirSync(join(root, "data"));
  writeFileSync(
    join(root, "data/brochures-ecasa.json"),
    JSON.stringify({
      assets: [
        {
          localPath: "/" + path,
          sha256: hashMismatch
            ? "0".repeat(64)
            : createHash("sha256").update(bytes).digest("hex"),
          privacySafe: true,
        },
      ],
    }),
  );
  git("add", ".");
  git("commit", "-qm", "Keep original media outside checkout");
  return { root, path, bytes };
}
test("reviewed media recovery defaults to read-only and restores only exact ignored historical bytes", (t) => {
  const f = fixture(t);
  assert.equal(
    recoverPreviewMedia({ ...f, refs: ["HEAD"] }).counts.recoverable,
    1,
  );
  assert.equal(existsSync(join(f.root, f.path)), false);
  const result = recoverPreviewMedia({ ...f, refs: ["HEAD"], write: true });
  assert.equal(result.counts.recovered, 1);
  assert.deepEqual(readFileSync(join(f.root, f.path)), f.bytes);
  assert.equal(
    recoverPreviewMedia({ ...f, refs: ["HEAD"], write: true }).counts.present,
    1,
  );
});
test("reviewed media recovery refuses mismatched historical bytes and preserves existing corruption for review", (t) => {
  const f = fixture(t, { hashMismatch: true });
  assert.equal(
    recoverPreviewMedia({ ...f, refs: ["HEAD"], write: true }).counts.missing,
    1,
  );
  mkdirSync(dirname(join(f.root, f.path)), { recursive: true });
  writeFileSync(join(f.root, f.path), "corrupt synthetic bytes");
  assert.equal(
    recoverPreviewMedia({ ...f, refs: ["HEAD"], write: true }).counts.mismatch,
    1,
  );
  assert.equal(
    readFileSync(join(f.root, f.path), "utf8"),
    "corrupt synthetic bytes",
  );
});
test("reviewed media recovery cannot write tracked destinations or follow symlinks", (t) => {
  const f = fixture(t, { ignored: false });
  assert.throws(() =>
    recoverPreviewMedia({ ...f, refs: ["HEAD"], write: true }),
  );
  const other = fixture(t);
  mkdirSync(join(other.root, "outside"));
  symlinkSync(join(other.root, "outside"), join(other.root, "assets"), "dir");
  assert.throws(
    () => recoverPreviewMedia({ ...other, refs: ["HEAD"], write: true }),
    /symlink/,
  );
});
test("reviewed media recovery rejects unsafe paths and unreviewed privacy flags", (t) => {
  const f = fixture(t);
  const manifest = join(f.root, "data/brochures-ecasa.json");
  let j = JSON.parse(readFileSync(manifest));
  j.assets[0].localPath =
    "/assets/propiedades/ecasa-preview/../../private.webp";
  writeFileSync(manifest, JSON.stringify(j));
  assert.throws(() => recoverPreviewMedia({ ...f, refs: ["HEAD"] }), /Unsafe/);
  j.assets[0].privacySafe = false;
  writeFileSync(manifest, JSON.stringify(j));
  assert.deepEqual(
    recoverPreviewMedia({ ...f, refs: ["HEAD"], write: true }).counts,
    { present: 0, recoverable: 0, recovered: 0, missing: 0, mismatch: 0 },
  );
});
