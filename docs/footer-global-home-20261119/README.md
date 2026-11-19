# Pie corporativo único — 19/11/2026

El titular solicita que todas las páginas tengan el mismo pie de firma de la portada y autoriza avanzar autónomamente hasta publicarlo. El alcance incluye los 168 HTML del artefacto productivo, incluidas las 152 fichas y las páginas de error. La unificación afecta el pie y su presentación; el contenido principal, la identificación de cada proyecto, las funciones, la medición consentida y la configuración se preservan.

La base real es `dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn`, publicada el 19/11 a las 16:56:11.782 America/Santiago, con cobertura de asesoría de 34 comunas en diez regiones. Se utiliza el HEAD remoto de continuidad `9f43dc0a20dbd8711609ea4e5461eb0aaab8c142`, posterior documentalmente al source publicado `d7ad0795a561a9b69999b421fd9eef519adfee26`. No se reconstruye desde el main histórico. La base congelada contiene 1.728 archivos y su inventario SHA256 es `f11c8fc8f816db5bf104866fc4f8bc439917674a0d210de90edc3cef3733ce1e`.

Se identifican diez implementaciones del pie. El componente compartido toma el contenido vigente de Inicio: logo oficial, copyright, descripción, correo, WhatsApp, navegación y dos enlaces legales. Los enlaces de sección se resuelven hacia Inicio desde cualquier página. La hoja de estilos se limita al pie y utiliza el mismo archivo de fuente local con un alias exclusivo, para no cambiar la tipografía del resto de las páginas. Los hooks finales de autoría evitan que un generador vuelva a introducir un pie diferente.

En la referencia original, el launcher fijo de privacidad podía cubrir WhatsApp a 768 px y el último enlace legal a 390/320 px. La unificación reserva 48 px adicionales al final del pie en anchos inferiores a 1024 px, igual en todas las páginas. Conserva la composición del pie y el control de privacidad; no oculta ni modifica la medición o su consentimiento.

## Continuidad del estudio SEO/GEO

Se leyeron `STRATEGY-v3.md`, la política activa y los estudios del 25/29 de octubre antes de proponer la intervención. El objetivo es una identidad corporativa y una navegación de contacto coherentes, frente a los diez pies observados. Esto se relaciona con el criterio del estudio de describir y enlazar de forma consistente la organización y sus vías reales de consulta. La verificación corresponde a igualdad del componente, presentación responsive, enlaces operativos y preservación del contenido exterior.

| Plataforma | Aplicabilidad de este cambio | Comprobación y límites |
|---|---|---|
| Google Search | Navegación e identidad visible uniformes; no es una intervención de metadatos ni de indexación | Se comprueba el HTML publicado y los enlaces. No se atribuyen posiciones, rastreo o resultados al cambio |
| OpenAI / ChatGPT Search | La misma identidad y contactos están disponibles en el HTML | No se hacen consultas IA ni se acredita mención, cita, recomendación o rastreo nuevo |
| Bing / Microsoft Copilot | Consistencia del mismo contenido visible y navegación | No se infiere que mejore Bing o Copilot ni se trasladan resultados de Google o ChatGPT |

Las fichas y Asset Portafolio siguen excluidos de optimización SEO/GEO: reciben únicamente el pie visual solicitado expresamente por el titular. No se amplían el registro de doce URL, permisos de rastreo, preferencias de entrenamiento, datos estructurados o campañas. No se envía ninguna solicitud de indexación. Implementar y publicar este componente no acredita resultados de búsqueda, citas IA o resultados comerciales.

## Verificación y publicación

Se comparan los bytes exteriores al footer en los 168 HTML, permitiendo únicamente el enlace de la nueva hoja de estilos. El artefacto se prepara como overlay del paquete productivo congelado; todos los demás archivos conservan sus hashes, incluidos siete bundles/57 archivos de funciones, datos, robots, sitemap, scripts de medición y motion.

La matriz de navegador cubre 168 páginas por cinco anchos (1440/1024/768/390/320). Se comprueban componente único, logo, correo, teléfono, enlaces, fuentes, colores, geometría, overflow y controles de privacidad. Los mapas externos se aíslan como fixture de la prueba del pie, conservando su markup y espacio; esto no constituye una nueva auditoría de Google Maps. La UF usa una fixture de indisponibilidad. No se aceptan cookies opcionales ni se envían formularios, mensajes o datos comerciales durante QA.

La autorización incluye publicar. Se creará un Production prebuilt sin asignar dominios; se verificará y se promoverá exactamente el mismo ID, sin reconstruir. Se conserva la versión anterior y se reconsultan aliases y concurrencia antes de promover. La entrega se cierra solo después del QA público, con manifiestos, capturas, recibos y documentación sincronizada. No se fusionan otras ramas o PR.
