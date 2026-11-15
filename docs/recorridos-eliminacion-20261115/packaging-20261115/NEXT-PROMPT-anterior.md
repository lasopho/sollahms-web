# SOLLAHMS — diagnóstico de empaquetado de Preview y preparación de corrección

Repositorio lasopho/sollahms-web; rama codex/eliminar-recorridos-global-20261115; PR #27 Draft.
Lee AGENTS.md, docs/recorridos-eliminacion-20261115/INFORME-CIERRE.md y docs/recorridos-eliminacion-20261115/qa-preview-chrome-20261115T182244/INFORME-QA.md.
Este prompt continúa el diagnóstico y preparación; NO autoriza crear un nuevo deployment, reconstruir el paquete, fusionar ni publicar.

Estado comprobado 2026-11-15 18:22:44 America/Santiago:
- Deployment dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF READY, staging, runtime c97bfa5aba80329f18e3db8058ec5c3fada80cc4.
- URL https://project-wrapp-b1aszxxoe-lsandoval2-8260s-projects.vercel.app/
- SSO all_except_custom_domains habilitado.
- Producción sollahms.cl y www.sollahms.cl en dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN.
- Chrome conectado sí alcanza el deployment: portada y /inn-puerto-chico.html devuelven 404.
- Resources muestra 1660 Static Assets, incluidas funciones. /static/inn-puerto-chico.html carga HTML sin CSS/imágenes y formulario deshabilitado.
- 0/131 fichas con QA completo, una inspección parcial diagnóstica. 0 controles responsive nuevos.
- No confundir hashes de fuentes correctos con rutas y funciones operativas. El bloqueo actual ya no es sólo el proxy histórico.

Objetivo siguiente:
1. Releer HEAD y conservar cambios ajenos. Mantener Draft y auto-deploy desactivado.
2. Investigar en lectura la creación del deployment y cómo se interpretó el paquete Build Output API. Comparar con un procedimiento válido documentado, sin ejecutar despliegues ni generadores.
3. Preparar corrección mínima concreta para reutilizar los bytes auditados como .vercel/output, manteniendo rutas raíz y los siete bundles de funciones. No reescribir fichas con prefijos /static, no cambiar SSO ni crear enlaces de bypass.
4. Documentar procedimiento, comprobaciones y alcance del nuevo deployment privado necesario. Antes de ejecutarlo, obtener instrucción expresa que habilite esa nueva etapa, ya que esta tarea prohibió reconstrucción/reemplazo. Esto no reabre las autorizaciones históricas resueltas.
5. Tras autorización de esa etapa y una Preview funcional, ejecutar QA en las 131 fichas a 1440/768/390/320 px; priorizar INN Puerto Chico, Bcome, Núcleo Costanera, Plaza Las Condes, Bordevivo y Distrito Centro. Conservar 393 pruebas y capturas como historia.
6. Comprobar galerías, planos, videos, navegación, encabezados/pies, recursos y formularios sin enviar leads ni activar Resend/CRM. Distinguir fallos Maps del entorno y del deployment.
7. Añadir evidencia versionada, actualizar informe y NEXT-PROMPT. No certificar pendientes.

Prohibido: producción, merge, promoción, dominios, cambios de seguridad, credenciales, proveedores o datos comerciales. No repetir eliminación. No sobrescribir evidencia histórica.
