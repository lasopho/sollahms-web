# Continuación local, publicación y reversión

Estado actual: paquete comprobado localmente y **publicación del artefacto exacto autorizada por el propietario**. La ejecución está bloqueada antes de crear el candidato por el canal disponible; véase [publication/report.md](publication/report.md). La autorización vigente permite producción sin dominios, QA protegido, activación de los dos alias indicados y reversión condicionada, conservando los demás límites. Las instrucciones de reconstrucción siguientes son históricas/reproducibles: **no reconstruir otra versión bajo la autorización del artefacto actual**.

## 1. Completar la fuente exacta

El `release/config.json` original completo ya se recuperó del adjunto del propietario y se guardó en:

`/workspace/work/publish-nine-copy-20261108/recovery.local/src/release/config.json`

Debe tener SHA-256 `0440b96a1986452092e2249bc9c6f86b86788c979ff4296f4618b1c125dbe985` y SHA-1 `0e51cb57914c40cd4fa14f7bdff3894fd375dbc1`. No usar el JSON parcial, crear rutas nuevas, reemplazarlo por `vercel.json` ni usar configuración de otra publicación.

Antes de seguir, confirmar mediante consultas de solo lectura que `sollahms.cl` continúa asociado al mismo despliegue. Si cambió, recuperar la nueva base completa y revisar únicamente conflictos de estas nueve mejoras; los pines actuales deben fallar antes de generar una versión obsoleta.

## 2. Construir localmente

Desde el checkout de `codex/seo-medicion-20261108`, para una nueva reproducción usar un directorio de trabajo inexistente (el mostrado ya contiene el paquete comprobado):

```sh
python scripts/prepare-nine-copy-local.py \
  --source-root /workspace/work/publish-nine-copy-20261108/recovery.local/src \
  --work-dir /workspace/work/publish-nine-copy-20261108/build-local \
  --build-only
```

El destino debe ser nuevo. El script no ejecuta `vercel build`, scripts del package manager, despliegues ni instalaciones; ejecuta únicamente `node prepare-orientation-production.mjs`, con bytes previamente autenticados, en dos directorios aislados y sin credenciales en su entorno. El constructor real se conserva sin cambios. La configuración Git del checkout no interviene ni se modifica.

Un resultado satisfactorio deja dos árboles `.vercel/output`, inventarios SHA-256 y logs, sin tar todavía. La diferencia runtime debe limitarse a `static/index.html`, `static/centro-orientacion.html`, `static/guia-hipotecaria.html` y `static/comparador-hipotecario.html`; todos los demás archivos deben ser idénticos. La copia G01 del generador permanece en Git y no debe entrar al paquete público.

## 3. Probar el resultado empaquetado

```sh
python tests/seo-nine-copy-browser.py \
  --baseline-static-root /workspace/work/publish-nine-copy-20261108/build-local/baseline/.vercel/output/static \
  --candidate-static-root /workspace/work/publish-nine-copy-20261108/build-local/candidate/.vercel/output/static \
  --output /workspace/work/publish-nine-copy-20261108/qa-package.local
```

Exigir ejecución nueva aprobada: cuatro páginas, móvil/escritorio, base/candidato; nueve cambios únicos; G01 conservado; enlaces previstos; fingerprints iguales de formularios, controles, consentimiento y contacto; resultados numéricos equivalentes; sin desbordamiento ni errores nuevos. Revisar capturas de ambos tamaños. Toda API debe quedar interceptada y los destinos remotos bloqueados; no permitir POST a servicios reales ni navegar a fichas. Los fixtures no acreditan funcionamiento de proveedores externos.

Reejecutar la regresión de fuentes `python tests/test_seo_nine_copy.py` para comprobar los nueve cambios y durabilidad G01. No regenerar páginas. Después del cierre indicado más abajo, comprobar que el tar y sus inventarios siguen coincidiendo; su SHA-256 en `summary.json` será la huella concreta de la versión a revisar. La validación de rutas deriva del config fuente exacto y el constructor original, más la igualdad de configuración compilada de base/candidato. No sustituye una comprobación HTTP del enrutamiento de Vercel posterior a una publicación autorizada.

Guardar únicamente evidencias sanitizadas en este directorio o en un avance nuevo; mantener capturas, exportaciones completas, funciones y artefactos privados fuera de Git y del paquete estático. Verificar otra vez protecciones de despliegue antes de hacer push a esta rama. No modificar `main`.

Después del QA aprobado y la revisión visual, finalizar **solo el nuevo directorio de reproducción**, usando su resultado real de navegador:

```sh
python scripts/prepare-nine-copy-local.py \
  --source-root /workspace/work/publish-nine-copy-20261108/recovery.local/src \
  --work-dir /workspace/work/publish-nine-copy-20261108/build-local \
  --finalize-after-qa /workspace/work/publish-nine-copy-20261108/qa-package.local/results.json
```

El cierre revalida entradas, inventarios y el QA de esos árboles exactos; crea `sollahms-nine-copy.vercel-output.tar.gz` y comprueba todos sus bytes. No permite sobrescribir un artefacto existente. La versión actual ya se finalizó: no repetir este comando sobre ella.

## 4. Preparar la autorización de la versión concreta

El [informe de cierre](completion/report.md) registra artefacto, tamaño, SHA-256, base, inventario y resultados nuevos de QA. **La autorización explícita de esa huella ya fue recibida; no volver a pedirla si se conservan las condiciones.** Cualquier reproducción diferente queda fuera de esa autorización.

## 5. Publicación futura — NO ejecutada

Tras autorización, reconfirmar base, proyecto y huella; extraer el artefacto en una carpeta aislada y verificar su inventario. Emplear el flujo manual de artefacto explícito/Build Output API ya utilizado por el proyecto, con las funciones y rutas conservadas y configuración de proveedor existente. No publicar el checkout completo ni un manifiesto histórico por defecto. No subir documentación, credenciales, `.local`, capturas o exports.

El proyecto de destino es `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH` del equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`. Crear producción **sin asignar dominios** mediante `--prebuilt --prod --skip-domain` o equivalente realmente disponible; esperar READY y comprobar el candidato con acceso autorizado existente. Reconfirmar después que ambos dominios siguen en la base. Activar solo el mismo despliegue comprobado mediante asignación individual de `sollahms.cl` y `www.sollahms.cl`; no efectuar promoción general que pueda mover otros alias. La autorización existe, pero todavía no se ha creado el candidato por el bloqueo documentado. Mantener intactas protecciones y despliegues automáticos.

Después de la publicación autorizada: comprobar alias efectivos, bytes de las cuatro páginas, recursos, redirecciones/cabeceras y servicios externos mediante el procedimiento permitido, interceptando cualquier envío de prueba hasta que exista autorización específica para una verificación real de contacto. No afirmar entrega de correos/CRM, reservas ni UF a partir de fixtures locales.

## 6. Reversión futura — NO ejecutada

Conservar `dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ` como destino de reversión mientras siga siendo la base. Si esta publicación presenta una regresión atribuible, comprobar primero que sigue siendo la activa y restaurar únicamente los dos alias autorizados a la base, sin reconstruir desde `main`, mover otros destinos ni cambiar servicios o protecciones. Confirmar los alias y respuestas HTTP después de revertir. Si cambió la base antes de publicar, detenerse para no sobrescribir esa intervención.

No se realizó rollback, promoción, cambio de alias, dominio, configuración ni ningún despliegue de preview o producción durante esta preparación.
