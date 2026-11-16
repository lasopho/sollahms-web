# Leben: recepción por bloques

Fecha: 16/11/2026. Se conservan los 55 IDs L-001–L-055 y los 461 campos pendientes. Dividir una solicitud en campos no crea solicitudes nuevas. Solo el primer lote de cuatro precios fue presentado; el propietario contestó que no tiene respaldo suficiente para confirmarlos.

## Orden y alcance

| Bloque | Contenido | Campos | Estado |
| --- | --- | --- | --- |
| B1 | Precios desde y por tipología | 24 | B1A recibido sin precios; restantes no presentados |
| B2 | Identificación de tipologías, dormitorios y baños | 91 | Preparado; no presentado |
| B3 | Superficies por el mismo modelo y etapa | 91 | Preparado; no presentado |
| B4 | Amenities sin respaldo | 111 | Preparado; no presentado |
| B5 | Características interiores faltantes o parciales | 89 | Preparado; no presentado |
| B6 | Estado comercial y entrega | 52 | Preparado; no presentado |
| B7 | Tres discrepancias que requieren respuesta | 3 | Preparado; no presentado |

El tipo de propiedad del proyecto está confirmado en los 13 casos. B2 solicita únicamente su asociación a modelos/etapas cuando falta, junto con dormitorios y baños del mismo modelo. Own queda fuera de B1 mientras figure vendido. Los bloques pueden responderse parcialmente con IDs originales; se acepta texto, tablas, Excel, CSV, capturas, PDF o documentos comerciales. Una declaración directa y precisa de Sollahms puede ser la fuente: no se exige un PDF para todo dato.

## Bloque 1A: respuesta recibida

| ID original | Proyecto | Sollahms histórico UF | Precio actual | Faltante |
| --- | --- | --- | --- | --- |
| L-001 | Edificio Living Town | 3949 | No confirmado | Precio UF, vigencia/confirmación, unidad/modelo e inclusión/exclusión de estacionamiento y bodega |
| L-005 | Edificio Mood | 3855.33 | No confirmado | Precio UF, vigencia/confirmación, unidad/modelo e inclusión/exclusión de estacionamiento y bodega |
| L-009 | Edificio Santo | 4023 | No confirmado | Precio UF, vigencia/confirmación, unidad/modelo e inclusión/exclusión de estacionamiento y bodega |
| L-013 | Edificio BAUM | 3843 | No confirmado | Precio UF, vigencia/confirmación, unidad/modelo e inclusión/exclusión de estacionamiento y bodega |

No se vuelve a pedir inmediatamente la misma confirmación: queda a la espera de nuevos antecedentes. La fecha de la comunicación solo registra recepción. No se convierte en vigencia comercial. [Respuesta recibida](COM-F2-001-RESPUESTA-PROPIETARIO.json) · [CSV para completar posteriormente](B1A-PRECIOS-RESPUESTA.csv).

## Lotes de precios siguientes (preparados)

| Lote | Proyectos | IDs originales |
| --- | --- | --- |
| B1B | Edificio Suecia, Capitanes, Edificio Bold, Edificio Argomedo | L-017, L-021, L-025, L-029 |
| B1C | Edificio Indi, Edificio Índigo, INN Puerto Chico, Edificio Nórdico | L-034, L-039, L-043, L-048 |

No se presentan automáticamente los lotes siguientes para evitar repetir solicitudes o abrir más frentes sin antecedentes. Una respuesta espontánea sobre otro proyecto Leben se acepta y vincula al ID correspondiente.

## Detalle por proyecto y campo

[Recepción completa por campo](RECEPCION-POR-CAMPO.csv) contiene proyecto, campo, valor anterior, motivo pendiente, respuesta esperada, unidad y respaldo. Cada par proyecto/campo aparece una vez. [Plantilla Excel original protegida](../PLANTILLA-RESPUESTA-LEBEN.xlsx) conserva sus bytes y sus 55 IDs.

## B1: Precios desde y por tipología

| Proyecto | ID original | Campos que faltan |
| --- | --- | --- |
| Edificio Living Town | L-001 | Precio desde, Precios por tipología |
| Edificio Mood | L-005 | Precio desde, Precios por tipología |
| Edificio Santo | L-009 | Precio desde, Precios por tipología |
| Edificio BAUM | L-013 | Precio desde, Precios por tipología |
| Edificio Suecia | L-017 | Precio desde, Precios por tipología |
| Capitanes | L-021 | Precio desde, Precios por tipología |
| Edificio Bold | L-025 | Precio desde, Precios por tipología |
| Edificio Argomedo | L-029 | Precio desde, Precios por tipología |
| Edificio Indi | L-034 | Precio desde, Precios por tipología |
| Edificio Índigo | L-039 | Precio desde, Precios por tipología |
| INN Puerto Chico | L-043 | Precio desde, Precios por tipología |
| Edificio Nórdico | L-048 | Precio desde, Precios por tipología |

[CSV del bloque](B1-SOLICITUDES.csv).

## B2: Identificación de tipologías, dormitorios y baños

| Proyecto | ID original | Campos que faltan |
| --- | --- | --- |
| Edificio Living Town | L-002 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio Mood | L-006 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio Santo | L-010 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio BAUM | L-014 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio Suecia | L-018 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Capitanes | L-022 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio Bold | L-026 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio Argomedo | L-031 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio Indi | L-036 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio Índigo | L-040 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| INN Puerto Chico | L-044 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Edificio Nórdico | L-049 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |
| Own | L-053 | Etapas o edificios diferenciados, Nombre de cada modelo, Identificación de cada modelo, Tipo de propiedad por modelo, Etapa por modelo, Dormitorios, Baños |

[CSV del bloque](B2-SOLICITUDES.csv).

## B3: Superficies por el mismo modelo y etapa

| Proyecto | ID original | Campos que faltan |
| --- | --- | --- |
| Edificio Living Town | L-002 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio Mood | L-006 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio Santo | L-010 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio BAUM | L-014 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio Suecia | L-018 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Capitanes | L-022 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio Bold | L-026 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio Argomedo | L-031 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio Indi | L-036 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio Índigo | L-040 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| INN Puerto Chico | L-044 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Edificio Nórdico | L-049 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |
| Own | L-053 | Superficie general sin clasificación, Superficie útil, Superficie interior, Superficie total, Terraza, Jardín o patio privado, Terreno |

[CSV del bloque](B3-SOLICITUDES.csv).

## B4: Amenities sin respaldo

| Proyecto | ID original | Campos que faltan |
| --- | --- | --- |
| Edificio Living Town | L-003 | Salón multiuso, Bicicleteros, Juegos infantiles, Terraza panorámica común, Lounge, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |
| Edificio Mood | L-007 | Salón multiuso, Áreas verdes comunes, Juegos infantiles, Lounge, Seguridad, Estacionamientos, Bodegas privadas |
| Edificio Santo | L-011 | Piscina, Salón multiuso, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Lounge, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |
| Edificio BAUM | L-015 | Salón multiuso, Terraza panorámica común, Seguridad, Estacionamientos, Bodegas privadas |
| Edificio Suecia | L-019 | Salón multiuso, Bicicleteros, Lavandería, Áreas verdes comunes, Terraza panorámica común, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |
| Capitanes | L-023 | Cowork, Lavandería, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Espacios para mascotas, Estacionamientos, Bodegas privadas |
| Edificio Bold | L-027 | Piscina, Quinchos, Salón multiuso, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Espacios para mascotas, Seguridad |
| Edificio Argomedo | L-032 | Piscina, Salón multiuso, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Lounge, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |
| Edificio Indi | L-037 | Salón multiuso, Áreas verdes comunes, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |
| Edificio Índigo | L-041 | Salón multiuso, Cowork, Bicicleteros, Lavandería, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |
| INN Puerto Chico | L-045 | Salón multiuso, Cowork, Bicicleteros, Juegos infantiles, Terraza panorámica común, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |
| Edificio Nórdico | L-050 | Salón multiuso, Cowork, Lavandería, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Lounge, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |
| Own | L-054 | Salón multiuso, Cowork, Áreas verdes comunes, Juegos infantiles, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas |

[CSV del bloque](B4-SOLICITUDES.csv).

## B5: Características interiores faltantes o parciales

| Proyecto | ID original | Campos que faltan |
| --- | --- | --- |
| Edificio Living Town | L-004 | Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia) |
| Edificio Mood | L-008 | Ventanas termopanel, Pisos, Cubiertas de cocina, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |
| Edificio Santo | L-012 | Cocina equipada, Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |
| Edificio BAUM | L-016 | Ventanas termopanel, Pisos, Conexión para lavadora, Terraza / rooftop privado, Jardín / patio privado (presencia) |
| Edificio Suecia | L-020 | Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |
| Capitanes | L-024 | Cocina equipada, Pisos, Iluminación interior, Cubiertas de cocina, Conexión para lavadora, Jardín / patio privado (presencia) |
| Edificio Bold | L-028 | Cocina equipada, Ventanas termopanel, Pisos, Iluminación interior, Cubiertas de cocina, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |
| Edificio Argomedo | L-033 | Pisos, Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |
| Edificio Indi | L-038 | Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |
| Edificio Índigo | L-042 | Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |
| INN Puerto Chico | L-046 | Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado |
| Edificio Nórdico | L-051 | Cocina equipada, Ventanas termopanel, Pisos, Iluminación interior, Cubiertas de cocina, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |
| Own | L-055 | Cocina equipada, Ventanas termopanel, Pisos, Iluminación interior, Cubiertas de cocina, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales |

[CSV del bloque](B5-SOLICITUDES.csv).

## B6: Estado comercial y entrega

| Proyecto | ID original | Campos que faltan |
| --- | --- | --- |
| Edificio Living Town | L-001 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio Mood | L-005 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio Santo | L-009 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio BAUM | L-013 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio Suecia | L-017 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Capitanes | L-021 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio Bold | L-025 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio Argomedo | L-029 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio Indi | L-034 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio Índigo | L-039 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| INN Puerto Chico | L-043 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Edificio Nórdico | L-048 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |
| Own | L-052 | Estado comercial, Fecha o categoría de entrega, Año de entrega, Semestre de entrega |

[CSV del bloque](B6-SOLICITUDES.csv).

## B7: Tres discrepancias que requieren respuesta

| Proyecto | ID original | Campos que faltan |
| --- | --- | --- |
| Edificio Argomedo | L-030 | Dirección |
| Edificio Indi | L-035 | Dirección |
| INN Puerto Chico | L-047 | Cubiertas de cocina |

[CSV del bloque](B7-SOLICITUDES.csv).
