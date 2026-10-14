#!/usr/bin/env python3
"""Diagnose local prerequisites without installing, building or calling providers."""
import sys
sys.dont_write_bytecode = True

import argparse
from datetime import datetime
import importlib
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import tempfile
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = Path('/opt/codex/runtimes/codex-primary-runtime/dependencies')
NODE_PROBE = r'''
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const { scryptSync } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const fromRepo = createRequire(path.join(process.cwd(), 'scripts/check-cloud-environment.py'));
const result = {version: process.versions.node, executable: process.execPath};
const safeError = error => /^[A-Z_0-9]+$/.test(error?.code || '') ? error.code : 'operation_failed';
const child = spawnSync(process.execPath, ['-e', 'process.stdout.write("ok")'], {encoding: 'utf8', timeout: 3000});
result.child_process = child.status === 0 && child.stdout === 'ok'
  ? {status: 'ok'} : {status: 'error', code: safeError(child.error)};
try { scryptSync('public-cloud-fixture', 'public-salt', 32); result.scrypt = {status: 'ok'}; }
catch (error) { result.scrypt = {status: 'error', code: safeError(error)}; }
for (const [name, override] of [['sharp', 'SOLLAHMS_SHARP_MODULE'], ['playwright', 'SOLLAHMS_PLAYWRIGHT_MODULE']]) {
  try {
    const entry = fromRepo.resolve(process.env[override] || name);
    const module = fromRepo(entry);
    let directory = path.dirname(entry), version = null;
    while (directory !== path.dirname(directory)) {
      const manifest = path.join(directory, 'package.json');
      if (fs.existsSync(manifest)) {
        const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
        if (data.name === name) { version = data.version; break; }
      }
      directory = path.dirname(directory);
    }
    result[name] = {status: 'ok', version};
    if (name === 'sharp') result[name].libvips = module.versions?.vips;
    else result[name].bundled_browser_present = fs.existsSync(module.chromium.executablePath());
  } catch (error) { result[name] = {status: 'missing', code: safeError(error)}; }
}
process.stdout.write(JSON.stringify(result));
'''


def run(command, timeout=5, env=None):
    """Never echo subprocess stderr, which may include provider configuration."""
    try:
        # Regular FDs let the probe report restricted Node PIPE operations itself.
        with tempfile.TemporaryFile(dir='/tmp') as source, tempfile.TemporaryFile(dir='/tmp') as output:
            result = subprocess.run(command, cwd=ROOT, stdin=source, stdout=output,
                                    stderr=subprocess.DEVNULL, timeout=timeout, env=env)
            output.seek(0)
            return result.returncode, output.read().decode('utf-8', errors='replace').strip()
    except subprocess.TimeoutExpired:
        return None, 'timeout'
    except OSError as error:
        return None, 'errno_' + str(error.errno)


def python_dependencies():
    result = {}
    modules = {'Pillow': 'PIL', 'pypdf': 'pypdf'}
    for line in (ROOT / 'requirements-ci.txt').read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        match = re.match(r'^([\w-]+)==([^\s]+)\s+--hash=sha256:[0-9a-f]{64}', line)
        if not match:
            result['requirements'] = {'status': 'error', 'reason': 'unhashed_dependency'}
            continue
        name, expected = match.groups()
        try:
            actual = importlib.metadata.version(name)
            importlib.import_module(modules[name])
            result[name] = {'status': 'ok' if actual == expected else 'error',
                            'version': actual, 'expected': expected}
        except (importlib.metadata.PackageNotFoundError, ImportError, OSError, KeyError):
            result[name] = {'status': 'missing', 'expected': expected}
    return result


def network_probe():
    curl = shutil.which('curl')
    if not curl:
        return {'status': 'missing', 'reason': 'curl_unavailable'}
    year = datetime.now(ZoneInfo('America/Santiago')).year
    targets = {'sii': f'https://www.sii.cl/valores_y_fechas/uf/uf{year}.htm',
               'pypi': 'https://pypi.org/simple/pillow/',
               'npm': 'https://registry.npmjs.org/sharp'}
    result = {}
    for name, url in targets.items():
        # -q prevents curlrc-supplied credentials; normal proxy and CA env remain.
        code, output = run([curl, '-q', '--silent', '--max-time', '5', '--connect-timeout', '3',
                            '--output', os.devnull, '--write-out', '%{http_code}', url])
        http = int(output) if re.fullmatch(r'\d{3}', output) else None
        result[name] = {'status': 'ok' if code == 0 and http == 200 else 'error',
                        'http_status': http, 'curl_exit_code': code}
        if code is None:
            result[name]['reason'] = output
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=os.environ.get('SOLLAHMS_CI_NODE') or shutil.which('node')
                        or str(RUNTIME / 'node/bin/node'))
    parser.add_argument('--network', action='store_true', help='GET public SII/PyPI/npm endpoints, at most five seconds each')
    args = parser.parse_args()
    python_ok = sys.version_info[:2] == (3, 12) and sys.platform == 'linux' and platform.machine() == 'x86_64'
    report = {'python': {'status': 'ok' if python_ok else 'error', 'version': platform.python_version(),
                         'executable': sys.executable, 'platform': sys.platform, 'architecture': platform.machine()},
              'dependencies': python_dependencies()}
    # Preloads would patch the very native operation this probe must measure.
    # Keep other environment settings, including module resolution, proxy and CA.
    probe_env = {key: value for key, value in os.environ.items() if key != 'NODE_OPTIONS'}
    code, output = run([args.node, '-e', NODE_PROBE], env=probe_env)
    try:
        node = json.loads(output) if code == 0 else None
    except json.JSONDecodeError:
        node = None
    if node is None:
        report['node'] = {'status': 'error', 'exit_code': code, 'reason': 'node_probe_failed'}
    else:
        node['status'] = 'ok' if node['version'].split('.')[0] == '24' else 'error'
        report['node'] = node
    child_ok = bool(node and node['child_process']['status'] == 'ok')
    compatibility = ROOT / 'scripts/cloud-sync-stdio.mjs'
    compatibility_check = ROOT / 'scripts/check-cloud-stdio.mjs'
    if not child_ok and compatibility.is_file() and compatibility_check.is_file():
        compatibility_code, compatibility_output = run(
            [args.node, '--import', str(compatibility), str(compatibility_check)], timeout=10, env=probe_env)
        try:
            verified = compatibility_code == 0 and json.loads(compatibility_output).get('allPassed') is True
        except (json.JSONDecodeError, AttributeError):
            verified = False
        report['cloud_stdio'] = {'status': 'ok' if verified else 'error', 'opt_in_required': True}
        if verified:
            child_ok = True
            report['warning'] = 'Native Node PIPE operations are restricted; use Git CI --cloud-stdio after the compatibility check passes.'
    browser = os.environ.get('SOLLAHMS_BROWSER_EXECUTABLE') or shutil.which('chromium') or '/usr/bin/chromium'
    browser_code, browser_version = run([browser, '--version'])
    report['browser'] = {'status': 'ok' if browser_code == 0 else 'missing', 'executable': browser,
                         'launch_verified': False}
    if browser_code == 0:
        report['browser']['version'] = browser_version.splitlines()[0]
    report['browser']['note'] = 'Existing QA scripts use Chrome channel; selecting system Chromium requires an explicit executable path.'
    report['network'] = network_probe() if args.network else {'status': 'not_run', 'reason': 'offline_default'}
    network_ok = not args.network or all(report['network'].get(name, {}).get('status') == 'ok'
        for name in ('sii', 'pypi', 'npm'))
    report['git_ci_ready'] = bool(python_ok and all(row['status'] == 'ok' for row in report['dependencies'].values())
        and node and node['status'] == 'ok' and child_ok and node['scrypt']['status'] == 'ok')
    report['optional_tools_present'] = bool(node and node['sharp']['status'] == 'ok'
        and node['playwright']['status'] == 'ok' and browser_code == 0)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['git_ci_ready'] and network_ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
