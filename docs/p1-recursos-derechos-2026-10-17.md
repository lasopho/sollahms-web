# P1 MED-001 y SRC-002 — recursos y derechos

Revisión del 17 de octubre de 2026, base `3866095`. Alcance: los dos hallazgos
del informe maestro de auditoría del 16 de octubre. No concede autorización de
publicación, tampoco prepara ni ejecuta un deployment.

## Resultado

MED-001 sigue bloqueado por insumos externos: **353 rutas seleccionadas ausentes**.
El inventario del transporte fuente vigente comprende 1039 rutas: 686 verificadas,
353 ausentes y ninguna diferencia de SHA-256, dimensiones o estructura detectada
en los archivos presentes. El alcance es el transporte fuente definido por los
selectores actuales; excluye planos sustituidos, candidatos y revisiones históricas.
No equivale al escáner más amplio de 1056 rutas activas de la auditoría original.

| Cartera | Requeridos | Verificados | Ausentes | Material necesario |
|---|---:|---:|---:|---|
| AJ Urbana | 104 | 104 | 0 | Ninguno |
| Ingevec | 165 | 0 | 165 | Derivados aprobados o originales autorizados para reproducirlos |
| Ecasa | 130 | 0 | 130 | Derivados aprobados o originales autorizados para reproducirlos |
| Leben | 43 | 0 | 43 | Derivados aprobados o los doce originales revisados |
| Sento | 283 | 277 | 6 | PDF originales internos fijados por SHA-256 |
| León | 310 | 305 | 5 | PDF originales internos fijados por SHA-256 |
| Ecasa oficiales | 4 | 0 | 4 | Dos originales y dos selecciones exactas del sidecar |

SRC-002 sigue bloqueado por documentación de derechos. Se preservan literalmente
`pending_contract_scope_verification` de Ecasa/Leben,
`publicPublicationApproved=false` de Leben y
`pending_explicit_ecasa_authorization`, `publicWeb=false`, `irisYapo=false` del
sidecar oficial. La autorización histórica para revisión protegida no prueba
permiso público, ni constituye autorización para publicar una Preview ahora.

## Investigación de recuperación

Se buscaron paquetes, originales y contratos en los directorios accesibles del
workspace y en Google Drive conectado. Las búsquedas Ecasa, Leben, iLeben,
Sollahms, Ingevec, brochure, nombres de inmobiliarias, ZIP/source.tgz y
contratos/convenios no localizaron el paquete requerido ni documentos pertinentes
de derechos. El resultado Ecasa fue una lista comercial ajena; Ingevec devolvió
un libro de leads, cuyo contenido no se consultó. La carpeta Brochure sólo contenía
un PDF Vista Parque ajeno a las identidades de estos lotes. No se descargaron esos
archivos ni se asumió que su acceso implicara autorización de reutilización.

La referencia histórica `/private/tmp/sollahms-pr4-reproduced-20261012/source.tgz`
no está disponible en esta instancia. Tampoco se localizó su equivalente en el
workspace. Los cuatro recursos oficiales Ecasa mantienen sus URL y hashes en
`data/ecasa-official-originals.json`; su uso autorizado documentado se limita a
revisión protegida. El entorno actual informa política de red `restricted`,
`enforced`, sin `ecasa.cl` entre los destinos permitidos. Una sonda GET al original
de Alto San Joaquín falló antes de llegar al servidor: `curl=7`, `HTTP=000`,
conexión al proxy no disponible. No se alteraron red, proxy o controles para
sortear el bloqueo. Esta sonda no determina si los recursos existen en el sitio
oficial o en Production.

**Recuperados: 0.** No se incorporaron imágenes, PDF, contratos ni derivados
reconstruidos. Para completar MED-001 se requiere transporte privado autorizado
de las rutas exactas. La disponibilidad pública de un archivo no resuelve SRC-002.

## Mejora técnica completada

`scripts/check-private-resources.py` permite comprobar los insumos antes de
importarlos al checkout. Reutiliza los selectores existentes de Sento, León,
Leben y sidecar Ecasa; recoge únicamente imágenes/planos seleccionados de AJ
Urbana, Ingevec y Ecasa. Verifica SHA-256, bytes cuando están documentados,
dimensiones de imágenes decodificables y número de páginas de los PDF. Rechaza
rutas no canónicas y enlaces simbólicos, y no crea placeholders, descarga,
descomprime, copia recursos ni cambia manifiestos o derechos.

El comando devuelve salida 1 mientras haya ausencias o diferencias. Incluso con
inventario íntegro, su resultado conserva `releaseApproved=false` y
`publicationApproved=false`: el informe no sustituye los gates de publicación.

Con las dependencias ya fijadas en `requirements-ci.txt`:

```sh
/workspace/.venvs/sollahms-web/bin/python -B scripts/check-private-resources.py \
  --output /tmp/sollahms-inventario-recursos.json
```

Para revisar un paquete privado **ya extraído y autorizado**, sin copiarlo a Git,
usar una carpeta canónica externa con la misma jerarquía `assets/...`:

```sh
/workspace/.venvs/sollahms-web/bin/python -B scripts/check-private-resources.py \
  --asset-root /tmp/sollahms-paquete-autorizado \
  --output /tmp/sollahms-inventario-paquete.json
```

El reporte se crea exclusivamente fuera del checkout y no sobrescribe otro
existente. Los manifiestos se leen desde el checkout; el paquete no aporta código
ni manifiestos a ejecutar. El hash esperado procede siempre de las evidencias
actuales. Sólo tras cerrar diferencias corresponde utilizar el flujo existente
de importación/materialización, sin relajar sus gates. Cualquier publicación
continúa requiriendo autorización separada.

## Evidencias y pruebas

Los resultados completos de esta ejecución permanecen fuera de Git, en
`/workspace/sollahms-p1-2026-10-17/recursos/`: inventario JSON de 1039 rutas,
CSV de los 353 faltantes, solicitudes por cartera y evidencia de búsqueda/red.
La condición anterior y posterior es la misma para los binarios: 353 pendientes;
ahora existe un preflight reproducible para comprobar su entrega autorizada.

Ocho pruebas sintéticas comprueban archivos exactos, ausencias sin placeholders,
corrupción, SHA/bytes/dimensiones alterados, enlaces simbólicos, rutas inseguras,
PDF y selección de las 1039 rutas con derechos intactos. No usan originales
privados ni proveedores. Aprobaron 8/8. También aprobaron 29/29 pruebas Node
existentes: 10 de originales oficiales Ecasa, 14 de publicación Ecasa y 5 de
publicación Leben. Las simulaciones confirman que recursos ausentes o alterados
siguen bloqueando la preparación y que los perfiles públicos requieren derechos.
Los 26 casos privados siguen pendientes.

## Desbloqueo documental de SRC-002

Para cada cartera, el titular o canal oficial debe aportar evidencia verificable
que permita contrastar:

- Identidad del autorizante y relación con los proyectos/materiales concretos.
- Archivos o lotes cubiertos y su correspondencia con fuentes/hashes actuales.
- Usos autorizados: revisión protegida, sitio público, adaptación/recorte y canales.
- Dominios, plazo, vigencia, atribución, límites, exclusiones y revocaciones.
- Permiso de terceros cuando el material acredita otro titular, como ESEPE.

No se transfieren permisos de AJ Urbana/Ingevec a Ecasa/Leben ni de un canal
Yapo/IRIS al sitio público. La comprobación documental no sustituye la posterior
autorización del usuario para integrar o publicar. Hasta contar con esa evidencia,
los derechos pendientes y todos los controles existentes permanecen intactos.
