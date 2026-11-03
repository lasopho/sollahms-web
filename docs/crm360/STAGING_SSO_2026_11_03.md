# Staging SSO y acceso operativo — 3 de noviembre de 2026

## Continuidad confirmada

Se conserva el PR #13 y toda la integración existente. El propietario confirmó mediante sus conexiones directas que project-wrapp tiene despliegues staging READY y protección SSO. Esto se registra como confirmación del propietario, sin repetir su localización ni tratar las previews anteriores como la URL CRM solicitada.

La sesión de ejecución actual no expone herramientas GitHub/Vercel/PostgreSQL/Auth ni identidades cloud: observación vigente con cero bindings y el manifiesto de identidades sin conexiones. api.vercel.com responde CONNECT 403 de Envoy antes de TLS; no se llegó a Vercel ni se pudo comprobar autorización del token. No se buscan secretos en archivos, copian valores Production ni cambian SSO o políticas para sortear el bloqueo. La conexión utilizada por el propietario debe estar disponible en esta tarea o proporcionar bindings autorizados del gestor para continuar.

## Scheduler protegido corregido

`scripts/preview-deliver-once.mjs` requiere ahora **SOLLAHMS_PREVIEW_ORIGIN** además de CRM_WORKER_URL y CRM_WORKER_TOKEN. El origen debe ser HTTPS canónico y coincidir exactamente con el destino revisado antes de enviar el token. Configurar esta variable solo en el servicio scheduler Sollahms y su gestor/archivo protegido; no requiere cambiar el frontend ni el entorno de producción.

El scheduler rechaza redirects, páginas HTML de login SSO incluso con HTTP 200, JSON inválido/desconocido y respuestas mayores de 2048 bytes. Valida el contrato de tick existente: idle o un estado con UUID. Un estado failed genera error de supervisión; pending conserva la semántica de reintento. Ni siquiera un estado recorded sustituye la comprobación independiente de registros CRM: la salida sigue indicando deliveryConfirmed=false y no registra IDs, payloads ni claves.

El bearer CRM_WORKER_TOKEN autentica el handler de aplicación; **no inicia una sesión Vercel SSO**. Un scheduler externo necesita una identidad de servicio autorizada compatible con la protección del staging. No se añadió un bypass, se deshabilitó SSO o habilitó una vía anónima. El mecanismo autorizado existente debe confirmarse antes de activar las unidades. Las llamadas en pruebas usan transportes sintéticos; no se enviaron ticks al staging real.

## Recuperar desde los recursos existentes antes de duplicar material

```sh
node scripts/prepare-staging-recovery-plan.mjs
```

Genera, sin red ni copias, un plan sobre la auditoría existente: **262 archivos faltantes con hash ligado y destino ignorado**. Hay **253 candidatos derivados revisados** y **9 candidatos que requieren paquete fuente privado**. El listado no prueba que Vercel contenga esos bytes. Contrastar primero la lista de archivos del deployment/source package staging autorizado y su SHA de origen. Para derivados se contemplan paths fuente, dist y Build Output API; los originales privados solo se buscan en el paquete fuente autorizado, nunca como una publicación web.

No volver a pedir que se suban los recursos disponibles en el staging o almacén de fuentes existente. Solo los archivos que no puedan recuperarse allí con su SHA-256 exacto requieren aportación adicional. No descargar imágenes sustitutas, sobreescribir bytes, restaurar rutas públicas retiradas, exponer originales ni cambiar las 26 guardas. El inventario no concede derechos de publicación. Los 85 Ecasa ya recuperados y el inventario previo se conservan; no se repitió su implementación.

## Separación de infraestructura y permisos

El contrato de recursos CRM en `deploy/preview/resource-bindings.example.json` y `check-preview-bindings.js` exige recursos distintos de aplicación y base para CRM/Sollahms, logins propios, Auth independiente de preview y revisión del commit desplegado. El CRM actual requiere host Node; project-wrapp no se convierte en host CRM ni en worker permanente. Las unidades de scheduler de Sollahms deben tener su propio recurso/identidad y secretos bajo el ámbito Sollahms, separados de los servicios CRM. Las instrucciones anteriores que proponían compartir el host no deben aplicarse como una identidad o infraestructura compartida.

Conservar Vercel SSO del sitio y la sesión/membresías CRM como controles diferentes. Guardar HMAC solamente en el receptor CRM y el emisor Sollahms; no compartir sesiones, claves de respaldo, credenciales CRM u outbox con el navegador o el otro componente. No reutilizar bindings Production para hacer funcionar una preview.

## Validación y siguiente dependencia

Los cinco casos del scheduler y las regresiones de delivery/runtime/recuperación pasan con datos sintéticos. La selección Git aumenta de 430 a **433 Node**, conservando 216 Python y los 26 casos protegidos separados. Verificar el CI por el nuevo SHA; el éxito anterior ec04bd0 no se atribuye a esta ampliación. Workflow, packager, vercel.json y declaraciones de los 26 casos permanecen intactos.

No se ha desplegado CRM ni probado persistencia contra una URL alojada. El siguiente paso dependiente de acceso es habilitar en esta tarea la conexión Vercel ya existente con lectura de proyecto/deployments/commit, nombres y scopes de variables, integraciones y archivos del staging/paquete fuente. También hacen falta los bindings de recursos CRM/PG/Auth de desarrollo separados y el mecanismo de autenticación de servicio al staging. Configurar secretos mediante el gestor; nunca enviarlos por chat. El informe CRM de esta etapa agrupa el dónde/por qué de todos esos bloqueos.
