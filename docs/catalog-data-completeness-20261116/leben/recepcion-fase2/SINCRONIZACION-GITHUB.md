# Sincronización de documentación Leben

El propietario autorizó expresamente «Autorizar exclusión y sincronizar». La exclusión mínima `git.deploymentEnabled["codex/auditoria-leben-20261116"] = false` está aplicada en el checkout de auditoría. Los demás valores de vercel.json se conservan. No se modifica main.

Estado: exclusión aplicada y validada, documentación preparada para sincronizar. La verificación remota y la consulta de deployments se registrarán después del push. No se declara completado antes de esa verificación.

Se utiliza Git para preservar exactamente los commits certificados, los hashes y los binarios del expediente. Los commits sin ref no se consideran una sincronización durable. No se crea PR ni se ejecutan generadores.

La integración Vercel está conectada y las ramas omitidas se habilitan por defecto según https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled . La exclusión debe viajar en el primer commit de la rama remota. Autorización y alcance: AUTORIZACION-SINCRONIZACION.json. Análisis previo: SEGURIDAD-SINCRONIZACION-GITHUB.json.
