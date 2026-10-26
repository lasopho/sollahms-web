# Pintor Cicarelli I — tres cabeceras para revisión visual

Preview funcional, no publicado en Sollahms.cl. Fecha local de trabajo: 25/10/2026 (UTC 26/10).

Comparador: https://project-wrapp-8wj1r5cvc-lsandoval2-8260s-projects.vercel.app/pintor-cicarelli-i.html?cabecera=a

Las opciones A, B y C de la barra de comparación cambian entre composiciones reales de la misma ficha. Cada opción también tiene enlace directo con `?cabecera=a`, `?cabecera=b` o `?cabecera=c`. La barra pertenece únicamente a esta prueba; debe retirarse al preparar una futura publicación aprobada.

## Diferencias

| Alternativa | Composición | Altura en escritorio 1440 px | Altura en móvil 390 px |
|---|---|---:|---:|
| A — Editorial clara | Texto a la izquierda, imagen de 360 px a la derecha, blanco y acento dorado discreto | 356 px | 509 px |
| B — Verde contenido | Imagen de 360 px a la izquierda y panel verde de dimensiones limitadas, rodeado de fondo claro | 335 px | 559 px |
| C — Cabecera compacta | Franja de identidad; debajo imagen de 190 px, datos y acción. En móvil, imagen de 150 px junto a los datos | 298 px | 366 px |

Las alturas excluyen la navegación y la barra de comparación. El título usa Manrope 400, ya cargada por la ficha, frente al peso 800 anterior. No hay efectos decorativos, sombras nuevas ni degradados. El flujo de lectura agrupa identidad, ubicación y datos; el botón «Solicitar asesoría» conserva el flujo existente y el contexto del proyecto.

Recomiendo A por la jerarquía de lectura, la superficie clara y el equilibrio entre edificio e información. C es preferible si se prioriza ver antes el contenido siguiente. B conserva la mayor presencia del verde. Son criterios de diseño y observación visual: no se han medido conversiones ni preferencias de visitantes y no se atribuyen efectos comerciales a la neurociencia.

## Material y paleta

Identidad comprobada: Maestra, Pintor Cicarelli I, Pintor Cicarelli 288, San Joaquín. La página 3 del brochure identifica expresamente el proyecto y la dirección. Se conserva el mismo render aéreo en A, B y C: original 2378 × 1454 px, xref 10; WebP existentes de 960 y 1800 px. No se recorta, estira, desenfoca ni genera material con IA. «Render referencial» permanece visible. Galería y planos intactos.

Paleta tomada del tema vigente: verde `#003229`, blanco `#FFFFFF`, superficie clara `#F5F7F3`, texto secundario `#4B6059`, borde `#CDD7CF`, dorado `#E9C176` y texto sobre verde `#EEF3EE`. Se usan sus variables compartidas. El dorado claro se limita a un pequeño acento en A y al rótulo Maestra sobre verde en B; no se usa como texto sobre blanco.

## Verificación

- Capturas equivalentes en Chrome: 1440 × 900 y 390 × 844, las tres versiones. Medición adicional a 360 y 768 px, sin desbordamiento horizontal. Imagen completa, proporciones conservadas, texto y acción visibles; botón de 48 px de alto.
- Se probaron los enlaces A/B/C, los tres menús móviles y el botón de cada versión. Todos abren `/agenda-asesoria.html?proyecto=pintor-cicarelli-i` y muestran «Tu consulta sobre Pintor Cicarelli I». No se completó ni envió ningún formulario.
- Foco de teclado comprobado. Movimiento reducido conservado en el tema compartido; no se incorporan animaciones.
- HTML, CSS y JS responden 200 y coinciden con los archivos preparados. Vercel añade únicamente su barra de comentarios a la respuesta HTML del preview. Sin errores ni advertencias de consola observados; sin logs error/fatal del preview en la ventana consultada de 15 minutos.
- El resto del HTML y los metadatos originales son idénticos, salvo las inclusiones CSS/JS y los controles propios de la prueba. Se conserva un solo H1. Precios, galería, planos, mapa, calculadora, UF, navegación, funciones y otras páginas mantienen sus archivos exactos.
- 1120 archivos de la salida anterior permanecen idénticos. Solo cambia esta ficha y se añaden un CSS y un JS exclusivos. No hay frameworks ni dependencias nuevas.

## Versiones y recuperación

- Código del preview: `f438e5115142f549322ec0a0fed0ca582d9ed832`.
- Rama: `codex/cicarelli-three-heroes-20261025`.
- Deployment final: `dpl_9vK2sPCLCEyuArXNARDREUQSR73T`, READY, preview, Vercel Authentication conservada y sin alias de producción.
- Base publicada exacta: `5704649e5fe45b4fad1e68b66747e43f20768327`; deployment `dpl_DAo4ZEDA17geE8cFUn3cbkKCvXF7`.
- Sollahms.cl sigue apuntando a esa base; su ficha pública coincide byte por byte con las fuentes recuperadas.
- Main permanece en `86e200ec191b38af355061e21bc0fc1e549cce3b`. `main:false` y despliegues automáticos desactivados para esta rama. Sin merge.

Se reutiliza el artefacto precompilado exacto de producción y se sobreponen únicamente los tres archivos de esta prueba. El informe histórico `builds.json`, que no forma parte del Build Output API, se conserva fuera del nuevo paquete; funciones y configuraciones permanecen idénticas. La producción y el preview previo permanecen recuperables. No se necesita rollback porque producción no cambió. Cualquier publicación o extensión a otras fichas requiere la elección y aprobación visual del propietario.

Capturas en `screenshots/`, mediciones en `verification.json` y comprobación del alcance en `scope-checks.json`.
