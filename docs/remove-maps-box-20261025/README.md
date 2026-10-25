# Retiro de los recuadros de Google Maps — 25/10/2026

Se retiraron 120 recuadros «Abrir en Google Maps ↗» de 118 fichas. El catálogo conserva sus 134 proyectos. Permanecen los 120 mapas integrados, las direcciones y comunas, y los 77 enlaces de recorridos externos.

El generador compartido ya no crea alternativas externas para mapas. Ante un error de carga del mapa, el comportamiento compartido retira únicamente el contenedor fallido, sin recrear el recuadro ni dejar un espacio vacío; conserva el texto de ubicación. Los recorridos mantienen sus alternativas y controles de destinos permitidos.

## Publicación y recuperación

- Rama: `codex/remove-project-maps-box-20261025`.
- Commit de implementación: `00241bbc7b0b5351bfe512069c714bced00822e7`.
- Deployment publicado: `dpl_6bdaSLjtvzdMoGeTpgDzWZK6s17R`.
- [Inspección en Vercel](https://vercel.com/lsandoval2-8260s-projects/project-wrapp/6bdaSLjtvzdMoGeTpgDzWZK6s17R).
- Versión anterior conservada: `dpl_uXwF4hPAnqTKeQJXATTswhdEV74R`, estado READY, producción.
- Referencia de fuentes y comprobantes de la versión anterior: `1f27a4d60f5e0448ce5d5e8a47215e4c72a3c9b6`.
- Recuperación oficial disponible: Vercel `request_rollback` con `deploymentId=dpl_uXwF4hPAnqTKeQJXATTswhdEV74R`, `projectId=prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, `teamId=team_A9VNIW2f2K1IJpd2pGdvDmEN`. No se ejecutó un rollback de prueba ni se eliminó ningún deployment.

Se recuperaron y verificaron por SHA-1 los 914 archivos del paquete que estaba publicado. Se reutilizó ese paquete: sólo cambiaron 118 HTML y `assets/js/project-embeds.js`. Los restantes 795 archivos, incluidas las funciones y la configuración de rutas, permanecen idénticos. Se conserva así la portada, el catálogo, imágenes, formularios, agenda, calculadora, SEO y presentación de WhatsApp.

El deployment se creó como producción con `--prebuilt --prod --skip-domain`; el dominio mantuvo la versión anterior durante la revisión. Después se promovió el mismo deployment mediante Vercel. Se mantuvo la protección `all_except_custom_domains`. No hubo merge ni modificación de `main`; `main:false` y la nueva rama desactivada constan en `vercel.json`. No se activaron workflows ni despliegues automáticos.

## Comprobaciones

- `static-validation.json`: revisión de las 134 fichas; cada HTML equivale exactamente al anterior menos el párrafo del recuadro; iframes y contenido ajeno al cambio idénticos; generador idempotente y destinos inseguros rechazados.
- `map-runtime-tests.txt` y `tour-regression-tests.txt`: 10 pruebas pertinentes satisfactorias. Se reutilizaron las evidencias de archivos idénticos; no se volvió a ejecutar toda la batería histórica.
- `browser-validation.json`: Chrome real, cuatro proyectos en escritorio (1440 × 900) y móvil (390 × 844): INN Puerto Chico, FerroParque, Terratoltén y Edificio Índigo. Sin recuadros ni desbordamiento horizontal; mapas y direcciones visibles. Se comprobó la expansión de etapa 2 de FerroParque, la vuelta al catálogo, el filtro (134 → 1 proyecto) y la galería de Índigo (3 imágenes cargadas).
- `candidate-http.json`: HTTP 200 y bytes exactos en el candidato protegido; UF vigente disponible mediante GET.
- `public-http.json`: comprobaciones GET en el dominio público, con hashes comparados contra el candidato y ausencia del recuadro en todas las fichas.
- `release-receipt.json`: alias final, protección, comprobación de `main`, UF y ventana de logs.
- Capturas: `candidate-desktop.jpg`, `candidate-mobile.jpg`, `published-desktop.jpg`, `published-mobile.jpg`.

No se enviaron formularios, correos ni reservas. Los controles propios dentro del mapa de Google se conservan como parte del mapa integrado; el elemento retirado es el recuadro externo de Sollahms.
