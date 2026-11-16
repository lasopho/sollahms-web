# Nórdico: fuentes y pendientes

Revisión: 13/10/2026. Nórdico se añade como `edificio-nordico`, con una sola ficha de Leben. El catálogo resultante tiene 137 proyectos. Las 136 filas comerciales anteriores, los 15 proyectos Ecasa y Own se conservan exactamente; el fixture `tests/fixtures/nordico-catalogue-baseline.json` verifica esta conservación. Esta tanda no autoriza merge ni cambios en Production.

## Información acreditada

La [página oficial de Nórdico](https://nordico.ileben.cl/) identifica la esquina Del Rosario/Mirador en Puerto Varas, venta en blanco, departamentos de 1, 2 y 3 dormitorios y un rango general de 42 a 120 m². El rango no distingue superficie útil, terraza ni total; esas categorías permanecen vacías.

El precio desde UF 4.746 corresponde a la unidad 101, de 1 dormitorio y 1 baño, y excluye estacionamiento y bodega. La ficha conserva la unidad, las exclusiones y la necesidad de confirmar disponibilidad y condiciones. El baño de esa unidad no acredita baños para todas las tipologías.

La sección de espacios comunes acredita quincho techado, salón gourmet, piscina temperada, hidromasaje, sauna, gimnasio, patio interior y bicicletero. Los renders no se usan para inferir materiales, equipamiento interior ni cantidad de pisos.

## Imágenes y trazabilidad

Se seleccionaron tres originales observados en el documento oficial y descargados mediante el inventario de recursos del navegador. Se revisaron visualmente completos antes de convertirlos a WebP, calidad 94 y tamaño original, sin aumentar su resolución.

| Original oficial | Tipo | Dimensiones |
| --- | --- | --- |
| `PERSPECTIVA-NORDICO-baja.jpg` | Render de fachada | 1969 × 1108 |
| `PERS-NORDICO-AREA-baja-e1770234860807.jpg` | Render del edificio y entorno | 1890 × 790 |
| `Aerea_Vista_Volcanes.jpg` | Fotografía del entorno | 1200 × 588 |

Las URL completas, dimensiones y SHA-256 originales y derivados están en `data/fuentes-imagenes.json`; su asociación con la ficha está en `data/fichas-proyectos.json`. Los ocho iconos de servicios de 61 × 61 píxeles se excluyeron de la selección fotográfica: no son fotografías y su resolución no sirve para portada ni galería. Ninguna fotografía aceptada presentó pixelación evidente ni desenfoque incompatible con su uso.

## Pendientes de Nórdico

- Brochure oficial y planos individuales por modelo.
- Superficies útiles, terrazas y totales por modelo; clasificación del rango 42–120 m².
- Fecha o semestre de entrega, cantidad de departamentos y pisos.
- Terminaciones y equipamiento de los departamentos.
- Baños por tipología y disponibilidad y precios por unidad.
- Verificación visual del [visor de ubicación oficial](https://www.lanube360.com/ileben/edificio-nordico/). Está enlazado mediante iframe en la página de Nórdico; su funcionamiento y alcance no se acreditaron. No se publica como recorrido interior.

La ficha muestra los planos y superficies por modelo como pendientes de confirmación. Este bloque se genera desde `planPendingNote`; no depende de una edición manual posterior de HTML.

## Parque Germania: una sola identidad

La [página de Leben](https://parquegermania.ileben.cl/) y la [página de ESEPE](https://www.esepe.cl/proyecto/parque-germania) identifican el mismo nombre, dirección Diagonal Germania 200 en Puerto Montt y teléfono comercial +56 9 7798 9175. El [brochure oficial de ESEPE](https://esepe.cl/wp-content/uploads/BROCHURE-PARQUE-GERMANIA.pdf) también publica esos datos. Estas coincidencias sustentan una sola identidad de proyecto con presencia comercial en ambos canales.

Las fuentes consultadas no acreditan una relación societaria, participación, mandato contractual o cesión entre ESEPE y Leben. No se afirma ninguna de esas relaciones. La ficha existente `parque-germania` y su información comercial acreditada se conservan; no se crea otra ficha bajo ESEPE ni se reemplaza su precio con una oferta de otra unidad o canal.

Existen diferencias documentales que deben conservarse por fuente: Leben publica 15 pisos y un rango de 29,5–91 m², mientras la [nota de ESEPE de 2023](https://esepe.cl/descubrepuertomontt/) indica 16 pisos y la descripción general de su ficha actual usa 29,50–81,65 m². No se mezclan estas cifras ni se inventa una conciliación. Los originales de esta tanda y la confirmación por unidad o etapa deben resolver cualquier dato comercial específico.

## Verificación reproducible

`python3 scripts/build-project-details.py --slugs edificio-nordico --review-date 2026-10-13 --branch codex/leben-brochures-nordico` genera únicamente la nueva ficha y actualiza el registro, contexto de formularios y sitemap del catálogo. `python3 tests/validate-project-details.py` verifica 137 fichas, conservación de 136 filas comerciales y 15 Ecasa, identidad única de Own y Parque Germania, ausencia de superficies inventadas, aviso del precio y hashes de las tres imágenes seleccionadas. Las pruebas completas y la Preview protegida corresponden al cierre de la tanda, registrado por separado.
