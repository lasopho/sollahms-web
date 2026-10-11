# Integración financiera Sollahms — revisión independiente

Rama: `codex/integracion-financiera-sollahms`. Checkout: `/private/tmp/sollahms-integracion-financiera`.

## Orígenes y resolución de conflictos

Se inspeccionaron los commits, diferencias y documentos de ambas ramas antes de editar. Base común: main `69eb89524d38071a5b5df6a032e105f0aa958d87`. Fichas: `bd42519dd4a1997af6c5b24dfcf67f1622197110`. Comparador: `fb018398a28949a028c807d9a809f16d37aa0fde`. La integración conserva ambos historiales mediante un commit de dos padres únicamente en esta nueva rama.

| Archivo compartido | Resolución |
|---|---|
| index, agenda, contacto | Versión de fichas íntegra: navegación aprobada, contexto148, RUT opcional, protección Preview. Los cambios del comparador en estas páginas eran entrada Hipotecario/CSS de navegación antiguos, sustituidos por CTAs de fichas y buscador opcional. |
| proyectos | Navegación, fotos, tarjetas y filtros de fichas conservados; buscador financiero añadido como función opcional. |
| api/contact | Composición: contrato genérico/RUT y contexto148 de fichas, consentimiento y recálculo hipotecario/validación de origen/aceptación de proveedor del comparador. Preview bloquea todos los envíos. |
| privacidad | Tratamiento existente RUT conservado; búsqueda local y transferencia temporal anónima documentadas; envío consentido del escenario. |
| sitemap | Todos los153 destinos de fichas más comparador, sin duplicados. |
| .gitignore | Unión, con .env.example sin credenciales permitido. |
| docs/qa/movil.jpg | Prueba de fichas conservada; captura histórica del comparador guardada como hipotecario-movil.jpg y enlace corregido. |

## Implementación

148 CTAs “Simular crédito hipotecario” enlazan por slug. Nombre y precio desde se consultan en el catálogo y se contrastan en el servidor.115 precios tienen procedencia vigente para el10/10;33 quedan sin precarga. Revisión interna de precios: máximo30 días, sin fechas futuras. No equivale a cotización de una unidad.

El buscador conserva filtros/ordenamientos, aplica criterios configurables25%/30%, deudas, renta complementada, pie5–90%, plazo5–40 años, ahorrosUF/CLP y horizonte0–600 meses. Reutiliza el motor original. A/B/C/D/E separan ahorro y presupuesto mensual; no son aprobación ni probabilidad. Sin tasa o UF del día la evaluación queda pendiente. Seguros/gastos desconocidos no se convierten en cero.

Renta/deudas/ahorro permanecen sólo en memoria del navegador. La transición explícita guarda sólo slug/monto/pie/plazo/tasa/convención/origen durante5 minutos, consume y elimina el registro al abrir el simulador. No lleva datos de identidad o capacidad. Backend deriva asunto/nombre y recalcula. RUT se valida en infraestructura propia y se excluye de Resend.

Referencias CMF se usan sólo con escenario y vigencia exactos; cambiarlo retira la tasa. Ubicación y tipo de activo del proyecto se contrastan también en servidor. Vivienda CMF no se atribuye a oficinas, locales o terrenos.

Fuentes y contraste independiente: [documento financiero](integracion-fuentes-financieras-2026-10-10.md). Estado comercial, mapas y recorridos permanecen en [registro existente](registro-fichas-proyectos.md).

## Validación en curso

Suites de ambas ramas y nuevas reglas pasan. Revisión estructural148 y QA local con proveedores simulados en `tests/qa-preview-server.mjs`. La evidencia final de navegador y Preview se registrará en `docs/integracion-financiera-verificacion.md`. Nunca se han autorizado correos o reservas reales en esta integración.

No se modifica main, Production ni las ramas de origen. No se contratan servicios ni se descargan de nuevo fotografías.
