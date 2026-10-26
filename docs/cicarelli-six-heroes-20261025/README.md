# Tres alternativas adicionales: D, E y F

Preview solamente. Sollahms.cl permanece intacto.

Comparador de las seis opciones: https://project-wrapp-aygdlq177-lsandoval2-8260s-projects.vercel.app/pintor-cicarelli-i.html?cabecera=d

- D — Galería central: `?cabecera=d`. Identidad centrada; debajo, imagen entre datos y acción. En móvil, composición centrada y apilada.
- E — Ficha abierta: `?cabecera=e`. Imagen e identidad en la primera fila; datos y acción en una franja inferior. En móvil, imagen junto al nombre y botón ancho debajo.
- F — En línea: `?cabecera=f`. Imagen, identidad, datos y botón en una sola fila de escritorio. En móvil, identidad arriba, datos e imagen juntos y acción debajo.

El selector muestra las seis opciones con la indicación «Selecciona una alternativa». D es la opción predeterminada. A, B y C mantienen sus estilos y composiciones anteriores; sus alturas comprobadas coinciden con el preview previo. Sus enlaces directos siguen usando `?cabecera=a`, `?cabecera=b` y `?cabecera=c`.

## Comparación y criterio

| Versión | Cabecera a 1440 px | Cabecera a 390 px | Imagen en escritorio / móvil |
|---|---:|---:|---:|
| D | 416 px | 499 px | 300 / 280 px |
| E | 367 px | 320 px | 280 / 140 px |
| F | 214 px | 371 px | 170 / 140 px |

Las alturas excluyen el encabezado y el selector del preview. E ofrece el equilibrio más favorable entre imagen, identidad y facilidad de acceso a la acción, especialmente en móvil. F prioriza llegar antes al contenido siguiente en escritorio. D da mayor protagonismo al edificio en una composición centrada. Son criterios de diseño; no se han medido efectos sobre conversiones.

Se conserva el mismo render aéreo verificado de Pintor Cicarelli I, Maestra, Pintor Cicarelli 288, San Joaquín: brochure página 3, xref 10, original 2378 × 1454 px. Se reutilizan los WebP de 960 y 1800 px. No hay recortes, estiramiento, desenfoque ni material generado con IA. La identificación «Render referencial» permanece visible.

La paleta utiliza exclusivamente las variables del tema aprobado: verde `#003229`, blanco `#FFFFFF`, texto secundario `#4B6059`, borde `#CDD7CF` y dorado `#E9C176` como pequeño acento en E. El título usa Manrope 400, ya disponible. No se añaden animaciones, sombras, frameworks ni dependencias. Se conservan los focos y las reglas compartidas de movimiento reducido. Las ratios de contraste comprobadas del sistema permanecen válidas (verde/blanco 14,11:1; texto secundario/blanco 6,74:1).

## Verificación y alcance

Capturas reales equivalentes en Chrome: 1440 × 900 y 390 × 844, para D, E y F. Verificación adicional de dimensiones a 360 y 681 px: sin desbordamientos ni cortes. El texto del botón puede ocupar dos líneas a 681 px en D y mantiene su área accesible. Menú móvil abierto y cerrado en las tres versiones; botones «Solicitar asesoría» comprobados en las tres, abriendo el flujo existente con «Tu consulta sobre Pintor Cicarelli I». No se envían formularios ni comunicaciones.

HTML, CSS nuevo y JS responden 200 y coinciden con las fuentes; el hosting añade su barra de comentarios del preview. Consola sin errores/advertencias observados y sin logs error/fatal en los 15 minutos consultados. El selector A–F fue comprobado mediante navegación real.

1120 archivos del artefacto publicado permanecen idénticos, incluidas todas las funciones y las demás páginas. Solo cambia el marcado de la cabecera y los controles del preview de esta ficha, con sus estilos y selector exclusivos. Metadatos, datos estructurados, precios, galería, planos, ubicación, calculadora, UF, formularios y navegación permanecen intactos. Se conserva un solo H1. Los estilos de A/B/C no se modificaron; solo se amplió su barra de comparación.

## Versiones y recuperación

- Preview READY: `dpl_2Duncb9L2qN7614d4EMVKoX4DXav`, Vercel Authentication conservada, sin alias de producción.
- Código: `28549082e81354e6f2c18fa0bf96e6802bdfd0ef`.
- Rama independiente: `codex/cicarelli-six-heroes-20261025`; despliegue automático desactivado.
- Main intacta: `86e200ec191b38af355061e21bc0fc1e549cce3b`, `main:false` conservado. Sin merge.
- Producción intacta: `dpl_DAo4ZEDA17geE8cFUn3cbkKCvXF7`, fuentes `5704649e5fe45b4fad1e68b66747e43f20768327`.
- Preview A/B/C anterior conservado: `dpl_9vK2sPCLCEyuArXNARDREUQSR73T`.

Se reutilizó el paquete precompilado exacto, sobreponiendo únicamente los archivos de esta prueba. No se reconstruyeron funciones. El informe histórico de CLI `builds.json`, ajeno al Build Output API, se conserva fuera de la salida del preview. No se necesita rollback porque producción no cambió. No promover ni extender el diseño a otras fichas sin elección y aprobación visual del propietario.

Capturas en `screenshots/`, mediciones en `verification.json` y hashes/alcance en `scope-checks.json`. Las evidencias válidas de A/B/C siguen en `docs/cicarelli-three-heroes-20261025`.
