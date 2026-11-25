# Homologación y publicación de pies — 25/11/2026

**Completado y publicado.** Las 168 páginas están conformes con el footer oficial; la auditoría requirió cero correcciones y la nueva publicación conserva exactamente los 1.729 archivos de runtime. El Production `dpl_8Dn1aquS1i4TeemVamcd5Yga6YZz`, source `15c07de8be8bf6255c1b431ab191127269fefdc9`, quedó asignado el 25/11/2026 a las 17:38:41.676, America/Santiago. El footer conserva su implementación aprobada `e866ce7ac0d7b6df968ecd011fa78d6aec335828`; el nuevo SHA identifica esta certificación y el guard de rama. El [informe de cierre](INFORME-CIERRE.md) entrega los quince puntos del encargo.

Pasaron dos matrices Chrome de 840 casos cada una en 1440/1280/768/390/320, con 1.680 capturas verificadas, y 34 revisiones manuales por entorno sobre todas las páginas no inmobiliarias más una ficha representativa. HTTP aprobó 174 GET antes, 172 aislados y 174 públicos; la verificación nativa final aprobó 31 controles y los 1.729 archivos. Los cinco aliases, redirecciones, SSO y variables se conservan; ADQD queda disponible para recuperación. El [PR #42](https://github.com/lasopho/sollahms-web/pull/42) permanece abierto en Draft, sin merge. No hay incidencias pendientes dentro del alcance del footer.

El encargo adjunto autoriza auditar el 100 % de las páginas públicas, conservar el footer corporativo aprobado y publicar el candidato validado sin aprobaciones intermedias. La rama independiente es `codex/footer-global-20261125`; el workspace original con cambios comerciales ajenos permanece intacto.

La consulta actual de Vercel confirma como base `dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be`, source `e866ce7ac0d7b6df968ecd011fa78d6aec335828`, publicada el 19/11. El HEAD de continuidad de su rama es `349b955fcf6d887ac084ed7b673bc78d8a2b52b4`, posterior únicamente por documentación. No se usa main histórico como base. Los cinco aliases actuales siguen en ADQD y no se ha observado otro Production posterior.

La referencia explícita aprobada es `templates/corporate-footer.html`, acompañada de `assets/css/corporate-footer.css`, publicada y certificada en el PR #40. La portada pública actual conserva exactamente ese componente y CSS. Tiene prioridad por ser una referencia corporativa explícita y vigente, y coincide con Inicio. Incluye el teléfono visible +56 9 4850 2440 y el destino WhatsApp `https://wa.me/56948502440` con el mensaje de consulta aprobado. No se añade un eslogan ni se introduce un diseño nuevo.

Se recupera el Build Output v3 actual de 1.729 archivos y se compara su inventario completo con Vercel. El paquete congelado anterior se utiliza únicamente como caché de contenido: sus bytes se completan con las salidas exactas de ADQD y el resultado debe coincidir íntegramente con el manifiesto de ADQD y la consulta remota actual. Su inventario SHA256 es `fdc28233a83fb11cc1e269d4b3b2963e6711f796973ac714247cea93d80aaf79`. No se ejecutan constructores generales que puedan restaurar contenido histórico.

La matriz de auditoría registra individualmente cada una de las 168 páginas, incluidas las 152 fichas. Si el pie ya coincide, se registra como conforme y se conservan sus bytes; el total de nuevas correcciones se distingue del total de páginas homologadas. Se preservan todos los HTML completos, metadatos, datos estructurados, canonical, enlaces, formularios, herramientas, siete funciones y 57 archivos de funciones, recursos, sitemap, robots, medición y configuración. Solo se añade a la fuente `vercel.json` el guard false de esta rama para evitar publicaciones automáticas de los commits documentales; el config v3 desplegado no cambia.

## Verificación

Los anchos son 1440, 1280, 768, 390 y 320 px. Se captura una referencia de Inicio actual y se prueba el footer de todas las páginas en el Production aislado y luego en público. Los modos remotos cargan los recursos propios mediante HTTPS real, validan TLS y comparan sus bytes con el candidato. Los enlaces y anclas se comprueban sin enviar mensajes ni formularios.

Los mapas externos y las API/UF usan fixtures explícitas para mantener la prueba dentro del alcance del pie; no se certifica de nuevo su proveedor ni un valor UF. La medición opcional se rechaza mediante su interfaz en las doce páginas canónicas; no se aceptan opcionales ni se ejecutan SDK o POST. El movimiento del contenido principal se muestrea en Inicio a cinco anchos; el resto se preserva por sus bytes idénticos. La comprobación del pie estático y sin desvanecimiento ancestral abarca cada caso.

Se creó un único Production prebuilt sin dominios, se comprobó su inventario completo y se promovió sin reconstruir. Se reconsultaron los aliases y la concurrencia antes de promover; se conservaron las redirecciones, SSO, variables, integraciones y el deployment anterior para recuperación. El QA público terminó satisfactoriamente antes del cierre.

## Continuidad del estudio SEO/GEO

Se leyeron `STRATEGY-v3.md`, los estudios del 25/29 de octubre, `active-policy.json` y los registros de la publicación vigente. El objetivo es conservar identidad y vías de contacto consistentes. El criterio del estudio aplicable es la coherencia de organización, contenido visible y navegación; se comprueba con el componente oficial, los enlaces y la preservación íntegra de las páginas. No se trata de una optimización de fichas.

| Plataforma | Comprobación de esta intervención | Límites |
|---|---|---|
| Google Search | HTML, metadatos, enlaces y preferencias conservados | No se acredita rastreo nuevo, indexación, posiciones ni efectos de resultados |
| OpenAI / ChatGPT Search | Identidad visible y política de bots conservadas | Sin consultas, menciones, enlaces, citas o recomendaciones medidos |
| Bing / Microsoft Copilot | Misma preservación técnica, comprobada por separado de resultados | Sin medición de indexación, búsquedas o citas de Bing/Copilot |

Se mantienen las doce URL y exclusiones del alcance corporativo v3 y las preferencias de entrenamiento. Una nueva publicación con los mismos bytes no constituye evidencia de mejoras de búsqueda, IA o resultados comerciales. No se cambian guías SEO ni se realizan solicitudes de indexación.
