# Auditoría de características para filtros

Revisión de lectura del 29/10/2026. Se auditaron las 131 fichas y los 362 aliases de `data/amenities.json`. El catálogo aún no tiene IDs semánticos; `data-amenity-icon` es presentación y no identifica presencia de un atributo.

Hay 973 elementos en 118 fichas. La propuesta conservadora obtiene al menos una característica elegible en 114 fichas. No cambia fuentes de la aplicación.

| ID propuesto | Etiqueta | Grupo | Proyectos elegibles actuales |
|---|---|---|---:|
| `piscina` | Piscina | amenities | 67 |
| `gimnasio` | Gimnasio | amenities | 42 |
| `quinchos` | Quinchos | amenities | 96 |
| `salon-multiuso` | Salón multiuso | amenities | 43 |
| `cowork` | Cowork | amenities | 43 |
| `bicicleteros` | Bicicleteros | amenities | 63 |
| `lavanderia` | Lavandería | amenities | 55 |
| `areas-verdes` | Áreas verdes | amenities | 36 |
| `juegos-infantiles` | Juegos infantiles | amenities | 30 |
| `terraza-panoramica` | Terraza panorámica común | amenities | 2 |
| `lounge` | Lounge | amenities | 12 |
| `mascotas` | Espacios para mascotas | amenities | 20 |
| `seguridad` | Seguridad o control de acceso | amenities | 46 |
| `estacionamientos` | Estacionamientos | amenities | 5 |
| `bodegas` | Bodegas | amenities | 3 |
| `cocina-equipada` | Cocina equipada | finishes | 22 |
| `termopanel` | Ventanas termopanel | finishes | 17 |
| `climatizacion` | Climatización de la vivienda | finishes | 0 |
| `tecnologia` | Equipamiento tecnológico | finishes | 12 |
| `terraza-privada` | Terraza privada | finishes | 0 |
| `jardin-privado` | Jardín o patio privado | finishes | 0 |

Los recuentos son de características publicadas con alcance aceptado; no son disponibilidad de unidades. Jardín privado y terraza privada por modelo se informan por separado y no se mezclan con el índice general.

## Decisiones necesarias

- Los IDs propuestos son nuevos IDs de filtro. Los índices de catálogo sólo identifican las filas auditadas y no son IDs estables.
- Usar source/label exactos. No comparar por icon, substring, fotos, captions ni texto del entorno.
- Guardar los grupos exactos en project-features.json una vez; renderer y filtros deben leer el mismo registro. El índice de filtros se genera y nunca se edita de forma independiente.
- El HTML puede sembrar el registro durante la migración, pero después no debe volver a ser una segunda fuente de verdad.
- Una característica desconocida se mantiene como desconocida; no generar negaciones ni excluir cuando el filtro no se solicita.
- Sólo se indexa etapaReferenciaSlug Ecasa. Los grupos de las otras etapas permanecen en la ficha con eligibleForFiltering=false.
- En oferta mixta NV, residential_only deja de coincidir para Local/Oficina/Comercial; los tres proyectos sólo-local no acreditan acceso comercial a espacios comunes residenciales.
- Plaza Las Condes mezcla amenities en un grupo HTML finishes: la clasificación semántica de cada etiqueta prevalece para el índice, sin necesidad de alterar su HTML durante seeding.
- Estacionamientos de visitas es un subtipo; el filtro genérico no afirma inclusión de estacionamiento privado. Bodegas sólo incluye la etiqueta Bodegas, no almacenamiento de encomiendas.
- Climatización no tiene coincidencia en los grupos publicados: enchufe/circuito no es equipo instalado; piscina climatizada no es climatización doméstica. Hay candidatos textuales aún no publicados documentados aparte.
- Terraza privada y jardín privado deben proceder del mismo modelo técnico que satisfaga dormitorios/baños/superficie; no declarar stock ni listar números de unidad.
- Quinchos con cantidad pendiente conserva presencia documentada; sólo la cantidad se mantiene desconocida.

## Mapeo explícito por categoría

### `piscina` — Piscina

- Dos piscinas
- Piscina
- Piscina amplia
- Piscina con terraza
- Piscina con vista Av. del Mar
- Piscina con vista panorámica
- Piscina en azotea
- Piscina en primer piso
- Piscina panorámica
- Piscina panorámica en azotea
- Piscina panorámica en azotea con terraza
- Piscina panorámica templada
- Piscina panorámica templada y terrazas panorámicas
- Piscina temperada
- Piscina temperada & Wellness
- Piscina templada
- Piscina templada y terrazas panorámicas
- Piscina y plaza interior
- Rooftop con piscina temperada y jacuzzi

### `gimnasio` — Gimnasio

- Gimnasio
- Gimnasio equipado
- Gimnasio exterior
- Gimnasio y pilates

### `quinchos` — Quinchos

- 2 quinchos en azotea
- 3 quinchos
- 4 quinchos
- 4 quinchos panorámicos
- 5 quinchos
- Clubhouse y quinchos
- Dos quinchos
- Quincho
- Quincho con vista panorámica
- Quincho en azotea
- Quincho panorámico
- Quincho techado
- Quincho techado interior
- Quinchos
- Quinchos con terrazas panorámicas
- Quinchos en azotea
- Quinchos panorámicos
- Quinchos, terrazas y Sky Bar
- Quinchos; cantidad pendiente de confirmación
- Sky Bar y quincho
- Terraza con quincho
- Terraza con quincho en azotea

### `salon-multiuso` — Salón multiuso

- Dos salas multiuso
- Sala multiuso gourmet
- Sala multiuso tipo bar
- Salones multiuso
- Salón multiuso
- Salón multiuso con vista panorámica

### `cowork` — Cowork

- Coffee & Work
- Cowork
- Cowork abierto y cubículos
- Lavandería con cowork
- Lavandería con juegos y cowork

### `bicicleteros` — Bicicleteros

- Bicicletero con taller
- Bicicleteros
- Bicicleteros comunes
- Bicicleteros comunes cerrados

### `lavanderia` — Lavandería

- Lavandería
- Lavandería con cowork
- Lavandería con juegos y cowork
- Lavandería equipada

### `areas-verdes` — Áreas verdes

- Jardín
- Jardín interior
- Parque central de 20.000 m²
- Parque privado
- Plazas y áreas verdes
- Terraza verde
- Área verde en plaza elevada
- Áreas verdes
- Áreas verdes, senderos, plazas y caniles

### `juegos-infantiles` — Juegos infantiles

- Juegos infantiles
- Zona de juegos infantiles
- Zona infantil

### `terraza-panoramica` — Terraza panorámica común

- Piscina panorámica templada y terrazas panorámicas
- Piscina templada y terrazas panorámicas
- Quinchos con terrazas panorámicas
- Terraza con vista panorámica

### `lounge` — Lounge

- Family & Social Club y Salón Lounge
- Lounge
- Lounge & Bar
- Lounge & Wine Bar
- Lounge exterior
- Lounge y patios interiores
- Salón lounge
- Terraza lounge

### `mascotas` — Espacios para mascotas

- Baño de mascotas
- Baño y área para mascotas
- Lavado de mascotas
- Patio de mascotas
- Patio y lavado de mascotas
- Pet & Spa Zone
- Sala de lavado de mascotas
- Spa de mascotas
- Área de mascotas
- Áreas verdes, senderos, plazas y caniles

### `seguridad` — Seguridad o control de acceso

- Acceso de doble seguridad automatizado
- Acceso digital
- Accesos controlados
- Accesos controlados por CCTV
- Ascensores con tarjeta de residente
- Ascensores, central de agua caliente y CCTV
- CCTV
- CCTV conectado a conserjería y administración
- Central de agua caliente a gas natural, ascensores y CCTV
- Central de agua caliente, ascensores y CCTV
- Cerradura electrónica
- Cerradura electrónica con control por tarjeta
- Cerradura electrónica con tarjeta
- Cerradura para renta corta
- Chapa con control de acceso digital
- Chapa con control de acceso digital a los departamentos
- Chapa con control de acceso digital en departamentos
- Chapas de seguridad con tarjeta y clave
- Circuito cerrado
- Conserjería 24 horas
- Conserjería virtual
- Control de acceso con tarjeta y clave
- Control de acceso digital
- Hall de acceso con conserjería virtual
- Hall de acceso controlado
- Hall de acceso de doble altura con conserjería virtual

### `estacionamientos` — Estacionamientos

- Estacionamientos
- Estacionamientos de visitas

### `bodegas` — Bodegas

- Bodegas

### `cocina-equipada` — Cocina equipada

- Campana, horno y encimera de 2 o 3 platos
- Cocina con campana retráctil, horno eléctrico, encimera vitrocerámica y cubierta de cuarzo
- Cocina equipada
- Cocinas con encimera, campana y horno
- Cocinas full electric con refrigerador apanelado no frost, encimera y horno
- Cocinas integradas full electric con refrigerador apanelado no frost, encimera y horno
- Encimera eléctrica, horno y campana
- Encimera vitrocerámica, horno y campana
- Encimera, horno y campana
- Horno, microondas, lavavajillas panelable, encimera y campana Franke, Cubierta de cocina ultracompacto con terminación travertino, Grifería de cocina Paini (Italia), Grifería del baño principal Hansgrohe (Alemania), Puertas enchapadas en madera de encina
- Kit de cocina eléctrico: campana, horno y encimera de 2 o 3 platos según tipo de departamento
- Kit de cocina: encimera, campana y horno

### `termopanel` — Ventanas termopanel

- Departamentos 100% termopanel
- Piso vinílico y ventanas termopanel con marco PVC
- Ventanales de PVC termopanel
- Ventanas de PVC con termopanel
- Ventanas termopanel
- Ventanas termopanel con marco de PVC
- Ventanas termopanel con perfil color grafito

### `climatizacion` — Climatización de la vivienda

Sin etiquetas elegibles en el catálogo publicado actual.

### `tecnologia` — Equipamiento tecnológico

- Acceso digital
- Cerradura electrónica
- Cerradura electrónica con control por tarjeta
- Cerradura electrónica con tarjeta
- Cerradura para renta corta
- Chapa con control de acceso digital
- Chapa con control de acceso digital a los departamentos
- Chapa con control de acceso digital en departamentos
- Chapas de seguridad con tarjeta y clave

### `terraza-privada` — Terraza privada

- Departamentos de 2 y 3 dormitorios con grandes terrazas
- Terrazas con barandas de cristal
- Terrazas con barandas vidriadas
- Terrazas según modelo

### `jardin-privado` — Jardín o patio privado

Sin etiquetas elegibles en el catálogo publicado actual.

## Exclusiones relevantes

- **Agua caliente con termo eléctrico o calefón, según unidad**: Agua caliente sanitaria; no demuestra calefacción ni aire acondicionado de la vivienda.
- **Agua caliente individual**: Agua caliente sanitaria; no demuestra calefacción ni aire acondicionado de la vivienda.
- **Agua caliente individual con calefón de tiro forzado**: Agua caliente sanitaria; no demuestra calefacción ni aire acondicionado de la vivienda.
- **Agua caliente individual con termo eléctrico**: Agua caliente sanitaria; no demuestra calefacción ni aire acondicionado de la vivienda.
- **Audio y WiFi en áreas comunes; confirma las condiciones al consultar**: Audio/Wifi del edificio o áreas comunes: no acredita tecnología instalada en la vivienda.
- **Bodega de encomiendas**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Bodega de encomiendas y lockers QR**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Bodega de maletas**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Bodega de mudanzas**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Bodega de mudanzas y oficina de administración**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Bodega náutica**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Calistenia**: Espacio de ejercicio o deporte sin afirmación explícita de gimnasio. Puede habilitar categoría separada Zona de entrenamiento; no inferir equipamiento.
- **Central de agua caliente a gas natural**: Agua caliente sanitaria; no demuestra calefacción ni aire acondicionado de la vivienda.
- **Circuito eléctrico individual para estufa eléctrica**: Sólo circuito/enchufe/preparación eléctrica; no es calefacción o aire acondicionado instalado. El equipo se excluye expresamente en el circuito para AC.
- **Circuito eléctrico para aire acondicionado en modelos 1D 1B con terraza señalados; el equipo no está incluido.**: Sólo circuito/enchufe/preparación eléctrica; no es calefacción o aire acondicionado instalado. El equipo se excluye expresamente en el circuito para AC.
- **Circuito individual para estufa eléctrica**: Sólo circuito/enchufe/preparación eléctrica; no es calefacción o aire acondicionado instalado. El equipo se excluye expresamente en el circuito para AC.
- **Cocina americana amoblada con cubierta de cuarzo**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cocina con cubierta de cuarzo**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cocina con cubierta de cuarzo blanco**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cocina full electric amoblada**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Conexión para lavadora según modelo**: Conexión, opción o instalación prevista para lavadora privada; no acredita lavadora incluida ni lavandería común.
- **Consulta las terminaciones disponibles para la unidad que te interesa.**: Texto pendiente de consulta: no es un atributo confirmado.
- **Cubierta de cuarzo blanco**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cubierta de cuarzo blanco y secador de platos**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cubierta de granito en cocina**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cubierta de granito en cocinas**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cubiertas de cuarzo**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cubiertas de cuarzo blanco**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Dos salones gourmet**: Salón gourmet, eventos, Family Room o Social Club: mantener concepto propio; no asumir SUM ni lounge sin texto que lo indique.
- **Lockers electrónicos**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **E-commerce / Mail Room**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Enchufe de fuerza para estufa eléctrica**: Sólo circuito/enchufe/preparación eléctrica; no es calefacción o aire acondicionado instalado. El equipo se excluye expresamente en el circuito para AC.
- **Enchufe para estufa eléctrica**: Sólo circuito/enchufe/preparación eléctrica; no es calefacción o aire acondicionado instalado. El equipo se excluye expresamente en el circuito para AC.
- **Encimera eléctrica o a gas, según especificación**: Equipamiento parcial: puede acreditar cocina equipada sólo en combinación explícita encimera + horno + campana del mismo proyecto/alcance.
- **Zona de entretenimiento**: Sala de juegos/entretenimiento sin destino infantil explícito; no equivale a juegos infantiles.
- **Salón de juegos**: Sala de juegos/entretenimiento sin destino infantil explícito; no equivale a juegos infantiles.
- **Hall de acceso y lobby**: Hall/lobby sin control ni conserjería explícitos: no acredita seguridad.
- **Hall de acceso de doble altura**: Hall/lobby sin control ni conserjería explícitos: no acredita seguridad.
- **Horno y campana**: Equipamiento parcial: puede acreditar cocina equipada sólo en combinación explícita encimera + horno + campana del mismo proyecto/alcance.
- **Instalación para lavadora**: Conexión, opción o instalación prevista para lavadora privada; no acredita lavadora incluida ni lavandería común.
- **Jardín fotovoltaico**: Jardín fotovoltaico describe infraestructura energética; no prueba área verde ni jardín privado.
- **Lockers con QR**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Luminarias LED**: Luminarias o soporte para TV: no se consideran sistema tecnológico de vivienda.
- **Luminarias LED y soporte para TV**: Luminarias o soporte para TV: no se consideran sistema tecnológico de vivienda.
- **Magnéticos en ventanas de departamentos de pisos 2 y 3**: Sensores magnéticos sólo en ventanas de departamentos de pisos 2 y 3; requiere alcance por modelo/piso antes de marcar tecnología o seguridad de cualquier vivienda.
- **Objetoteca**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Opción de instalación de lavadora**: Conexión, opción o instalación prevista para lavadora privada; no acredita lavadora incluida ni lavandería común.
- **Opción de instalar lavadora en departamentos 1D 1B, salvo línea 9.**: Conexión, opción o instalación prevista para lavadora privada; no acredita lavadora incluida ni lavandería común.
- **Patio de actividades**: Patio/plaza/espacio al aire libre no acredita vegetación ni uso privado de vivienda.
- **Patio exterior**: Patio/plaza/espacio al aire libre no acredita vegetación ni uso privado de vivienda.
- **Patio interior**: Patio/plaza/espacio al aire libre no acredita vegetación ni uso privado de vivienda.
- **Plaza elevada**: Patio/plaza/espacio al aire libre no acredita vegetación ni uso privado de vivienda.
- **Plaza exterior**: Patio/plaza/espacio al aire libre no acredita vegetación ni uso privado de vivienda.
- **Pool bar**: Pool bar no acredita piscina por sí solo.
- **Refrigerador apanelado**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Refrigerador apanelado y cortinas roller**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Salón gourmet**: Salón gourmet, eventos, Family Room o Social Club: mantener concepto propio; no asumir SUM ni lounge sin texto que lo indique.
- **Salón de eventos**: Salón gourmet, eventos, Family Room o Social Club: mantener concepto propio; no asumir SUM ni lounge sin texto que lo indique.
- **E-commerce / Mail Room con refrigerador**: Encomiendas, lockers u otro almacenamiento común especializado; no acredita bodega privada ofrecida con la propiedad.
- **Salas de ejercicio**: Espacio de ejercicio o deporte sin afirmación explícita de gimnasio. Puede habilitar categoría separada Zona de entrenamiento; no inferir equipamiento.
- **Secador de platos**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Secaplatos mural**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Sistema de control de incendios**: Control de incendios es protección contra incendios; no equivale a control de acceso o vigilancia.
- **Sky Bar**: Bar o Sky Bar no acredita salón lounge ni terraza panorámica explícita.
- **Soporte para TV**: Luminarias o soporte para TV: no se consideran sistema tecnológico de vivienda.
- **Soporte para TV y luminarias**: Luminarias o soporte para TV: no se consideran sistema tecnológico de vivienda.
- **Soporte para TV y luminarias LED**: Luminarias o soporte para TV: no se consideran sistema tecnológico de vivienda.
- **Sport bar**: Bar o Sky Bar no acredita salón lounge ni terraza panorámica explícita.
- **Terraza**: Terraza genérica/interior/elevada: falta alcance privado y/o carácter panorámico.
- **Terraza elevada**: Terraza genérica/interior/elevada: falta alcance privado y/o carácter panorámico.
- **Terraza interior**: Terraza genérica/interior/elevada: falta alcance privado y/o carácter panorámico.
- **Terrazas**: Terraza genérica/interior/elevada: falta alcance privado y/o carácter panorámico.
- **Zona de entrenamiento**: Espacio de ejercicio o deporte sin afirmación explícita de gimnasio. Puede habilitar categoría separada Zona de entrenamiento; no inferir equipamiento.
- **Vistas panorámicas**: Vista panorámica o marco de aluminio no demuestra terraza panorámica común ni ventana termopanel.
- **Ventanales de aluminio blanco**: Vista panorámica o marco de aluminio no demuestra terraza panorámica común ni ventana termopanel.
- **Wifi en primer piso**: Audio/Wifi del edificio o áreas comunes: no acredita tecnología instalada en la vivienda.
- **Zona de deportes**: Espacio de ejercicio o deporte sin afirmación explícita de gimnasio. Puede habilitar categoría separada Zona de entrenamiento; no inferir equipamiento.
- **Zona de ejercicios**: Espacio de ejercicio o deporte sin afirmación explícita de gimnasio. Puede habilitar categoría separada Zona de entrenamiento; no inferir equipamiento.
- **Áreas comunes amobladas con audio y wifi**: Audio/Wifi del edificio o áreas comunes: no acredita tecnología instalada en la vivienda.
- **Cocinas con cubiertas de cuarzo**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Conjunto residencial con edificios y jardín interior, mostrado en las fotografías del brochure**: Afirmación derivada de fotografías/renders del brochure; excluida de coincidencias verificadas hasta evidencia textual/plano explícito.
- **Cubierta de cocina de cuarzo**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cubiertas de cocina de cuarzo**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Cubiertas de cuarzo en cocinas**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Edificio residencial con terrazas y espacios comunes, mostrado en las fotografías del brochure**: Afirmación derivada de fotografías/renders del brochure; excluida de coincidencias verificadas hasta evidencia textual/plano explícito.
- **Espacio de quincho equipado mostrado en el brochure**: Afirmación derivada de fotografías/renders del brochure; excluida de coincidencias verificadas hasta evidencia textual/plano explícito.
- **Espacios al aire libre**: Patio/plaza/espacio al aire libre no acredita vegetación ni uso privado de vivienda.
- **Family & Social Club**: Salón gourmet, eventos, Family Room o Social Club: mantener concepto propio; no asumir SUM ni lounge sin texto que lo indique.
- **Family Room**: Salón gourmet, eventos, Family Room o Social Club: mantener concepto propio; no asumir SUM ni lounge sin texto que lo indique.
- **Gimnasio mostrado en el brochure**: Afirmación derivada de fotografías/renders del brochure; excluida de coincidencias verificadas hasta evidencia textual/plano explícito.
- **Kit de cocina**: Muebles, cubierta, refrigerador o kit no desglosado: no bastan por sí solos para acreditar cocina equipada completa.
- **Pet friendly**: Pet friendly es política de admisión, no demuestra espacio común para mascotas.
- **Piscina y espacios comunes mostrados en el brochure**: Afirmación derivada de fotografías/renders del brochure; excluida de coincidencias verificadas hasta evidencia textual/plano explícito.
- **Sala de estar y comedor comunes**: Salón gourmet, eventos, Family Room o Social Club: mantener concepto propio; no asumir SUM ni lounge sin texto que lo indique.
- **Social Club**: Salón gourmet, eventos, Family Room o Social Club: mantener concepto propio; no asumir SUM ni lounge sin texto que lo indique.

## Alcance contextual

- Sólo local: `vergara-domeyko`, `parque-panama`, `bordevivo`. Ningún amenity residencial referido al edificio habilita coincidencia comercial.
- Mixtos: `edificio-dual-390-lto`, `parque-quinta`, `edificio-plaza-nova`, `edif-origen-atacama-3008`. Coincidencias residenciales condicionadas al uso/tipo seleccionado.
- Ferroparque: sus cinco amenities están en Etapa 2; la etapa de referencia es Etapa 1 y no se indexan como atributos de ésta.
- Terratoltén: indexar Piscina, Áreas verdes, Quinchos y Gimnasio de Etapa 3; conservar sin indexar Juegos infantiles y Bicicleteros de Etapa 1.
- Eleuterio Ramírez: jardín privado documentado en A1 (111,81 m², página 5) y B1 (47,88 m², página 8). Conservar el área separada del total y la disponibilidad como desconocida.
- Las siete fichas Nollagam tienen variantes con terraza numérica positiva. Filtrar dentro del mismo modelo que cumple dormitorios/baños/superficie, sin extrapolar a todos sus modelos.
- Plaza Las Condes: corregir el grupo semántico del índice aunque el HTML actual marque amenities como `finishes`.

## Fuente compartida sugerida

Agregar `filters[]` y `filterIds[]` explícitos por alias a `data/amenities.json`. Sembrar `data/project-features.json` con grupos y textos exactos, `stageSlug`, `scope`, `eligibleForFiltering`, condiciones y evidencia. Después ambos consumidores (render de ficha e índice de filtros generado) deben leer ese registro. Los futuros cambios se hacen ahí; los HTML y el índice se generan, sin editar una segunda copia de la verdad.

`scripts/project_amenities.py:render_items/apply_amenities` es el consumidor de presentación. `data/proyectos.json.amenities` sólo cubre parte de las características actuales; no usarlo como sustituto completo de los grupos publicados ni unir indiscriminadamente las fuentes antiguas.

## Verificaciones recomendadas

- Alias equivalentes generan mismo ID; iconos compartidos no generan equivalencia.
- Circuito AC, lavadora opcional, Pool bar, Pet friendly, foto de gimnasio y jardín fotovoltaico no producen falsos positivos.
- Cantidad de quinchos pendiente conserva coincidencia por quinchos, sin inventar número.
- Filtrar Local/Comercial elimina coincidencias de amenities residenciales en mixtos y sólo-local.
- No combinar precio o superficie de una etapa con amenity de otra.
- Un jardín/terraza de un modelo no satisface dormitorio/baño de otro modelo.
- Proyecto sin documentación permanece visible sin filtro específico; al activarlo no se considera coincidencia verificada.
- Renderer e índice se generan de la misma fuente, conservando textos y condiciones de las fichas.

## Límites

Auditoría de datos y HTML existentes; no es nueva comprobación del equipamiento instalado ni del stock. Las fuentes documentales no publicadas se listan como candidatos aparte. Las categorías sin registros elegibles no deben mostrarse como filtros vacíos.
