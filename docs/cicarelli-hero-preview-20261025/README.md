# Prueba de cabecera: Pintor Cicarelli I

Preview para revisión visual, sin publicación en Sollahms.cl.

- Ficha verificada: Maestra, Pintor Cicarelli I, Pintor Cicarelli 288, San Joaquín.
- Preview: https://project-wrapp-r1qr0ptna-lsandoval2-8260s-projects.vercel.app/pintor-cicarelli-i.html
- Deployment: `dpl_2EWhbukC2mnEkq5vvt9qbtBYgsa3`, READY, entorno preview, protección Vercel Authentication conservada. Acceso comprobado en la sesión del propietario.
- Código: `faad9785693069b3537c3e44af2420a5cea07cbe`, rama `codex/cicarelli-hero-preview-20261025`.
- Base exacta: `5704649e5fe45b4fad1e68b66747e43f20768327`. Producción permanece en `dpl_DAo4ZEDA17geE8cFUn3cbkKCvXF7`; no se movió ningún alias.
- `main` permanece en `86e200ec191b38af355061e21bc0fc1e549cce3b`. Despliegues automáticos desactivados para main y esta rama.

## Diseño y material

Verde sólido aprobado `#003229` (`--s-green`). Imagen a la izquierda y contenido a la derecha, con una transición que ocupa solamente el 12 % del borde derecho de la imagen. El edificio queda fuera de esa transición. La cabecera baja de 580 a 360 px en escritorio; la imagen pasa de 1425 px de ancho a 426 px en la revisión a 1440 px. En móvil se apila la imagen (máximo 320 px) sobre el texto.

Se conserva el render aéreo identificado en la página 3 del brochure de Pintor Cicarelli I, original 2378 × 1454 px, xref 10. La página indica explícitamente nombre, comuna y dirección 288. Se comparó con el render nocturno de página 2 (2000 × 1500 px) y las fotografías anteriores (822 × 599 px). El render aéreo permite reconocer el edificio completo y cuenta con mayor resolución. Se reutilizan los WebP existentes de 960 y 1800 px, suficientes para esta presentación; no se modifica ningún recurso de galería. No hay generación con IA, desenfoque, estiramiento ni recorte. Se añade el rótulo visible «Render referencial · Brochure Maestra».

## Alcance y comprobaciones

La ficha cambia exclusivamente en el marcado de la cabecera y un enlace a una hoja de estilos exclusiva, cargada antes del tema compartido. El resto del HTML, SEO, datos estructurados y scripts permanece idéntico. No cambian fotografías, galería, planos, precios, mapa, calculadora, formularios ni las demás páginas.

Se copia el artefacto exacto de producción y se sobreponen solo la ficha y el nuevo CSS. 1120 archivos permanecen idénticos, incluidas todas las funciones y sus configuraciones sin variables incrustadas. El informe histórico `builds.json`, ajeno al Build Output API, se conserva fuera del nuevo paquete; no se afirma haber reconstruido las funciones. El paquete se despliega manualmente al entorno preview, sin `--prod` ni promoción. El primer comando con `--skip-domain` fue rechazado antes de desplegar, porque esa opción solo corresponde a producción; se retiró esa opción y se conservó el destino preview.

Revisión real en Chrome: escritorio 1440 px, tableta 768 px, móviles 390 y 360 px. Sin desbordamiento horizontal de página ni cortes en imagen o textos. Menú móvil abierto/cerrado, navegación al catálogo, ancla de planos y cuatro planos cargados. Foco de teclado visible. Contraste sobre verde: blanco 14,11:1, texto claro 12,56:1, dorado 8,30:1. No se añaden animaciones; siguen vigentes las reglas compartidas de movimiento reducido. No se envían formularios ni reservas.

HTML y CSS responden 200. El HTML coincide con el archivo preparado más la barra de comentarios que Vercel añade a los previews; el CSS es idéntico. Consola sin errores/advertencias observados. Logs error/fatal del preview sin registros en los 15 minutos revisados. Las evidencias previas de componentes idénticos se conservan en `docs/maestra-brochures-20261025`.

## Capturas y recuperación

- `screenshots/ci-before-desktop.jpg`
- `screenshots/ci-before-mobile.jpg`
- `screenshots/ci-after-desktop.jpg`
- `screenshots/ci-after-mobile.jpg`

Los detalles comprobados están en `verification.json` y `scope-checks.json`. La producción anterior permanece activa; no necesita rollback. Para descartar la prueba basta con conservar la versión pública y no promover este preview. Cualquier publicación o extensión a otras fichas requiere la aprobación visual del propietario.
