# Preparación de preview — 2 de noviembre de 2026

Se conserva la integración persistente y toda la configuración de Vercel. La nueva rama añade `npm run preview:readiness`, un preflight de solo lectura sin flag de bypass. Examina los manifiestos revisados: 735 referencias de assets y 394 ausentes; no certifica permisos ni el resto del sitio.

Los 26 casos de publicación se intentaron por nombre literal: 25 fallaron por materiales protegidos ausentes, uno se omitió por su guarda nativa y ninguno aprobó. El intento local de empaquetado sobre la rama actual, sin simular otra rama, fue rechazado con `Unexpected branch for this review build`. El build alojable no está autorizado ni validado. No sustituir materiales por placeholders, cambiar hashes o simular una rama aprobada. La suite Git 424 Node/216 Python se verifica independientemente de este resultado.

El CRM incorpora en su rama `codex/cloud-preview-2026-11-02` una composición PostgreSQL de sesiones, lecturas/escrituras y bandeja, dashboard, Growth, worker supervisable, mapa verificable de 137 contextos sintéticos y artefacto de aplicación. Persisten rutas heredadas pendientes; leer `docs/PREVIEW_PRIVADA_SOLLAHMS_2026_11_02.md` del CRM.

No hay Preview alojada, proveedores activos ni cuentas configuradas. Faltan acceso autorizado al host/PostgreSQL/Auth de desarrollo, secretos del entorno y materiales protegidos. La API GitHub continúa bloqueada por el proxy antes de alcanzar GitHub; no inferir token defectuoso ni CI remoto aprobado.
