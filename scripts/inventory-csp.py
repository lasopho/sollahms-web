#!/usr/bin/env python3
"""Read local HTML/CSS/JS and prepare an unapplied CSP Report-Only proposal.

No network, JavaScript execution, packaging, headers, or reporting endpoint.
Source HTML and an extracted artifact are different input scopes; neither a
directory name nor --profile-label proves a build profile or deployed bytes.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
from html.parser import HTMLParser
import ipaddress
import json
import os
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
MAX_TEXT_BYTES = 4 * 1024 * 1024
MAX_FILES = 5000
RESOURCE_KINDS = ('script', 'style', 'font', 'img', 'frame', 'connect', 'media', 'worker', 'form')
DIRECTIVES = {kind: kind + '-src' for kind in RESOURCE_KINDS if kind != 'form'}
DIRECTIVES['form'] = 'form-action'


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def csp_hash(text):
    """HTML input preprocessing, then UTF-8 SHA-256; never entity-decode JS."""
    normalized = text.replace('\r\n', '\n').replace('\r', '\n').replace('\x00', '\ufffd')
    return "'sha256-" + base64.b64encode(hashlib.sha256(normalized.encode('utf-8')).digest()).decode('ascii') + "'"


def local_path(url_path, owner):
    """Resolve a URL path inside a virtual root, rejecting escaped traversal."""
    decoded = unquote(url_path, errors='strict')
    if '\\' in decoded or '\x00' in decoded or re.search(r'%[0-9a-fA-F]{2}', decoded):
        raise ValueError('ambiguous or multiply encoded local path')
    parts = [] if decoded.startswith('/') else list(Path(owner).parent.parts)
    for part in decoded.split('/'):
        if part in ('', '.'):
            continue
        if part == '..':
            if not parts:
                raise ValueError('local path escapes inventory root')
            parts.pop()
        else:
            parts.append(part)
    return '/'.join(parts)


def classify_url(value, owner):
    """Classify an observed attribute/literal, without dereferencing it."""
    value = value.strip(' \t\n\r\f')
    # Browsers remove embedded ASCII tabs/newlines from a URL scheme. Detect
    # javascript even when such characters would make other URLs invalid.
    scheme_probe = re.sub(r'[\x00-\x20]', '', value.split(':', 1)[0]).lower()
    if ':' in value and scheme_probe == 'javascript':
        return {'disposition': 'javascript', 'reason': 'javascript URL is inline execution'}
    if not value or value.startswith('#'):
        return {'disposition': 'fragment-or-empty'}
    if value.lower().startswith('data:') and not re.search(r'[\x00-\x1f\x7f]', value):
        # Quoted CSS data:image/svg+xml URLs may legitimately contain spaces.
        # Their payload is not decoded or treated as a network origin.
        return {'disposition': 'data', 'scheme': 'data'}
    if re.search(r'[\x00-\x20\x7f]', value) or '\\' in value:
        return {'disposition': 'invalid', 'reason': 'control, space, or backslash in URL'}
    try:
        parsed = urlsplit(value)
        if parsed.scheme.lower() in {'blob', 'mailto', 'tel', 'about'}:
            return {'disposition': 'other-scheme', 'scheme': parsed.scheme.lower()}
        if parsed.scheme and parsed.scheme.lower() not in {'http', 'https', 'ws', 'wss'}:
            raise ValueError('unsupported URL scheme')
        if value.startswith('//') and not parsed.netloc:
            raise ValueError('ambiguous protocol-relative URL')
        if parsed.scheme or parsed.netloc:
            if not parsed.netloc or not parsed.hostname or parsed.username is not None or parsed.password is not None:
                raise ValueError('missing host or embedded credentials')
            host = parsed.hostname.encode('idna').decode('ascii').lower()
            if '%' in host or not re.fullmatch(r'[a-z0-9.:-]+', host):
                raise ValueError('invalid host')
            if ':' in host:
                ipaddress.IPv6Address(host)
            elif len(host) > 253 or any(not re.fullmatch(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?', label)
                                      for label in host.rstrip('.').split('.')):
                raise ValueError('invalid DNS host labels')
            port = parsed.port  # malformed/out-of-range ports raise ValueError
            if port == 0:
                raise ValueError('port zero is not a policy source')
            authority = '[' + host + ']' if ':' in host else host
            scheme = parsed.scheme.lower()
            if port is not None and port != {'https': 443, 'http': 80, 'ws': 80, 'wss': 443}.get(scheme):
                authority += ':' + str(port)
            return {'disposition': 'external', 'origin': scheme + '://' + authority if scheme else None,
                    'host': host, 'protocolRelative': not bool(scheme)}
        path = local_path(parsed.path, owner)
        return {'disposition': 'local', 'path': path}
    except (ValueError, UnicodeError) as exc:
        return {'disposition': 'invalid', 'reason': str(exc)}


class Inventory:
    def __init__(self, root):
        root = Path(root)
        if root.is_symlink() or not root.is_dir():
            raise ValueError('input root must be a real directory')
        self.root = root.resolve()
        self.files = {}
        self.references = []
        self.issues = []
        self.inline_scripts = []
        self.inline_styles = []
        self.handlers = []
        self.edges = {}
        self.pending = set()
        self.scanned = set()

    def issue(self, owner, line, code, detail):
        self.issues.append({'file': owner, 'line': line, 'code': code, 'detail': detail})

    def read(self, relative, kind):
        path = self.root
        for part in Path(relative).parts:
            path = path / part
            if path.is_symlink():
                raise ValueError('symlink is outside the inventory contract: ' + relative)
        if not path.is_file():
            return None
        if path.stat().st_size > MAX_TEXT_BYTES:
            raise ValueError('text input exceeds bounded size: ' + relative)
        data = path.read_bytes()
        text = data.decode('utf-8-sig', errors='strict')
        if relative not in self.files and len(self.files) >= MAX_FILES:
            raise ValueError('inventory exceeds bounded file count')
        self.files[relative] = {'path': relative, 'kind': kind, 'bytes': len(data), 'sha256': sha256(data)}
        return text

    def reference(self, owner, line, kind, value, basis):
        classified = classify_url(value, owner)
        row = {'file': owner, 'line': line, 'kind': kind, 'basis': basis, **classified}
        # Invalid/credential-bearing values are represented by a digest, not
        # echoed into evidence. Valid static references retain exact URLs.
        if classified['disposition'] in {'invalid', 'javascript'}:
            row['valueSha256'] = sha256(value.encode('utf-8'))
            self.issue(owner, line, classified['disposition'] + '-url', classified['reason'])
        else:
            row['url'] = value
        self.references.append(row)
        if classified['disposition'] == 'external':
            if classified['protocolRelative']:
                self.issue(owner, line, 'protocol-relative-url', 'Effective scheme requires the actual page URL; excluded from origin allowlist.')
            if (classified.get('origin') or '').startswith(('http:', 'ws:')):
                self.issue(owner, line, 'insecure-origin', 'Observed scheme is retained, not upgraded or approved.')
            if kind in {'script', 'style'}:
                self.issue(owner, line, 'unfetched-external-' + kind, 'Third-party body and its transitive requests were not fetched.')
        if classified['disposition'] == 'local' and kind in {'script', 'style'}:
            target = classified['path']
            self.edges.setdefault(owner, set()).add(target)
            self.pending.add((target, kind))
        return row

    def javascript(self, owner, text, first_line=1):
        """Conservative lexical candidates, expressly not a JS parser/evaluator."""
        def line_at(offset):
            return first_line + text.count('\n', 0, offset)

        imports = re.compile(r'\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?([\'\"])([^\'\"\n]+)\1')
        for match in imports.finditer(text):
            specifier = match[2]
            if not specifier.startswith(('.', '/', 'http:', 'https:')):
                self.issue(owner, line_at(match.start()), 'unresolved-module-specifier', 'Bare/import-map module resolution requires browser/build evidence.')
            else:
                self.reference(owner, line_at(match.start()), 'script', specifier, 'static-module-specifier-candidate')
        calls = re.compile(r'\b(fetch|fetchImpl|import|WebSocket|EventSource|Worker|SharedWorker|sendBeacon)\s*\(\s*([\'\"])([^\'\"\n]+)\2')
        for match in calls.finditer(text):
            kind = 'script' if match[1] == 'import' else 'worker' if match[1] in {'Worker', 'SharedWorker'} else 'connect'
            self.reference(owner, line_at(match.start()), kind, match[3], 'literal-' + match[1] + '-candidate')
        flags = {
            'runtime-request': r'\b(?:fetch|fetchImpl|WebSocket|EventSource|sendBeacon)\s*\(',
            'xhr-runtime': r'\bXMLHttpRequest\b',
            'dynamic-import': r'\bimport\s*\(',
            'dynamic-script-loader': r'createElement\s*\(\s*[\'\"]script[\'\"]',
            'computed-element-loader': r'createElement\s*\(\s*(?![\'\"])\w',
            'runtime-resource-assignment': r'\.src\s*=|\.setAttribute\s*\(\s*[\'\"]src[\'\"]',
            'runtime-html-assignment': r'\.innerHTML\s*=|insertAdjacentHTML\s*\(',
            'string-code-execution': r'\beval\s*\(|\bnew\s+Function\s*\(',
            'worker-runtime': r'\b(?:Worker|SharedWorker)\s*\(|serviceWorker\s*\.\s*register\s*\(',
        }
        for code, pattern in flags.items():
            for match in re.finditer(pattern, text):
                self.issue(owner, line_at(match.start()), code, 'Lexical signal only; computed values and execution path are not resolved.')

    def css(self, owner, text, first_line=1):
        # Comments are blanked while preserving offsets and line numbers. CSS
        # escapes/custom properties and fetched stylesheets remain unverified.
        text = re.sub(r'/\*[\s\S]*?\*/', lambda m: re.sub(r'[^\n]', ' ', m[0]), text)
        imports = list(re.finditer(r'@import\s+(?:url\(\s*(?:([\'\"])(.*?)\1|([^\s\)]+))\s*\)|([\'\"])(.*?)\4)', text, re.I))
        for match in imports:
            value = match[2] if match[1] else match[3] if match[3] else match[5]
            self.reference(owner, first_line + text.count('\n', 0, match.start()), 'style', value, 'css-import-candidate')
        for match in re.finditer(r'url\(\s*(?:([\'\"])(.*?)\1|([^\s\)]+))\s*\)', text, re.I):
            value = match[2] if match[1] else match[3]
            if any(m.start() <= match.start() < m.end() for m in imports):
                continue
            kind = 'font' if re.search(r'\.(?:woff2?|ttf|otf|eot)(?:[?#]|$)', value, re.I) else 'img'
            self.reference(owner, first_line + text.count('\n', 0, match.start()), kind, value, 'css-url-extension-candidate')
        if '\\' in text or 'var(' in text:
            self.issue(owner, first_line, 'css-runtime-or-escape', 'CSS escapes/variables are not resolved by the lexical inventory.')

    def drain(self):
        while self.pending:
            relative, kind = min(self.pending)
            self.pending.remove((relative, kind))
            if (relative, kind) in self.scanned:
                continue
            self.scanned.add((relative, kind))
            text = self.read(relative, kind)
            if text is None:
                self.issue(relative, 1, 'missing-local-resource', 'A referenced local script/style was not present; no replacement was fetched.')
            elif kind == 'script':
                self.javascript(relative, text)
            else:
                self.css(relative, text)


class PageParser(HTMLParser):
    def __init__(self, inventory, owner):
        super().__init__(convert_charrefs=False)
        self.audit, self.owner = inventory, owner
        self.raw = None

    def handle_starttag(self, tag, pairs):
        line = self.getpos()[0]
        attrs = dict(pairs)
        if len(attrs) != len(pairs):
            self.audit.issue(self.owner, line, 'duplicate-html-attribute', 'Duplicate attributes require browser parser review; no exact resolution is claimed.')
        if tag == 'meta':
            if (attrs.get('http-equiv') or '').strip().lower() == 'content-security-policy':
                self.audit.issue(self.owner, line, 'existing-document-csp', 'A meta policy may combine with headers; this inventory does not apply or replace either.')
            declared_charset = attrs.get('charset')
            if declared_charset and declared_charset.strip().lower() not in {'utf-8', 'utf8'}:
                self.audit.issue(self.owner, line, 'meta-charset-unverified', 'Input is decoded as strict UTF-8; a different declared encoding requires browser/response-header review.')
        for key, value in pairs:
            if key.startswith('on') and value is not None:
                self.audit.handlers.append({'file': self.owner, 'line': line, 'attribute': key,
                                            'valueSha256': sha256(value.encode('utf-8'))})
                self.audit.issue(self.owner, line, 'inline-event-handler', 'Script-element hashes do not authorize event handlers; no unsafe-hashes is proposed.')
            if value is not None and classify_url(value, self.owner)['disposition'] == 'javascript':
                self.audit.reference(self.owner, line, 'script', value, 'javascript-attribute:' + key)
        if tag == 'base' and attrs.get('href'):
            self.audit.issue(self.owner, line, 'html-base-url', 'Relative references may resolve against this base; local resolution is only a candidate.')
        if tag == 'iframe' and 'srcdoc' in attrs:
            self.audit.issue(self.owner, line, 'iframe-srcdoc', 'Nested HTML was not parsed; it needs its own browser/CSP review.')
        if attrs.get('style'):
            self.audit.issue(self.owner, line, 'inline-style-attribute', 'Candidate style-src-attr none would report this; element hashes do not cover it.')
            self.audit.css(self.owner, attrs['style'], line)
        if tag in {'script', 'style'}:
            if self.raw:
                self.audit.issue(self.owner, line, 'nested-raw-element', 'Malformed raw-text structure requires browser review.')
            self.raw = {'tag': tag, 'attrs': attrs, 'line': line, 'chunks': []}
        if tag == 'script' and 'src' in attrs:
            self.audit.reference(self.owner, line, 'script', attrs['src'] or '', 'html-script-src')
            if not attrs['src']:
                self.audit.issue(self.owner, line, 'empty-script-src', 'A present src attribute suppresses inline execution; its empty URL requires browser review.')
        if tag == 'link' and attrs.get('href'):
            rel = (attrs.get('rel') or '').lower().split()
            resource_kind = 'style' if 'stylesheet' in rel else 'script' if 'modulepreload' in rel else None
            if 'preload' in rel:
                resource_kind = {'script': 'script', 'style': 'style', 'font': 'font', 'image': 'img',
                                 'fetch': 'connect', 'video': 'media', 'audio': 'media'}.get(attrs.get('as'), resource_kind)
            if 'preconnect' in rel or 'dns-prefetch' in rel:
                self.audit.reference(self.owner, line, 'connect', attrs['href'], 'connection-hint-not-proof-of-fetch')
            if resource_kind:
                self.audit.reference(self.owner, line, resource_kind, attrs['href'], 'html-link')
        for attribute, kind in [('data-embed-src', 'frame')]:
            if attrs.get(attribute):
                self.audit.reference(self.owner, line, kind, attrs[attribute], 'html-' + attribute + '-candidate')
        if tag in {'iframe', 'frame', 'img', 'input', 'source', 'video', 'audio'} and attrs.get('src'):
            kind = 'frame' if tag in {'iframe', 'frame'} else 'img' if tag in {'img', 'input'} else 'media'
            self.audit.reference(self.owner, line, kind, attrs['src'], 'html-' + tag + '-src')
        if tag == 'video' and attrs.get('poster'):
            self.audit.reference(self.owner, line, 'img', attrs['poster'], 'html-video-poster')
        if attrs.get('srcset'):
            srcset = attrs['srcset']
            if 'data:' in srcset.lower():
                self.audit.issue(self.owner, line, 'complex-srcset', 'Data URL commas require browser srcset parsing; not split into an allowlist.')
            else:
                for candidate in srcset.split(','):
                    tokens = candidate.split()
                    if tokens:
                        self.audit.reference(self.owner, line, 'img', tokens[0], 'html-srcset-candidate')
        if tag == 'form' and attrs.get('action'):
            self.audit.reference(self.owner, line, 'form', attrs['action'], 'html-form-action')
        if attrs.get('formaction'):
            self.audit.reference(self.owner, line, 'form', attrs['formaction'], 'html-formaction')
        if tag == 'object' and attrs.get('data'):
            self.audit.issue(self.owner, line, 'object-element', 'Candidate object-src none would report this resource.')
            self.audit.reference(self.owner, line, 'object', attrs['data'], 'html-object-data')
        if tag == 'embed' and attrs.get('src'):
            self.audit.issue(self.owner, line, 'embed-element', 'Candidate object-src none would report this resource; it is not a media-src candidate.')
            self.audit.reference(self.owner, line, 'object', attrs['src'], 'html-embed-src')

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag in {'script', 'style'}:
            self.audit.issue(self.owner, self.getpos()[0], 'self-closing-raw-element', 'HTML does not self-close script/style; no inline hash is emitted for this ambiguous parser case.')
            self.raw = None
        else:
            self.handle_endtag(tag)

    def handle_data(self, data):
        if self.raw:
            self.raw['chunks'].append(data)

    def handle_entityref(self, name):
        if self.raw:
            self.raw['chunks'].append('&' + name + ';')

    def handle_charref(self, name):
        if self.raw:
            self.raw['chunks'].append('&#' + name + ';')

    def handle_endtag(self, tag):
        if not self.raw or tag != self.raw['tag']:
            return
        raw, self.raw = self.raw, None
        body = ''.join(raw['chunks'])
        row = {'file': self.owner, 'line': raw['line'], 'parsedBodyUtf8Sha256': sha256(body.encode('utf-8')),
               'bodyUtf8Bytes': len(body.encode('utf-8')), 'cspSource': csp_hash(body)}
        if tag == 'script':
            if re.search(r'<!--[\s\S]*?<script(?:\s|/|>)', body, re.I):
                row['cspSource'] = None
                row['hashUnavailableReason'] = 'HTML escaped/double-escaped script tokenization needs a browser parser'
                self.audit.issue(self.owner, raw['line'], 'ambiguous-script-tokenization', 'No CSP hash is proposed for this escaped-script parser ambiguity.')
            declared_type = raw['attrs'].get('type', 'classic')
            row['type'] = (declared_type or '').strip().lower()
            row['hasSrc'] = 'src' in raw['attrs']
            row['executionKind'] = ('executable' if row['type'] in {'classic', '', 'module', 'text/javascript', 'application/javascript'}
                                    else 'browser-data-mechanism' if row['type'] in {'importmap', 'speculationrules'}
                                    else 'data-or-unrecognized-type')
            self.audit.inline_scripts.append(row)
            if not row['hasSrc']:
                if row['type'] in {'classic', '', 'module', 'text/javascript', 'application/javascript'}:
                    self.audit.javascript(self.owner, body, raw['line'])
                elif row['type'] in {'importmap', 'speculationrules'}:
                    self.audit.issue(self.owner, raw['line'], 'browser-script-data-type', 'Browser/module-resolution semantics require review; only static text was hashed.')
        else:
            self.audit.inline_styles.append(row)
            self.audit.css(self.owner, body, raw['line'])


def discover_pages(root, scope):
    if scope == 'source':
        return sorted(p.name for p in root.iterdir() if p.name.endswith('.html'))
    pages = []
    for folder, directories, files in os.walk(root, followlinks=False):
        for name in directories + files:
            if (Path(folder) / name).is_symlink():
                raise ValueError('artifact scope does not accept symlinks')
        pages.extend((Path(folder) / name).relative_to(root).as_posix() for name in files if name.endswith('.html'))
    return sorted(pages)


def prepare_inventory(root=ROOT, scope='source', profile_label=None):
    if scope not in {'source', 'artifact'}:
        raise ValueError('scope must be source or artifact')
    audit = Inventory(root)
    pages = discover_pages(audit.root, scope)
    if not pages:
        raise ValueError('no HTML routes in selected scope')
    for page in pages:
        text = audit.read(page, 'html')
        if text is None:
            raise ValueError('HTML route is not a regular file: ' + page)
        parser = PageParser(audit, page)
        # Browser HTML preprocessing precedes tokenization. Raw bytes remain
        # separately represented by the whole-file SHA-256 above.
        parser.feed(text.replace('\r\n', '\n').replace('\r', '\n').replace('\x00', '\ufffd'))
        parser.close()
        if parser.raw:
            audit.issue(page, parser.raw['line'], 'unclosed-raw-element', 'No trustworthy complete inline body hash was emitted.')
    audit.drain()
    references = sorted(audit.references, key=lambda r: json.dumps(r, sort_keys=True))
    issues = sorted(audit.issues, key=lambda r: (r['file'], r['line'], r['code'], r['detail']))
    inline_scripts = sorted(audit.inline_scripts, key=lambda r: (r['file'], r['line']))
    inline_styles = sorted(audit.inline_styles, key=lambda r: (r['file'], r['line']))
    candidates = {kind: sorted({r['origin'] for r in references if r['kind'] == kind and r.get('origin')})
                  for kind in RESOURCE_KINDS}
    policies = []
    for page in pages:
        reachable, stack = set(), [page]
        while stack:
            item = stack.pop()
            if item not in reachable:
                reachable.add(item)
                stack.extend(audit.edges.get(item, ()))
        rows = [r for r in references if r['file'] in reachable]
        directives = {'default-src': ["'self'"], 'base-uri': ["'self'"], 'object-src': ["'none'"],
                      'frame-ancestors': ["'self'"], 'script-src-attr': ["'none'"], 'style-src-attr': ["'none'"]}
        for kind, directive in DIRECTIVES.items():
            sources = {"'self'"}
            sources.update(r['origin'] for r in rows if r['kind'] == kind and r.get('origin'))
            if kind == 'img' and any(r['kind'] == kind and r['disposition'] == 'data' for r in rows):
                sources.add('data:')
            if kind == 'script':
                sources.update(r['cspSource'] for r in inline_scripts if r['file'] == page and not r['hasSrc'] and r['cspSource']
                               and r['executionKind'] != 'data-or-unrecognized-type')
            if kind == 'style':
                sources.update(r['cspSource'] for r in inline_styles if r['file'] == page)
            directives[directive] = sorted(sources)
        value = '; '.join(name + ' ' + ' '.join(sources) for name, sources in sorted(directives.items()))
        policies.append({'path': page, 'route': '/' if page == 'index.html' else '/' + page,
                         'reachableStaticFiles': sorted(reachable), 'headerValueCandidate': value,
                         'headerValueUtf8Bytes': len(value.encode('utf-8'))})
    files = sorted(audit.files.values(), key=lambda row: row['path'])
    return {
        'schemaVersion': 1,
        'scope': {'kind': scope, 'routeSelection': 'root-level HTML source candidates' if scope == 'source' else 'all HTML files in supplied extracted directory',
                  'declaredProfileLabel': profile_label, 'profileVerified': False, 'packagerExecuted': False,
                  'artifactProvenanceVerified': False, 'deployedBytesVerified': False},
        'execution': {'networkRequests': 0, 'javascriptExecuted': False, 'headersApplied': False, 'reportingEndpointCreated': False},
        'summary': {'htmlRoutes': len(pages), 'textFiles': len(files), 'references': len(references),
                    'inlineScriptElements': len(inline_scripts), 'inlineStyleElements': len(inline_styles),
                    'eventHandlers': len(audit.handlers), 'issues': len(issues)},
        'files': files,
        'scannedTextManifestSha256': sha256(json.dumps(files, sort_keys=True, separators=(',', ':')).encode('utf-8')),
        'externalOriginCandidates': candidates, 'references': references,
        'inlineScripts': inline_scripts, 'inlineStyles': inline_styles,
        'eventHandlers': sorted(audit.handlers, key=lambda r: (r['file'], r['line'], r['attribute'])), 'issues': issues,
        'proposal': {'headerName': 'Content-Security-Policy-Report-Only', 'status': 'unapplied-incomplete-proposal',
                     'readyToApply': False, 'browserValidated': False, 'hashCoverage': 'static parsed HTML script/style element text only',
                     'hashNormalization': 'UTF-8 after HTML CRLF/CR to LF and NUL to U+FFFD; script/style entities are not decoded',
                     'reportingEndpoint': None, 'perRouteCandidates': policies},
        'limitations': [
            'This is a lexical/static candidate inventory, not an HTML/JS/CSS browser engine or proof of policy completeness.',
            'Source includes mutually exclusive review/public blocks; packaging may remove or rewrite bytes. Source hashes must not be applied to an artifact.',
            'Artifact mode inventories supplied extracted files only. A profile label does not authenticate the build, private rights, deployment, redirects, API bundles, or response headers.',
            'External script/style bodies, their requests, redirects and embedded frame subresources were not fetched; browser network QA is required.',
            'Runtime values, data-driven images, import maps, dynamic loaders, workers, CSS escapes/custom properties and JS-generated markup can require sources/hashes absent here.',
            'Text inputs must be UTF-8. Response Content-Type/charset and browser encoding were not inspected; another effective encoding requires recalculating hashes from browser text.',
            'Event handlers and javascript URLs are not authorized by element hashes. No unsafe-inline, unsafe-eval, unsafe-hashes, nonce or strict-dynamic is proposed.',
            'Inline style attributes intentionally remain violations in this staged proposal. No report-uri/report-to endpoint is invented; without a collector only local browser violations can be inspected.',
            'Origin candidates are observations, not provider approval. Protocol-relative URLs are excluded from origin allowlists until the actual page scheme is known.',
            'Per-route candidates require reviewed actual artifact hashes, header-size limits and Chromium checks before even a remotely applied Report-Only trial; never switch to enforcement from this output.',
        ],
    }


def write_output(destination, result, input_root):
    destination = Path(destination)
    if destination.is_symlink():
        raise ValueError('output cannot be a symlink')
    resolved = destination.resolve()
    for protected in (ROOT.resolve(), Path(input_root).resolve()):
        if resolved == protected or protected in resolved.parents:
            raise ValueError('output must be outside the repository and selected input tree')
    # Exclusive creation preserves prior evidence and never modifies an input.
    with resolved.open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + '\n')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--scope', choices=('source', 'artifact'), default='source')
    parser.add_argument('--profile-label', help='Unverified operator label, never a profile certification')
    parser.add_argument('--output', type=Path, required=True, help='New JSON path outside the repository and input tree')
    args = parser.parse_args(argv)
    try:
        result = prepare_inventory(args.root, args.scope, args.profile_label)
        write_output(args.output, result, args.root)
    except (ValueError, OSError, UnicodeError) as exc:
        parser.exit(1, 'CSP inventory failed: ' + str(exc) + '\n')
    print(json.dumps({'scope': args.scope, **result['summary'], 'readyToApply': False}, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
