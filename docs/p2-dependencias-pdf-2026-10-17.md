# DEP-01 — Actualización del tooling PDF

Revisión del 17 de octubre de 2026. Se actualiza únicamente la dependencia de
herramientas y fixtures de `pypdf 6.10.0` a **6.21.1**. Las APIs web no importan
pypdf. Pillow continúa en 12.3.0 y se conserva la instalación de wheels con
`--require-hashes --only-binary=:all:` del setup existente.

## Elección de versión y evidencia oficial

Los dos avisos de la auditoría quedan fuera del rango de la versión elegida:

| Aviso | Rango afectado | Primera versión corregida |
| --- | --- | --- |
| [GHSA-x284-j5p8-9c5p](https://github.com/py-pdf/pypdf/security/advisories/GHSA-x284-j5p8-9c5p) | <6.10.2 | 6.10.2 |
| [GHSA-jw7q-gvrg-4vj3](https://github.com/py-pdf/pypdf/security/advisories/GHSA-jw7q-gvrg-4vj3) | <6.18.1 | 6.18.1 |

La elección incorpora la lectura actual del [índice oficial de seguridad](https://github.com/py-pdf/pypdf/security/advisories)
y del [changelog oficial](https://pypdf.readthedocs.io/en/6.21.1/meta/CHANGELOG.html).
El aviso [GHSA-5hx5-vpf9-5wcv](https://github.com/py-pdf/pypdf/security/advisories/GHSA-5hx5-vpf9-5wcv),
publicado el mismo día, afecta a versiones anteriores a 6.21.1 al abrir imágenes
etiquetadas `/DCTDecode` con parsers de formatos distintos de JPEG. Impide
considerar suficiente una actualización mínima a 6.18.1.

También se leyeron los avisos recientes
[GHSA-f54x-cmq8-qg57](https://github.com/py-pdf/pypdf/security/advisories/GHSA-f54x-cmq8-qg57),
[GHSA-cgf9-327m-v77c](https://github.com/py-pdf/pypdf/security/advisories/GHSA-cgf9-327m-v77c)
y [GHSA-6vvc-x485-93v7](https://github.com/py-pdf/pypdf/security/advisories/GHSA-6vvc-x485-93v7),
que indican rango afectado <6.21.0. Este último tiene una errata en el campo
«Patched versions» (`6.2.10`); el apartado Patches y el changelog identifican
6.21.0. La versión elegida supera ambos valores y no depende de corregir esa
errata por interpretación.

El [registro PyPI 6.21.1](https://pypi.org/pypi/pypdf/6.21.1/json) declara Python
>=3.9, wheel universal no retirado y lista `vulnerabilities` vacía en la lectura.
La consulta de 6.10.0 devuelve 61 entradas, incluidos alias de un mismo aviso;
esa cifra no representa 61 vulnerabilidades independientes. El registro puede
tener retrasos y estas consultas no certifican ausencia de vulnerabilidades.

El wheel descargado desde la URL oficial de PyPI tiene **405134 bytes** y SHA-256
`553e2d42f5bb3bb2a785a7d3de8ef90bb7df74b5413eff5a7b4388007ea9254b`,
idéntico al pin de `requirements-ci.txt` y al digest publicado por PyPI.
No se añaden dependencias de producción ni extras de pypdf.

## Compatibilidad y límites

La instalación se verificó en una virtualenv nueva fuera del checkout con
Python 3.12/Linux x86_64, conservando proxy y verificación TLS. Los fixtures
existentes cubren materializadores, selección y hashes de recursos. Dos casos
nuevos comprueban texto comprimido Flate, páginas e identidad de un JPEG nativo,
y el rechazo de un PNG inocuo de 2×2 píxeles falsamente etiquetado como JPEG,
sin invocar su parser PNG. Este último caso falla con 6.10.0 y pasa con 6.21.1.
No se ejecutó un PDF malicioso ni se generó un documento de consumo excesivo.

La actualización no autoriza procesar documentos arbitrarios. Conservar la
verificación previa de hashes y los límites de tiempo/memoria del proceso al
recibir originales externos. La actualización no sustituye los originales
privados ni certifica la reproducción de sus derivados: los 26 casos privados
siguen pendientes. Los resultados completos y SHA finales se registran en la
entrega P2 fuera del repositorio.
