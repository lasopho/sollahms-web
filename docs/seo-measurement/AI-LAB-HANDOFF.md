# Coordinación con Sollahms AI Lab

La revisión inicial de la auditoría miró main del Lab, que contenía solo README y configuración. Esta fase recuperó la rama `work` en `3435668fb6a1bb393f34665288e76fe23676bdb0` y el [PR borrador #1](https://github.com/lasopho/sollahms-ai-lab/pull/1). Allí ya existe generación y revisión editorial, deduplicación, estado SQLite y exportaciones; sus métricas locales no son métricas SEO externas. El PR declara 104 pruebas y cero llamadas API reales: es antecedente del Lab, no validación ejecutada por esta fase.

La guía `docs/PHASE2_GUIDE.md` y `sollahms_ai_lab/editorial_spec.py` se consultaron para no crear un segundo flujo editorial. El generador trabaja sobre paquetes internos y su aprobación no habilita publicación. El primer paquete de compra en verde existe; no crear otro artículo con el mismo propósito que ese paquete o que `cuando-comprar-propiedad.html` sin revisar el inventario editorial privado.

## Reparto de responsabilidades

| Actividad | Responsable del registro |
|---|---|
| Importar GSC/Bing, comparar periodos y conservar evidencia | Sollahms Web, `docs/seo-measurement` |
| Observar respuestas reales de buscadores/IA | Protocolo de medición; nunca datos sintéticos del Lab |
| Preparar/revisar redacción y fuentes de oportunidades aceptadas | Flujo editorial existente del Lab |
| Validar hechos de cada proyecto, stock y condiciones actuales | Responsable comercial, contra sus antecedentes |
| Aprobar una intervención/publicación | Propietario; esta fase no concede autorización |

## Entrega preparada

`runs/2026-11-08-phase2/ai-lab-handoff.json` contiene ocho oportunidades sobre URL existentes, evidencia, título/meta propuestos, límites y campos de rendimiento nulos. Es un **contrato de traspaso de oportunidades**, no un spec nativo de generación ni una importación ejecutada. No se llamó al Lab ni se crearon borradores en su base privada.

Para cada oportunidad, el operador del Lab debe:

1. Comprobar el último avance de `work` y buscar paquetes existentes por URL/intención antes de crear trabajo.
2. Reutilizar la revisión/paquete existente cuando corresponda; conservar ID/versión y opportunity_id en el registro de traspaso de Web.
3. Registrar hechos propios con derechos confirmados y referencias revisadas. No convertir `verified_on` en una verificación automática ni fechas comerciales de octubre en stock actual.
4. Proponer edición de la página existente, no un artículo duplicado ni páginas por comuna. No copiar las propuestas directamente a producción.
5. Devolver ID del paquete, versión, revisión humana, fuentes pendientes y estado de aprobación interna. Mantener `publication_allowed=false`.
6. Después de una futura publicación autorizada, registrar fecha, URL y cambios para comparar ventanas equivalentes; no atribuir causalidad a una sola variación de CTR.

No se modificó el repositorio del Lab, su presupuesto, sus modelos, su cola, la API ni sus controles de coste. No se emitieron mensajes/comentarios en su PR. Esto evita consumo o generación duplicados y deja el trabajo coordinable sin depender de una sesión compartida.
