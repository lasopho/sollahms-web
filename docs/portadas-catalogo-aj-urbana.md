# Portadas del catálogo AJ Urbana — revisión protegida

Actualización contractual del 10/10/2026: la procedencia Yapo/IRIS y la ausencia de licencia individual adicional para material cubierto sustituyen el criterio anterior. Consultar el estado y los controles actuales en [Preparación de publicación Yapo/IRIS](brochures-yapo-iris-publicacion.md).

Fecha: 2026-10-10. Rama: `codex/integracion-financiera-sollahms`.

El catálogo utiliza `imagenPrincipal` e `imagenAlt` del JSON público. Las imágenes de las galerías AJ no estaban asignadas como portadas del catálogo. El empaquetador ahora asigna las cinco portadas únicamente en `dist/data/proyectos.json` cuando `VERCEL_ENV=preview`; el catálogo fuente conserva sus bytes y todos los campos comerciales y financieros originales.

| Proyecto | Portada reutilizada | Archivo dentro de `assets/propiedades/aj-urbana-preview/` | Resolución | Página del brochure |
| --- | --- | --- | --- | ---: |
| Downtown San Martín | Living y cocina integrada | `downtown-san-martin/downtown-san-martin_pagina_05_candidato.jpeg` | 3758×2251 | 5 |
| Edificio Teatinos 750 | Fachada | `edificio-teatinos-750/edificio-teatinos-750_pagina_05_candidato.jpeg` | 1600×2000 | 5 |
| Edificio Vista Amunátegui | Fachada | `edificio-vista-amunategui/edificio-vista-amunategui_pagina_01_candidato.jpeg` | 1707×2000 | 1 |
| Monjitas 690 | Patio interior | `monjitas-690/monjitas-690_pagina_13_candidato.jpeg` | 1758×1082 | 13 |
| Vista Morandé | Fachada | `vista-morande/vista-morande_pagina_01_candidato.jpeg` | 1600×2000 | 1 |

Son renders ilustrativos ya integrados y verificados en las fichas. No se generaron, descargaron, editaron ni duplicaron imágenes. Las fachadas conservan el recorte existente de las tarjetas; Downtown y Monjitas utilizan encuadres horizontales representativos. Cada texto alternativo identifica el proyecto y el carácter ilustrativo de la imagen.

## Derechos y alcance

- Se conserva la autorización de revisión protegida y el pendiente de licencia de difusión pública.
- El build comprueba que cada portada pertenezca a la galería de su propio proyecto, coincida con su SHA-256 y esté referenciada en su ficha. Una portada cruzada o alterada detiene el build.
- Production y un entorno sin especificar conservan exactamente el catálogo original; excluyen las imágenes, planos y secciones AJ. El manifiesto privado no se sirve como JSON público.
- No cambian `proyectos.html`, las cinco fichas, las otras 143 fichas, las galerías, los 78 planos, los 531 assets históricos, los filtros, las APIs ni los motores financieros. El catálogo conserva 148 proyectos.

## Validación

- 174/174 pruebas automatizadas aprobadas, sin fallos ni omisiones. La fixture del empaquetador verifica los cinco cambios de portada y los otros 143 objetos completos sin cambios; comprueba también Production, entorno ausente, rama no autorizada y rechazo de imágenes cruzadas o alteradas.
- Catálogo local verificado a 1280×900, 820×1100 y 390×844: cinco imágenes cargadas, cero placeholders en AJ y ningún desbordamiento horizontal.
- Enlace de tarjeta a ficha comprobado; las galerías y planos permanecen intactos.

Preview de la rama: [catálogo protegido](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/proyectos.html). La entrega identifica el commit exacto y su nueva URL inmutable de Vercel tras verificar el despliegue.
