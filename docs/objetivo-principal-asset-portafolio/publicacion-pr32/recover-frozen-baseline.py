#!/usr/bin/env python3
"""Recover immutable baseline bytes via public GET and normal official Vercel CLI GET.
No build, generation, deploy, auth-file read, environment inspection or retry.
"""
import base64
import hashlib
import json
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

DEPLOYMENT = 'dpl_9b2Fp33LqsL5NuB2p7JLdxx9t9gu'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
SCOPE = 'lsandoval2-8260s-projects'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
MANIFEST = Path('/private/tmp/sollahms-release-preparation-evidence/baseline-candidate-manifest.json')
TREE = Path('/private/tmp/sollahms-production-files-flat.json')
CONFIG = Path('/private/tmp/sollahms-production-config.json')
ALIAS_BEFORE = Path('/private/tmp/sollahms-recovery-alias-before.json')
RECOVERY = Path('/private/tmp/sollahms-pr32-release-20261117/recovered-b761')
OUTPUT = RECOVERY / '.vercel/output'
PIN = 'aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549'
MANIFEST_SHA256 = '727b0533e54435577e21d98bad33854e3c60931b07976d618c154bad2a792753'
FUNCTIONS = {'advisory.func', 'booking-availability.func', 'booking-create.func',
             'collaboration.func', 'contact.func', 'orientation-contact.func', 'uf.func'}
MAX_WORKERS = 8
STOP = threading.Event()

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

def sha(body, kind='sha256'):
    return hashlib.new(kind, body).hexdigest()

def now():
    return datetime.now(timezone.utc).isoformat()

def inventory_pin(rows):
    return sha(''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n"
                       for r in sorted(rows, key=lambda row: row['path'])).encode())

def validate(body, row):
    require(len(body) == row['size'], 'size mismatch: ' + row['path'])
    require(sha(body, 'sha1') == row['sha1'], 'SHA1 mismatch: ' + row['path'])
    require(sha(body) == row['sha256'], 'SHA256 mismatch: ' + row['path'])

def save_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def safe_relative(value):
    p = PurePosixPath(value)
    require(not p.is_absolute() and value == p.as_posix() and '..' not in p.parts,
            'unsafe inventory path')
    require(value == 'config.json' or value.startswith(('static/', 'functions/api/')),
            'unexpected inventory family')
    return p

def write_verified(body, row):
    if STOP.is_set():
        return
    target = OUTPUT.joinpath(*safe_relative(row['path']).parts)
    target.parent.mkdir(parents=True, exist_ok=True)
    require(not target.exists(), 'refuse to replace recovered file: ' + row['path'])
    temporary = target.with_name(target.name + '.recovery-part')
    with temporary.open('xb') as file:
        file.write(body)
    temporary.replace(target)

def allowed_public_url(url):
    parsed = urllib.parse.urlsplit(url)
    return (parsed.scheme == 'https' and parsed.hostname == 'sollahms.cl'
            and parsed.port in (None, 443) and parsed.username is None
            and parsed.password is None and not parsed.query and not parsed.fragment)

class SameOriginRedirect(urllib.request.HTTPRedirectHandler):
    max_redirections = 3
    max_repeats = 1
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        absolute = urllib.parse.urljoin(req.full_url, newurl)
        require(allowed_public_url(absolute), 'unexpected redirect origin; stop public recovery')
        return super().redirect_request(req, fp, code, msg, headers, absolute)

def public_get(row):
    require(not STOP.is_set(), 'stopped')
    relative = row['path'][len('static/'):]
    require(not relative.startswith('api/'), 'application API requests are forbidden')
    url = 'https://sollahms.cl/' + urllib.parse.quote(relative, safe='/')
    require(allowed_public_url(url), 'unsafe public URL')
    request = urllib.request.Request(url, method='GET',
                                    headers={'Accept-Encoding': 'identity',
                                             'User-Agent': 'Sollahms-Immutable-Artifact-Recovery/1.0'})
    opener = urllib.request.build_opener(SameOriginRedirect())
    try:
        response = opener.open(request, timeout=45)
    except urllib.error.HTTPError as error:
        require((relative, error.code) in {('404.html', 404), ('410.html', 410)},
                'unexpected HTTP status for ' + row['path'] + ': ' + str(error.code))
        response = error
    with response:
        require(allowed_public_url(response.geturl()), 'unexpected final origin')
        status = response.getcode()
        require(status == 200 or (relative, status) in {('404.html', 404), ('410.html', 410)},
                'unexpected HTTP status')
        body = response.read(row['size'] + 1)
        encoding = response.headers.get('Content-Encoding', '')
        require(encoding.lower() in ('', 'identity'), 'unexpected content encoding')
    validate(body, row)
    write_verified(body, row)
    return [{'path': row['path'], 'source': 'public-HTTPS-GET', 'url': url,
             'status': status, 'observedAtUTC': now(), 'size': len(body),
             'sha1': row['sha1'], 'sha256': row['sha256']}]

def cli_get(uid, rows):
    require(not STOP.is_set(), 'stopped')
    endpoint = '/v8/deployments/' + DEPLOYMENT + '/files/' + uid + '?teamId=' + TEAM
    args = [CLI, 'api', endpoint, '--method', 'GET', '--scope', SCOPE,
            '--raw', '--non-interactive']
    # Normal official CLI transport handles its own existing session.
    # Never read auth files, print credentials, add --token, or expose stderr.
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            timeout=90, check=False)
    require(result.returncode == 0, 'official CLI GET failed; stop and let owner resolve auth/access')
    try:
        payload = json.loads(result.stdout)
        require(isinstance(payload, dict) and isinstance(payload.get('data'), str),
                'unexpected successful CLI JSON format')
        body = base64.b64decode(payload['data'], validate=True)
    except Exception:
        raise RuntimeError('invalid successful CLI base64 JSON; stop without retry')
    for row in rows:
        validate(body, row)
    if not STOP.is_set():
        receipt_path = RECOVERY / 'cli-json' / (uid + '.json')
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
        # Only successful JSON is retained under /private/tmp; stderr is discarded.
        receipt_path.write_bytes(result.stdout)
    records = []
    for row in rows:
        write_verified(body, row)
        records.append({'path': row['path'], 'source': 'official-CLI-GET-immutable-deployment',
                        'deploymentId': DEPLOYMENT, 'fileId': uid, 'observedAtUTC': now(),
                        'size': len(body), 'sha1': row['sha1'], 'sha256': row['sha256']})
    return records

def recover():
    started = now()
    manifest_bytes = MANIFEST.read_bytes()
    require(sha(manifest_bytes) == MANIFEST_SHA256, 'frozen manifest file hash mismatch')
    manifest = json.loads(manifest_bytes)
    rows = sorted(manifest['inventory'], key=lambda row: row['path'])
    require(len(rows) == 1660 and inventory_pin(rows) == manifest['outputInventorySha256'] == PIN,
            'frozen inventory mismatch')
    expected = {row['path']: row for row in rows}
    require(len(expected) == 1660, 'duplicate frozen paths')
    for path in expected:
        safe_relative(path)
    tree_bytes = TREE.read_bytes()
    tree = json.loads(tree_bytes)
    remote = {}
    prefix = 'src/.vercel/output/'
    for row in tree:
        require(row['path'].startswith(prefix), 'unexpected source-tree prefix')
        path = row['path'][len(prefix):]
        require(path not in remote, 'duplicate source-tree path')
        remote[path] = row['uid']
    require(len(tree) == len(remote) == 1660 and set(remote) == set(expected),
            'complete immutable source-tree path set mismatch')
    require(all(remote[path] == row['sha1'] for path, row in expected.items()),
            'immutable source-tree UID mismatch')
    require(ALIAS_BEFORE.is_file(), 'root alias preflight receipt is required')
    alias_bytes = ALIAS_BEFORE.read_bytes()
    alias = json.loads(alias_bytes)
    require(alias.get('id') == DEPLOYMENT and alias.get('state') == 'READY'
            and alias.get('target') == 'production'
            and alias.get('sha') == 'b761ddeaea2fa526870e6af25658046e31b571d7',
            'root alias receipt does not bind the intended production baseline')
    alias_time = datetime.fromisoformat(alias['observedAtUTC'].replace('Z', '+00:00'))
    age = (datetime.now(timezone.utc) - alias_time).total_seconds()
    require(0 <= age < 1800, 'root alias preflight receipt must be refreshed before recovery')
    config = CONFIG.read_bytes()
    validate(config, expected['config.json'])
    require(json.loads(config)['version'] == 3, 'baseline config version mismatch')
    require(Path(CLI).is_file(), 'official CLI is unavailable')
    require(not RECOVERY.exists() and not RECOVERY.is_symlink(),
            'refuse existing recovery directory; inspect prior receipt before any retry')
    RECOVERY.mkdir(parents=True, exist_ok=False)
    OUTPUT.mkdir(parents=True, exist_ok=False)
    write_verified(config, expected['config.json'])
    records = [{'path': 'config.json', 'source': 'root-prior-official-CLI-GET-reused',
                'sourceFile': str(CONFIG), 'fileId': expected['config.json']['sha1'],
                'size': len(config), 'sha1': expected['config.json']['sha1'],
                'sha256': expected['config.json']['sha256'], 'observedAtUTC': started}]
    static = [row for row in rows if row['path'].startswith('static/')]
    groups = {}
    for row in rows:
        if row['path'] != 'config.json' and not row['path'].startswith('static/'):
            groups.setdefault(row['sha1'], []).append(row)
    require(len(static) == 1602 and sum(len(group) for group in groups.values()) == 57
            and len(groups) == 31, 'unexpected request partition')
    report = {'startedAtUTC': started, 'deploymentId': DEPLOYMENT, 'passed': False,
              'output': str(OUTPUT), 'expectedInventorySha256': PIN,
              'manifestSHA256': MANIFEST_SHA256, 'sourceTreeSHA256': sha(tree_bytes),
              'aliasBeforeReceipt': str(ALIAS_BEFORE), 'aliasBeforeReceiptSHA256': sha(alias_bytes),
              'publicStaticRequestsPlanned': 1602, 'uniqueNonstaticCLIRequestsPlanned': 31,
              'configCLIRequestRepeated': False, 'maxWorkers': MAX_WORKERS, 'retries': 0,
              'builders': 0, 'generators': 0, 'deployments': 0, 'promotions': 0,
              'credentialFilesRead': False, 'tokensPrinted': False, 'records': records}
    save_json(RECOVERY / 'RECOVERY.json', report)
    executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
    futures = []
    completed = 1
    last_print_count = 0
    last_print_time = time.monotonic()
    failure = None
    try:
        futures = [executor.submit(public_get, row) for row in static]
        futures += [executor.submit(cli_get, uid, group) for uid, group in groups.items()]
        pending = set(futures)
        while pending:
            ready, pending = wait(pending, timeout=2, return_when=FIRST_COMPLETED)
            for future in ready:
                try:
                    result = future.result()
                except Exception as error:
                    failure = {'type': type(error).__name__,
                               'message': str(error) if isinstance(error, RuntimeError)
                               else 'Read failed; stop. No retry or fallback was performed.'}
                    STOP.set()
                    for other in pending:
                        other.cancel()
                    raise RuntimeError('recovery stopped after first failed read')
                records.extend(result)
                completed += len(result)
            moment = time.monotonic()
            if completed - last_print_count >= 50 or moment - last_print_time >= 30:
                print(json.dumps({'recoveredFiles': completed, 'expected': 1660,
                                  'remainingTasks': len(pending)}), flush=True)
                last_print_count, last_print_time = completed, moment
        executor.shutdown(wait=True)
        actual = []
        for file in sorted(OUTPUT.rglob('*')):
            require(not file.is_symlink(), 'recovered symlink rejected')
            if file.is_file():
                body = file.read_bytes()
                path = file.relative_to(OUTPUT).as_posix()
                require(path in expected, 'unexpected recovered file')
                validate(body, expected[path])
                actual.append(expected[path])
        require(len(actual) == 1660 and inventory_pin(actual) == PIN, 'final recovered inventory mismatch')
        function_paths = [row for row in actual if row['path'].startswith('functions/')]
        require(len(function_paths) == 57, 'function file count mismatch')
        require({p.name for p in (OUTPUT / 'functions/api').iterdir() if p.is_dir()} == FUNCTIONS,
                'function bundle set mismatch')
        require(sum(row['path'].startswith('static/') and row['path'].endswith('.html')
                    for row in actual) == 147, 'baseline HTML count mismatch')
        report.update(passed=True, recoveredFiles=1660, inventorySha256=PIN,
                      functionFiles=57, functionBundles=7,
                      totalBytes=sum(row['size'] for row in actual),
                      configSHA256=expected['config.json']['sha256'],
                      aliasAfterRecheckRequiredByRoot=True)
    except Exception:
        STOP.set()
        for future in futures:
            future.cancel()
        executor.shutdown(wait=True, cancel_futures=True)
        report['failure'] = failure or {'type': 'IntegrityError',
                                        'message': 'Recovery integrity gate failed; stop without retry'}
        raise
    finally:
        report['finishedAtUTC'] = now()
        report['records'] = records
        save_json(RECOVERY / 'RECOVERY.json', report)
        print(json.dumps({key: report.get(key) for key in
                          ['passed', 'output', 'recoveredFiles', 'inventorySha256', 'failure']}),
              flush=True)

if __name__ == '__main__':
    recover()
