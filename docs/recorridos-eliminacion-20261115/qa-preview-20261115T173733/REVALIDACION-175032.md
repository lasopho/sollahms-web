# Revalidación de continuidad — 15/11/2026, 17:50:32 America/Santiago

**Resultado: el bloqueo de acceso persiste. No se aprobó QA visual remoto.**

1. **Objetivo y alcance:** comprobar si se habilitó el acceso necesario para continuar el QA existente; sin reconstrucción ni cambios funcionales.
2. **Completado:** lectura de instrucciones y cierre, comprobación del HEAD remoto y consultas actuales de PR, deployment, SSO, aliases y política del entorno. El HEAD recibido continúa en `cfecd02aa0bf5a04dbfec5975d7c7716db32a941`.
3. **Pendiente:** QA visual/funcional de 131 fichas a 1440/768/390/320 px, incluyendo galerías, planos, medios, consola, recursos HTTP y mapas. Nuevas fichas visualmente revisadas: 0.
4. **Bloqueo:** el hostname exacto de Preview sigue fuera de la allowlist; HTTPS reproduce CONNECT 403. La credencial disponible sigue limitada a otras URLs. No se envió fuera de alcance. Se solicitó al propietario del entorno habilitar acceso y autenticación permitidos, manteniendo SSO. No se cambiaron red, seguridad ni credenciales.
5. **Archivos:** sólo esta revalidación, su JSON, el informe principal y la continuidad. El prompt anterior se archivó; no se reemplazaron capturas ni resultados históricos.
6. **Trazabilidad:** rama `codex/eliminar-recorridos-global-20261115`; base `c2e1965ced736d46917a1bee286456cb937d58fe`; runtime `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`; evidencia técnica `1933a086f29086fa45883b18176fdb2fe88fdf30`; cierre previo `cfecd02aa0bf5a04dbfec5975d7c7716db32a941`. El commit documental de esta revalidación figura en la entrega y el historial.
7. **Pruebas:** nuevo GET de sólo lectura bloqueado por proxy. No se repitieron los 1.660 hashes, el análisis de 131 fuentes ni las 393 pruebas responsive históricas, ya documentados. No hubo envíos de formularios ni ejecución de funciones comerciales.
8. **Estados:** PR #27 abierto en Draft, no fusionado. Preview `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF` READY; SSO `all_except_custom_domains` activo. Ambos aliases productivos continúan en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. No hubo deployment, promoción ni cambios productivos.
9. **Preview:** https://project-wrapp-b1aszxxoe-lsandoval2-8260s-projects.vercel.app/
10. **Próxima acción:** habilitar en el entorno de pruebas HTTPS y autenticación válidos para ese hostname y entonces ejecutar el QA remoto pendiente. No pedir nuevamente autorización para PR/Preview ya creados. Mantener Draft y protección del sitio.

[Evidencia de estado y acceso](revalidacion-175032.json). [Auditoría técnica y limitaciones anteriores](INFORME-QA-FINAL.md).
