# Norte Verde — integración aislada de encabezados

El usuario autorizó el merge el 14 de octubre de 2026. La integración parte de `main` (`f1e9bf1715cc99d095a367eba9028a9a1ad2b026`) en la rama `codex/norte-verde-hero-merge`. Excluye las actualizaciones anteriores de Ecasa, Leben y cartera Norte Verde heredadas por la rama visual.

Se integran A (fusión lateral), B (transición envolvente) y C (fotografía contenida), con texto sobre `#003229`. Escritorio/tablet usan una transición lateral; móvil coloca la fotografía arriba, un degradado vertical y el texto sobre verde sólido debajo.

[Preview visual protegido](https://project-wrapp-dbb3wbcu2-lsandoval2-8260s-projects.vercel.app/assets/review/norte-verde-hero-variantes.html). Ese despliegue corresponde al commit visual `1deacd5`, con la cartera documental revisada en su rama previa. [Informe visual y evidencias originales](https://github.com/lasopho/sollahms-web/blob/codex/norte-verde-hero-variantes/docs/norte-verde-encabezados-variantes.md).

**Recomendación:** A como base; C para fotografías verticales o encuadres difíciles. B da más profundidad pero oscurece detalles inferiores.

La versión aislada admite fotografías sin atributos de dimensiones: obtiene su proporción real al cargar la imagen. Su comparador utiliza Bordevivo, Vicuña Mackenna 6896, Quintavista y Playa Serena, que conservan fotografías en el `main` actual. Verne no tiene fotografía en esa versión; su ficha y el resto del contenido permanecen intactos. La torre completa de Verne puede evaluarse en el Preview visual original.

La compilación activa el prototipo únicamente con `VERCEL_ENV=preview` y la referencia `codex/norte-verde-hero-merge`. Se selecciona mediante `?encabezado=lateral`, `envolvente` o `contenida`; sin parámetro continúa el encabezado actual. Las demás compilaciones excluyen los tres recursos del prototipo y conservan la salida anterior.

## Verificación antes del merge

- 240 controles Node aprobados en un checkout limpio.
- 74 pruebas Python aprobadas tras adaptar la comprobación histórica para reconocer únicamente los cuatro cambios exactos de empaquetado. Los hashes anteriores de recursos siguen comprobándose.
- 42 vistas de fichas/variantes/tamaños y 144 estados del comparador sobre el contenido de `main`: 2467 comprobaciones, cero fallos. La prueba usa un manifiesto operacional privado derivado del HTML existente para comprobar títulos, fotografías, galerías y ausencia de modelos añadidos.
- Compilación local habitual: los 1129 archivos coinciden byte por byte con la salida del `main` anterior, incluida la misma lista de archivos. Fue una compilación offline, sin despliegue.
- Compilación local de revisión: conserva 1112 archivos anteriores; las 17 fichas Norte Verde restantes recuperan exactamente el HTML previo al retirar las dos etiquetas de carga y la clase `nv-hero`. Se añaden únicamente los tres recursos del prototipo.
- Todos los HTML fuente, datos, galerías, planos, imágenes, precios y textos comerciales de `main` permanecen idénticos. `vercel.json` permanece idéntico y conserva `main: false` para despliegues automáticos.

Las capturas automatizadas usan fuentes de reserva al aislar servicios externos. Las declaraciones Manrope/Inter permanecen intactas. No se enviaron formularios, mensajes ni reservas.

La evidencia local de integración se guarda en [norte-verde-hero-merge-evidencias](norte-verde-hero-merge-evidencias/). El commit funcional es `77f153e`; el commit posterior añade este informe y evidencias. La confirmación del merge figura en el PR asociado.

No se autoriza ni ejecuta un despliegue a Production como parte del merge.
