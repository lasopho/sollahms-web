# Publicación SEO/GEO corporativa — completada

**T0: 19/11/2026 07:54:02.653 America/Santiago** (`2026-11-19T10:54:02.653Z`). Fuente: timestamp `updatedAt` del alias principal en Vercel; no se confunde con la hora de solicitar promoción. [Registro](publication.json), [lectura independiente final](production-after.json).

El SHA autorizado `df78d77f31c8da946623e586634998e151ed237e`, PR37, se publicó en **`dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH`**, servido por `sollahms.cl` y `www.sollahms.cl` (308 al principal). El mismo ID se creó primero en Production con `--prebuilt --skip-domain`, se verificó y se promovió una sola vez, sin reconstrucción ni deployment adicional durante la promoción.

## Evidencia

- [Revalidación local](local-revalidation.json): 1.723 archivos exactos; cuatro cambios autorizados y 1.719 preservados, incluidas 152 fichas, catálogo/mapa, Centro documental, recursos y siete funciones/57 archivos.
- [Integridad remota](staged-remote-integrity.json): 1.723/1.723 UID coincidentes, entorno Production y SHA autorizado correctos.
- [HTTP previo](staged-http-verification.json): 14/14 GET autenticados correctos; contenido exacto, canonicals públicos y staging protegido.
- [Pruebas de runtime](production-runtime-mocks.json): 17/17 con proveedores simulados, sin red ni credenciales reales. La reserva conserva su bloqueo `booking_not_certified`.
- [HTTP público](public-http-verification.json): 6/6 GET correctos, restringidos a las cuatro páginas del plan más robots y sitemap. Bytes exactos, canonicals correctos, un H1 por página y ausencia de `noindex` en las páginas públicas.
- [Configuración final](production-after.json): idéntica a la inicial, incluido `autoAssignCustomDomains:false`, SSO, rama Production, variables de sistema y opciones Git. No se necesitó PATCH correctivo. [Revisión independiente](peer-review.json).

Se reutilizaron los 130 controles estáticos y 36 flujos de navegador certificados del mismo artefacto. No se repitieron baterías sin cambios que las justificaran. Cero correos, reservas, registros CRM o solicitudes de indexación reales. No se modificaron DNS, seguridad, datos comerciales, integraciones o main, ni se fusionó el PR.

## Recuperación y seguimiento

El deployment anterior `dpl_8MyM5t9vQukSLaBkNRq4sTzGsSPV` permanece READY, listado como candidato de rollback; acceso OWNER y consultas oficiales de recuperación verificados. [Disponibilidad de recuperación](recovery-readiness.json). No se ejecutó una reversión de prueba.

La publicación y la accesibilidad pública están comprobadas. Rastreo del motor, indexación, impresiones, clics, posición y menciones/enlaces/citas IA siguen **no medidos**. El [plan de seguimiento](../measurement-plan.json) registra T0 y conserva métricas desconocidas como `null`. No se atribuye posicionamiento o citas a la publicación ni se mezclan resultados corporativos con el catálogo.
