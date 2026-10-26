# Recorrido de las fichas — 26/10/2026

Base: producción `dpl_7aP9NvcJ6iSJMeRvSFDddSxSjCbb`, código `489713312f017c6392ae748918190251caee2242`; fuentes y evidencia `a8e9a1ca875be024dd660d903e702037bd81cb5b`. Rama `codex/project-journey-20261026`. No modificar main ni activar despliegues Git.

## Organización compartida

`scripts/project_journey.py` se aplica desde `scripts/project_header_b.py`, también en los generadores Sento y León. Conserva el encabezado B y sus imágenes. Ordena resumen verificado, galería/planos, detalles, equipamiento, ubicación y contacto. Las galerías extensas muestran tres recursos iniciales y un desplegable; las condiciones comerciales no se ocultan de nuevo. No crea secciones sin material ni altera datos comerciales.

`assets/css/project-journey.css` sólo afecta las fichas marcadas. Mantiene colores y efectos existentes. La navegación interior usa la altura real del encabezado. La acción principal permanece en el encabezado; se evita una barra inferior que pueda tapar consentimiento o teclado. No se añaden movimientos ni cambios en la intensidad del desvanecimiento.

## Contacto

`templates/project-contact.html` y `assets/js/project-request.mjs` reutilizan `/api/advisory`, su consentimiento, canal autorizado e idempotencia. Cotización: nombre y correo o teléfono elegido. Llamada: nombre y teléfono; horario opcional, sólo preferencia. Objetivo y mensaje son opcionales. La identidad y la URL canónica, incluida la etapa comercial seleccionada, se resuelven desde el catálogo y se incorporan al contrato existente. El servidor valida los identificadores con su registro vigente.

La confirmación significa aceptación por el proveedor, no entrega al buzón, disponibilidad ni reserva. Se conservan campos tras errores; los reintentos inciertos mantienen su clave y bloquean cambios de solicitud. No se activan CRM, remitentes ni servicios. Sin JavaScript el contenido permanece visible y el formulario ofrece el contacto existente sin intentar un envío inseguro.

## Verificación

`scripts/verify-project-journey.py` compara las 132 fichas con la base, incluidos metadatos, imágenes, planos, mapas, anclas, UF y superficies; verifica que las otras siete páginas y los componentes compartidos protegidos no cambien. `tests/project-request.test.mjs` comprueba todas las identidades y etapas, campos mínimos, validación, resultados inciertos e idempotencia con transporte inyectado sin red.

El preview de QA usa exclusivamente un handler sintético sin acceso al proveedor. Ese handler no forma parte del artefacto de producción. La publicación conserva todos los 41 archivos de funciones/configuración/rutas anteriores y reutiliza los recursos no modificados por hash. La referencia de rollback es el deployment indicado arriba.
