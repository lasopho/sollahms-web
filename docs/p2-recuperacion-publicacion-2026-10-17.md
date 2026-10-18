# Recuperación P2 y preparación del PR apilado

Se recuperaron los 19 commits originales desde el respaldo privado autorizado,
con base exacta P1 `39006d3a6c96bd4154dd99eb6e914c5857393a3b`, HEAD
`840e00d34e8ace11080af54088df16fcd8d4e6c2` y árbol
`96534578544d7e1f3961554ba76c71c3cd948d36`.
El ZIP coincide con SHA-256
`986785b6e6d023d7fb7606e9f0df6cf0507f1f3065a580777e2a2d1a07db2545`;
su verificador aprobó los 918 archivos. La recuperación utilizó el bundle,
sin aplicar parches ni reescribir commits, y comprobó SHA, padres y árboles.

El entorno arrancó, pero sólo conservaba un checkout limpio de main; no
conservaba P2, archivos de preparación ni objetos Git inalcanzables. El commit
técnico original `e599114cdeb276c2028b9778d17cad04dcb9833a` tampoco estaba
disponible mediante lectura de GitHub o fetch de ese objeto. Por ello este
commit es un sustituto técnico nuevo autorizado, no una recuperación de ese
SHA ni una certificación de igualdad con su árbol desconocido.

El sustituto habilita el PR sobre `codex/leon-cartera-preview` en el workflow
existente y hace checkout del SHA exacto de la cabecera del PR. Conserva
íntegros los pasos nativos, permisos de lectura, acciones fijadas, historia
completa y dependencias con hashes. Añade seis comprobaciones de esos límites;
el inventario pasa de 399 a 405 Node y conserva 198 Python y 26 casos privados
pendientes. No se elimina ni rebaja ninguna validación existente.

`vercel.json` conserva exactamente el blob
`470459fa3e10fff13ddfe1d935f830c85b7000e2`: main y P1 mantienen sus reglas
`false`; P2 no tiene una entrada explícita. El usuario autorizó publicar
exclusivamente `codex/p2-revision-sin-deploy-20261017`, crear un PR en borrador
sobre P1, ejecutar Actions y aceptar una posible Preview privada automática.
No se modifica la configuración remota ni se solicita un deployment manual.
Los packagers, guardas de release y derechos conservan sus bytes.

Los informes P2 previos describen el corte original de 19 commits y siguen
siendo evidencia histórica. Este documento registra el cambio técnico
posterior. Los resultados efectivos de pruebas y publicación se registran en
la entrega y el PR, sin presentarlos como ya ejecutados por este documento.
Continúan pendientes los 26 casos privados, 353 recursos ausentes y los demás
bloqueos externos documentados. No hay autorización para merge, Production,
promoción, dominios, DNS, credenciales, correos ni reservas reales.
