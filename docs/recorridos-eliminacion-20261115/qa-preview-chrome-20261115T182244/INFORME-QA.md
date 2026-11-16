# QA remoto en Chrome — Preview no aprobada

Fecha de cierre: 2026-11-15 18:22:44 America/Santiago (UTC−03:00).
Repositorio: lasopho/sollahms-web. Rama: codex/eliminar-recorridos-global-20261115.
Deployment: dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF.
Preview: https://project-wrapp-b1aszxxoe-lsandoval2-8260s-projects.vercel.app/
Runtime declarado: c97bfa5aba80329f18e3db8058ec5c3fada80cc4.
HEAD documental inicial: 7ba3bdd1e79b818209ce9029d42ccd6770e4b8b5.

## Resultado

**NO APROBADO: incidencia bloqueante del empaquetado/entrega del deployment.**
Chrome conectado alcanza Vercel; el fallo actual no es el CONNECT 403 histórico. La portada y /inn-puerto-chico.html muestran 404 NOT_FOUND. El panel autenticado Resources enumera los 1.660 archivos como Static Assets, incluidos /config.json y /functions/api/advisory.func/api/advisory.mjs. INN aparece bajo /static/inn-puerto-chico.html. Esto demuestra que la estructura de salida está publicada como archivos estáticos, en lugar de resolver las páginas y registrar los bundles de funciones como se esperaba.

Se abrió únicamente la ruta alternativa observada /static/inn-puerto-chico.html para diagnosticar: el HTML aparece sin sus recursos. Las 16 hojas CSS locales tienen sheet nulo; las dos externas también, sin atribuir estas últimas al empaquetado. Las seis imágenes del DOM tienen complete=true y naturalWidth=0. Siete inputs del formulario permanecen deshabilitados. La ficha conserva enlaces absolutos /assets/... y /proyectos.html, incompatibles con la estructura estática observada. No se cambiaron URLs del sitio para esconder el problema.

## Cobertura exacta

- Dos rutas normales consultadas: portada y una ficha (INN Puerto Chico), ambas 404.
- Una ficha inspeccionada parcialmente como diagnóstico en ruta /static/; no cuenta como QA completo ni aprobado.
- **0/131 fichas completaron QA visual/funcional en su ruta normal.**
- 0 controles responsive nuevos a 1440/768/390/320 px. Las capturas se tomaron en el viewport existente, sin atribuirles esos anchos.
- 393 controles históricos locales, ocho pruebas y 27 capturas conservados, no reejecutados.
- La auditoría histórica de 1.660 hashes y 131 fuentes sigue siendo evidencia de contenido subido, no prueba de enrutamiento ni registro de funciones.
- No se revisaron las otras 130 fichas porque el fallo estructural bloquea un QA representativo; no se les atribuye un resultado individual.
- Pendientes: galerías, planos, videos, navegación operativa, WhatsApp interactivo, formularios, mapas y cuatro anchos sobre rutas válidas. Se observó el destino WhatsApp en DOM, sin abrir ni enviar mensajes.
- La lectura de consola devolvió lista vacía; no sustituye la evidencia de recursos sin cargar ni certifica ejecución JS.
- Google Maps mostró sólo contenido parcial de iframe; no se certifica su funcionamiento ni se atribuye un defecto nuevo al proveedor.

## Evidencias y comparación

| Evidencia | Resultado nuevo |
| --- | --- |
| [404 ficha](errorShot.jpg) | Ruta normal no resuelve; request ID gru1::cr2bt-1794777625052-6b6c9fc56378 |
| [Resources](resourcesShot.jpg) | 1660 Static Assets; archivos de funciones tratados como estáticos |
| [Ficha bajo /static/](brokenShot.jpg) | HTML sin estilos e imágenes; no es una vista aprobada |
| [Antes histórico 1440](../antes-inn-puerto-chico-1440.png) / [después local histórico 1440](../inn-puerto-chico-1440.png) | Se conservan como comparación histórica; no hay nueva comparación equivalente válida |

Portada: request ID gru1::bzxng-1794777604451-66158407010f.
Panel: https://vercel.com/lsandoval2-8260s-projects/project-wrapp/Fyu39RK4drsHA7tqs8brGRHqTtxF/resources

## Clasificación y corrección mínima propuesta

Incidencia nueva confirmada en la entrega de esta Preview; no se ha demostrado un defecto en la eliminación HTML/CSS. El fallo no queda explicado por la restricción de red histórica. READY significa que Vercel terminó el deployment; no prueba que el paquete funcione.

Propuesta: reutilizar los bytes ya auditados y hacer que Vercel interprete correctamente Build Output API (.vercel/output con static, functions y config.json), sin ejecutar generadores históricos ni modificar fichas para agregar /static a sus rutas. Verificar antes de cualquier nuevo despliegue el método exacto de ingestión y un plan de preservación. El constructor prepare-preview.mjs ya copia hacia .vercel/output; no se modificó por no haber evidencia de que ese script sea la causa. Revisar cómo se entregó el paquete al crear este deployment.

Esta tarea prohíbe reconstruir/reemplazar el deployment: no se creó otro ni se ejecutó la corrección propuesta. No cambiar SSO ni crear enlaces de bypass. No se inspeccionó ni difundió contenido de funciones o datos comerciales por sus rutas estáticas.

## Estados y preservación

PR #27 abierto, Draft, no fusionado. Base codex/agenda-regions-responsive-20261115.
Deployment indicado READY, target staging, confirmado por API y dashboard.
SSO enabled=true, all_except_custom_domains; se conservó configuración. La sesión existente accede al HTML alternativo, pero no se realizó prueba anónima de enforcement.
sollahms.cl y www.sollahms.cl apuntan a dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN. Producción READY, target production.
Sin cambios runtime, nuevos deployments, promociones, merges, dominios, seguridad o credenciales.
Sin envíos comerciales, Resend ni operaciones CRM 360.
Sólo se añade documentación y capturas en la misma rama; git deploymentEnabled de esta rama continúa false.

## Continuidad

Primero resolver la entrega correcta del paquete mediante una etapa expresamente habilitada para un nuevo deployment privado; después ejecutar las 131 fichas y cuatro anchos. No repetir la eliminación ni pedir otra vez autorización para el PR y Preview históricos. No declarar verificación técnica final mientras persista esta incidencia.
