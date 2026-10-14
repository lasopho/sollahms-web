# Sollahms Web — diagnóstico técnico de Codex Cloud

Auditoría y preparación del 14 de octubre de 2026, fecha de America/Santiago.
Rama de revisión: `codex/cloud-development-diagnostics`. Base Git:
`42b8e87ee89c850ffc7a6b69b0136d33d51f84f8`; conserva el snapshot local de
`origin/main`. La punta remota no pudo comprobarse mediante Git por el bloqueo
de red durante la auditoría inicial. En la preparación para integración, el
conector autorizado de GitHub confirmó ese mismo SHA de `main`.
Las verificaciones iniciales se realizaron sobre el árbol de trabajo previo
al commit técnico. Su SHA y el estado de publicación se entregan al cerrar
la preparación para integración.

## Resultado

El checkout cloud permite ejecutar toda la regresión pública vigente:
**330/330 casos Node y 137/137 Python aprobados**, sin fallos, cancelaciones o
casos saltados. También aprobó el validador hipotecario. Los **26 casos de
release privado** se excluyen por su clasificación existente y no se declaran
aprobados. La preparación no habilita red, servidores locales ni navegador.

Los datos, páginas, estilos, recursos, funciones del sitio, plantillas,
`vercel.json`, workflow de GitHub y dependencias fijadas permanecen sin cambios.
No se modificó producción, se hizo merge ni se consultó o modificó Vercel.

## Problemas corregidos

La sesión aplica Seccomp y NoNewPrivs. Las sondas reproducen `EPERM` en
operaciones de sockets Unix como `shutdown`, `getsockname` y `getsockopt`.
Node utiliza esos canales para stdio: puede devolver `EPERM` aun cuando Git
terminó correctamente, perder salida de un proceso Node o provocar `EPIPE`
al transmitir entrada. Los errores Python eran consecuencia de los helpers
Node que ejecutaban esas operaciones; Python → Git funcionaba.

`UV_USE_IO_URING=0` no corrigió el problema. La regla exacta del filtro no es
accesible y `strace` también fue denegado; no se solicitaron privilegios.

El modo optativo `--cloud-stdio` utiliza descriptores de archivos temporales
privados para entrada/salida síncrona y ejecuta cada archivo de pruebas Node
en un proceso independiente con `--test-isolation=none`. Mantiene las
assertions, patrones de selección y cantidades del CI. El preload se aplica
únicamente al entorno de esos procesos y sus helpers, no al runtime general.

Ocho grupos de comprobaciones reales verificaron Git, entrada/salida binaria,
3000 captions UTF-8 del test existente, status de error, stderr, timeout,
`ENOENT`, `ENOBUFS`, opciones admitidas y limpieza de temporales.
La diferencia documentada es que `maxBuffer` se comprueba **al finalizar** el
proceso: un exceso falla, pero no interrumpe la primera escritura excedida.
Este transporte se limita a comandos de desarrollo confiables y acotados.

## Instalación y configuración reproducibles

No había un setup de cloud versionado ni una configuración editable visible
en este checkout. Se añaden:

| Archivo | Función |
|---|---|
| `scripts/setup-cloud.sh` | Valida Node 24/Python 3.12/Linux x86_64; prepara la virtualenv fuera del repo y exige wheels con hashes si necesita instalar. |
| `scripts/check-cloud-environment.py` | Diagnóstico offline, versiones, imports, operaciones Node, compatibilidad cloud y GET públicos opcionales sanitizados. |
| `scripts/cloud-sync-stdio.mjs` | Transporte síncrono optativo para las restricciones de stdio del runtime. |
| `scripts/check-cloud-stdio.mjs` | Comprueba el contrato de compatibilidad con subprocesses reales. |

El setup ejecutado aprobó sin instalar paquetes ni utilizar red: las versiones
fijadas ya estaban presentes. También se verificó el rechazo seguro de una
virtualenv dentro del repositorio y de un ejecutable Node inexistente.
La revisión para integración añadió el rechazo de una instalación global
seleccionada por error como virtualenv y aisló las sondas Node del
`NODE_OPTIONS` heredado para conservar un diagnóstico nativo fiable.

Node 24.19.0, Python 3.12.14, Pillow 12.3.0 y pypdf 6.10.0 están disponibles.
Sharp 0.35.5/libvips 8.18.7 y Playwright 1.62.1 cargan correctamente como
herramientas opcionales. Chromium 154 existe, pero su arranque está bloqueado.
No se necesita `npm install` para la regresión pública de este sitio.

```sh
bash scripts/setup-cloud.sh
PATH="/workspace/.venvs/sollahms-web/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 /workspace/.venvs/sollahms-web/bin/python -B scripts/run-git-ci.py --cloud-stdio --output /tmp/sollahms-cloud-public-ci
```

La [guía de desarrollo](cloud-development.md) contiene diagnóstico, variables
opcionales y uso del servidor QA existente. Para futuras instancias, registrar
`bash scripts/setup-cloud.sh` como preparación mediante la configuración
soportada de Codex Cloud; este trabajo no cambió esa configuración externa.
La documentación de CI se actualizó a 330/137/26, los once gates existentes y
el inventario por commit, evitando reutilizar las 964 fuentes históricas.

## Verificaciones completadas

| Control | Resultado observado |
|---|---|
| CI Node público | 330 aprobados, 0 fallos, 0 cancelaciones, 0 skips |
| Fixtures Python públicos | 137 aprobados |
| Validador hipotecario | Aprobado; 10 instituciones y 3 referencias |
| Contrato de stdio cloud | 8 grupos aprobados |
| `git fsck --full --no-reflogs` | Salida 0, sin daños ni objetos colgantes |
| Historia Git y baselines | Checkout no shallow; las cinco revisiones exigidas por el runner existen |
| `pip check` | Sin dependencias rotas |
| Integridad RECORD de Python | 141 archivos Pillow + 61 pypdf, sin diferencias |
| Recursos presentes seleccionados | 686 archivos con hashes exactos |
| Fuentes comerciales/diseño/plataforma | Diff vacío contra la base |

El validador hipotecario conserva sus advertencias de vigencia: la UF del
10/10 está vencida para convertir pesos actuales y la referencia Scotiabank
requiere revisión. Itaú y Banco de Chile requieren reverificación para seguir
disponibles el 17/10. Esas fuentes comerciales no se editaron.

La evidencia detallada está en [el reporte JSON consolidado](cloud-development-audit-2026-10-14.json).
La repetición completa para integración también aprobó 330/330 Node, 137/137
Python y el validador, con cero skips. Sus logs y el reporte del runner están
en `/tmp/sollahms-cloud-integration-ci/`; la ejecución inicial está en
`/tmp/sollahms-cloud-public-ci/`. Son archivos de trabajo de esta instancia.

## Limitaciones del entorno

`proxy` resuelve por DNS y el perfil HTTP declarado autoriza GitHub y los
registros de paquetes. Sin embargo, crear sockets `AF_INET` devuelve `EPERM`,
incluso en loopback. Git y curl fallan antes de HTTP, TLS o autenticación.
No hay evidencia para atribuirlo a credenciales inválidas ni a una caída de
GitHub o del proxy. `git ls-remote origin refs/heads/main` sigue bloqueado.
GET de SII, PyPI y npm devolvieron curl 7/HTTP 000.

La política declarada no incluye `www.sii.cl` ni `api.resend.com`. La futura
verificación real de esas integraciones requiere permitir sus destinos por
el flujo soportado. El dominio del backend de reservas debe definirse desde
su configuración autorizada, sin divulgar su valor.

Chromium headless, con su configuración normal, falla en `setsockopt` con
`EPERM`. No se desactivó su sandbox. Los scripts QA además fijan el canal
Chrome, ausente; Playwright no tiene un navegador descargado en su caché.
Tras resolver infraestructura, admitir un ejecutable Chromium explícito o
proporcionar el canal requerido. `SOLLAHMS_BROWSER_EXECUTABLE` configura hoy
el diagnóstico, no modifica las suites QA existentes.

Servidores de desarrollo, QA visual, mapas/visores externos, UF real y la
consulta remota a Git requieren una revisión del perfil de ejecución por el
administrador del entorno. No se modificaron proxy, confianza TLS, rutas,
capabilities, filtros ni infraestructura.

## Recursos privados y acciones pendientes

El inventario exacto, con rutas, manifiestos/líneas, hashes, tamaños y
geometría cuando están registrados, está en
`/tmp/sollahms-cloud-audit/private-resources.json`.

| Recursos necesarios para la fuente Preview completa | Ausentes |
|---|---:|
| Derivados Ingevec | 165 |
| Derivados Ecasa | 130 |
| Medios Leben | 43 |
| Originales/selecciones oficiales Ecasa adicionales | 4 |
| PDF originales Sento | 6 |
| PDF originales León | 5 |
| **Total** | **353** |

Los insumos de reproducción se separan del build: 62 nombres de PDF,
correspondientes a 60 contenidos únicos, y 26 candidatos AJ aprobados.
El JSON también distingue 224 evidencias históricas documentales ausentes;
no se cuentan como requisito del build actual ni del CI público.
No se crearon sustitutos de ninguno de esos recursos.

Contacto real requiere `RESEND_API_KEY`; agenda requiere `BOOKING_SECRET`
y la configuración `BOOKING_BACKEND_URL`, además del backend autorizado y
su integración de calendario. La instancia no tiene bindings de secretos
configurados. La validación pública aprobada utiliza los fixtures existentes
con proveedores simulados y no necesita esas credenciales.

Acciones restantes:

1. Revisar el perfil de ejecución para sockets TCP/Unix, proxy y navegador,
   conservando el aislamiento y la verificación TLS del entorno.
2. Registrar el setup reproducible en la configuración soportada de Cloud.
3. Proporcionar el paquete privado verificado correspondiente al commit/lote
   vigente para los 26 casos privados y la validación completa de Preview.
4. Verificar red, credenciales y servicios reales en una tarea con ese alcance;
   los envíos y las reservas no forman parte de esta preparación técnica.
5. Revisar la configuración de navegador y los scripts QA históricos antes
   de afirmar una validación visual del catálogo actual de 134 proyectos.
