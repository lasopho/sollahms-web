# Comparador hipotecario — registro de avance

Fecha de inicio: 9 de octubre de 2026 (Chile).

- Solicitud: comparador completo para revisión, sin merge ni despliegue de producción.
- Base verificada: `origin/main`, commit `69eb895`; fetch realizado antes del trabajo.
- Rama: `codex/comparador-hipotecario`; checkout aislado `/private/tmp/sollahms-comparador-hipotecario`.
- No modificar las fichas inmobiliarias ni `data/proyectos.json`.
- Arquitectura existente: HTML estático, CSS local y funciones Vercel Request/Response ESM; contacto con Resend a `contacto@sollahms.cl`.
- Trabajo paralelo: motor y datos financieros; contacto y pruebas API; investigación oficial; interfaz e integración.
- Criterios: cálculos auditables, tasas con procedencia y alcance, expiración estricta, simulación libre de datos personales, envío con consentimiento y confirmación real, escritorio y móvil.

## Investigación inicial

UF: $41.130,94 el 09/10/2026, SII y CMF. La API oficial CMF exige clave y contiene indicadores; no se ha encontrado una API pública documentada de las ofertas del simulador. No utilizar endpoints internos ni scraping automatizado. Preparar publicación controlada de evidencia financiera.

## Implementación y evaluación

- Motor puro y datos fuente separados; tasas nominales/efectivas explícitas y anualidad estable.
- CMF contrastada mediante captura pública controlada: se detectó conversión efectiva anual en los dividendos. Tres referencias exactas incorporadas; registros antiguos y costos inconsistentes se excluyen.
- Catálogo de 10 instituciones, UF fechada, controles de vigencia y cobertura para CAE.
- UI premium, responsive, navegación y asesoría reutilizando Resend; consentimiento y contexto recalculado.
- Auditoría independiente, corrección de enlaces, cobertura CAE, extrapolación de gastos, comentario corto y validación de costo completo.
- 33 pruebas aprobadas; 512 escenarios de amortización independiente. Navegador local verificado en cinco viewports, con falla y recuperación de datos y error de envío sin credenciales.
- Commits `7ce7346` motor/datos, `4d23faf` captación, `1d235e2` interfaz e integración. Rama publicada en GitHub.
- Vercel generó vista previa aislada READY, protegida por SSO; no se hizo merge ni publicación de producción.

## Continuación de correo — 10 de octubre

El usuario abrió sesiones normales de Vercel y Resend. Se ejecutó una sola prueba con los datos ficticios preparados. La aplicación confirmó el envío; Resend respondió HTTP 200 con ID `01a12570-c935-7dda-a216-5c697b748382` y mostró Sent/Delivered. Se comprobó el contenido identificado y el resumen financiero. La protección de Vercel permanece activa; no se usó un enlace temporal ni se cambiaron credenciales. La UF del 9 está vencida y el sistema omitió pesos correctamente.

Queda pendiente la recepción efectiva en el buzón de contacto. Las conexiones Gmail disponibles no encontraron ese identificador y no constituyen acceso directo confirmado al buzón. Se solicitó al titular comprobar el mensaje y la carpeta. El [registro de prueba](prueba-correo-hipotecario.md) conserva tiempos, IDs y capturas. No repetir el envío.

## Historial de accesos iniciales — 9 de octubre

El 9/10, el acceso normal a preview requería login Vercel. La revisión automática rechazó crear un enlace temporal de autenticación porque ampliaría acceso sin autorización específica. No se cambió la protección. La metadata confirmó la existencia de la clave Resend en preview, pero ese día no se pudo verificar el envío remoto ni su recepción. La sesión autenticada permitió comprobar el formulario y el proveedor el 10/10, como se registra arriba; la recepción en el buzón sigue pendiente. GitHub rechazó crear PR con 403 de integración; la rama está disponible para revisión.

La [guía](comparador-hipotecario.md), la [auditoría](comparador-auditoria.md) y el [informe de verificación](comparador-verificacion.md) conservan las fuentes, alcance, pruebas, correcciones y pasos de continuación. Continuar desde el checkout aislado, no desde el desarrollo de fichas ni main.
