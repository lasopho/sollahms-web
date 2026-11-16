# Continuidad — Preview aprobada; publicar Production verificado

Estado al 16/11/2026, America/Santiago. La autorización integral de corrección, verificación y publicación condicionada sigue vigente. No pedirla de nuevo.

Trabajar exclusivamente en `/private/tmp/sollahms-recorridos-20261115-local`, rama `codex/eliminar-recorridos-global-20261115`. No modificar ni cambiar de rama el checkout original de Documents ni `/Users/luissandoval/Projects/sollahms-publicacion` de Contacto. Consultar HEAD remoto antes de escribir y conservar avances posteriores. PR #27 permanece abierto y Draft, incluso tras la publicación; no fusionar automáticamente.

Leer `AGENTS.md` y `docs/recorridos-eliminacion-20261115/local-qa-20261115/INFORME-CIERRE.md`. Los informes históricos siguen preservados; sus bloqueos de red/SSO/artefactos están resueltos. El último hito documental anterior a esta aprobación fue `2e0759cac94b3a489ba51439e7214074fde8a6c8`.

## Artefacto y QA aprobados

Preview correctiva: https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app/ . Deployment `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi`, runtime declarado `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.

Salida existente recuperada directamente de las fuentes de ese deployment: `/private/tmp/sollahms-recorridos-recovery/output`. Son 1.660 archivos exactos: 1.602 estáticos, 57 archivos en siete bundles y config v3; 66 cambios aprobados y 1.594 preservados. Inventario SHA256 `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. No hubo build, generadores ni repetición de preparación o eliminación.

QA aprobado: 131 fichas × cuatro anchos = 524 parejas; 476 mediciones de los 119 mapas; encabezados/pies 524 y menú móvil 18; navegación, galerías, planos, comparación y formularios en 131 fichas; siete funciones con métodos seguros. Cero envíos comerciales o campos modificados. Los cuatro mapas se cerraron con reprobes dirigidos, abriendo `Etapa 2` de Ferroparque sin alterar sus dos mapas.

Gate independiente: `/private/tmp/sollahms-recorridos-access/qa-gate.json`, validado a las 00:59:57 Santiago, `eligibleForProductionPreparation:true`, cero fallos. Copia versionada en `docs/recorridos-eliminacion-20261115/local-qa-20261115/qa/gate/`. No repetir los 524 controles certificados sin una razón nueva. Se documentaron advertencias preexistentes de `allow`/`allowfullscreen` y bloqueos de telemetría/toolbar; no ocultar errores reales ni declarar cero advertencias.

## Siguiente etapa autorizada

1. Confirmar HEAD, PR Draft, proyecto/equipo, CLI y aliases actuales. CLI local 65.16.0, Node 24.22.3, usuario `lsandoval2-8260`. Proyecto `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`.
2. Preparar únicamente una copia idéntica del output aprobado bajo `.vercel/output` en un directorio aislado. Verificar la transferencia contra el inventario; no ejecutar `prepare-isolated.py`, builders ni generadores.
3. Crear Production sin dominios por CLI oficial, `--prebuilt --environment=production --skip-domain`, proyecto y scope explícitos. No usar `--verify`, sharelinks, bypasses nuevos, promoción de Preview ni despliegue ordinario de fuentes. La CLI admite el output sin `builds.json`; no añadir archivos a sus 1.660 entradas. No cambiar credenciales, variables o SSO.
4. Verificar READY, target production, fuentes/hash 1.660, siete lambdas, rutas originales/recursos, métodos seguros y un smoke de entorno con las seis fichas prioritarias a cuatro anchos. Usar caché separada por deployment y acceso nativo autenticado desde un directorio sin vincular; no copiar/extraer tokens. Scripts de verificación en `/private/tmp/sollahms-recorridos-production-verify`; aún esperan ID.
5. Solo después de aprobar ese Production, promover exclusivamente su ID sin reconstrucción. Reconsultar aliases/coordinar inmediatamente antes. Comprobar HTTP y HTTPS de `sollahms.cl` y `www.sollahms.cl`, portada, fichas, recursos y funciones sin enviar formularios.
6. Registrar deployment/hora local, conservar el anterior y actualizar informe, PR y este prompt. No declarar terminada la tarea mientras falten verificación productiva o publicación.

A la aprobación de QA todavía no se había creado Production ni promovido. Ambos aliases se revalidaron en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`; conservarlo como referencia de recuperación. SSO sigue `all_except_custom_domains` y los deployments automáticos continúan desactivados.

## Coordinación con Contacto

Su chat terminó la Preview, está idle y no tiene autorización propia para Production. PR #26/#28 siguen Draft; Contacto aprobado `967d556730e20ef86bae6ecee11ec6152434c8ae` cambia únicamente contacto.html. No hay intersección textual con Recorridos. Se informó expresamente que comenzaremos Production aislado tras QA, evitando operaciones simultáneas.

Esta publicación conserva el contacto.html productivo actual y sus ramas intactas; no incorpora su overlay todavía no publicado ni reemplaza los siete bundles certificados por su reconstrucción alternativa B. Una futura publicación de Contacto deberá conciliar su candidato con el nuevo baseline y conservar los 64 HTML y dos CSS sin recorridos. Comunicar el deployment final a esa tarea; no alterar ni fusionar sus PR.
