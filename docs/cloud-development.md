# Desarrollo y diagnóstico en Codex Cloud

Los scripts siguientes preparan herramientas de prueba. No generan un build publicable del sitio,
importan recursos privados, cambian ramas ni ejecutan operaciones en Vercel.
Tampoco llaman a Resend, al backend de reservas o a Google Calendar.

## Preparación

Desde el checkout en `/workspace/sollahms-web`:

```sh
bash scripts/setup-cloud.sh
```

El setup exige Node 24, Python 3.12 y Linux x86_64, como el CI de GitHub y los
hashes de `requirements-ci.txt`. Usa los ejecutables disponibles en PATH o el
runtime de Codex bajo `/opt/codex/runtimes/codex-primary-runtime/dependencies`.
`/usr/bin/python3` puede pertenecer a otra versión; no debe seleccionarse por
su ubicación sin comprobarla.

La virtualenv queda en `/workspace/.venvs/sollahms-web`, fuera del repositorio.
Si Pillow y pypdf ya tienen las versiones fijadas, no ejecuta pip ni necesita
red. Si faltan, pip instala exclusivamente wheels con los hashes revisados,
manteniendo la verificación TLS y la configuración de proxy heredadas.
Comprueba `pyvenv.cfg` y que el prefijo Python pertenezca al directorio elegido;
una instalación global no puede utilizarse como destino de pip.
Antes de instalar, también rechaza destinos configurados para paquetes,
intérprete, logs o reportes en variables pip y sus secciones global/install.
La inspección usa la CLI soportada, captura sus valores sin mostrarlos y
conserva la configuración de proxy, certificados e índices. El rechazo es
conservador, incluso si otra sección sobrescribe el destino. El install fija
el intérprete de la virtualenv y usa `--no-user`; no modifica la configuración
de pip del llamador.
No reemplaza una virtualenv existente de otra versión ni instala npm, Chrome
o herramientas del sistema.

Variables opcionales:

| Variable | Uso |
|---|---|
| `SOLLAHMS_CI_NODE` | Ejecutable Node 24; también lo utiliza el runner Git CI. |
| `SOLLAHMS_CLOUD_PYTHON` | Ejecutable Python 3.12 para crear la virtualenv. |
| `SOLLAHMS_CLOUD_VENV` | Directorio absoluto de virtualenv fuera del checkout. |
| `SOLLAHMS_SHARP_MODULE` | Módulo Sharp existente para pruebas privadas de píxeles. |
| `SOLLAHMS_PLAYWRIGHT_MODULE` | Módulo Playwright Node existente para QA de navegador. |
| `SOLLAHMS_BROWSER_EXECUTABLE` | Chromium del sistema; el diagnóstico usa `/usr/bin/chromium` cuando está disponible. |

El setup es un proceso separado: no cambia el PATH de la terminal que lo llamó.
Al terminar muestra el comando de CI con los ejecutables concretos y el PATH
de la virtualenv antepuesto sólo para ese comando. Esto también asegura que
los helpers Python lanzados por Node usen las mismas dependencias.

## Diagnóstico sin instalaciones

```sh
/workspace/.venvs/sollahms-web/bin/python scripts/check-cloud-environment.py
```

El comando devuelve JSON con versiones, dependencias, carga de Sharp/libvips,
Playwright, existencia del navegador y operaciones Node de subprocess y
`scryptSync`. Sólo consulta `chromium --version`; no lanza el navegador ni
afirma que su sandbox funcione. `git_ci_ready` requiere que las operaciones
Node y las dependencias de CI funcionen. Si el entorno restringe las operaciones
nativas con PIPE, ejecuta `scripts/check-cloud-stdio.mjs` con el preload
optativo y exige que apruebe su contrato de compatibilidad. En ese caso informa
una advertencia y requiere `--cloud-stdio` para el CI. No elimina permisos ni
cambia la política del entorno. Sharp y Playwright son herramientas opcionales
para las verificaciones que los necesitan.

Las dos sondas Node del diagnóstico no heredan `NODE_OPTIONS`: así pueden
medir las operaciones nativas y verificar expresamente el adaptador aun si
la terminal ya lo tiene precargado. El entorno del llamador, el proxy, los
certificados y las llamadas GET conservan su configuración.

El diagnóstico funciona sin red por defecto. Para comprobar únicamente GET
públicos de SII, PyPI y npm, con un límite de cinco segundos por destino:

```sh
/workspace/.venvs/sollahms-web/bin/python scripts/check-cloud-environment.py --network
```

Se conservan proxy y confianza TLS del entorno. La salida muestra estados
HTTP y códigos de error, sin valores de variables, credenciales ni cabeceras.
Con `--network`, un destino que no se puede verificar también devuelve salida 1.
Un fallo de confianza TLS debe corregirse en la configuración del entorno;
estos scripts no desactivan la verificación de certificados.

## Regresión Git y QA local

```sh
PATH="/workspace/.venvs/sollahms-web/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 /workspace/.venvs/sollahms-web/bin/python -B scripts/run-git-ci.py --cloud-stdio --output /tmp/sollahms-cloud-public-ci
node scripts/validate-mortgage-data.mjs
```

El alcance y los conteos vigentes están en `tests/git-ci-selection.json`.
El runner requiere historia Git completa y los commits históricos que
verifica. Sus resultados y temporales van fuera del checkout; no reemplaza
las comprobaciones que necesitan el paquete privado de release.

`--cloud-stdio` carga el adaptador únicamente en los procesos del CI y sus
helpers. Cada archivo Node se ejecuta por separado; las assertions y los
conteos del modo normal se conservan. No hay que exportar `NODE_OPTIONS`
globalmente ni utilizar este transporte para comandos no confiables.
La diferencia de límite es explícita: `maxBuffer` se comprueba después de
terminar el proceso. Un exceso produce `ENOBUFS`, pero no detiene la escritura
en el primer byte que supera el límite. Los timeout y errores reales se
mantienen. El contrato puede comprobarse por separado:

```sh
node --import ./scripts/cloud-sync-stdio.mjs scripts/check-cloud-stdio.mjs
```

Para revisar páginas fuente con proveedores simulados:

```sh
SOLLAHMS_QA_PORT=8897 node tests/qa-preview-server.mjs --root .
```

El servidor se limita a loopback y sustituye el transporte de formularios.
Sus fixtures UF tienen fechas concretas: un día no registrado debe fallar
como UF no disponible. No utilizar el servidor genérico `scripts/preview.mjs`
para pruebas de envío con credenciales reales heredadas.

Las suites `tests/qa-*.mjs` existentes seleccionan `channel: 'chrome'`.
En un entorno que sólo contiene Chromium, la presencia del módulo Playwright
no basta: hace falta admitir una ruta explícita del ejecutable en esas suites.
`SOLLAHMS_BROWSER_EXECUTABLE` sólo configura este diagnóstico hasta que se
integre ese soporte. Una denegación del sandbox al lanzar Chromium debe
informarse y resolverse mediante el entorno; no se evita con flags adicionales.

En la instancia auditada el 14/10/2026 se observó además `EPERM` al crear sockets
TCP, incluso para loopback, y al ejecutar Chromium headless con su configuración
normal. Por ello el servidor QA y la revisión visual necesitan una instancia
con esas capacidades habilitadas. La compatibilidad optativa de subprocess
permite el CI de archivos; no habilita TCP ni soluciona el lanzamiento del
navegador. No se desactivó el sandbox de Chromium.
