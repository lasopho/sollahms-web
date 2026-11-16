# Continuidad — QA remoto pendiente de Sollahms

Continúa en `lasopho/sollahms-web`, rama `codex/eliminar-recorridos-global-20261115`. Lee `AGENTS.md`, `docs/recorridos-eliminacion-20261115/INFORME-CIERRE.md` y `docs/recorridos-eliminacion-20261115/qa-preview-20261115T173733/INFORME-QA-FINAL.md`. El prompt anterior está archivado en ese directorio. Este prompt no autoriza su ejecución automática.

Estado verificado el 15/11/2026, 17:37–17:45 America/Santiago:
- PR #27: https://github.com/lasopho/sollahms-web/pull/27, abierto en Draft. Base `codex/agenda-regions-responsive-20261115`, SHA `c2e1965ced736d46917a1bee286456cb937d58fe`.
- Preview READY: https://project-wrapp-b1aszxxoe-lsandoval2-8260s-projects.vercel.app/ ; deployment `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF`, target staging, runtime `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.
- Vercel: proyecto `project-wrapp`, ID `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`; equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`. SSO `all_except_custom_domains`.
- Producción y ambos aliases siguen en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`; su SHA Git no está expuesto.
- HEAD remoto recibido `03cc6e9c3cf6152abd54ae138282bb8655946ddb`. Evidencias nuevas: `1933a086f29086fa45883b18176fdb2fe88fdf30`. Los commits posteriores de esta entrega sólo documentan el cierre. Verifica HEAD y conserva cambios ajenos.

No repetir:
La eliminación retiró 49 secciones, 73 iframes y 74 enlaces en 131 fichas. Cambian 64 HTML y dos CSS. La nueva auditoría verifica 1.660/1.660 fuentes del deployment por SHA-1, con 1.594 archivos iguales a producción. Son 57 archivos de funciones en 7 bundles, no 57 funciones. Las 131 fichas desplegadas coinciden con la rama y están sin recorridos. Ninguna de sus 1.119 rutas locales de recursos falta; conservan 131 formularios con cuatro campos y 131 enlaces WhatsApp. Hay ocho pruebas, 393 controles locales a 1440/768/390 px y 27 capturas históricas; no sustituyen QA visual remoto.

Bloqueo actual:
El proxy excluye el hostname de Preview: HTTPS CONNECT 403 y Chromium `ERR_TUNNEL_CONNECTION_FAILED`. La credencial disponible está limitada a otras dos URLs; no se envió fuera de alcance. No hay navegador conectado expuesto. Google Maps también está bloqueado por el proxy. No se cambiaron red, SSO, credenciales ni proveedores. Las autorizaciones históricas para crear PR y Preview ya están resueltas.

Pendientes: cero fichas inspeccionadas visualmente en remoto; cero controles responsive remotos; 320 px sin comprobar. Tampoco se certificaron interacciones de galerías/planos, consola, carga HTTP de recursos o mapas dentro de la Preview. No declarar aprobado ese QA.

Pasos:
1. Verifica PR Draft, deployment READY, SSO y aliases mediante lecturas. No recrees PR ni Preview y no reconstruyas el paquete.
2. Comprueba si el propietario del entorno habilitó acceso HTTPS y autenticación permitida para el hostname exacto. Usa credenciales sólo dentro de su alcance; no compartas secretos ni cambies seguridad para superar el bloqueo. Si sigue inaccesible, documenta el pendiente.
3. Con acceso, inspecciona las 131 fichas directamente en Preview a 1440/768/390/320 px. Prioriza las 49 secciones retiradas, las 64 fichas cambiadas y las seis muestras INN Puerto Chico, Bcome, Núcleo Costanera, Plaza Las Condes, Bordevivo y Distrito Centro. Guarda nuevas capturas sin reemplazar las anteriores.
4. Verifica ausencia de recorridos, huecos, overflow y superposiciones; medios y planos, navegación, encabezado/pie, formularios, WhatsApp, CSS, JS y mapas. No envíes leads ni actives Resend/CRM. Distingue bloqueos del entorno de defectos del deployment y propone sólo correcciones mínimas del alcance.
5. Añade cierre versionado, actualiza informe y NEXT-PROMPT.md, registra commits y entrega enlaces y el prompt íntegro. Mantén PR #27 en Draft.

Autorizado: QA de sólo lectura de la Preview existente, verificaciones de preservación y documentación en la misma rama. No pedir nuevamente autorización para PR/Preview ya realizados.

Requiere autorización separada: merge, promoción, producción, dominios, seguridad, credenciales, proveedores, gastos o ampliación de alcance. Protege CRM 360, AI Lab, Resend, atribución, formularios, precios, SEO/GEO, sitemap y páginas ajenas. No reconstruir el paquete en esta etapa.

Aceptación: fuentes y QA visual/funcional remoto aplicable verificados con limitaciones explícitas; PR Draft y SSO conservados; producción intacta. Mientras falte acceso visual, informar resultado parcial y pendiente concreto.
