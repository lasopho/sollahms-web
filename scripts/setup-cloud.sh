#!/usr/bin/env bash
# Prepare test dependencies outside the checkout; never build or deploy the site.
set -euo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
runtime_root=/opt/codex/runtimes/codex-primary-runtime/dependencies
node_bin=${SOLLAHMS_CI_NODE:-$(command -v node || true)}
python_bin=${SOLLAHMS_CLOUD_PYTHON:-$(command -v python3.12 || true)}
venv_path=${SOLLAHMS_CLOUD_VENV:-/workspace/.venvs/sollahms-web}

[[ -n "$node_bin" ]] || node_bin="$runtime_root/node/bin/node"
[[ -n "$python_bin" ]] || python_bin="$runtime_root/python/bin/python3"
export PYTHONDONTWRITEBYTECODE=1

if ! "$node_bin" -e 'process.exit(process.versions.node.split(".")[0] === "24" ? 0 : 1)' 2>/dev/null; then
  printf '%s\n' 'Node 24 is required. Set SOLLAHMS_CI_NODE to its executable.' >&2
  exit 2
fi
if ! "$python_bin" -c 'import platform, sys; sys.exit(0 if sys.version_info[:2] == (3, 12) and sys.platform == "linux" and platform.machine() == "x86_64" else 1)' 2>/dev/null; then
  printf '%s\n' 'The hashed wheels require Linux x86_64 and Python 3.12. Set SOLLAHMS_CLOUD_PYTHON.' >&2
  exit 2
fi
if ! "$python_bin" -c 'import os, sys; target, repo = map(os.path.realpath, sys.argv[1:]); sys.exit(0 if os.path.isabs(sys.argv[1]) and os.path.commonpath([target, repo]) != repo else 1)' "$venv_path" "$repo_root"; then
  printf '%s\n' 'SOLLAHMS_CLOUD_VENV must be an absolute directory outside the repository.' >&2
  exit 2
fi

if [[ ! -x "$venv_path/bin/python" ]]; then
  if [[ -e "$venv_path" ]]; then
    printf '%s\n' 'The selected virtualenv directory exists without a Python executable; inspect it before setup.' >&2
    exit 2
  fi
  "$python_bin" -m venv "$venv_path"
fi
if [[ ! -f "$venv_path/pyvenv.cfg" ]] || ! "$venv_path/bin/python" -c 'import os, sys; sys.exit(0 if sys.version_info[:2] == (3, 12) and sys.prefix != sys.base_prefix and os.path.realpath(sys.prefix) == os.path.realpath(sys.argv[1]) else 1)' "$venv_path"; then
  printf '%s\n' 'The directory must contain its own Python 3.12 virtualenv. Choose a separate directory.' >&2
  exit 2
fi

if ! "$venv_path/bin/python" - "$repo_root/requirements-ci.txt" <<'PY'
import importlib.metadata, pathlib, re, sys
for line in pathlib.Path(sys.argv[1]).read_text().splitlines():
    if not line.strip() or line.lstrip().startswith('#'):
        continue
    match = re.match(r'^([\w-]+)==([^\s]+)\s+--hash=sha256:[0-9a-f]{64}', line)
    if not match:
        raise SystemExit('Expected a pinned, hashed test dependency.')
    try:
        if importlib.metadata.version(match[1]) != match[2]:
            raise SystemExit(1)
    except importlib.metadata.PackageNotFoundError:
        raise SystemExit(1)
PY
then
  "$venv_path/bin/python" -m pip install --quiet --disable-pip-version-check \
    --cache-dir "$venv_path/.pip-cache" --require-hashes --only-binary=:all: \
    -r "$repo_root/requirements-ci.txt"
else
  printf '%s\n' 'Pinned Python dependencies are already present; no installation or network request needed.'
fi

"$venv_path/bin/python" "$repo_root/scripts/check-cloud-environment.py" --node "$node_bin"
printf '\nRun Git CI with:\n  PATH=%q:"$PATH" SOLLAHMS_CI_NODE=%q %q -B scripts/run-git-ci.py --cloud-stdio --output /tmp/sollahms-cloud-public-ci\n' \
  "$venv_path/bin" "$node_bin" "$venv_path/bin/python"
