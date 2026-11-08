# Contacto comercial — 8 noviembre 2026

- Número visible: +56 9 4850 2440. Destino: https://wa.me/56948502440.
- 141 páginas con enlace estático en el pie; 134 fichas con nombre tomado del catálogo.
- El enlace telefónico de contacto abre WhatsApp. Sin cambios en teléfonos de terceros.
- Organización de portada y contacto con teléfono y enlace oficial en datos estructurados.
- El empaquetador aplica la misma configuración a páginas regeneradas.
- Formularios, scripts ejecutables, API y CRM conservados.
- Rama de trabajo con despliegue automático desactivado; sin publicación ni merge.

## Validaciones

`node --test tests/commercial-contact.test.mjs`: 2 pruebas aprobadas, auditoría de 141 páginas y 134 fichas; números, nombres, JSON-LD, codificación, idempotencia y preservación de terceros.

Comparación contra HEAD: formularios y scripts ejecutables conservados en las 141 páginas. `node --check` de ambos módulos modificados y `git diff --check` aprobados.

Navegador de escritorio: página de contacto y ficha Abdón Cifuentes; enlaces con mensaje correcto, número y contexto. No se enviaron mensajes ni formularios.

## Pendientes concretos antes de publicación

La compilación `VERCEL_ENV=preview node scripts/package-vercel.mjs` falla por un recurso previo ausente: `assets/brochures/sento/curico-77.pdf` (ENOENT en verifySentoAssets). No se han relajado los controles de publicación. Restaurar el material autorizado y repetir la compilación.

La revisión en un viewport móvil y la apertura final en la aplicación WhatsApp de un teléfono siguen pendientes. Los enlaces son anchors HTTPS estáticos y funcionan sin JavaScript; esto no sustituye la validación en dispositivo.
