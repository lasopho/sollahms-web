# Planes de pago privados por unidad

La ampliación solicitada permite seleccionar un proyecto de entrega futura, tipología y fila de unidad de Iris, consultar sus condiciones literales y simular reserva, pago inicial, cuotas mensuales y cuotón en UF. Mantiene el acceso exclusivo con la cuenta corporativa ya autorizada.

La precarga procede de consultas manuales autorizadas del 25 de noviembre de 2026. Se guarda en el Blob privado existente, en `bonos-pie/v1/payment-plans.json`, separado del inventario y las verificaciones de bonos. No se empaquetan precios, filas de unidades ni condiciones comerciales en Git o archivos estáticos. Sólo el servidor autenticado entrega esos datos. La consulta no certifica stock actual, vigencia contractual ni aprobación de financiamiento.

Los porcentajes literales de Iris no especifican siempre su base, imputación de la reserva o fecha de inicio. Por eso no se convierten en condiciones numéricas confirmadas. El usuario define expresamente el escenario sobre el precio elegido; el resultado se identifica como simulación. Un semestre no se convierte automáticamente en un mes. Los plazos de cuotas que exceden la entrega se conservan como evidencia sin imponerlos al calendario hasta la entrega. Reservas en pesos se conservan como texto y no se convierten a UF sin una base acordada.

El cálculo usa centésimas de UF, evita descontar dos veces la reserva y ajusta la última cuota para cuadrar el total. Los valores vacíos son desconocidos, y cero debe ser explícito. No se calculan intereses ni dividendos hipotecarios. Los escenarios permanecen en memoria del dispositivo y pueden descargarse en CSV; no se guardan ni transmiten.

La publicación reutiliza la autorización expresa del encargo original: «Autorizo desarrollar, probar y publicar el panel privado, siempre que esté protegido mediante autenticación real». La solicitud posterior amplía el panel con los planes de entrega futura. Se conserva la autenticación, sus protecciones y la configuración de Vercel. No se fusiona la rama.

Baseline reconciliado: `dpl_AraH5152864kmJWKpNjbe2ovaJa7`, fuente `14d99d8fb286950a211b254f5d738b0abe18217e`, 1739 archivos. `build-payment-plans.mjs` sólo permite cambiar cinco archivos del handler privado. Rutas, 1672 archivos estáticos y 57 fuentes de las otras siete funciones permanecen idénticos.

Esta ampliación no cambia contenido público, precios autorizados del catálogo, fichas, formularios, CRM, navegación, sitemap, medición o políticas SEO/GEO. No establece un efecto en Google, OpenAI/ChatGPT Search ni Bing/Microsoft Copilot; los datos privados conservan autenticación y noindex. El estudio SEO/GEO previo continúa siendo la referencia para futuras propuestas de visibilidad.

Verificación: pruebas de seguridad de la sesión, validación del dataset privado, conservación aritmética, límites de fechas y reserva; recorrido UI con datos sintéticos; comparación completa del artefacto remoto; acceso anónimo denegado y revisión de la sesión real en el panel. Los registros de publicación y comprobaciones se añaden a esta carpeta al finalizar.

Publicado y verificado en `https://sollahms.cl/bonos-pie#payment-title`: despliegue `dpl_9M5yUF3GzFK2aWy34Qn4en7y8tA7`, fuente `2327ed4324b0d56af04d9f6db8f50b4f54ca33b4`, pin `001fdacf9410338353d7a5867231b599aff89592e1eeb7e8c29f5055f6d1e1f3`. Precarga de 60 proyectos y 462 filas residenciales; las filas son referencias observadas, no certificación de stock. Pasaron 45 pruebas, 16 comprobaciones UI sintéticas, seis lecturas anónimas y el recorrido con la sesión real. La auditoría remota comparó 1741 archivos y ocho funciones; los 1672 estáticos, 57 fuentes de otras funciones y todas las rutas permanecieron idénticos.
