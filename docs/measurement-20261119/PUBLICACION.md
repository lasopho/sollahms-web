# Publicación del candidato de medición — pendiente de aprobación

Este plan no ejecuta una publicación. El permiso original de PR37/SHA `df78d77f31c8da946623e586634998e151ed237e` no cubre automáticamente este nuevo candidato, el candidato de apariencia heredado de PR38 ni el borrador del contenedor Google Tag Manager.

## Resultado que se revisa

Se añaden elecciones independientes de Analytics y replay, eventos limitados al recorrido corporativo y la sección de privacidad correspondiente. La comparación de Google, Bing/Microsoft y ChatGPT Search conserva fechas, filtros y limitaciones por plataforma. El artefacto completo conserva catálogo, 152 fichas, Centro documental, datos/recursos, siete funciones y sus 57 archivos. No se reconstruye con main ni con generadores históricos.

La apariencia pendiente de PR38 forma parte explícita de este candidato: coherencia de metadatos sociales/description estructurada de portada y favicon PNG del logo oficial; no se atribuye crecimiento a ello. El diff Git del comparador incluye un pie que ya está publicado: se recuperó de producción y no es un nuevo rediseño. La comparación de artefactos, no la antigüedad del checkout, determina el delta real.

## Antes de modificar producción

1. Leer `candidate.json`, `artifact-proof.json`, recibos del SDK/navegador y del borrador GTM. Confirmar autorización del candidato concreto y los ajustes de GTM que se describen allí.
2. Comprobar otra vez ambos alias, deployment activo, configuración automática, SSO, dominios, integraciones y nombres/targets del entorno sin extraer valores secretos. Referencia comprobada: `dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH`, `autoAssignCustomDomains:false`, SSO `all_except_custom_domains`, producción en main. Si ha habido una publicación posterior, recuperar íntegramente ese artefacto, reaplicar sólo el overlay revisado y repetir preservación y pruebas.
3. Conservar como reversión el deployment de producción inmediatamente anterior, READY y accesible para la cuenta actual. Revalidar el mecanismo oficial y su elegibilidad sin ejecutar un rollback de ensayo contra tráfico real. La simulación local y una lectura no acreditan el permiso efectivo de una futura escritura.
4. Tras la aprobación, publicar únicamente los cambios revisados del contenedor `GTM-KTXQ2V7B`. No añadir etiquetas Ads, destinos ni integraciones. Descargar su SDK público vigente y repetir en un contexto aislado la prueba de red interceptada: cero descargas/eventos antes del permiso o con rechazo; exactamente un page_view tras aceptación; todos los eventos con URL/referrer saneados y sin datos personales o financieros; sin eventos automáticos ajenos al contrato; cookies host-only, Secure, máximo 60 días y sin renovación. Los beacons se cumplen localmente y no se envían. Si difiere, detener antes del despliegue del sitio, corregir y volver a revisar el candidato.

## Artefacto y promoción

1. Usar el artefacto completo de 1.727 archivos certificado por `candidateInventorySHA256` en `artifact-proof.json`. Verificar de nuevo cada hash local. No usar el preview como origen de reconstrucción ni promover un preview como Production.
2. Crear **Production sin asignar dominios**, con CLI verificada y el proyecto/equipo explícitos:

   `vercel deploy <directorio-certificado> --prebuilt --prod --skip-domain --project prj_URomRRU0MAy4etGKP5gWv3Qv4DGH --scope team_A9VNIW2f2K1IJpd2pGdvDmEN`

3. Registrar ID, commit, target Production y READY. Comparar el inventario remoto completo, no una lista truncada: 1.727 UIDs/bytes, configuración Build Output, siete funciones y sus 57 archivos. Verificar entorno/integraciones por nombres y targets, sin imprimir valores. Confirmar que ningún alias público se movió durante el staging.
4. Comprobar las doce páginas, robots, sitemap y nuevos recursos por HTTP autenticado; canonicals al dominio oficial, metadatos/directivas públicos correctos, MIME y bytes esperados. El hostname técnico mantiene SSO/noindex y bloquea el SDK por diseño; no demuestra recepción de analítica.
5. Ejecutar las pruebas de formularios/CRM/reserva con mecanismos simulados. No enviar correos, contactos, reservas o leads reales. Verificar otra vez producción inmediatamente antes de promover.
6. Promover **ese mismo ID Production validado**, sin reconstruir ni asignar alias manuales. Mantener las opciones de despliegue existentes; comprobar y corregir únicamente un efecto lateral observado de promoción sobre autoasignación.

## Después de promover y reversión

Registrar el instante efectivo **T0 en America/Santiago** a partir del cambio de alias, con UTC para trazabilidad. Revisar apex y www/308, bytes públicos, doce canonicals, sitemap y robots/directivas de indexación. Verificar el control de consentimiento y el comportamiento de la etiqueta con pruebas aisladas; la recepción real consentida, si se comprueba, se registra aparte de las simulaciones. No convertir una solicitud aceptada por proveedor/CRM en entrega o lead cualificado.

Ante una regresión, volver al ID inmediatamente anterior mediante el mecanismo oficial de rollback y comprobar ambos alias, bytes, SSO y configuración. El artefacto anterior no carga la nueva integración; los ajustes GTM más restrictivos no habilitan por sí solos scripts en ese sitio. Conservar evidencia del motivo y de la hora. Nunca practicar la reversión cambiando tráfico real sólo para probar el comando.

El seguimiento mantiene separadas publicación, rastreo/indexación, búsquedas Web, menciones/enlaces/citas IA y captación. Se limita a las doce URL corporativas del registro v3; ausencias de datos siguen siendo desconocidas. No se crean automatizaciones, campañas, solicitudes masivas de indexación ni gastos de API por esta revisión.
