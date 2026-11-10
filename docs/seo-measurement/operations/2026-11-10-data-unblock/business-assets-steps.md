# Negocio y activos: acciones mínimas del propietario

## Negocio: confirmar operación antes de pedir datos

Se reutilizó el inventario del commit `5282c2ea248a4d14da1ca692031560d9af0f4818`, sin nueva auditoría de código, DNS o Analytics. La búsqueda de herramientas disponibles no encontró un conector de CRM/reportes capaz de leer agregados. Por tanto, **no hay una fuente operativa de atribución agregada acreditada con el acceso actual**; no se afirma que el CRM no exista.

Lo ya acreditado es preparación técnica: handlers/Resend, contratos CRM y UTM/página remitente en una rama histórica. Una comprobación nueva y acotada del selector no secreto `CONTACT_DELIVERY_MODE` en la configuración de producción del proyecto devolvió `resend` el 10/11. Esto acredita el receptor configurado del proyecto, no el runtime congelado, entrega efectiva, existencia de informes ni operación de otro CRM. No se leyeron claves ni registros personales. [Comprobación de modo](sources/commercial-mode-current.json). Observability cuenta HTTP y no une tráfico con negocio. No se repitió la auditoría general.

El propietario o administrador de operaciones debe completar, en orden:

1. **Identificar el sistema que recibe hoy los formularios.** Indicar nombre del CRM/proveedor, instancia y entorno, sin credenciales ni URL con tokens. En su panel existente, leer el estado de la integración receptora. Entregar una captura recortada del estado activo/última recepción exitosa si el panel la muestra, sin lista de contactos, payloads, nombres o direcciones. No enviar un formulario de prueba. Si no tiene ese panel, el responsable técnico puede confirmar mediante metadatos operativos de solo lectura, sin leer logs de leads.
2. **Abrir un informe ya existente que agregue los datos en origen.** El menú concreto depende del CRM todavía no identificado; usar sus informes/reportes actuales o solicitar al administrador un agregado de solo lectura. No descargar filas de personas para anonimizarlas después. Anotar periodo completo realmente disponible, zona nativa, sistema y fecha de extracción; separar producción de pruebas y colaboración de compradores.
3. **Revisar los campos que ya existen.** Distinguir primera landing de página remitente/de envío. Comprobar si el informe conserva source/medium, UTM y vínculo con la etapa comercial. Un `Referer` interno o `origen=simulador` no establece primera entrada ni origen orgánico. Si un campo no se conserva, dejarlo vacío y declarar `not_collected` o `unknown`; no reconstruirlo desde HTTP ni repartir totales.
4. **Exportar únicamente el agregado.** Limitar la página a las 11 URL de `corporate-education-v2`, sin fichas individuales. Si el informe no puede acreditar ese filtro, guardar el total aparte como `general_no_filtrada` y no rellenar la plantilla del segmento con él. Usar URL canónica sin query/fragmentos; UTM solo con etiquetas de campañas públicas, sin valores que contengan información personal.
5. **Entregar `business-aggregate.csv` y `business-provenance.json`.** Conservar el CSV nativo agregado si existe; el segundo fichero explica sistema/entorno, periodo/zona/filtros, qué campos no están disponibles, definición de etapas, deduplicación y modelo de atribución. La plantilla `business-aggregate-template.csv` ofrece un formato de recepción estructurado, no afirma que un importador histórico lo acepte directamente. Se mapeará contra el original antes de calcular.

### Cómo completar la plantilla de negocio

Una fila = fecha nativa × página acreditada × dimensiones de adquisición que realmente existan × **una etapa**. `page_dimension` debe ser `first_landing` o `submission_page`, conforme al campo original; nunca intercambiarlos. `stage` admite `form_submitted`, `provider_accepted`, `durably_persisted`, `qualified_contact`, `reservation_confirmed` o `commercial_conversion_confirmed`, únicamente cuando el sistema use esa definición. Añadir `whatsapp_click` solo si ya existe un contador. La plantilla está vacía: no contiene resultados ni ceros supuestos.

- `count`: entero agregado del origen solo con `metric_status=observed`; si no se mide, celda vacía con `unknown`, `not_collected` o `unavailable`. Un cero explícito requiere cobertura acreditada del origen.
- `date_basis`: `event_date` o `cohort_entry_date`, según el informe; las etapas ocurridas el mismo día no forman necesariamente la misma cohorte. No calcular tasas de embudo mezclando esas bases.
- `deduplication_definition`: explicar cómo el sistema evita repeticiones en cada etapa, sin exportar claves/personas. `attribution_model`: conservar la definición existente; desconocido queda vacío y explicado.
- Diferenciar aceptación del proveedor, persistencia durable, contacto cualificado y reserva/conversión. Un correo aceptado no acredita entrega, calidad ni venta. No sumar etapas como si fueran personas distintas.

**Pieza mínima para unir tráfico y negocio:** un informe agregado existente que conserve la relación entre adquisición/página de entrada y etapa comercial, con definición de atribución y deduplicación. Si ambos campos están almacenados pero falta el reporte, solicitarlo al administrador como lectura agregada. Si nunca se almacenó la adquisición o su vínculo con la solicitud, no hay unión histórica acreditada: documentar esa ausencia de campo/vínculo como requisito de una tarea futura, sin implementar tracking ahora.

## Activos: completar una fila por perfil ya existente

El dominio propio está acreditado en el expediente anterior. **Ningún perfil corporativo externo tiene control confirmado en la evidencia recuperada.** La plantilla `corporate-assets-confirmation.csv` contiene cinco candidatos de plataforma con URL y campos vacíos: LinkedIn corporativo, Instagram, Facebook, Google Business Profile y Bing Places. No presupone que existan. Incluye aparte el perfil personal LinkedIn conocido como referencia, sin tratarlo como activo de la organización. Los dos comentarios y dos directorios duplicados no son perfiles corporativos por reclamar.

El propietario debe, para cada fila:

1. Abrir el perfil **desde el panel que ya administra**, si existe, y copiar su URL pública exacta; no buscar ni crear un perfil nuevo para rellenar el formulario. Si no existe según su inventario, escribir `asset_status=none_declared`; es una declaración del propietario, no una ausencia pública certificada. Si no lo sabe, conservar `unknown`.
2. Copiar el nombre mostrado, dominio enlazado, teléfono comercial público, descripción y estado visible; si un dato no aparece, distinguir `not_displayed` de `unknown`. No incorporar teléfonos de personas, direcciones de usuarios ni correos de la cuenta.
3. Adjuntar una captura recortada de la indicación de rol de administración/control sobre **ese perfil**, ocultando identidad de cuenta, otros administradores y cualquier dato privado. Basta que permita relacionar URL/nombre del activo con capacidad administrativa; no modificar datos ni publicar para demostrar control. Alternativamente, entregar confirmación del responsable y dejar la prueba documental pendiente.
4. Registrar fecha y referencia de evidencia. `control_state=confirmed` solo después de revisar una evidencia válida del control del perfil correspondiente; una declaración sin prueba se registra en `owner_confirmation` y conserva `control_state=unknown`. Un enlace público al dominio por sí solo no demuestra control. No añadir `sameAs` durante esta fase.

Entrega: `corporate-assets-confirmation.csv` cumplimentado y capturas permitidas referidas por nombre de archivo. No aportar contraseñas, cookies, sesiones o capturas completas de cuentas.

## Bloqueos que estas acciones resuelven

| Recurso exacto | Acción mínima | Responsable | Evidencia que desbloquea |
|---|---|---|---|
| Sistema receptor productivo actual | Identificar CRM/proveedor y leer estado de integración existente | Propietario + responsable técnico/operaciones | Nombre/entorno y estado recortado de recepción, sin registros personales |
| Agregado comercial existente | Exportar informe por página/adquisición/etapa, con cobertura y definiciones | Administrador CRM/negocio | CSV agregado + procedencia; permite mapear los datos realmente disponibles |
| Unión adquisición→etapa | Confirmar campos y vínculo ya almacenados; obtener agregado si existe | Administrador del sistema | Definición de landing/atribución/deduplicación, o declaración exacta del campo/vínculo no conservado |
| Control de perfiles corporativos | Completar URL/campos y evidencia del panel ya administrado | Propietario o administrador del activo | Inventario confirmado/pendiente por plataforma, sin crear perfiles |

Fuentes reutilizadas: [inventario](https://github.com/lasopho/sollahms-web/blob/5282c2ea248a4d14da1ca692031560d9af0f4818/docs/seo-measurement/runs/2026-11-09-gap-closure-audit/analytics-inventory.md), [variables](https://github.com/lasopho/sollahms-web/blob/5282c2ea248a4d14da1ca692031560d9af0f4818/docs/seo-measurement/runs/2026-11-09-gap-closure-audit/evidence/vercel-env-names-only.json) y [presencia](https://github.com/lasopho/sollahms-web/blob/5282c2ea248a4d14da1ca692031560d9af0f4818/docs/seo-measurement/runs/2026-11-09-gap-closure-audit/external-presence.md) del run anterior. Esta entrega no modifica producción ni activa proveedores o medición.
