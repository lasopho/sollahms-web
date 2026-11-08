# Continuación local, publicación y reversión

Estado actual: bloqueado por `release/config.json`. Este procedimiento no autoriza ninguna publicación. Las rutas privadas indicadas contienen recuperación parcial, no un artefacto listo.

## 1. Completar la fuente exacta

Recuperar de una exportación autorizada de fuentes de `dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ`, o de su archivo congelado conservado, el `release/config.json` original completo. Guardarlo en:

`/workspace/work/publish-nine-copy-20261108/recovery.local/src/release/config.json`

Debe tener SHA-256 `0440b96a1986452092e2249bc9c6f86b86788c979ff4296f4618b1c125dbe985` y SHA-1 `0e51cb57914c40cd4fa14f7bdff3894fd375dbc1`. No usar el JSON parcial, crear rutas nuevas, reemplazarlo por `vercel.json` ni usar configuración de otra publicación.

Antes de seguir, confirmar mediante consultas de solo lectura que `sollahms.cl` continúa asociado al mismo despliegue. Si cambió, recuperar la nueva base completa y revisar únicamente conflictos de estas nueve mejoras; los pines actuales deben fallar antes de generar una versión obsoleta.

## 2. Construir localmente

Desde el checkout de `codex/seo-medicion-20261108`, ejecutar **solo cuando exista el recurso anterior**:

```sh
python scripts/prepare-nine-copy-local.py \
  --source-root /workspace/work/publish-nine-copy-20261108/recovery.local/src \
  --work-dir /workspace/work/publish-nine-copy-20261108/build-local
```

El destino debe ser nuevo. El script no ejecuta `vercel build`, scripts del package manager, despliegues ni instalaciones; ejecuta únicamente `node prepare-orientation-production.mjs`, con bytes previamente autenticados, en dos directorios aislados y sin credenciales en su entorno. El constructor real se conserva sin cambios. La configuración Git del checkout no interviene ni se modifica.

Un resultado satisfactorio deja dos árboles `.vercel/output`, inventarios SHA-256, logs y `sollahms-nine-copy.vercel-output.tar.gz`. La diferencia runtime debe limitarse a `static/index.html`, `static/centro-orientacion.html`, `static/guia-hipotecaria.html` y `static/comparador-hipotecario.html`; todos los demás archivos deben ser idénticos. La copia G01 del generador permanece en Git y no debe entrar al paquete público.

## 3. Probar el resultado empaquetado

```sh
python tests/seo-nine-copy-browser.py \
  --baseline-static-root /workspace/work/publish-nine-copy-20261108/build-local/baseline/.vercel/output/static \
  --candidate-static-root /workspace/work/publish-nine-copy-20261108/build-local/candidate/.vercel/output/static \
  --output /workspace/work/publish-nine-copy-20261108/qa-package.local
```

Exigir ejecución nueva aprobada: cuatro páginas, móvil/escritorio, base/candidato; nueve cambios únicos; G01 conservado; enlaces previstos; fingerprints iguales de formularios, controles, consentimiento y contacto; resultados numéricos equivalentes; sin desbordamiento ni errores nuevos. Revisar capturas de ambos tamaños. Toda API debe quedar interceptada y los destinos remotos bloqueados; no permitir POST a servicios reales ni navegar a fichas. Los fixtures no acreditan funcionamiento de proveedores externos.

Reejecutar la regresión de fuentes `python tests/test_seo_nine_copy.py` para comprobar los nueve cambios y durabilidad G01. No regenerar páginas. Comprobar que el tar y sus inventarios siguen coincidiendo; su SHA-256 en `summary.json` será la huella concreta de la versión a revisar. La validación de rutas deriva del config fuente exacto y el constructor original, más la igualdad de configuración compilada de base/candidato. No sustituye una comprobación HTTP del enrutamiento de Vercel posterior a una publicación autorizada.

Guardar únicamente evidencias sanitizadas en este directorio o en un avance nuevo; mantener capturas, exportaciones completas, funciones y artefactos privados fuera de Git y del paquete estático. Verificar otra vez protecciones de despliegue antes de hacer push a esta rama. No modificar `main`.

## 4. Preparar la autorización de la versión concreta

Actualizar el informe con el artefacto real, tamaño, SHA-256, base y commits exactos, inventario comparado y resultados nuevos de QA. **Detenerse para la autorización explícita del propietario sobre esa huella.** Hoy no existe una huella de artefacto que pueda autorizarse.

## 5. Publicación futura — NO ejecutada

Tras autorización, reconfirmar base, proyecto y huella; extraer el artefacto en una carpeta aislada y verificar su inventario. Emplear el flujo manual de artefacto explícito/Build Output API ya utilizado por el proyecto, con las funciones y rutas conservadas y configuración de proveedor existente. No publicar el checkout completo ni un manifiesto histórico por defecto. No subir documentación, credenciales, `.local`, capturas o exports.

El proyecto de destino es `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH` del equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`. La operación concreta de crear/publicar/promover el artefacto y asignar dominios queda **diferida**: no se ejecutó ningún comando o mutación de Vercel. El nuevo ID de despliegue solo podrá registrarse cuando se autorice y realice esa operación. Mantener intactas protecciones y despliegues automáticos.

Después de la publicación autorizada: comprobar alias efectivos, bytes de las cuatro páginas, recursos, redirecciones/cabeceras y servicios externos mediante el procedimiento permitido, interceptando cualquier envío de prueba hasta que exista autorización específica para una verificación real de contacto. No afirmar entrega de correos/CRM, reservas ni UF a partir de fixtures locales.

## 6. Reversión futura — NO ejecutada

Conservar `dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ` como destino de reversión mientras siga siendo la base. Si una publicación posterior autorizada presenta una regresión, el operador autorizado puede restaurar esa publicación anterior mediante el mecanismo de rollback/promoción manual del proyecto, sin reconstruir desde `main` y sin cambiar servicios o protecciones. Confirmar los alias y respuestas HTTP después de revertir. Si cambió la base antes de publicar, actualizar también este destino con evidencia.

No se realizó rollback, promoción, cambio de alias, dominio, configuración ni ningún despliegue de preview o producción durante esta preparación.
