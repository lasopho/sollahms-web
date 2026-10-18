# León: conciliación vigente de planos y pendientes

CAT-004. Conciliación de metadata: 17/10/2026. Revisión especializada retenida: 14/10/2026.

El [registro vigente](registro-vigente.md) conserva las 134 fichas. Esta capa describe sólo los 36 planos León ya revisados. No modifica los textos históricos de `data/registro-fichas.json`, ni vuelve a certificar los originales privados ausentes. No acredita disponibilidad comercial.

**36 planos: 29 confirmados, 5 discrepantes y 2 pendientes según la revisión retenida.** Hay 30 conjuntos de superficies completos y 6 incompletos; 3 planos tienen baños pendientes y 1 tiene identidad de variante pendiente. Son dimensiones distintas: un conjunto completo puede conservar una discrepancia de fuente, como Gregorio 03.

Las 36 rutas y todos los campos de superficies coinciden exactamente con el HTML. Se conserva `interior` frente a `útil`, la ausencia explícita de terraza y cada valor nulo. No se calcula terraza por diferencia ni se cierra un pendiente comercial a partir de una superficie.

Fuentes y hashes: [ledger derivado](../data/leon-pendientes-vigentes.json), [registro especializado](../data/leon-plan-surfaces.json) y [manifiesto](../data/brochures-leon.json). El ledger conserva íntegros los pendientes históricos por proyecto para consultar su alcance anterior.

## Estado por proyecto

| Proyecto | Planos | Superficies completas | Incompletas |
| --- | ---: | ---: | ---: |
| [jardines-de-ramon-cruz](../jardines-de-ramon-cruz.html#planos) | 8 | 6 | 2 |
| [condominio-parque-don-lautaro](../condominio-parque-don-lautaro.html#planos) | 3 | 3 | 0 |
| [condominio-uruguay](../condominio-uruguay.html#planos) | 4 | 3 | 1 |
| [gregorio-de-la-fuente-a](../gregorio-de-la-fuente-a.html#planos) | 9 | 7 | 2 |
| [bcome](../bcome.html#planos) | 12 | 11 | 1 |

## Estado por plano

| Plano | Estado retenido | Pendientes actuales por campo | Fuente |
| --- | --- | --- | --- |
| jardines-de-ramon-cruz-01 | pendiente | useful, terrace, total | [Oficial](https://www.ileon.cl/proyectos/condominio-jardines-de-ramon-cruz/), PDF p. 9 |
| jardines-de-ramon-cruz-02 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-jardines-de-ramon-cruz/), PDF p. 9 |
| jardines-de-ramon-cruz-03 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-jardines-de-ramon-cruz/), PDF p. 10 |
| jardines-de-ramon-cruz-04 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-jardines-de-ramon-cruz/), PDF p. 10 |
| jardines-de-ramon-cruz-05 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-jardines-de-ramon-cruz/), PDF p. 10 |
| jardines-de-ramon-cruz-06 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-jardines-de-ramon-cruz/), PDF p. 11 |
| jardines-de-ramon-cruz-07 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-jardines-de-ramon-cruz/), PDF p. 11 |
| jardines-de-ramon-cruz-08 | discrepante | terrace | [Oficial](https://www.ileon.cl/proyectos/condominio-jardines-de-ramon-cruz/), PDF p. 12 |
| condominio-parque-don-lautaro-01 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-parque-don-lautaro/), PDF p. 10 |
| condominio-parque-don-lautaro-02 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-parque-don-lautaro/), PDF p. 11 |
| condominio-parque-don-lautaro-03 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-parque-don-lautaro/), PDF p. 12 |
| condominio-uruguay-01 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-uruguay/), PDF p. 12 |
| condominio-uruguay-02 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-uruguay/), PDF p. 13 |
| condominio-uruguay-03 | discrepante | useful, total | [Oficial](https://www.ileon.cl/proyectos/condominio-uruguay/), PDF p. 14 |
| condominio-uruguay-04 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-uruguay/), PDF p. 15 |
| gregorio-de-la-fuente-a-01 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 12 |
| gregorio-de-la-fuente-a-02 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 12 |
| gregorio-de-la-fuente-a-03 | discrepante | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 13 |
| gregorio-de-la-fuente-a-04 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 13 |
| gregorio-de-la-fuente-a-05 | discrepante | useful, total | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 14 |
| gregorio-de-la-fuente-a-06 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 14 |
| gregorio-de-la-fuente-a-07 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 15 |
| gregorio-de-la-fuente-a-08 | discrepante | useful | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 15 |
| gregorio-de-la-fuente-a-09 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/condominio-gregorio-de-la-fuente/), PDF p. 16 |
| bcome-01 | confirmado | bathrooms | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 7 |
| bcome-02 | pendiente | interior, terrace, total, identity, bathrooms | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 7 |
| bcome-03 | confirmado | bathrooms | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 7 |
| bcome-04 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 8 |
| bcome-05 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 8 |
| bcome-06 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 8 |
| bcome-07 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 8 |
| bcome-08 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 9 |
| bcome-09 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 9 |
| bcome-10 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 10 |
| bcome-11 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 10 |
| bcome-12 | confirmado | Sin campos pendientes en esta revisión | [Oficial](https://www.ileon.cl/proyectos/edificio-b-come/), PDF p. 10 |

## Insumos externos para recertificar

Solicitar los cinco PDF originales con SHA-256 del manifiesto y las plantas oficiales asociadas a los 36 identificadores, con acceso a los archivos de evidencia de la revisión. Para los seis conjuntos incompletos, confirmar explícitamente cada campo listado; para B.Come 02, la variante exacta; para los tres estudios, el número de baños. La confirmación debe conservar página, identificador oficial y fecha. Los cinco estados discrepantes no se convierten en confirmados por coincidir con el HTML.

Regenerar: `python scripts/build-leon-pending-register.py`; verificar sin escribir: añadir `--check`.
