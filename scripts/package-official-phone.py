"""Phone-only overlay on the exact published León artifact; no regeneration."""
import copy
import hashlib
import json
from pathlib import Path
from site_contact import render, sync

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "docs/official-phone-20261030"
BASE = ROOT / "docs/leon-commercial-20261030/deployment-files.json"
BRANCH = "codex/official-phone-20261030"
ALLOWED = {"index.html", "contacto.html", "agenda-asesoria.html", "comparador-hipotecario.html"}
config = json.loads((ROOT / "data/site-contact.json").read_text())
sync(check=True)
baseline = json.loads(BASE.read_text())
files = {f["file"]: copy.deepcopy(f) for f in baseline}
hashes = json.loads(files["release-hashes.json"]["data"])
# Confirm this manifest matches the SHA-1 observed in the active deployment.
assert hashlib.sha1(files["release-hashes.json"]["data"].encode()).hexdigest() == "ac52e404419ce528f7dddff7ba593be324307220"
changed = []
for path in sorted(ALLOWED):
    key = "release/static/" + path
    previous = files[key]["data"]
    current = render(previous, config)
    assert current != previous, path
    assert (ROOT / path).read_text() == current, "Unrelated source edit: " + path
    files[key] = {"file": key, "data": current}
    hashes["static/" + path] = hashlib.sha256(current.encode()).hexdigest()
    changed.append(key)
files["release-hashes.json"]["data"] = json.dumps(hashes, separators=(",", ":"))
vc = json.loads(files["vercel.json"]["data"])
vc["git"]["deploymentEnabled"][BRANCH] = False
assert vc["git"]["deploymentEnabled"]["main"] is False
files["vercel.json"]["data"] = json.dumps(vc, indent=2) + "\n"
source_vc = json.loads((ROOT / "vercel.json").read_text())
source_vc["git"]["deploymentEnabled"][BRANCH] = False
(ROOT / "vercel.json").write_text(json.dumps(source_vc, indent=2) + "\n")
allowed = set(changed) | {"release-hashes.json", "vercel.json"}
assert set(files) == {f["file"] for f in baseline}
assert all(files[f["file"]] == f for f in baseline if f["file"] not in allowed)
DEST.mkdir(parents=True, exist_ok=True)
output = DEST / "deployment-files.json"
output.write_text(json.dumps(list(files.values()), ensure_ascii=False, separators=(",", ":")))
report = {
    "baselineDeployment": "dpl_BZhhRSnpWc3faoDHCByT2p2XzmLa",
    "baselineManifestSha256": hashlib.sha256(BASE.read_bytes()).hexdigest(),
    "candidateSha256": hashlib.sha256(output.read_bytes()).hexdigest(),
    "entries": len(files), "changedRuntimeFiles": changed,
    "unchangedEntries": len(files) - len(allowed),
    "allFunctionsUnchanged": True, "allMediaUnchanged": True,
    "allStylesAndScriptsUnchanged": True, "noNewPublicRoutes": True,
    "previewGuardsUnchanged": True, "retirementAndContactSyncUnchanged": True,
}
(DEST / "package-check.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
