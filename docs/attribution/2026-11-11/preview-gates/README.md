# Cierre de gates del preview de atribución — 2026-11-11

**Resultado: parcial. `candidate_ready_for_release_review = false`.** Configuración y validación/guard de los siete formularios aprobadas. Falta observar directamente la adquisición real almacenada por el navegador. No se sustituye esa evidencia por tests aislados.

## Candidato y cambio autorizado

- Rama: `codex/attribution-first-party-20261111`.
- Commit runtime certificado: `6d818f38a26e21e7e5a7a518fb986aa962111f8c`.
- Preview anterior: `dpl_47hdEYK2Gz7Z9qLaE3ahoAwR4yPa`.
- Nuevo deployment: `dpl_dsduPwMeC8xbVBMwkX8xwMzp3L6M`, READY, target Preview (`target:null` en API).
- [Preview privado](https://project-wrapp-k1nd0u2z9-lsandoval2-8260s-projects.vercel.app/).
- Se creó exclusivamente `CONTACT_DELIVERY_MODE=resend`, target `preview`, ID `a5xNTMBCIGj1Er1R`. La variable independiente de Production conserva ID y fecha de modificación.

Se redeplegó el deployment anterior con `withLatestCommit:false`, sin cambiar archivos de runtime. La metadata registra el commit final 6d818f3, que contiene exactamente el runtime de aquel candidato. Vercel descargó los mismos 1.661 archivos y el constructor verificó los 1.658 hashes runtime y la configuración original antes de construir. No se usó `main`, no se activó Git deploy ni se asignaron dominios. La petición sin sesión recibió HTTP 302 hacia Vercel y `X-Robots-Tag: noindex`; se preservó el acceso privado.

Los registros de variables ya contenían `RESEND_API_KEY` con target Preview antes de esta ronda. Su valor no se consultó ni se copió, añadió o modificó. No se afirma que Preview carezca físicamente de esa clave preexistente: la protección certificada es que el guard responde **antes de leerla o contactar al proveedor**. Todos los metadatos de variables preexistentes quedaron iguales.

## Siete formularios: validación y guard en Chrome

Solo datos sintéticos: QA Persona Sintética, RUT de prueba 1.000.005-K, correo reservado `qa@example.invalid` y teléfono de prueba. En colaboración se probaron las dos rutas con un único canal cada una, respetando su contrato vigente.

| Formulario | Validación sin datos | Envío sintético | Configuration unavailable | Acquisición almacenada observada |
| --- | --- | --- | --- | --- |
| Portada | Bloquea campo obligatorio | Guard de preview | Ausente | Pendiente |
| Contacto | Bloquea campo obligatorio | Guard de preview | Ausente | Pendiente |
| Agenda de asesoría | Bloquea campo obligatorio | Guard de preview | Ausente | Pendiente |
| Centro de Orientación | Bloquea campo obligatorio | Guard de preview | Ausente | Pendiente |
| Comparador Hipotecario | Bloquea campo obligatorio | Guard de preview | Ausente | Pendiente |
| Trabaja con nosotros — inmobiliaria | Pide un canal y consentimiento | Guard con correo sintético | Ausente | Pendiente |
| Trabaja con nosotros — persona | Pide un canal y consentimiento | Guard con teléfono sintético | Ausente | Pendiente |

**Centro: aprobado para usabilidad, validación y guard. Comparador: aprobado para usabilidad, simulación y guard.** En Comparador se calculó un escenario sintético de 3.000 UF, 20% pie, 25 años y tasa 4,5%, y se abrió el formulario. No se evaluaron clientes ni fichas.

Mensajes observados:

- Portada, Contacto, Agenda y colaboración: «La vista previa no envía solicitudes reales.»
- Centro y Comparador: «La vista previa no envía mensajes reales. Puedes revisar el formulario sin contactar al equipo.»

La interfaz muestra el mensaje exclusivo del retorno `preview_read_only`; los tests aislados verifican directamente código JSON y HTTP 503. No se presenta una captura de payload de red del navegador que la herramienta no ofrece. Al finalizar, los logs de consola consultados no devolvieron errores/advertencias. No se enviaron correos reales ni se activó CRM.

Evidencia visual: [Centro](centro-preview-read-only.jpg), [Comparador](comparador-preview-read-only.jpg).

## Adquisición en navegador: gate abierto

| Caso requerido | Evidencia real de sessionStorage | Estado |
| --- | --- | --- |
| A — entrada directa, landing/referrer/UTM | No obtenida | Bloqueado |
| B — UTM y navegación preservando primera adquisición | No obtenida | Bloqueado |
| C — referrer controlado, solo origin | No obtenida | Bloqueado; no se fabricó Referer |

La lectura puntual autorizada de `sessionStorage["sollahms:acquisition:v1"]` desde la herramienta de Chrome falló porque su ámbito de evaluación no expone `sessionStorage` (`undefined`). No significa que el sitio no lo haya guardado. El intento de inspección visual adicional no produjo una vista legible del almacenamiento. No se alteró el sitio para exponerlo.

El ensayo integral existente volvió a fallar al iniciar Chromium: `process_singleton ... socket() failed: Operation not permitted`. La política del entorno rechazó la solicitud de ejecución fuera del aislamiento (`sandbox_approval:false`); no fue un fallo de atribución ni un test aprobado.

Se preparó un fixture local separado que sirve los dos módulos exactos del paquete congelado y muestra el almacenamiento real en una página QA. El navegador de escritorio alternativo no pudo alcanzar el servidor local (`ERR_CONNECTION_REFUSED`); no se debilitó autenticación, no se creó un enlace público ni se añadió el fixture al deployment. Se detuvo el servidor. **Este fixture está preparado, pero no cuenta como ejecutado ni como evidencia real.**

## Pruebas automatizadas

**76 aprobadas, 0 fallos: las 73 existentes más 3 específicas.** No se eliminó ni modificó ningún test existente.

1. Centro: se reproduce el error con modo ausente; usando las variables reales de proceso `VERCEL_ENV=preview` y `CONTACT_DELIVERY_MODE=resend`, retorna `preview_read_only`/503 con cero lecturas de clave, llamadas de proveedor, CRM o UF.
2. Comparador: mismo caso incluyendo un payload hipotecario sintético válido; llega al guard sin servicios externos.
3. Inicialización del módulo y navegación interna aisladas: conserva la primera landing/UTM y registra cero invocaciones de transporte antes de un formulario. Es una prueba de módulo, **no de navegador real ni de toda la red del sitio**.

```sh
node --test tests/acquisition.test.mjs tests/acquisition-preview-gates.test.mjs tests/orientation-20261031.mjs tests/required-commercial-fields.test.mjs tests/project-request.test.mjs tests/collaboration.test.mjs
```

[Salida completa](tests.txt). Se conservaron las pruebas ya aprobadas de contrato, UUID, normalización, sesión, Resend y CRM futuro. No se volvió a implementar adquisición ni se reestructuraron formularios.

## Privacidad y retención para decisión humana

[Propuesta mínima de transparencia, NO PUBLICADA](privacy-proposal.md). Documenta sessionStorage temporal, landing, origen externo, cinco UTM, click IDs opcionales, UUID al iniciar operación, página de envío y transmisión del objeto con el formulario. Distingue contexto técnico de solicitud, analítica de audiencia y marketing, y evita equiparar ausencia de referrer con tráfico directo.

La documentación pública de Resend establece 30 días para email/log data en Free, Pro y Scale, retención flexible en Enterprise y almacenamiento en Estados Unidos. **plan Resend actual: no confirmado**; su panel mostró login. No se fijó una duración de 30 días en la política de Sollahms ni se modificó el texto público. Base jurídica/consentimiento: **revisión jurídica/privacidad pendiente**, sin dictamen.

## Matriz de decisión

| Gate | Resultado |
| --- | --- |
| 7/7 formularios usables, validaciones y guard | Aprobado en Chrome |
| Centro/Comparador sin configuration unavailable | Aprobado |
| Adquisición browser observada directamente | **Pendiente** |
| Ningún correo real | Aprobado: todos alcanzaron guard, transporte aislado en tests |
| Sin regresión SEO/runtime | Aprobado: redeploy mismo paquete; cero cambios runtime en esta ronda |
| Privacidad y retención documentadas para decisión humana | Aprobado documentalmente; decisión jurídica/operativa pendiente |
| `candidate_ready_for_release_review` | **false** |

La adquisición preparada y su propagación siguen certificadas por tests de contrato; no se extrapolan a observación directa del almacenamiento del preview.

## Cómo cerrar la evidencia que falta

En una nueva pestaña independiente del preview privado, abrir DevTools → Application → Session storage → origen del preview. Leer únicamente `sollahms:acquisition:v1`, sin cookies ni otras claves. Caso A: entrada `/` sin parámetros, verificar landing `/`, referrer null y cinco UTM null. Caso B: nueva pestaña independiente con `/?utm_source=test&utm_medium=organic&utm_campaign=qa`, verificar los tres valores, navegar mediante un enlace interno y comparar que `context` no cambió. Guardar solo ese JSON sintético y ruta de página. No enviar más formularios ni compartir capturas de cuenta.

La lectura de consola equivalente, solo lectura, es `JSON.parse(sessionStorage.getItem('sollahms:acquisition:v1'))`. Para C se puede ejecutar el fixture local en un entorno que permita navegador y loopback; su enlace desde el segundo origen entrega un Referer controlado con ruta/query que deben desaparecer del registro. No falsificar un resultado si el navegador omite Referer.

```sh
node tests/acquisition-browser-fixture.mjs ../attribution-candidate-v2/release/static
# Abrir http://127.0.0.1:8765/ en ese mismo equipo.
```

Si se usa el fixture, identificarlo como evidencia local de módulos idénticos; no presentarlo como la UI alojada. Los escenarios actuales permanecen pendientes hasta obtener observación real.

## Preservación y entrega

Ambos dominios, `sollahms.cl` y `www.sollahms.cl`, continúan apuntando a `dpl_3LEibLxqAhX4bgak99HKNXNyhXuW`. No se modificaron variables de Production, política pública, consentimiento, SEO, fichas, CRM, analítica, cookies ni tracking. El commit documental/de pruebas de esta ronda no cambia el runtime del candidato 6d818f3 ni requiere otro deployment.

[Registro verificable y logs de build saneados](verification.json). No se guardaron secretos, cookies, sesiones de cuenta ni capturas de paneles privados.

**Producción intacta. Detenido antes de cualquier publicación.**
