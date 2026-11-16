# Cierre de revalidación — 15/11/2026, 19:38:58 America/Santiago

**Bloqueo sin resolver: CONNECT 403 del proxy. No hay nueva aprobación de QA ni publicación.**

1. **Objetivo y alcance:** reanudar QA y publicación condicionada ya autorizados, comenzando por comprobar acceso efectivo a la Preview existente.
2. **Completado:** lectura de solicitud, instrucciones y cierre; fetch y comprobación de rama sin cambios remotos posteriores; nuevo GET autenticado mediante CLI; consultas de PR, deployment, SSO, aliases y política del entorno.
3. **Pendiente:** HTTP real de portada, 131 fichas, recursos, siete funciones y rutas internas; QA de 131 × 1440/768/390/320 = 524 combinaciones; después Production verificado sin dominios, promoción y comprobación de ambos dominios. Nuevas fichas visuales: 0.
4. **Incidencia:** la revisión efectiva del entorno sigue siendo 1 y no permite `project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app`. El nuevo `vercel curl` autenticado devuelve HTTP 000 y CONNECT 403 antes de alcanzar el deployment. No es un rechazo de autorización del propietario. No se probó una vía indirecta ni se modificaron red, SSO o credenciales.
5. **Archivos:** sólo nueva documentación de revalidación, informe principal y continuidad. El prompt previo se archivó. Sin cambios de runtime ni sobrescritura de evidencias históricas.
6. **Rama y commits:** `codex/eliminar-recorridos-global-20261115`; HEAD recibido `ea7c5ad7221de862d8725847ebf580d134d3ce14`; runtime `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`; evidencia prebuilt y runner `23de970853a2d2e1235cd9cf71addecefc7caa70`. El commit documental de esta comprobación figura en la entrega y el historial.
7. **Pruebas:** GET nuevo bloqueado por proxy. No se repitieron empaquetado, 1.603 GET locales, imports, hashes ni controles históricos ya certificados. Cero envíos comerciales y funciones remotas ejecutadas. El entorno no permite certificar HTTP, responsive o interactividad del sitio.
8. **Estados:** PR #27 abierto, Draft y sin merge. `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi` READY, SSO `all_except_custom_domains` habilitado. Los aliases `sollahms.cl` y `www.sollahms.cl` conservan `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. Sin nuevo deployment, preparación Production, promoción ni publicación.
9. **Preview:** https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app/
10. **Próxima acción:** aplicar realmente al entorno activo el acceso HTTPS a ese hostname y a los recursos de mapas necesarios, preservando SSO; comprobar una conexión nueva. Después continuar con el mismo candidato y autorización integral, sin pedir nuevas confirmaciones de publicación ni recrear la Preview.

[Evidencia de esta comprobación](REVALIDACION-193858.json). [Cierre del hito prebuilt y pruebas preservadas](INFORME-CIERRE.md). Fecha/hora de publicación final: no corresponde, porque no se publicó.
