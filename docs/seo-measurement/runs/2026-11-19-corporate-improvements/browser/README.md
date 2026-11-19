# QA local del candidato corporativo — 19/11/2026

`report.json`: PASS, 36 flujos en seis páginas, comparando el artefacto productivo certificado con el candidato a 1440, 390 y 320 px. Cero excepciones JavaScript y cero desbordamientos horizontales. Las nueve capturas superiores antes/después son idénticas; Centro y Entorno conservan también su texto visible. El cambio empresarial aparece en la sección de asesoría.

Se verificaron menú móvil, filtros y reset de obras, presupuesto/checklist/recorrido del Centro, cálculo hipotecario, campos requeridos y recuperación de formularios. Los resultados y enlaces WhatsApp se compararon con la referencia. Los 18 POST de prueba quedaron interceptados por el navegador y respondieron con un rechazo ficticio; ninguno llegó al servidor o a proveedores. La UF es una fixture sintética, sin valor probatorio sobre el valor vigente.

Las fuentes remotas de Google se bloquearon; ambas variantes usan el mismo entorno de fuentes disponible. La comprobación es local, no acredita acceso remoto, aceptación de proveedores, correo, reserva ni CRM.

Reproducción: `node scripts/qa-corporate-20261119.mjs BASELINE_STATIC OUTPUT`. Usa las rutas existentes de Playwright/Chrome o las variables `SOLLAHMS_PLAYWRIGHT_MODULE` y `SOLLAHMS_CHROME`. El servidor acepta exclusivamente GET/HEAD y el navegador bloquea APIs y solicitudes externas. El sandbox puede requerir permiso de ejecución para abrir puertos locales y Chrome.

Las capturas `candidate-*-empresa-contact-cta.png` complementan la revisión móvil con el botón entero dentro de la pantalla; su geometría y método constan en `cta-visual-review.json`.
