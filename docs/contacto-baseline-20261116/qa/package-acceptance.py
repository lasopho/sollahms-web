"""Package existing Contacto evidence. No browser, network, application edits or deployment."""
import copy
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

REPO = Path('/private/tmp/sollahms-contacto-baseline-20261116')
DOCS = REPO / 'docs/contacto-baseline-20261116/qa'
RUNTIME = REPO / '.vercel/contacto-baseline-20261116/qa'
DEPLOYMENT = 'dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh'
ORIGIN = 'https://project-wrapp-cyqjausfq-lsandoval2-8260s-projects.vercel.app'
SUFFIX_HASH = '8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc'


def read(name):
    return json.loads((DOCS / name).read_text())


def write(name, value):
    (DOCS / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def digest(data):
    return hashlib.sha256(data).hexdigest()


initial = read('results-initial-keyboard-harness.json')
interactions = read('interactions-final.json')
rut_consent = read('rut-consent-final.json')
enter = read('interactions-320-enter-diagnostic.json')
keyboard_diagnostic = read('keyboard-diagnostic-320.json')
phases = [initial, interactions, rut_consent, enter, keyboard_diagnostic]
for phase in phases:
    assert phase['deployment'] == DEPLOYMENT and phase['origin'] == ORIGIN
    assert phase['profileRemoved'] and not phase['managedProcessesRemaining']
    assert not phase['pageErrors'] and not phase['transportErrors']
    assert phase['actualCommercialRequests'] == 0
    assert not phase['blockedApi'] and not phase['blockedUnsafe']
    assert all(c['intentionalTooling'] for c in phase['console'])
    assert all(c['tooling'] for c in phase['blockedExternal'])
assert rut_consent['passed']
assert enter['cases'][0]['keyboard']['submitAfterArrow'] == 1
assert enter['formSubmitEvents'] == 0  # Preserved raw aggregation bug; corrected only in summary.

rows = []
for width in [1440, 1024, 768, 390, 320]:
    original = next(c for c in initial['cases'] if c['width'] == width)
    interaction = next(c for c in interactions['cases'] if c['width'] == width)
    final = next(c for c in rut_consent['cases'] if c['width'] == width)
    layout = original['layout']
    assert layout['scrollWidth'] <= width + 1 and not layout['offscreen']
    assert all(f['required'] and f['visible'] and f['enabled'] and f['empty'] for f in layout['fields'])
    assert layout['select']['textWidth'] <= layout['select']['availableTextWidth'] + 1
    key = interaction['keyboard']
    assert key['letterSelectsExpected'] and key['shiftTabRestoresSelect'] and key['restoredInitial']
    assert key['firstTab']['tag'] == 'SUMMARY' and key['secondTab']['id'] == 'advisory-consent'
    assert interaction['emptyReportValidity'] is False
    assert all(final['rut']['invalid'].values())
    assert final['rut']['valid']['formatted'] and final['rut']['valid']['ariaValid']
    assert final['rut']['valid']['errorHidden'] and final['rut']['valid']['nativeValid']
    assert not final['rut']['valid']['stored'] and not final['rut']['valid']['urlContainsValue']
    consent_source = final if final.get('consentToggleRestored') else interaction
    assert consent_source['consentToggleRestored'] and final['rut']['cleared']
    assert interaction['submitEvents'] == final['submitEvents'] == 0
    rows.append({
        'width': width, 'status': 'PASS', 'layout': layout,
        'mobileMenu': original['mobileMenu'], 'keyboard': key,
        'emptyReportValidity': interaction['emptyReportValidity'],
        'rut': final['rut'], 'consentToggleRestored': True,
        'consentMethod': consent_source.get('consentMethod', 'real checkbox click, then uncheck'),
        'submitEvents': 0,
        'screenshots': [f'screenshots/{kind}-{width}.png' for kind in ['contacto', 'footer', 'selector']],
        'evidenceSources': {
            'layoutAndScreenshots': 'results-initial-keyboard-harness.json',
            'keyboardAndEmptyValidity': 'interactions-final.json',
            'rutInvalidAndValid': 'rut-consent-final.json',
            'consent': 'rut-consent-final.json' if consent_source is final else 'interactions-final.json',
        },
    })

cache_records = []
cache = RUNTIME / 'cache' / DEPLOYMENT / 'native-cache'
for meta_path in sorted(cache.glob('*.json')):
    meta = json.loads(meta_path.read_text())
    body = meta_path.with_suffix('.body').read_bytes()
    assert meta['deployment'] == DEPLOYMENT and meta['origin'] == ORIGIN
    assert meta['method'] == 'GET' and meta['status'] == 200
    assert meta['bytes'] == len(body) and meta['sha256'] == digest(body)
    source_path = REPO / (meta['path'].lstrip('/') or 'index.html')
    source = source_path.read_bytes()
    assert body[:len(source)] == source
    suffix = body[len(source):]
    assert not suffix or (len(suffix) == 163 and digest(suffix) == SUFFIX_HASH)
    cache_records.append({
        **{k: meta[k] for k in ['path', 'method', 'status', 'bytes', 'sha256']},
        'sourceIdentical': True, 'platformSuffixBytes': len(suffix),
        'cspPreserved': bool(meta['headers'].get('content-security-policy')),
    })
assert len(cache_records) == 31
write('resource-proof.json', {
    'deployment': DEPLOYMENT, 'origin': ORIGIN, 'ownCacheOnly': True,
    'historicalCacheReuse': 0, 'verifiedRecords': len(cache_records),
    'records': cache_records,
    'navigationCancellations': {
        'count': 2, 'path': '/assets/branding/favicon.svg', 'error': 'net::ERR_ABORTED',
        'source': 'results-initial-keyboard-harness.json',
        'classification': 'Browser navigation cancellation; native response HTTP 200 and exact source bytes verified in this candidate cache. No failed HTTP response or broken image.',
    },
})

visual_path = REPO / 'docs/contacto-baseline-20261116/visual-review.json'
visual = json.loads(visual_path.read_text())
assert visual['visualPassed'] and visual['deploymentId'] == DEPLOYMENT
for screenshot in visual['screenshots']:
    assert digest((visual_path.parent / screenshot['path']).read_bytes()) == screenshot['sha256']
pid_state = json.loads((RUNTIME / 'pid.json').read_text())
assert pid_state['state'] == 'closed' and pid_state['profileRemoved']
assert pid_state['managedProcessesRemaining'] == []
assert not list((RUNTIME / 'profiles').iterdir())
try:
    os.kill(pid_state['pid'], 0)
except ProcessLookupError:
    pid_absent = True
else:
    raise AssertionError('Previous runner PID still exists; inspect before packaging')
write('process-cleanup.json', {
    **pid_state, 'pidAbsentAtPackaging': pid_absent, 'profileDirectoriesRemaining': 0,
    'managedProcessGroupsRemaining': 0, 'noOtherBrowserProcessesTouched': True,
})

accepted = copy.deepcopy(initial)
accepted.update({
    'widths': [1440, 1024, 768, 390, 320], 'cases': rows, 'passed': True,
    'acceptanceMethod': 'Composite acceptance of preserved layout and focused interaction phases; no application edits between phases.',
    'acceptanceSources': ['results-initial-keyboard-harness.json', 'interactions-final.json', 'rut-consent-final.json'],
    'access': rut_consent['access'],
    'resourceFailures': [r for r in initial['resourceFailures'] if r['intentionalTooling']],
    'resourceFailureClassification': 'Two initial favicon navigation cancellations retained in raw and resolved by exact-source HTTP200 cache proof in resource-proof.json.',
    'formSubmitEvents': 0, 'actualCommercialRequests': 0,
    'historicalDiagnostics': {
        'emptyDomSubmitEvents': 1, 'commercialRequests': 0,
        'source': 'interactions-320-enter-diagnostic.json',
        'counterLocation': 'cases[0].keyboard.submitAfterArrow',
        'rawAggregateCounter': 0,
        'note': 'Enter on the native select generated one empty DOM submit rejected by existing validation before network. Raw aggregate missed it because it followed a failed assertion. Raw evidence is unchanged.',
        'notCertifiedKeys': ['ArrowDown', 'Home'],
    },
    'closedAt': rut_consent['closedAt'], 'profileRemoved': True,
    'managedProcessesRemaining': [], 'productionAuthorized': False,
})
write('results.json', accepted)

summary = {
    'passed': True, 'scope': 'New private Preview Contacto QA only',
    'deployment': DEPLOYMENT, 'origin': ORIGIN, 'productionAuthorized': False,
    'sourceContactoBytes': accepted['sourceContactoBytes'],
    'sourceContactoSha256': accepted['sourceContactoSha256'],
    'candidateInventorySha256': accepted['inventorySha256'],
    'access': accepted['access'], 'browser': accepted['browser'], 'node': accepted['node'],
    'widths': accepted['widths'], 'acceptedCases': 5, 'expectedCases': 5,
    'counts': {
        'layoutHeaderFooterOverflow': 5, 'fourRequiredFields': 5,
        'selectorPromptAndNativeIndicator': 5, 'keyboardTypeaheadAndTabOrder': 5,
        'emptyReportValidityRejected': 5, 'rutInvalidErrorVisible': 5,
        'rutValidFormattedErrorHidden': 5, 'consentRealToggleAndRestoration': 5,
        'whatsappHrefWithoutOpening': 5, 'mobileMenusOpenEscapeFocusRestored': 4,
        'internalNavigationHttp200': 10, 'screenshots': 15,
        'candidateCacheHttp200ByteVerified': 31,
    },
    'safety': {
        'acceptanceDomSubmitEvents': 0, 'historicalDiagnosticEmptyDomSubmitEvents': 1,
        'actualCommercialRequestsAllPhases': 0, 'unsafeRequestsAttemptedAllPhases': 0,
        'apiRequestsAttemptedAllPhases': 0, 'submitButtonClicks': 0,
        'formSubmitMethodCalls': 0, 'historicalCacheReuse': 0,
        'syntheticRutInScreenshotsOrReports': False,
        'rutValuesCleared': True, 'credentialsLogged': False,
        'protectionsOrCredentialsChanged': False,
    },
    'consoleAndResources': {
        'applicationPageErrorsAllPhases': 0, 'unknownConsoleErrorsOrWarningsAllPhases': 0,
        'intentionalToolbarConsoleErrorsAcrossUniquePhases': sum(len(p['console']) for p in phases),
        'toolbarScript': 'https://vercel.live/_next-live/feedback/feedback.js',
        'initialFaviconNavigationCancellations': 2,
        'faviconExactSourceHttp200Verified': True,
        'note': 'Toolbar is deliberately isolated; its ERR_FAILED messages are preserved and classified. Global console is not claimed empty.',
    },
    'keyboardMethod': 'Real native letter d selects diversificar; Tab to optional-message SUMMARY, Tab to consent; Shift+Tab twice restores selector; selectOption restores empty initial option.',
    'notCertifiedKeys': ['ArrowDown', 'Home'],
    'visualReview': '../visual-review.json',
    'visualReviewSha256': digest(visual_path.read_bytes()),
    'rawEvidencePreserved': True,
    'processes': {'runnerClosed': True, 'profileRemoved': True, 'remainingManagedProcessGroups': 0},
    'acceptedResult': 'results.json', 'resourceProof': 'resource-proof.json',
    'packagedAt': datetime.now(timezone.utc).isoformat(),
}
write('acceptance-summary.json', summary)

readme = """Contacto: QA de la nueva Preview privada, 5/5 PASS.

Deployment `dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh`, origen https://project-wrapp-cyqjausfq-lsandoval2-8260s-projects.vercel.app. Esta aceptación cubre únicamente esta Preview; no autoriza una publicación Production. Resumen verificable: [acceptance-summary.json](acceptance-summary.json). Resultados compuestos: [results.json](results.json).

| Ancho | Layout, encabezado y pie | Selector y teclado | RUT y consentimiento | Captura |
| --- | --- | --- | --- | --- |
| 1440 | PASS | PASS | PASS | [Página](screenshots/contacto-1440.png) |
| 1024 | PASS | PASS | PASS | [Página](screenshots/contacto-1024.png) |
| 768 | PASS | PASS | PASS | [Página](screenshots/contacto-768.png) |
| 390 | PASS | PASS | PASS | [Página](screenshots/contacto-390.png) |
| 320 | PASS | PASS | PASS | [Página](screenshots/contacto-320.png) |

En los cinco anchos se verificaron los cuatro campos obligatorios visibles y vacíos, ausencia de desbordamiento, enlaces de encabezado y pie, selector con texto completo e indicador nativo, consentimiento inicialmente vacío y WhatsApp mediante su href sin abrirlo. El pie tiene tres columnas desde 768 px y una en 390/320 px. Los cuatro menús móviles visibles abrieron, cerraron con Escape y restauraron el foco. Diez destinos internos devolvieron HTTP 200. Hay quince capturas originales: página, pie y selector por ancho. La inspección visual independiente y sus hashes están en [visual-review.json](../visual-review.json); las capturas no se sobrescribieron tras dicha inspección.

La selección por teclado se probó con una pulsación real de «d», que selecciona «Diversificar mis inversiones». Tab recorre el summary «Agregar un mensaje (opcional)» y después el consentimiento; dos Shift+Tab regresan al selector. Se restauró la opción inicial mediante selectOption, cuyo uso queda registrado. ArrowDown y Home no se certifican. reportValidity sobre el formulario vacío devuelve false. Un RUT sintético con checksum inválido muestra el error y aria-invalid=true; el válido se formatea, retira el error y queda aria-invalid=false. El valor se usó solo en memoria, no aparece en capturas ni resultados, y se vació al terminar. El consentimiento se marcó y desmarcó con clic real.

La aceptación es compuesta y conserva cada fase original. [results-initial-keyboard-harness.json](results-initial-keyboard-harness.json) contiene el layout y las capturas aceptadas, aunque su aserción de ArrowDown era incorrecta para el select nativo de Chrome headless en Mac. [interactions-final.json](interactions-final.json) aporta teclado y validación vacía en los cinco anchos, y consentimiento en 320/390. Su limpieza anticipada del RUT requerido provocaba un cambio de layout durante el clic de consentimiento en 1440/1024/768. [rut-consent-final.json](rut-consent-final.json) completa RUT inválido/válido en los cinco y esos tres clics con el RUT válido y desenfocado. No cambió el HTML ni la aplicación entre fases.

El diagnóstico anterior [interactions-320-enter-diagnostic.json](interactions-320-enter-diagnostic.json) conserva un evento DOM submit de formulario vacío provocado por Enter. La validación existente lo rechazó antes de cualquier solicitud. Su contador agregado original figura cero por una aserción que interrumpía la agregación; el resumen contabiliza expresamente ese evento histórico como uno, sin alterar el raw. [keyboard-diagnostic-320.json](keyboard-diagnostic-320.json) conserva foco real, eventos no prevenidos y la selección correcta por letra. Las fases de aceptación tienen cero eventos DOM submit. En todas las fases hubo cero solicitudes comerciales, cero intentos API/unsafe, cero clics en submit y cero invocaciones de form.submit.

Los 31 recursos de la caché propia CUt se verificaron por deployment, origen, bytes y SHA256; todos devolvieron HTTP 200 y conservan el prefijo de la fuente exacta. [resource-proof.json](resource-proof.json) documenta esta comprobación. Dos peticiones del favicon fueron canceladas por navegación en la primera pasada; el mismo recurso tiene respuesta 200 y bytes exactos. El script Vercel Toolbar se aisló deliberadamente: sus 17 mensajes ERR_FAILED, repartidos entre las cinco fases únicas, están preservados. Hubo cero errores JS de aplicación y cero errores o advertencias de consola desconocidos; no se afirma que la consola global estuviera vacía.

Fuente Contacto: 18.655 bytes, SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`. Inventario lógico del candidato: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`. La respuesta HTML autenticada contiene esa fuente idéntica más el sufijo Vercel de exactamente 163 bytes, SHA256 `8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc`; se rechazaba cualquier otro sufijo. Runtime usado: Node v24.22.3 y Chrome 157.0.8103.78, mediante playwright-core ya instalado. Se conservó CSP, HTTPS y SSO usando el CLI autenticado desde un directorio independiente sin vincular. No se cambiaron credenciales ni protecciones ni se generaron sharelinks/bypasses. No se reutilizó ninguna respuesta de la caché histórica.

Fuentes del harness: [contacto-qa.mjs](contacto-qa.mjs), [native-transport.mjs](native-transport.mjs), [managed-process.mjs](managed-process.mjs) y este empaquetador [package-acceptance.py](package-acceptance.py). El transporte limita la concurrencia a dos CLI, impone watchdog y termina únicamente sus propios grupos. El perfil y los procesos quedaron cerrados: [process-cleanup.json](process-cleanup.json). Las cachés, perfiles y cabeceras raw permanecen fuera de la documentación y no forman parte del paquete.

Los comandos usados para las fases enfocadas fueron `node docs/contacto-baseline-20261116/qa/contacto-qa.mjs --interaction-only` y `node docs/contacto-baseline-20261116/qa/contacto-qa.mjs --interaction-only --rut-consent-only`. Los archivos de diagnóstico conservan resultados históricos y no deben interpretarse como controles pendientes de la aplicación. El paquete final se construye localmente, sin navegador ni red, con `python3 docs/contacto-baseline-20261116/qa/package-acceptance.py`. MANIFEST-SHA256.json y SHA256SUMS cubren todos los archivos durables salvo los propios manifiestos.
"""
(DOCS / 'README.md').write_text(readme)

files = []
for path in sorted(DOCS.rglob('*')):
    if path.is_file() and path.name not in ['MANIFEST-SHA256.json', 'SHA256SUMS']:
        data = path.read_bytes()
        files.append({'path': str(path.relative_to(DOCS)), 'bytes': len(data), 'sha256': digest(data)})
write('MANIFEST-SHA256.json', {'algorithm': 'SHA256', 'deployment': DEPLOYMENT, 'files': files})
(DOCS / 'SHA256SUMS').write_text(''.join(f"{item['sha256']}  {item['path']}\n" for item in files))
print(json.dumps({'passed': True, 'cases': len(rows), 'packagedFiles': len(files), 'summary': str(DOCS / 'acceptance-summary.json')}, ensure_ascii=False))
