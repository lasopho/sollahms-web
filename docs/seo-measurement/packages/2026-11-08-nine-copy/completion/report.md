# Paquete local construido y comprobado — sin publicación

**8 de noviembre de 2026, America/Santiago.** El bloqueo de `release/config.json` quedó resuelto. Las fuentes privadas y el adjunto permanecen fuera de GitHub. No se desplegó, publicó, fusionó ni modificó ninguna protección.

## Archivo original recuperado

El propietario aportó `config-response.json`: 4376 bytes, JSON válido con una única clave `data`, sin error ni truncamiento. La decodificación base64 estricta produjo **3271 bytes**, sin reformatear ni normalizar. Ambas huellas coinciden exactamente:

- SHA-1: `0e51cb57914c40cd4fa14f7bdff3894fd375dbc1`.
- SHA-256: `0440b96a1986452092e2249bc9c6f86b86788c979ff4296f4618b1c125dbe985`.

Se incorporó exclusivamente al área privada `recovery.local/src/release/config.json`, reutilizando los 1647 archivos existentes. Los **1648 archivos** coinciden con el registro autenticado de producción. Evidencia: [config-verification.json](config-verification.json).

## Base y construcción

Se confirmó por lectura que `sollahms.cl` y `www.sollahms.cl` siguen asociados a **`dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ`**, referencia de publicación `d7e98eb61edc3b8577b0fe7ec189e7c0ad7e0d53`. Las nueve mejoras se conservan desde **`ad84faac50cfa434fdcfaadbd0a139fbd6e5ab0d`**; se continuó sobre `cd08c13` en `codex/seo-medicion-20261108`.

El preparador existente ejecutó localmente el constructor original autenticado, **sin modificarlo**, para reconstruir base y candidato. Ambos terminaron con código 0. No hubo instalaciones, comandos Vercel de construcción/publicación ni credenciales en el entorno de esos procesos. Se añadió al preparador la separación `--build-only` / `--finalize-after-qa`, para generar el tar únicamente después del QA aprobado; no se cambió el sistema de construcción original.

Los dos paquetes tienen 1648 rutas idénticas. Solo difieren:

- `static/index.html`
- `static/centro-orientacion.html`
- `static/guia-hipotecaria.html`
- `static/comparador-hipotecario.html`

Los **1644 archivos restantes**, incluidos los 57 archivos de funciones, configuración, recursos, datos y fichas, son idénticos. Las 131 fichas se comprobaron solo por rutas y hashes. Se conservaron los bytes de producción de `entorno-desarrollo-urbano.html`, diferentes de la copia Git histórica. La configuración de salida conserva las 24 rutas originales y las dos salvaguardas 410/308 del constructor publicado; base y candidato tienen el mismo SHA-256 de configuración. G01 sigue también en el generador existente, sin nuevos cambios.

Evidencias: [base vigente](production-base.json), [construcción](build-summary.json), [integridad del paquete](package-integrity.json).

## Pruebas nuevas sobre esta versión

| Comprobación | Resultado |
|---|---|
| Regresión de fuentes y generador G01 | 8 aprobadas |
| Pruebas existentes aplicadas a los HTML empaquetados | 6 aprobadas; nueve mejoras únicas y reversión exacta a la base |
| Aislamiento del lector de paquetes del navegador | 6 aprobadas |
| Cierre del preparador tras QA, rechazo de cambios/inyecciones y archivo exacto | 4 aprobadas con datos sintéticos |
| Regresión del Centro y contactos, con transporte inyectado | 18 aprobadas; no certifican proveedores externos |
| Navegador sobre paquetes reales | 16 cargas, 8 pares aprobados, 12 validaciones de formularios vacíos |
| Visualización | 16 capturas revisadas: ocho elementos en escritorio 1440×1000 y móvil 390×844 |
| Archivo final | 1648 miembros regulares y únicos; todos sus hashes coinciden con el candidato comprobado |

El navegador usó los recursos propios de cada paquete, locale `es-CL` y zona `America/Santiago`, entre **20:10:00 y 20:10:38**. No hubo excepciones JavaScript, recursos locales fallidos, desbordamiento ni regresiones de formularios, consentimiento, contacto, enlaces o cálculos. G01 permanece visible antes de las acciones existentes en ambos tamaños. Los 12 GET de UF fueron interceptados; ningún POST llegó a los servidores locales ni se permitió tráfico a proveedores.

Los resultados numéricos sintéticos coincidieron antes/después: comparador 20,09 UF; guía 19,39 UF y 20 filas; presupuesto 2269,74 UF; cotizaciones 8/14,03 UF. No son ofertas, tasas vigentes ni mediciones SEO. La fuente externa de Google del comparador se bloqueó deliberadamente: cuatro incidencias iguales en base y candidato y algunos glifos de sustitución en aislamiento. No se alteraron estilos para ocultarlo ni se certifica con ello la carga externa en producción.

Resultados resumidos: [browser-summary.json](browser-summary.json). Logs de fuentes: [8 pruebas](source-regression.txt), [6 pruebas de aislamiento](browser-input-tests.txt), [4 pruebas de cierre](finalization-tests.txt), [18 pruebas del Centro](orientation-source-tests.txt). El resultado detallado y las 16 capturas permanecen en `/workspace/work/publish-nine-copy-20261108/qa-package.local/`, fuera de Git y del artefacto.

## Artefacto concreto para revisar

**Ruta:** `/workspace/work/publish-nine-copy-20261108/build-local/sollahms-nine-copy.vercel-output.tar.gz`

**Tamaño:** 211687360 bytes.

**SHA-256:**

```text
17f4496b411f779029494de4c6757c30cca41f8547992333f1e76523444c035d
```

Se generó después del QA y se volvió a leer íntegramente. Contiene únicamente `.vercel/output/` y sus archivos runtime verificados: sin documentación, pruebas, capturas, adjuntos, exportaciones de recuperación, credenciales, `.local` ni rutas fuera de ese árbol. No se subió el artefacto, las funciones recuperadas ni el adjunto a GitHub. Evidencia: [artifact-verification.json](artifact-verification.json).

## Punto de parada

El paquete queda **comprobado localmente y pendiente de autorización explícita del propietario sobre esta huella**. No se ejecutó publicación ni reversión. El [runbook existente](../runbook.md) conserva el proyecto de destino y el despliegue base de reversión.

Antes de una publicación autorizada habrá que reconfirmar que producción no cambió y que la huella del archivo sigue siendo la indicada. Después de publicar corresponderá comprobar alias, HTTP/cabeceras/redirecciones y servicios externos: los fixtures locales no certifican UF vigente, entrega de correos/CRM ni reservas reales. No hay un bloqueo local pendiente de construcción o QA.
