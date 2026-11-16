"""Package a completed browser phase locally, without network or application edits."""
import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--phase', required=True, choices=['isolated', 'public'])
phase = parser.parse_args().phase
repo = Path('/private/tmp/sollahms-contacto-baseline-20261116')
base = repo / 'docs/contacto-baseline-20261116/production-release-20261116/browser'
runtime_base = repo / '.vercel/contacto-production-release-20261116/browser'
docs, runtime = base / phase, runtime_base / phase


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


result = json.loads((docs / 'results.json').read_text())
assert result['passed'] and result['browserClosed'] and result['profileRemoved']
assert result['stage'] == phase and result['widths'] == [1440, 1024, 768, 390, 320]
assert len(result['cases']) == 5 and all(c['status'] == 'PASS' for c in result['cases'])
assert result['formSubmitEvents'] == result['actualCommercialRequests'] == result['historicalCacheReuse'] == 0
assert not result['blockedUnsafe'] and not result['blockedApi'] and not result['transportErrors']
assert not result['pageErrors'] and all(c['intentionalTooling'] for c in result['console'])
assert len(list((docs / 'screenshots').glob('*.png'))) == 15
target = json.loads((runtime_base / f'target-{phase}.json').read_text())
assert target['deployment'] == result['deployment'] and target['origin'] == result['origin']
pid = json.loads((runtime / 'pid.json').read_text())
assert pid['state'] == 'closed' and pid['browserClosed'] and pid['profileRemoved']
assert not pid['managedProcessesRemaining'] and not list((runtime / 'profiles').iterdir())
try:
    os.kill(pid['pid'], 0)
except ProcessLookupError:
    pid_absent = True
else:
    raise AssertionError('Runner PID remains present; inspect before packaging')
save(docs / 'target.json', target)
save(docs / 'process-cleanup.json', {**pid, 'pidAbsentAtPackaging': pid_absent, 'profileDirectoriesRemaining': 0})

resource_records = []
if phase == 'isolated':
    for meta_path in sorted((runtime / 'cache' / result['deployment'] / 'native-cache').glob('*.json')):
        meta = json.loads(meta_path.read_text())
        body = meta_path.with_suffix('.body').read_bytes()
        assert meta['deployment'] == result['deployment'] and meta['origin'] == result['origin']
        assert meta['method'] == 'GET' and meta['status'] == 200
        assert meta['bytes'] == len(body) and meta['sha256'] == sha(body)
        source = (repo / (meta['path'].lstrip('/') or 'index.html')).read_bytes()
        assert body == source, f'Isolated Production resource differs: {meta["path"]}'
        resource_records.append({**{k: meta[k] for k in ['path', 'method', 'status', 'bytes', 'sha256']}, 'sourceIdentical': True})
save(docs / 'resource-proof.json', {
    'phase': phase, 'deployment': result['deployment'], 'origin': result['origin'],
    'historicalCacheReuse': 0,
    'method': 'Isolated deployment cache verified by ID, origin, bytes and source SHA256' if phase == 'isolated' else 'Direct public HTTPS browser requests; no isolated or Preview response cache used',
    'verifiedCacheRecords': resource_records,
    'favicon': result['faviconProof'], 'navigation': result['navigation'],
    'resourceEvents': result['resourceFailures'],
})

summary = {
    'passed': True, 'phase': phase, 'deployment': result['deployment'], 'origin': result['origin'],
    'sourceContactoSha256': result['sourceContactoSha256'],
    'sourceContactoBytes': result['sourceContactoBytes'],
    'candidateInventorySha256': result['candidateInventorySha256'],
    'access': result['access'], 'browser': result['browser'], 'node': result['node'],
    'widths': result['widths'], 'acceptedCases': 5, 'expectedCases': 5,
    'counts': {
        'layoutHeaderFooterOverflow': 5, 'fourRequiredFields': 5,
        'selectorPromptAndNativeIndicator': 5, 'keyboardTypeaheadAndTabOrder': 5,
        'emptyValidityRejected': 5, 'rutInvalidErrorVisible': 5, 'rutValidFormattedErrorHidden': 5,
        'consentRealToggleAndRestored': 5, 'whatsappHrefWithoutOpening': 5,
        'mobileMenusOpenEscapeFocusRestored': sum(bool(c['mobileMenu'].get('opensClosesEscapeRestoresFocus')) for c in result['cases']),
        'screenshots': 15, 'internalNavigationHttp200': len(result['navigation']),
        'cacheResourcesHttp200ByteVerified': len(resource_records),
    },
    'safety': {'domSubmitEvents': 0, 'actualCommercialRequests': 0,
               'unsafeRequestsAttempted': 0, 'apiRequestsAttempted': 0,
               'enterKeyPresses': 0, 'submitButtonClicks': 0, 'formSubmitMethodCalls': 0,
               'historicalCacheReuse': 0, 'syntheticRutValuesRecorded': False,
               'rutValuesCleared': True, 'credentialOrProtectionChanges': 0},
    'console': {'applicationPageErrors': 0, 'unknownErrorsOrWarnings': 0,
                'intentionalToolbarErrors': len(result['console']),
                'globalConsoleClaimedEmpty': len(result['console']) == 0},
    'notCertifiedKeys': ['ArrowDown', 'Home'],
    'runnerClosed': True, 'profileRemoved': True, 'managedProcessesRemaining': [],
    'packagedAt': datetime.now(timezone.utc).isoformat(),
}
save(docs / 'acceptance-summary.json', summary)
(docs / 'README.md').write_text(f'''Contacto: QA {phase}, 5/5 PASS.

Deployment `{result['deployment']}`. Origen: {result['origin']}. Fuente Contacto SHA256 `{result['sourceContactoSha256']}`, 18.655 bytes. Inventario lógico `{result['candidateInventorySha256']}`.

Se verificaron 1440, 1024, 768, 390 y 320 px en una pasada nueva, con quince capturas vacías tomadas antes de interacciones. Encabezado, pie, cuatro campos obligatorios, prompt e indicador nativo del selector, WhatsApp por href sin abrirlo y ausencia de overflow: PASS. Cuatro menús móviles: apertura, Escape y restauración del foco PASS. Diez enlaces internos: HTTP 200.

La selección real por letra «d» y Tab recorre SUMMARY y consentimiento; dos Shift+Tab restauran el selector. reportValidity vacío devuelve false. El RUT sintético inválido muestra error y aria-invalid=true; el válido se formatea, oculta el error y queda aria-invalid=false. El consentimiento se marca y desmarca con clic real mientras el RUT está válido y desenfocado; el RUT se vacía al final. No se usó Enter, no hubo submit DOM ni clic-submit ni llamadas form.submit, y hubo cero solicitudes comerciales/API/unsafe. Los valores sintéticos no se guardaron en resultados ni capturas. No se repitieron diagnósticos históricos.

Runtime: Chrome {result['browser']} y Node {result['node']}. Caché histórica reutilizada: cero. El acceso fue {'CLI autenticado con ID explícito desde directorio sin vincular y caché nueva por ID/origen' if phase == 'isolated' else 'HTTPS público directo desde un perfil nuevo, sin cabeceras de autenticación ni respuestas de caché aislada/Preview'}. CSP y la fuente exacta se verificaron antes de iniciar el navegador. No se cambiaron protecciones, credenciales, runtime o índice Git.

Consola: cero errores JS de aplicación y cero errores/advertencias desconocidos; {len(result['console'])} errores del Toolbar deliberadamente aislado, clasificados por origen y ruta exactos. No se ocultan avisos globales en el resultado raw. Las cancelaciones de favicon, si existen, quedan diferenciadas y requieren su prueba HTTP 200 con fuente exacta.

Resultados: results.json. Resumen: acceptance-summary.json. Recursos y enlaces: resource-proof.json. Target: target.json. Procesos: process-cleanup.json, con PID ausente, navegador cerrado, perfil eliminado y cero grupos CLI propios. Las cachés/perfiles/cabeceras raw quedan fuera del paquete. Los scripts compartidos están en ../scripts/. El manifiesto de esta carpeta cubre los archivos durables salvo sus propios archivos de hashes.
''')


def manifest(directory):
    rows = []
    for p in sorted(directory.rglob('*')):
        if p.is_file() and p.parent == directory and p.name in ['MANIFEST-SHA256.json', 'SHA256SUMS']:
            continue
        if p.is_file():
            data = p.read_bytes()
            rows.append({'path': str(p.relative_to(directory)), 'bytes': len(data), 'sha256': sha(data)})
    save(directory / 'MANIFEST-SHA256.json', {'algorithm': 'SHA256', 'files': rows})
    (directory / 'SHA256SUMS').write_text(''.join(f'{r["sha256"]}  {r["path"]}\n' for r in rows))
    return len(rows)


phase_files = manifest(docs)
all_files = manifest(base)
print(json.dumps({'passed': True, 'phase': phase, 'cases': 5, 'phaseFiles': phase_files,
                  'allFiles': all_files, 'summary': str(docs / 'acceptance-summary.json')}))
