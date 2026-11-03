import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
// Offline metadata only. Never fetches a protected URL, invokes Vercel, copies
// source bytes or grants publication rights. The existing inventory is reused.
const inventory = JSON.parse(
  execFileSync(process.execPath, ["scripts/protected-release-inventory.mjs"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }),
);
const reference = JSON.parse(
  readFileSync(resolve(root, "docs/release-reference.json"), "utf8"),
);
const requests = inventory.assets
  .filter((a) => a.state === "missing")
  .map((a) => {
    const safe =
      /^assets\/[A-Za-z0-9_./ ()-]+$/.test(a.path) &&
      !a.path.split("/").includes("..");
    const ignored =
      safe &&
      spawnSync(
        "git",
        ["check-ignore", "--no-index", "--quiet", "--", a.path],
        { cwd: root, stdio: "ignore" },
      ).status === 0;
    const hashBound =
      a.expectedSha256.length === 1 &&
      /^[a-f0-9]{64}$/.test(a.expectedSha256[0]);
    const sourceOnly =
      /\.pdf$/i.test(a.path) ||
      a.path.includes("/brochures/") ||
      a.path.includes("/ecasa-official-review/");
    return {
      path: a.path,
      expectedSha256: a.expectedSha256,
      sources: a.sources,
      destinationIgnored: ignored,
      classification: sourceOnly
        ? "private-source-package"
        : "reviewed-derivative",
      candidateArtifactPaths: safe
        ? sourceOnly
          ? [a.path]
          : [a.path, "dist/" + a.path, ".vercel/output/static/" + a.path]
        : [],
      eligibleForAuthenticatedExactHashRecovery: !!(
        safe &&
        ignored &&
        hashBound
      ),
      publicFetchAuthorized: false,
      restoreAutomatically: false,
    };
  });
console.log(
  JSON.stringify(
    {
      scope:
        "inspect existing protected staging artifacts before requesting duplicate material; offline preparation only",
      projectName: reference.projectName,
      projectIdFromVersionedReference: reference.projectId,
      teamIdFromVersionedReference: reference.teamId,
      stagingStatusEvidence:
        "READY and SSO confirmed by owner; deployment ID, URL and commit still unavailable to this executor",
      deploymentId: null,
      previewOrigin: null,
      requests,
      summary: {
        missing: requests.length,
        hashBoundIgnoredCandidates: requests.filter(
          (r) => r.eligibleForAuthenticatedExactHashRecovery,
        ).length,
        privateSourcePackageCandidates: requests.filter(
          (r) => r.classification === "private-source-package",
        ).length,
      },
      requiredAccess: [
        "Read project staging deployment metadata and source commit",
        "Read source/build artifact file inventory",
        "Authenticated read of authorized protected artifacts or existing private source package",
      ],
      restrictions: {
        disableSso: false,
        changeProtectedTests: false,
        useProductionArtifacts: false,
        publishSourcePdfs: false,
        providerCallsPerformed: false,
        productionAuthorized: false,
      },
    },
    null,
    2,
  ),
);
