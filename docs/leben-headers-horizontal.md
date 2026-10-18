# Encabezados compartidos Leben

> Conteos históricos: las cifras de catálogo de 148/144/137 de este documento corresponden a su etapa de revisión. El [registro vigente de 134 fichas](registro-vigente.md), fijado al commit fuente, define el inventario actual. Se conserva íntegra la evidencia y el alcance original.

Alcance confirmado en el inventario vigente:14 fichas, incluidos Own y Nórdico; Parque Germania permanece único. El catálogo conserva137 proyectos y15Ecasa, con portadas y valores comerciales intactos.

El componente scripts/leben_header.py y la configuración data/leben-headers.json generan un único sistema visual con assets/css/leben-project-hero.css. Escritorio/tablet: verde #003229 detrás del texto, degradado horizontal continuo y fotografía a la derecha. El ancho de la fotografía se limita a la proporción original en un marco de600px de altura; su borde real se enmascara para fundirlo con el verde. Móvil: fotografía en proporción completa, transición vertical progresiva y texto sobre verde sólido.

La configuración permite seleccionar sólo imágenes acreditadas del mismo proyecto y ajustar puntos focales/intensidad/transición por ficha. La validación exige las14 identidades Leben y coteja los archivos con los hashes y dimensiones aprobados. El catálogo y el manifiesto de los12 PDF/43 medios no se editan. El JPEG original de Indi2113×1335 permanece intacto; la casona sigue en su galería.

La regeneración se integra tanto en las fichas genéricas como en Suecia/INN, y materializa Own/Nórdico aunque no tengan brochure. Los bloques Preview/Public conservan el fallback histórico exacto. La hoja nueva y el material privado se habilitan únicamente en la Preview protegida; no se otorga publicación pública del lote. Las garantías de no-deploy automático de main y de rechazo del paquete protegido en Production permanecen vigentes.

Limitaciones visuales: Mood dispone de imágenes interiores aprobadas, sin fachada acreditada entre los recursos disponibles. Se conserva su interior actual, identificado explícitamente. En tablet las panorámicas reciben focos particulares y puede quedar fuera parte de los laterales. Algunos originales de menor resolución no cubren DPR2 a600px de altura; se registra la densidad efectiva sin ampliar ni recomprimir el archivo. En móvil, todos los originales cubren los tamaños y DPR ensayados.

Pruebas:317Node y137Python;84vistas antes y84después en1440/768/390px,DPR1/2. Se cotejan textos, enlaces, galerías, tablas, iframes y portadas contra el baseline f369f36. El validador de las137 rutas comprueba3503 enlaces internos y143URLs del sitemap. Los12 complementos y22 superficies documentales se conservan.

El usuario autorizó posteriormente el merge a main, manteniendo la restricción de no modificar Production. La Preview final se verifica antes de realizar ese merge. No se promueve ni despliega Production.

La integración conserva el merge concurrente de Norte Verde 61884b0: sus recursos y sus cuatro inserciones de empaquetado permanecen exactos y se activan sólo en su rama de revisión. La Preview Leben mantiene sus 14 encabezados y excluye los tres recursos de ese prototipo. Todas las ramas de revisión, además de main, conservan el despliegue automático desactivado.

También se conserva íntegramente la integración concurrente Sento f72bd9e: siete fichas y sus objetos comerciales, 277 medios y seis PDF verificados. Los 40 candidatos no seleccionados quedan fuera del paquete. El conjunto mantiene 137 proyectos y 15 Ecasa; las 14 fichas Leben compiladas son idénticas a la Preview 005f7da. El paquete conjunto es exclusivamente de Preview y comprueba el rechazo de Production, sin fabricar un fallback Sento. La suite de Git incorpora los ocho casos Sento (325 casos Node) y conserva 137 fixtures Python.
