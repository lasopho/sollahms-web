# Entorno y desarrollo urbano — revisión del catálogo completo

**Corte: 31 de octubre de 2026. Publicado en Sollahms.cl por autorización expresa.**

Se concluyó una revisión documental de **131/131 proyectos**, en 10 regiones. El registro público contiene **56 obras verificadas y 74 relaciones**, correspondientes a **59 proyectos**. Las búsquedas se organizaron por comuna y sector, con una evaluación individual de cada dirección.

La cobertura completa significa que no quedan proyectos sin revisar en este ciclo. **No significa que se hayan identificado todas las inversiones existentes ni que todas las coordenadas heredadas se hayan verificado nuevamente.** Los candidatos que no cumplen el respaldo o la precisión necesarios quedan excluidos de las asociaciones y documentados como pendientes de evidencia.

## Entregables y control de cobertura

- [Resultado de los 131 proyectos](COBERTURA.md).
- [Registro individual: búsquedas, fuentes, justificaciones y pendientes](catalog-coverage.json).
- [Auditoría independiente de ubicaciones](location-review.json).
- [Relaciones y distancias calculadas](verified-relationships.json).
- [Pruebas ejecutadas](tests.txt) y [preservación del paquete](package-checks.json).
- [Datos únicos utilizados por fichas, mapa y filtros](../../data/urban-development.json).

| Resultado | Proyectos |
| --- | ---: |
| Con relaciones verificadas incorporadas | 59 |
| Revisados sin asociación admitida | 67 |
| Revisados con ubicación bloqueada | 5 |

“Sin asociación admitida” no significa ausencia de obras: puede existir una inversión documentada cuya geometría, acceso o relación territorial no permite incorporarla a la ficha.

## Ubicaciones y restricciones

La auditoría conserva las direcciones, coordenadas y procedencia del catálogo. Se comprobó integridad e identidad de los 131 registros, con revisión documental focalizada de anomalías; no se hizo un levantamiento topográfico ni una nueva geocodificación integral. Cuatro registros carecen de dirección precisa y Vicuña Mackenna 7589 presenta una discrepancia con coordenadas del expediente SEA. Se bloquean nuevas asociaciones, sin alterar datos comerciales ni corregir por inferencia:

- Endémico (`endemico`).
- Mapocho 3521 - Edificio A (`mapocho-3521-edificio-a`).
- Plaza Cervantes - Torre A (`plaza-cervantes`).
- Reserva Mayor 2 (`reserva-mayor-2`).
- Edificio Vicuña Mackenna 7589 (`vicuna-mackenna-7589`).

Pintor Cicarelli III conserva una alerta de precisión registrada en la auditoría. No se afirma que el punto sea erróneo sin evidencia suficiente.

## Método y alcance

- Se revisaron transporte, vialidad, salud, educación, parques, equipamiento e inversiones privadas por zona. Se priorizaron organismos públicos, expedientes y responsables de inversión. Las consultas y resultados están en el registro individual.
- Las aprobaciones ambientales, compras de terrenos, licitaciones, adjudicaciones y anuncios se distinguen de las obras en ejecución. La adquisición del terreno Hospital Zona Norte no se presenta como financiación de la construcción del hospital.
- Distancias geográficas mediante Haversine para puntos y menor distancia a segmentos para perímetros y trazados, incluidos polígonos múltiples. Se indica el destino medido: entrada, perímetro o punto de referencia del recinto. No son recorridos ni tiempos de viaje.
- Para trenes y Metro sólo se admiten distancias a accesos documentados. Las nuevas líneas sin accesos precisos permanecen como contexto general sin relaciones inventadas.
- Un perímetro cartográfico de parque o recinto existente no delimita necesariamente cada frente de obra; esta diferencia se informa en las fichas. Una proximidad geográfica no acredita accesibilidad peatonal, derecho de atención sanitaria, acceso público a espacios privados ni efectos económicos.
- Se describen posibles cambios y molestias sin prometer plusvalía, rentabilidad o efectos porcentuales.

## Obras verificadas

| Obra | Región | Estado | Información | Relaciones |
| --- | --- | --- | --- | ---: |
| Puente Industrial | Biobío | Operativa | 2026-09-07 | 0 |
| Nuevo Puente Ferroviario Biobío | Biobío | Operativa | 2025-11-11 | 3 |
| Tren Llanquihue–Puerto Montt · Puerto Varas | Los Lagos | Operativa | 2026-09-09 | 3 |
| Línea 7 de Metro | Región Metropolitana | En construcción | 2026-03-19 | 0 |
| Línea 8 de Metro | Región Metropolitana | Aprobada · Calificación ambiental favorable; ejecución no confirmada en este registro | 2026-05-29 | 0 |
| Línea 9 · trabajos previos en Santa Rosa con Alameda | Región Metropolitana | En construcción · Obras previas: excavaciones arqueológicas | 2026-08-12 | 0 |
| Nuevo Hospital San Pablo de Coquimbo | Coquimbo | En construcción · Construcción confirmada por informe ejecutivo DGC de agosto de 2026. | 2026-10-23 | 5 |
| Parque Urbano Cerro Grande | Coquimbo | Operativa · Apertura documentada en septiembre de 2025; actividades del operador CEAZA corroboradas en septiembre de 2026. | 2026-09-23 | 0 |
| Borde costero Playa Chinchorro · segunda etapa | Arica y Parinacota | Operativa · Inauguración confirmada por DOP el 16-09-2026. | 2026-09-16 | 0 |
| Parque Costanera de Puerto Montt | Los Lagos | Operativa | 2026-09-14 | 3 |
| Nuevo Hospital de Villarrica | La Araucanía | Operativa | 2024-10-04 | 1 |
| Nuevo Hospital de Puerto Varas | Los Lagos | En construcción | 2026-10-15 | 0 |
| Parque Costanera · Playa Urbana Puerto Varas | Los Lagos | En construcción | 2026-07-13 | 0 |
| Parque Metropolitano de Puerto Montt | Los Lagos | Aprobada · Acuerdo de cofinanciamiento firmado; construcción no acreditada | 2026-09-28 | 0 |
| Puente Cochrane · acceso vial oriente | Los Ríos | En licitación · Acceso oriente en licitación; no el puente completo | 2026-07-23 | 0 |
| Segunda Faja al Volcán · tramo urbano Villarrica | La Araucanía | Operativa | 2025-12-12 | 0 |
| Colegio Río Maullín · proyecto privado | Los Lagos | Aprobada · RCA favorable20261000193; ejecución no confirmada | 2026-06-18 | 0 |
| Nuevo CESFAM O’Higgins | Biobío | En construcción | 2026-09-25 | 4 |
| Nuevo Hospital de La Serena | Coquimbo | En construcción | 2026-03-30 | 1 |
| Parque Recreativo San Joaquín | Coquimbo | En construcción | 2026-06-08 | 0 |
| Nuevo Hospital de Pichilemu | O'Higgins | En construcción | 2026-09-24 | 0 |
| Obras marítimas y terrestres Caleta Papudo | Valparaíso | En construcción | 2026-06-23 | 0 |
| Proyecto Inmobiliario Olas de Puyai | Valparaíso | En estudio o evaluación | 2026-10-27 | 0 |
| Avenida Baquedano · segunda etapa | O'Higgins | Adjudicada | 2026-09-14 | 0 |
| Mejoramiento del alumbrado público de Valparaíso · etapa 1 | Valparaíso | En licitación | 2026-10-27 | 0 |
| Iluminación y televigilancia población Chinchorro | Arica y Parinacota | Adjudicada | 2026-06-26 | 0 |
| Ampliación Cenco Rancagua | O'Higgins | En construcción | 2026-08-19 | 1 |
| Alcantarillado urbano Pichilemu · Zona 1 | O'Higgins | Adjudicada | 2026-09-16 | 0 |
| Mejoramiento Parque Portales | Región Metropolitana | En construcción | 2026-10-21 | 5 |
| Proyecto de mejoramiento Parque Almagro | Región Metropolitana | Idea o anuncio preliminar · Proyecto anunciado; ejecución no confirmada. | 2026-10-21 | 7 |
| Proyecto de mejoramiento Parque Forestal | Región Metropolitana | Idea o anuncio preliminar · Proyecto anunciado; ejecución no confirmada. | 2026-10-21 | 5 |
| Proyecto de renovación de juegos Plaza Panamá | Región Metropolitana | Idea o anuncio preliminar · Anuncio de aporte privado; contrato y ejecución no verificados. | 2026-10-21 | 1 |
| Nuevo CESFAM Erasmo Escala | Región Metropolitana | Operativa | 2026-08-13 | 4 |
| NIDO Lucía · torre y laboratorios operativos | Región Metropolitana | Operativa | 2026-03-25 | 13 |
| NIDO Lucía · segunda etapa anunciada | Región Metropolitana | Idea o anuncio preliminar · Anuncio del desarrollador; inicio de construcción no comprobado. | 2026-10-31 | 0 |
| Nueva Alameda · bandejón central, tramos 1 y 2 | Región Metropolitana | En construcción | 2026-10-29 | 0 |
| UNAB Campus República · edificio R14 | Región Metropolitana | Operativa | 2026-04-06 | 0 |
| Renovación propuesta Plaza Artesanos del 900 | Región Metropolitana | En estudio o evaluación · Diseño en revisión; obra no confirmada. | 2026-09-01 | 0 |
| Recuperación de eje Bandera para buses | Región Metropolitana | Operativa | 2026-10-02 | 0 |
| SAR Santa Anselma | Región Metropolitana | Operativa | 2026-08-17 | 5 |
| Nuevo CESFAM Eduardo Frei Montalva | Región Metropolitana | Operativa | 2025-07-15 | 3 |
| Parque Cenco Florida | Región Metropolitana | En construcción | 2026-08-05 | 0 |
| Multifamily Cenco Florida | Región Metropolitana | En construcción | 2026-08-05 | 0 |
| Mejoramiento Parque Castillo Urizar | Región Metropolitana | Adjudicada · Adjudicación de obra 2287-104-LR24; no se acredita inicio físico. | 2026-01-08 | 1 |
| Ampliación Escuela de Construcción Civil UC | Región Metropolitana | En construcción | 2026-08-19 | 0 |
| Parque Metropolitano Sur Cerro Chena | Región Metropolitana | En construcción · Obras y recepción aún pendientes; apertura no confirmada. | 2026-10-08 | 0 |
| Parque Pulmón Verde de San Bernardo | Región Metropolitana | Con financiamiento confirmado · Financiamiento MINVU comunicado; diseño participativo en desarrollo. | 2026-10-16 | 0 |
| Parque Estadio Nacional · áreas abiertas | Región Metropolitana | Operativa · Áreas comunes abiertas; los recintos deportivos tienen reglas independientes. | 2026-08-05 | 9 |
| Parque Mapocho Río | Región Metropolitana | Operativa · Apertura total de sus seis etapas documentada por MINVU. | 2025-03-04 | 0 |
| Teleférico Bicentenario | Región Metropolitana | En construcción · Instalación de cabinas documentada por MOP. | 2026-06-18 | 0 |
| Túnel Lo Ruiz | Región Metropolitana | En construcción · Obras en ejecución documentadas por MOP. | 2026-08-19 | 0 |
| Renovación Parque El Trébol | Región Metropolitana | En construcción · Inicio de obras informado el 30-10-2026. | 2026-10-30 | 0 |
| Hospital Zona Norte · adquisición de terreno | Región Metropolitana | Con financiamiento confirmado · Financiamiento confirmado exclusivamente para adquirir el terreno; no para ejecutar el hospital completo. | 2026-08-17 | 0 |
| Mall Vivo Santiago · etapa II | Región Metropolitana | Aprobada · RCA favorable N°202213001571, de 06-10-2022; aprobación respaldada por fallo informado el 06-06-2025. | 2025-06-06 | 0 |
| Extensión Ciclovía Av. Cerrillos | Región Metropolitana | Aprobada · Aprobación del proyecto por Resolución Exenta 986 de SEREMI MTT, publicada 20-04-2026. | 2026-04-20 | 0 |
| Urbanización vial Las Condes 7039–7083 | Región Metropolitana | Aprobada · Permiso de urbanización voluntaria 55, de 21-09-2026, para MMV N°4 y 5. | 2026-09-21 | 0 |

## Evidencia y limitaciones por obra

### Puente Industrial

Conexión vial entre ambas riberas del Biobío, con accesos a la red urbana.

Responsable: MOP / Dirección General de Concesiones y Sociedad Concesionaria Puente Industrial. Ubicación: Cruce del río Biobío entre Hualpén y San Pedro de la Paz.

Estado: **Operativa**.  Información: 2026-09-07. Última revisión: 2026-10-31.

- [Concesionaria: primer año de operación](https://www.puenteindustrial.cl/puente-industrial-cumple-su-primer-ano-de-operaciones-redisenando-la-conectividad-vial-en-el-gran-concepcion/) — 2026-09-07.
- [DGC: ficha de concesión y mapa](https://concesiones.mop.gob.cl/project/concesion-vial-puente-industrial/) — sin fecha editorial; revisión al corte.
- Cartografía: [Mapa de la concesión enlazado por DGC](https://www.google.com/maps/d/viewer?mid=1MpIgvPhisjYRZ186qjPNb2gISMY). Referencia: al trazado vial documentado; no al acceso.

- Una ficha genérica del MOP mantiene información de construcción de 2025. La operación se acredita con la comunicación de la concesionaria de septiembre de 2026.
- El trazado cartográfico no describe por sí solo accesos ni recorridos habilitados.
- Considerar peaje, tránsito de carga y conexión efectiva desde la propiedad.

### Nuevo Puente Ferroviario Biobío

Infraestructura ferroviaria de doble vía; su habilitación total fue informada por el MTT.

Responsable: EFE / Ministerio de Transportes y Telecomunicaciones. Ubicación: Cruce ferroviario entre Concepción y San Pedro de la Paz.

Estado: **Operativa**.  Información: 2025-11-11. Última revisión: 2026-10-31.

- [MTT: habilitación total del nuevo puente](https://mtt.gov.cl/archivos/38592) — 2025-11-11.
- [SEA: expediente ambiental y alcance territorial](https://seia.sea.gob.cl/expediente/ficha/fichaPrincipal.php?id_expediente=2143540297) — sin fecha editorial; revisión al corte.
- Cartografía: [OpenStreetMap: huella del nuevo puente, way 1414187625](https://www.openstreetmap.org/way/1414187625). Referencia: al perímetro del puente; no a una estación.

- La huella cartográfica fue revisada documentalmente; no sustituye un levantamiento topográfico.
- La estructura no es una estación ni un acceso público al tren.
- Ruido y vibraciones son aspectos que conviene evaluar en terreno; no se ha cuantificado su efecto en estos proyectos.

### Tren Llanquihue–Puerto Montt · Puerto Varas

Servicio ferroviario regional con parada en Puerto Varas. La relación local se mide al acceso principal de esta estación.

Responsable: EFE Sur. Ubicación: Estación Puerto Varas, acceso principal cartografiado.

Estado: **Operativa**.  Información: 2026-09-09. Última revisión: 2026-10-31.

- [Transporte Informa: servicio e itinerario vigente](https://loslagos.transporteinforma.cl/noticias/anuncian-puesta-en-marcha-del-tren-llanquihue-puerto-montt/) — 2026-09-09.
- [Ministerio del Interior: inauguración del servicio](https://interior.gob.cl/noticias/2025/04/29/presidente-boric-inaugura-tren-puerto-montt-llanquihue-junto-a-ministros-elizalde-y-munoz/) — 2025-04-29.
- Cartografía: [OpenStreetMap: acceso principal, nodo 8787773125](https://www.openstreetmap.org/node/8787773125). Referencia: al acceso principal cartografiado de Puerto Varas.

- Acceso principal identificado en cartografía OSM y en el edificio de estación; verificación de terreno pendiente.
- Verificar cruces, pendientes y continuidad de veredas antes de elegir un recorrido. No se han calculado tiempos caminando.
- Frecuencias y condiciones del servicio pueden variar; consultar al operador antes de viajar.

### Línea 7 de Metro

Nueva línea en construcción, acreditada mediante el encuentro de túneles en Cal y Canto.

Responsable: Metro de Santiago. Ubicación: Corredor Renca–Vitacura; acceso de Cal y Canto descrito en Plaza Prat.

Estado: **En construcción**.  Información: 2026-03-19. Última revisión: 2026-10-31.

Término estimado documentado: Fines de 2028, según comunicación del 19/03/2026. Sujeto a cambios.

- [Gobierno de Santiago: encuentro de túneles de Línea 7](https://www.gobiernosantiago.cl/2026/03/19/autoridades-participan-del-encuentro-de-tuneles-en-estacion-cal-y-canto-de-futura-linea-7/) — 2026-03-19.

- El plazo es una proyección documentada, no una garantía.
- Sin coordenadas precisas de accesos futuros aprobadas para este registro. No se calculan distancias ni se asocian viviendas al trazado.
- Las faenas pueden implicar ruido, desvíos y restricciones de circulación; verificar los avisos del sector.

### Línea 8 de Metro

Proyecto con calificación ambiental favorable. Esa aprobación no acredita financiamiento ni inicio de construcción.

Responsable: Metro de Santiago / SEA Región Metropolitana. Ubicación: Trazado proyectado entre Providencia y Puente Alto; cola de maniobras en Las Condes.

Estado: **Aprobada**. Calificación ambiental favorable; ejecución no confirmada en este registro Información: 2026-05-29. Última revisión: 2026-10-31.

- [BCN: notificación RCA 20261301132 de 19/05/2026](https://www.bcn.cl/leychile/navegar?idNorma=1224602) — 2026-05-29.
- [SEA: descripción del Estudio de Impacto Ambiental](https://infofirma.sea.gob.cl/DocumentosSEA/MostrarDocumento?docId=2024%2F07%2F19%2Ff085-758d-4dd5-b87c-58e20cd71536) — 2024-07-19.

- Financiamiento y cronograma de ejecución pendientes de corroboración primaria actual.
- Las Condes incluye obras subterráneas de maniobra; no implica una estación de pasajeros en esa comuna.
- No se publican distancias a estaciones futuras sin accesos precisos verificados.
- La eventual construcción podría generar molestias temporales. No se atribuyen efectos a una vivienda específica.

### Línea 9 · trabajos previos en Santa Rosa con Alameda

Excavaciones arqueológicas informadas en el sector para la futura Línea 9. Este registro describe esas faenas, no el avance completo de la línea.

Responsable: Metro de Santiago / Red Movilidad. Ubicación: Santa Rosa con Alameda, sector Santa Lucía.

Estado: **En construcción**. Obras previas: excavaciones arqueológicas Información: 2026-08-12. Última revisión: 2026-10-31.

- [Red Movilidad: excavaciones y traslado de parada](https://www.red.cl/red-comunica/futura-construccion-linea-9-de-metro-parada-7-metro-santa-lucia-se-traslada-hacia-el-sur-por-trabajos-de-excavacion-en-santa-rosa-con-alameda/) — 2026-08-12.

- Sin fecha de término corroborada para estas faenas.
- No equivale a una estación operativa ni acredita la construcción de todos los tramos de Línea 9.
- Coordenadas del futuro acceso pendientes; no se calculan distancias.
- La comunicación informa traslado de parada y desvíos. Su continuidad al día de viaje debe consultarse en Red Movilidad.

### Nuevo Hospital San Pablo de Coquimbo

Nuevo recinto hospitalario de alta complejidad en el sector La Cantera.

Responsable: Minsal / Servicio de Salud Coquimbo / Dirección General de Concesiones MOP / Sociedad Concesionaria Hospital Coquimbo S.A.. Ubicación: Sector La Cantera, Coquimbo; numeración oficial contradictoria: Minsal 2379, DGC 2370..

Estado: **En construcción**. Construcción confirmada por informe ejecutivo DGC de agosto de 2026. Información: 2026-10-23. Última revisión: 2026-10-31.

- [Informe ejecutivo DGC, agosto 2026](https://concesiones.mop.gob.cl/uploads/sites/4/2026/10/Informe-Ejecutivo_Hospital-Coquimbo-agosto2026.pdf) — 2026-08.
- [Plan de Inversiones Minsal](https://plandeinversionesensalud.minsal.cl/hospital-san-pablo-de-coquimbo-ii-etapa/) — 2026-09.
- [Panel Técnico: discrepancia D12-2026-39](https://www.panelconcesiones.cl/noticias/ver/comunicado-discrepancia-d12-2026-39) — 2026-10-23.
- Cartografía: [OpenStreetMap: polígono Construcción Nuevo Hospital de Alta Complejidad de Coquimbo (ODbL 1.0)](https://www.openstreetmap.org/way/1125463653). Referencia: al perímetro del recinto en construcción; no al acceso.

- El informe DGC de agosto de 2026 registra puesta en servicio provisoria contractual máxima 07-02-2028. Existe discrepancia D12-2026-39 en trámite; no se presenta esa fecha como apertura garantizada.
- Minsal publica La Cantera 2379 y DGC La Cantera 2370; se utiliza el polígono cartográfico del recinto, no una dirección geocodificada por número.
- Los porcentajes y fechas de inicio publicados por Minsal, DGC y Servicio de Salud difieren; se omiten del contenido público.
- El polígono OSM fue revisado como ubicación de la construcción; su etiqueta histórica opening_date=2027 no se usa para el estado ni calendario.
- Durante las faenas deben considerarse eventuales ruidos y tránsito de construcción.
- La cercanía al recinto no demuestra un acceso peatonal ni tiempo de viaje; revisar conexiones viales y cruces.

### Parque Urbano Cerro Grande

Parque público con espacios recreativos y educación ambiental en La Serena.

Responsable: MINVU / SERVIU / Municipalidad de La Serena; Centro de Educación Ambiental CEAZA. Ubicación: Cerro Grande, La Serena; acceso sector Avenida Cuatro Esquinas..

Estado: **Operativa**. Apertura documentada en septiembre de 2025; actividades del operador CEAZA corroboradas en septiembre de 2026. Información: 2026-09-23. Última revisión: 2026-10-31.

- [Delegación Presidencial Coquimbo: apertura](https://www.dprcoquimbo.dpr.gob.cl/2025/09/26/nuevo-parque-urbano-cerro-grande-abre-sus-puertas/) — 2025-09-26.
- [CEAZA: actividades y funcionamiento en2026](https://www.ceaza.cl/2026/09/23/centro-de-educacion-ambiental-ceaza-reune-a-927-participantes-durante-su-primer-semestre-de-actividades-en-cerro-grande/) — 2026-09-23.
- Cartografía: [OpenStreetMap: polígono Parque Urbano Cerro Grande (ODbL 1.0)](https://www.openstreetmap.org/way/1214567323). Referencia: al perímetro del parque; no al acceso.

- No se validó un acceso público concreto para calcular recorrido. El único portón etiquetado en el polígono OSM es privado/cerrado y se excluye como acceso.
- El proyecto del catálogo más próximo, Alto San Joaquín, queda a más de 3,7km del polígono; no se aprueba asociación de cercanía en esta muestra.
- La cercanía al perímetro no determina acceso habilitado; parte del cerro presenta pendientes.
- Mayor afluencia de visitantes y necesidades de conservación son aspectos a considerar, no efectos medidos en viviendas.

### Borde costero Playa Chinchorro · segunda etapa

Conservación de paseo costero, pavimentos, iluminación y equipamiento recreativo.

Responsable: Dirección de Obras Portuarias, MOP. Ubicación: Paseo costero entre calle Buenos Aires y conexión con mejoramiento de Playa Las Machas..

Estado: **Operativa**. Inauguración confirmada por DOP el 16-09-2026. Información: 2026-09-16. Última revisión: 2026-10-31.

- [DOP: inauguración segunda etapa](https://dop.mop.gob.cl/2026/09/16/mop-inaugura-renovacion-de-13-kilometros-del-borde-costero-de-playa-chinchorro-de-arica-con-inversion-que-supera-los-4-mil-millones/) — 2026-09-16.
- [DOP: descripción del tramo intervenido](https://dop.mop.gob.cl/2026/04/07/dop-impulsa-conservacion-integral-del-borde-costero-de-playa-chinchorro-en-arica-para-reforzar-seguridad-y-estandar-urbano/) — 2026-04-07.

- Falta delimitar cartográficamente el tramo exacto y sus accesos. No asociar automáticamente todo Playa Chinchorro ni usar centro de playa como coordenada.
- Considerar afluencia de visitantes y actividad recreativa; no se midieron efectos sobre cada vivienda.

### Parque Costanera de Puerto Montt

Espacio público recuperado con paseo, áreas verdes y equipamiento recreativo.

Responsable: MINVU / SERVIU Los Lagos. Ubicación: Borde marítimo central entre Plaza de Armas y embarcadero hacia Tenglo y Maillén.

Estado: **Operativa**.  Información: 2026-09-14. Última revisión: 2026-10-31.

- [MINVU: Parque Costanera ejecutado y equipamiento](https://www.minvu.gob.cl/noticia/dos-obras-del-minvu-quedaron-seleccionadas-para-la-xiv-bienal-iberoamericana-de-arquitectura-y-urbanismo/) — 2026-09-14.
- [MINVU: alcance territorial Parque Costanera](https://www.minvu.gob.cl/parque-costanera/) — sin fecha editorial; revisión al corte.
- Cartografía: [OSM: perímetro Parque Costanera, way93670548](https://www.openstreetmap.org/way/93670548). Referencia: al perímetro del parque; no a un cruce peatonal.

- La ficha histórica MINVU conserva proyecciones de2022; se utiliza la evidencia de obra ejecutada de septiembre2026.
- El polígono OSM identifica el parque, no todos los cruces peatonales habilitados.
- Cruzar la avenida costera exige revisar pasos habilitados; las pendientes desde las terrazas aumentan el esfuerzo del recorrido.
- Considerar intensidad de uso y ruido de actividades recreativas.

### Nuevo Hospital de Villarrica

Hospital inaugurado en 2024 y clasificado por Minsal como entregado a uso.

Responsable: Minsal / Servicio de Salud Araucanía Sur. Ubicación: Avenida Saturnino Epulef; recinto nuevo, distinto del antiguo hospital de San Martín.

Estado: **Operativa**.  Información: 2024-10-04. Última revisión: 2026-10-31.

- [Minsal: inauguración del nuevo Hospital Villarrica](https://www.minsal.cl/ministra-de-salud-inaugura-hospital-de-villarrica-es-un-hospital-que-duplica-su-capacidad-instalada/) — 2024-10-04.
- [Minsal: Hospital Villarrica entregado a uso](https://plandeinversionesensalud.minsal.cl/hospital-de-villarrica/) — sin fecha editorial; revisión al corte.
- Cartografía: [OSM: recinto Hospital Villarrica, way857939722](https://www.openstreetmap.org/way/857939722). Referencia: al perímetro del nuevo recinto; no al acceso.

- Algunos directorios y documentos administrativos mantienen la antigua dirección San Martín 460; no se utiliza para georreferenciar el recinto nuevo.
- La proximidad no garantiza inscripción, disponibilidad de horas ni acceso inmediato a prestaciones.
- La distancia se refiere al perímetro; no se verificó recorrido ni entrada para pacientes.

### Nuevo Hospital de Puerto Varas

Hospital en construcción confirmado por el Plan de Inversiones Minsal.

Responsable: Minsal / Servicio de Salud del Reloncaví / Dirección General de Concesiones. Ubicación: Ruta5, acceso sur de Puerto Varas.

Estado: **En construcción**.  Información: 2026-10-15. Última revisión: 2026-10-31.

- [Minsal: construcción Hospital Puerto Varas, avance septiembre2026](https://plandeinversionesensalud.minsal.cl/hospital-de-puerto-varas/) — 2026-09.
- [El Heraldo Austral: visita del Servicio de Salud a las obras (apoyo)](https://eha.cl/noticia/local/servicio-de-salud-del-reloncavi-constata-avance-del-55-en-construccion-del-hospital-puerto-varas) — 2026-10-15.

- La fuente primaria informa avance a septiembre2026, sin día específico. La fecha de información corresponde al apoyo periodístico del15octubre sobre visita del Servicio de Salud.
- No se verificó geometría ni accesos futuros; no se asignan distancias.
- No se publica una fecha de apertura; avances constructivos no equivalen a habilitación sanitaria.
- Las obras pueden generar tránsito de faenas y alteraciones locales.

### Parque Costanera · Playa Urbana Puerto Varas

Recuperación del borde lacustre con paseos, miradores y accesos a la playa.

Responsable: MOP / Dirección de Obras Portuarias / Constructora BAPER S.A.. Ubicación: Entre Punta de Diamantes y humedal Marina Sur, borde de Avenida Vicente Pérez Rosales.

Estado: **En construcción**.  Información: 2026-07-13. Última revisión: 2026-10-31.

Inicio estimado documentado: Inicio contractual:6mayo2026; entrega de terreno:15junio2026 (DOP)..

- [DOP: inicio de construcción Parque Costanera Puerto Varas](https://dop.mop.gob.cl/2026/07/13/mop-da-inicio-a-la-construccion-del-nuevo-parque-costanera-en-puerto-varas/) — 2026-07-13.
- [Municipalidad Puerto Varas: inicio de obras y restricciones de uso](https://www.ptovaras.cl/noticias/puerto-varas-inicia-historica-transformacion-de-su-borde-lacustre-con-inversion-de-9700-millones) — 2026-07.

- Tramo y accesos no vectorizados con precisión suficiente: sin marcador ni relaciones calculadas.
- No se convierte el plazo contractual en una fecha garantizada de apertura.
- Durante las faenas hay cierres de acera y restricciones de acceso a la playa en sectores intervenidos.
- La circulación vial se informa mantenida, sujeta a cambios de obra.

### Parque Metropolitano de Puerto Montt

Proyecto de reconversión de terreno industrial en espacio público.

Responsable: MINVU / Gobierno Regional Los Lagos / Municipalidad Puerto Montt. Ubicación: Segunda terraza de Puerto Montt, antiguo terreno industrial.

Estado: **Aprobada**. Acuerdo de cofinanciamiento firmado; construcción no acreditada Información: 2026-09-28. Última revisión: 2026-10-31.

- [MINVU: acuerdo de cofinanciamiento Parque Metropolitano](https://www.minvu.gob.cl/noticia/minvu-gore-los-lagos-y-municipios-acuerdan-forma-de-financiamiento-para-materializar-parques-metropolitano-de-puerto-montt-y-la-toma-de-rio-negro/) — 2026-09-28.

- La aprobación registrada corresponde al acuerdo de cofinanciamiento firmado; no acredita por sí sola transferencia presupuestaria, adjudicación ni inicio de obra.
- Falta geometría precisa y accesos para relacionarlo con fichas.
- La ejecución depende de contratos y etapas posteriores; podrían existir molestias durante futuras faenas.

### Puente Cochrane · acceso vial oriente

Licitación5751-25-O126 para obras viales del acceso oriente.

Responsable: SERVIU Los Ríos. Ubicación: Acceso oriente del futuro Puente Cochrane, sector Valdivia centro–Barrios Bajos.

Estado: **En licitación**. Acceso oriente en licitación; no el puente completo Información: 2026-07-23. Última revisión: 2026-10-31.

- [Mercado Público: licitación 5751-25-O126 acceso oriente](https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=WXMAH3ZWCTOe2aFFuPIWig%3D%3D) — 2026-07-23.
- [DPR Los Ríos: sondajes de diseño y contratos complementarios](https://dprlosrios.dpr.gob.cl/noticias/autoridades-regionales-anuncian-inicio-de-sondajes-geotecnicos-para-el-puente-cochrane-en-valdivia/) — 2026-02-26.

- El puente principal está sujeto a actualización de ingeniería; licitar un acceso no confirma construcción de todo el puente.
- Mercado Público muestra cierre17noviembre2026; fechas futuras de adjudicación son programadas, no hechos cumplidos.
- Sin geometría contractual precisa no se calculan distancias desde Chacabuco637.
- Futuras obras podrían generar desvíos y tránsito en Barrios Bajos.

### Segunda Faja al Volcán · tramo urbano Villarrica

Ampliación urbana a doble calzada con infraestructura peatonal y ciclista.

Responsable: MOP / Dirección de Vialidad. Ubicación: Tramo urbano S-839 hasta la intersección con S-95-T.

Estado: **Operativa**.  Información: 2025-12-12. Última revisión: 2026-10-31.

- [Vialidad: inauguración del tramo urbano S-839](https://vialidad.mop.gob.cl/2025/12/12/ministra-lopez-inauguro-ampliacion-de-la-ruta-al-volcan-villarrica-en-la-region-de-la-araucania/) — 2025-12-12.
- [MOP: ficha presupuestaria del proyecto ampliado](https://proyectos.mop.gob.cl/proyecto.asp?cod_p=41784) — 2026-04-21.

- La inauguración se limita al tramo urbano de2,5km; la ficha presupuestaria incluye un proyecto mayor y no implica que17km estén terminados.
- Trazado preciso y conexión desde Terratolten no verificados; sin asociación individual.
- Mayor capacidad vial no elimina congestión estacional ni asegura tiempos de viaje.

### Colegio Río Maullín · proyecto privado

Proyecto educacional con calificación ambiental favorable.

Responsable: Sociedad Educacional San Esteban S.A.. Ubicación: Sector Nueva Braunau, comuna Puerto Varas.

Estado: **Aprobada**. RCA favorable20261000193; ejecución no confirmada Información: 2026-06-18. Última revisión: 2026-10-31.

- [SEA: RCA20261000193 firmada15junio2026](https://seia.sea.gob.cl/archivos/2026/06/18/RCA_N__20261000193_del_15-06-2026_FIRMADA_y_Notificacion_PAC.pdf) — 2026-06-15.
- [SEA: expediente2164395409, calificación favorable registrada18junio](https://seia.sea.gob.cl/expediente/ficha/fichaPrincipal.php?modo=normal&id_expediente=2164395409) — 2026-06-18.

- RCA20261000193 firmada15junio2026 y registrada18junio; no acredita financiamiento, inicio de obras ni apertura.
- El cronograma original mantiene noviembre2025, anterior a la RCA: no se reproduce como fecha vigente.
- No se asocia a viviendas del centro o Puerto Chico sólo por compartir comuna.
- La oferta futura, admisión y accesibilidad dependen de ejecución y operación.

### Nuevo CESFAM O’Higgins

Reposición del centro de salud familiar en un nuevo edificio.

Responsable: Servicio de Salud Concepción / Municipalidad de Concepción. Ubicación: Ex Liceo Balmaceda, esquina Las Heras con Salas.

Estado: **En construcción**.  Información: 2026-09-25. Última revisión: 2026-10-31.

- [Municipalidad Concepción: construcción nuevo CESFAM O’Higgins](https://concepcion.cl/un-85-de-avance-presentan-obras-del-nuevo-cesfam-ohiggins/) — 2026-05-12.
- [Servicio Salud Concepción: terreno ex Liceo Balmaceda](https://ssconce.redsalud.gob.cl/nuevo-cesfam-0higgins-demuelen-ruinas-de-ex-liceo-balmaceda/) — 2025-02-14.
- [Diario Concepción: construcción y proyección de apertura (apoyo)](https://www.diarioconcepcion.cl/ciudad/2026/09/25/nuevo-cesfam-ohiggins-concepcion-apertura-noviembre.html) — 2026-09-25.
- Cartografía: [OSM nodo309997048 compartido por Las Heras y Salas; contraste con ubicación oficial](https://www.openstreetmap.org/node/309997048). Referencia: a la esquina Las Heras–Salas documentada; acceso por confirmar.

- La construcción se acredita en fuente municipal; la actualización de septiembre es apoyo periodístico. No se acredita apertura al público.
- Existen proyecciones de apertura diferentes en2026 y2027; se omite fecha estimada.
- El marcador representa la intersección documentada, no la puerta ni el perímetro del nuevo edificio. No se usa el antiguo CESFAM de Salas538.
- Inscripción y atención dependen de la red de salud; cercanía no garantiza cupos.
- Considerar cierres puntuales, tránsito de faenas y posterior intensidad de uso.

### Nuevo Hospital de La Serena

Nuevo recinto hospitalario de alta complejidad en construcción. Minsal publica avance hasta septiembre de 2026.

Responsable: Minsal / DGC MOP / Sociedad Concesionaria Hospital La Serena S.A.. Ubicación: Cuatro Esquinas 1500, La Serena.

Estado: **En construcción**.  Información: 2026-03-30. Última revisión: 2026-10-31.

- [MOP: revisión de faenas de hospitales de La Serena y Coquimbo](https://www.mop.gob.cl/subsecretario-de-obras-publicas-revisa-avances-de-los-futuros-hospitales-de-la-serena-y-coquimbo/) — 2026-03-30.
- [Minsal: Hospital de La Serena, avance a septiembre de 2026](https://plandeinversionesensalud.minsal.cl/hospital-de-la-serena/) — 2026-09.
- Cartografía: [OpenStreetMap: terreno Construcción Nuevo Hospital de La Serena, way 1069815675](https://www.openstreetmap.org/way/1069815675). Referencia: al perímetro del hospital en construcción; no al acceso.

- Se mide al perímetro del terreno, no a una entrada futura. No se adopta la etiqueta OSM de apertura como calendario oficial.
- Las fuentes difieren en cifras de camas; se omite esa cifra. No se promete fecha de apertura.
- Posibles molestias de construcción y mayor circulación en el entorno.

### Parque Recreativo San Joaquín

Parque con áreas verdes y equipamiento recreativo cuya primera piedra y construcción fueron informadas por GORE.

Responsable: Municipalidad de La Serena / Gobierno Regional de Coquimbo. Ubicación: Sector San Joaquín, suroriente de La Serena.

Estado: **En construcción**.  Información: 2026-06-08. Última revisión: 2026-10-31.

- [GORE: inicio de construcción del Parque Recreativo San Joaquín](https://www.gorecoquimbo.cl/vecinos-celebran-el-inicio-de-la-construccion-del-parque-recreativo-san) — 2026-06-08.

- Falta un polígono y accesos públicos contrastados para calcular distancias individuales. La duración de 480 días no se convierte en fecha de apertura.
- Faenas y futura concentración de actividades pueden modificar ruido y circulación.

### Nuevo Hospital de Pichilemu

Hospital en construcción, con obra gruesa y avance documentados por MOP en septiembre de 2026.

Responsable: MOP / Minsal / Hospitales Red O’Higgins. Ubicación: Comuna de Pichilemu; nuevo recinto concesionado.

Estado: **En construcción**.  Información: 2026-09-24. Última revisión: 2026-10-31.

Inicio estimado documentado: Noviembre de 2025, según MOP.

Término estimado documentado: Meta de operación durante 2028, informada por MOP en septiembre de 2026; no garantizada. Sujeto a cambios.

- [MOP: avance de construcción del nuevo Hospital de Pichilemu](https://www.mop.gob.cl/mas-de-un-30-de-avance-tiene-construccion-de-nuevo-hospital-de-pichilemu-que-atendera-a-mas-de-70-mil-personas/) — 2026-09-24.

- No se dispone de coordenadas de accesos verificadas en este registro.
- La meta de operación 2028 está sujeta a avance, recepción y habilitación.
- Posibles molestias por obras y cambios de circulación.

### Obras marítimas y terrestres Caleta Papudo

Infraestructura marítima y terrestre para actividad pesquera, con avance de construcción documentado.

Responsable: Dirección de Obras Portuarias, MOP. Ubicación: Caleta de pescadores de Papudo.

Estado: **En construcción**.  Información: 2026-06-23. Última revisión: 2026-10-31.

Término estimado documentado: Enero de 2027, estimación de término de obras publicada por DOP en junio de 2026. Sujeto a cambios.

- [DOP: avance de obras marítimas y terrestres Caleta Papudo](https://dop.mop.gob.cl/2026/06/23/obras-de-nueva-infraestructura-portuaria-para-la-caleta-de-papudo-alcanzan-el-47-por-ciento-de-avance/) — 2026-06-23.

- Pendiente precisar perímetro y accesos antes de relacionarla por distancia.
- La fuente diferencia término de obras en enero de 2027 de una posible inauguración posterior.
- Actividad portuaria, carga y obras pueden generar ruido y circulación. No es un parque residencial.

### Proyecto Inmobiliario Olas de Puyai

Propuesta privada de viviendas y locales comerciales sometida a evaluación ambiental y participación ciudadana.

Responsable: Titular: Antonia Chicharro Benavente; evaluación SEA Valparaíso. Ubicación: Intersección Avenida Marítima y Paseo Punta Puyai, Papudo.

Estado: **En estudio o evaluación**.  Información: 2026-10-27. Última revisión: 2026-10-31.

- [Diario Oficial: apertura de participación ciudadana, RCA aún no acreditada](https://www.diariooficial.interior.gob.cl/publicaciones/2026/10/27/44584/01/2891490.pdf) — 2026-10-27.
- [SEA: descripción y localización de Olas de Puyai](https://www.sea.gob.cl/portal-de-participacion-ciudadana-y-consulta-indigena/proyecto/proyecto-inmobiliario-olas-de-puyai) — sin fecha editorial; revisión al corte.

- Evaluación ambiental no equivale a aprobación, financiamiento ni construcción.
- El calendario 2027–2030 corresponde a la propuesta del titular; no es una ejecución confirmada.
- Falta georreferenciar el polígono del expediente para asociar viviendas.
- Podría aumentar la intensidad de uso, tránsito y molestias de construcción; incluye evaluación de efectos sobre humedales.

### Avenida Baquedano · segunda etapa

Mejoramiento vial adjudicado a Vialfi Ltda., con financiamiento conjunto informado.

Responsable: MINVU / SERVIU O’Higgins / Gobierno Regional. Ubicación: Entre acceso 3 del Cementerio N.º 2 y calle Lourdes, Rancagua.

Estado: **Adjudicada**.  Información: 2026-09-14. Última revisión: 2026-10-31.

Inicio estimado documentado: Noviembre de 2026, inicio proyectado por MINVU.

- [MINVU: adjudicación de segunda etapa de Avenida Baquedano](https://www.minvu.gob.cl/noticia/ministro-poduje-anuncia-inicio-de-segunda-etapa-de-avenida-baquedano-con-historica-inversion-para-la-region-de-ohiggins/) — 2026-09-14.

- El inicio anunciado para noviembre no se presenta como construcción al corte de octubre.
- La tercera etapa tiene trámites pendientes y no se incluye como adjudicada.
- No se vincula automáticamente con Cáceres por compartir comuna.
- Se esperan alteraciones de circulación durante las faenas.

### Mejoramiento del alumbrado público de Valparaíso · etapa 1

Licitación publicada para recambio de luminarias con financiamiento FNDR.

Responsable: Municipalidad de Valparaíso / Gobierno Regional. Ubicación: 40 sectores de Valparaíso, incluidos Yolanda y Rodelillo.

Estado: **En licitación**.  Información: 2026-10-27. Última revisión: 2026-10-31.

- [Municipio: licitación de recambio de luminarias](https://municipalidaddevalparaiso.cl/que-calles-de-valparaiso-tendran-nuevas-luces-led-revisa-los-sectores-contemplados-en-el-proyecto/) — 2026-10-27.

- La inclusión del sector Rodelillo no demuestra que Camino Los Ingleses 715 esté en el listado de puntos.
- El plazo de 12 meses se cuenta después de adjudicación y contrato; no es fecha de término confirmada.
- Las instalaciones pueden producir intervenciones temporales en calles.

### Iluminación y televigilancia población Chinchorro

Obra de iluminación y televigilancia adjudicada en Mercado Público, ID 2369-14-LP26.

Responsable: Municipalidad de Arica / financiamiento MINVU. Ubicación: Población Chinchorro; visita técnica en Víctor Guzmán con Presbítero Ramírez.

Estado: **Adjudicada**.  Información: 2026-06-26. Última revisión: 2026-10-31.

- [Mercado Público: licitación 2369-14-LP26 adjudicada](https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=onqKTbFY7AW1vmOIJpGy%2FQ%3D%3D) — 2026-06-26.

- La adjudicación no demuestra inicio o recepción de obras.
- El lugar de visita técnica no es el polígono de intervención; no se usa como marcador ni distancia.
- La incorporación de cámaras no acredita una reducción delictual.

### Ampliación Cenco Rancagua

Ampliación del centro comercial, confirmada por su responsable, que mantiene parte del recinto operativa.

Responsable: Cenco Malls / Cencosud Shopping. Ubicación: Avenida Presidente Eduardo Frei 750, Rancagua.

Estado: **En construcción**.  Información: 2026-08-19. Última revisión: 2026-10-31.

Término estimado documentado: Apertura de los últimos locales proyectada durante 2028 por el responsable; sujeta a cambios. Sujeto a cambios.

- [Cenco Malls: obras, accesos y calendario de ampliación](https://www.cencomalls.cl/rancagua/nuevo-cenco-rancagua) — sin fecha editorial; revisión al corte.
- [El Tipógrafo: obras en marcha; corroboración temporal](https://eltipografo.cl/2026/08/expansion-de-cenco-rancagua-promete-importantes-novedades-en-que-etapa-van) — 2026-08-19.
- Cartografía: [Punto de destino enlazado por Cenco Malls en Cómo llegar (no centro de cámara)](https://www.cencomalls.cl/rancagua/como-llegar). Referencia: al punto de referencia del centro comercial; no al acceso ni frente de obras.

- El punto oficial de referencia identifica el centro comercial, no el frente específico de faenas ni un acceso medido.
- La página del responsable no tiene fecha editorial; el estado se contrastó con noticia de agosto y se revisó al corte.
- El responsable informa mitigación de ruido y polvo y posibles cortes parciales y desvíos.

### Alcantarillado urbano Pichilemu · Zona 1

Contrato firmado para obras de colectores, conexiones y reposición de pavimentos.

Responsable: Municipalidad de Pichilemu / Gobierno Regional de O’Higgins. Ubicación: Zona 1 urbana, sectores Centro y El Llano.

Estado: **Adjudicada**.  Información: 2026-09-16. Última revisión: 2026-10-31.

- [GORE: contrato de alcantarillado Zona 1 firmado](https://goreohiggins.cl/noticias/noticias-gore/1339-gobierno-regional-y-municipalidad-de-pichilemu-firman-contrato-para-iniciar-obras-de-alcantarillado) — 2026-09-16.

- El inicio esperado en octubre no se considera ejecución confirmada sin una fuente posterior.
- No está acreditado que Endémico se encuentre en la zona atendida; faltan plano de red y dirección precisa del proyecto.
- Las obras contemplan intervención de pavimentos y redes; pueden afectar accesos y circulación.

### Mejoramiento Parque Portales

Renovación de pavimentos, riego y equipamiento del parque.

Responsable: Municipalidad de Santiago. Ubicación: Parque Portales, Santiago.

Estado: **En construcción**.  Información: 2026-10-21. Última revisión: 2026-10-31.

- [Municipalidad: cartera de parques y plazas](https://www.munistgo.cl/plazas-y-parques-de-la-comuna-se-renuevan-con-un-plan-de-inversion-que-supera-los-18-mil-millones/) — 2026-10-21.
- [Municipalidad: inicio Parque Portales](https://www.munistgo.cl/con-inversion-de-mas-de-4-600-millones-comienzan-las-obras-de-mejoramiento-del-parque-portales-de-santiago/) — 2025-12-11.
- Cartografía: [OpenStreetMap: Parque Portales (way 173295539), ODbL 1.0](https://www.openstreetmap.org/way/173295539). Referencia: al perímetro cartografiado del recinto; no al acceso.

- La estimación original de octubre de 2026 no acredita término: el municipio aún informó ejecución el 21-10-2026.
- El perímetro OSM representa el parque existente; el área exacta de cada faena puede ser menor.
- Las obras pueden generar cierres parciales, ruido o cambios de circulación; no se han medido efectos en viviendas.

### Proyecto de mejoramiento Parque Almagro

Propuesta municipal de renovación del parque existente.

Responsable: Municipalidad de Santiago. Ubicación: Parque Almagro.

Estado: **Idea o anuncio preliminar**. Proyecto anunciado; ejecución no confirmada. Información: 2026-10-21. Última revisión: 2026-10-31.

- [Municipalidad: cartera de parques y plazas](https://www.munistgo.cl/plazas-y-parques-de-la-comuna-se-renuevan-con-un-plan-de-inversion-que-supera-los-18-mil-millones/) — 2026-10-21.
- Cartografía: [OpenStreetMap: Parque Almagro (relation 15957924), ODbL 1.0](https://www.openstreetmap.org/relation/15957924). Referencia: al perímetro cartografiado del recinto; no al acceso.

- La cartera agregada no demuestra licitación ni inicio de esta intervención particular.
- Se mide al parque actual, no al límite de futuras faenas.
- Las obras pueden generar cierres parciales, ruido o cambios de circulación; no se han medido efectos en viviendas.

### Proyecto de mejoramiento Parque Forestal

Propuesta municipal de renovación del parque existente.

Responsable: Municipalidad de Santiago. Ubicación: Parque Forestal.

Estado: **Idea o anuncio preliminar**. Proyecto anunciado; ejecución no confirmada. Información: 2026-10-21. Última revisión: 2026-10-31.

- [Municipalidad: cartera de parques y plazas](https://www.munistgo.cl/plazas-y-parques-de-la-comuna-se-renuevan-con-un-plan-de-inversion-que-supera-los-18-mil-millones/) — 2026-10-21.
- Cartografía: [OpenStreetMap: Parque Forestal (way 332070819), ODbL 1.0](https://www.openstreetmap.org/way/332070819). Referencia: al perímetro cartografiado del recinto; no al acceso.

- La cartera agregada no demuestra licitación ni inicio de esta intervención particular.
- Se mide al parque actual, no al límite de futuras faenas.
- Las obras pueden generar cierres parciales, ruido o cambios de circulación; no se han medido efectos en viviendas.

### Proyecto de renovación de juegos Plaza Panamá

Mejoramiento anunciado de la zona de juegos.

Responsable: Municipalidad de Santiago. Ubicación: Plaza Panamá, sector Martínez de Rozas.

Estado: **Idea o anuncio preliminar**. Anuncio de aporte privado; contrato y ejecución no verificados. Información: 2026-10-21. Última revisión: 2026-10-31.

- [Municipalidad: cartera de parques y plazas](https://www.munistgo.cl/plazas-y-parques-de-la-comuna-se-renuevan-con-un-plan-de-inversion-que-supera-los-18-mil-millones/) — 2026-10-21.
- Cartografía: [OpenStreetMap: Plaza Panamá (way 23486863), ODbL 1.0](https://www.openstreetmap.org/way/23486863). Referencia: al perímetro cartografiado del recinto; no al acceso.

- No se acredita desembolso, adjudicación ni fecha de inicio.
- La geometría corresponde a la plaza, no a la superficie exacta de juegos.
- Las obras pueden generar cierres parciales, ruido o cambios de circulación; no se han medido efectos en viviendas.

### Nuevo CESFAM Erasmo Escala

Centro de atención primaria inaugurado en marzo de 2026, con vacunatorio habilitado en agosto.

Responsable: Municipalidad de Santiago. Ubicación: Erasmo Escala 2767, barrio Yungay.

Estado: **Operativa**.  Información: 2026-08-13. Última revisión: 2026-10-31.

- [Municipalidad: vacunatorio Erasmo Escala operativo](https://www.munistgo.cl/cesfam-erasmo-escala-amplia-sus-prestaciones-con-nuevo-vacunatorio/) — 2026-08-13.
- [Municipalidad: apertura CESFAM Erasmo Escala](https://www.munistgo.cl/nuevo-cesfam-erasmo-escala-abre-sus-puertas-en-barrio-yungay-tras-mas-de-una-decada-de-espera/) — 2026-03-10.
- Cartografía: [OpenStreetMap: CESFAM Erasmo Escala (way 527635115), ODbL 1.0](https://www.openstreetmap.org/way/527635115). Referencia: al perímetro cartografiado del recinto; no al acceso.

- La cercanía no determina inscripción, prestaciones disponibles ni asignación territorial de atención.
- Distancia al perímetro: el acceso y los cruces efectivos deben verificarse.

### NIDO Lucía · torre y laboratorios operativos

Primera etapa con oficinas y laboratorios; se distingue del futuro mercado.

Responsable: Territoria / Fundación Chile / Corfo. Ubicación: Torre de Santa Rosa 76; proyecto NIDO también declara San Isidro 85.

Estado: **Operativa**.  Información: 2026-03-25. Última revisión: 2026-10-31.

- [Corfo: operación de startuplab.01](https://www.corfo.gob.cl/sites/cpp/nacional/startuplab-01-abre-su-segunda-convocatoria-para-startups-cientifico-tecnologicas/) — 2026-03-25.
- [Territoria: etapas de NIDO Lucía](https://territoria.cl/es/nuestros-proyectos/) — sin fecha editorial; revisión al corte.
- [Fundación Chile: ubicación startuplab.01](https://fch.cl/wp-content/uploads/2024/11/Que-es-startuplab.01.pdf) — sin fecha editorial; revisión al corte.
- Cartografía: [OpenStreetMap: Edificio Santa Rosa 76 (way 120367420), ODbL 1.0](https://www.openstreetmap.org/way/120367420). Referencia: al perímetro cartografiado del recinto; no al acceso.

- El polígono representa la torre existente, no toda la manzana ni la segunda etapa.
- El recinto no equivale a un servicio público de libre acceso. Considerar mayor afluencia y circulación.

### NIDO Lucía · segunda etapa anunciada

Propuesta de mercado y espacios abiertos complementarios a la torre.

Responsable: Territoria. Ubicación: Manzana de Santa Rosa y San Isidro, Santiago.

Estado: **Idea o anuncio preliminar**. Anuncio del desarrollador; inicio de construcción no comprobado. Información: 2026-10-31. Última revisión: 2026-10-31.

Inicio estimado documentado: Fines de 2026, anuncio del desarrollador sin inicio comprobado.

Término estimado documentado: Fines de 2029, estimación del desarrollador, sujeta a cambios. Sujeto a cambios.

- [Territoria: etapas de NIDO Lucía](https://territoria.cl/es/nuestros-proyectos/) — sin fecha editorial; revisión al corte.

- Fuente sin fecha editorial; revisada el 31-10-2026.
- No se acreditan permisos, financiamiento ni faenas de esta etapa.
- Sin perímetro de intervención validado; no se calculan distancias.
- Las obras pueden generar cierres parciales, ruido o cambios de circulación; no se han medido efectos en viviendas.

### Nueva Alameda · bandejón central, tramos 1 y 2

Renovación del bandejón entre Vicuña Mackenna y Matucana.

Responsable: SERVIU RM / Gobierno de Santiago / SUBDERE. Ubicación: Alameda: Vicuña Mackenna–Manuel Rodríguez–Matucana.

Estado: **En construcción**.  Información: 2026-10-29. Última revisión: 2026-10-31.

Inicio estimado documentado: Abril de 2026, según GORE.

- [GORE: avance bandejón central Alameda](https://www.gobiernosantiago.cl/2026/10/29/proyecto-nueva-alameda-avanza-en-la-renovacion-del-bandejon-central-con-espacios-mas-seguros-verdes-y-accesibles/) — 2026-10-29.

- No incluye el tercer tramo de Estación Central como obra iniciada.
- Falta geometría del bandejón intervenido para distancias individuales.
- Las obras pueden generar cierres parciales, ruido o cambios de circulación; no se han medido efectos en viviendas.

### UNAB Campus República · edificio R14

Edificio universitario inaugurado en abril de 2026.

Responsable: Universidad Andrés Bello. Ubicación: Intersección Echaurren y Sazié.

Estado: **Operativa**.  Información: 2026-04-06. Última revisión: 2026-10-31.

- [UNAB: inauguración edificio R14](https://noticias.unab.cl/campus-republica-suma-un-nuevo-hito-con-la-inauguracion-del-edificio-r14/) — 2026-04-06.

- No se verificó huella y acceso del edificio R14; no se asignan distancias.
- Uso sujeto a reglas universitarias; considerar flujos de estudiantes y actividad urbana.

### Renovación propuesta Plaza Artesanos del 900

Actualización de diseño con participación vecinal.

Responsable: Municipalidad de Santiago. Ubicación: Plaza Artesanos del 900, barrio Santa Isabel.

Estado: **En estudio o evaluación**. Diseño en revisión; obra no confirmada. Información: 2026-09-01. Última revisión: 2026-10-31.

- [Municipalidad: propuesta Plaza Artesanos del 900](https://www.munistgo.cl/mas-areas-verdes-juegos-y-espacios-de-encuentro-contempla-renovacion-de-plaza-artesanos-del-900/) — 2026-09-01.

- No se acreditan contratación ni inicio; coordenadas del recinto pendientes.
- Las obras pueden generar cierres parciales, ruido o cambios de circulación; no se han medido efectos en viviendas.

### Recuperación de eje Bandera para buses

Eje habilitado para cuatro servicios Red desde el 3 de octubre de 2026.

Responsable: MTT / Red Movilidad / MINVU / Municipalidad de Santiago. Ubicación: Bandera, entre sector San Diego y General Mackenna.

Estado: **Operativa**.  Información: 2026-10-02. Última revisión: 2026-10-31.

- [Red Movilidad: retorno de buses a Bandera](https://www.red.cl/red-comunica/buses-red-vuelven-a-calle-bandera-mejorando-tiempos-de-viaje-de-sur-a-norte-de-santiago/) — 2026-10-02.

- No se asignan distancias al eje ni a paradas sin geometría de acceso validada.
- Convivencia de peatones y buses; revisar paradas y cambios vigentes antes del viaje.

### SAR Santa Anselma

Nuevo servicio de urgencia primaria con capacidad diagnóstica ampliada.

Responsable: Servicio de Salud Metropolitano Sur / Municipalidad de La Cisterna. Ubicación: Brisas del Maipo 0515, La Cisterna.

Estado: **Operativa**.  Información: 2026-08-17. Última revisión: 2026-10-31.

- [SSMS: SAR Santa Anselma operativo](https://ssms.gob.cl/2026/08/17/red-de-urgencia-del-ssms-refuerza-su-capacidad-de-respuesta-territorial-con-la-inauguracion-del-sar-santa-anselma-en-la-cisterna/) — 2026-08-17.
- [Municipalidad: dirección y funcionamiento SAR](https://www.cisterna.cl/paginas/sar-santa-anselma) — sin fecha editorial; revisión al corte.
- Cartografía: [OpenStreetMap: perímetro cartografiado, way 1466878823](https://www.openstreetmap.org/way/1466878823). Referencia: al perímetro cartografiado del recinto; no al acceso.

- La apertura asistencial fue el 22-12-2025; las ceremonias posteriores no representan el inicio de atención.
- OSM registra Brisas del Maipo518 y la fuente oficial0515. Identidad nominal del edificio concordante; se mide sólo al perímetro, no a puerta ni numeración. Verificación en terreno pendiente.
- La relación con cada vivienda requiere revisar accesos y recorridos reales.

### Nuevo CESFAM Eduardo Frei Montalva

Reposición de infraestructura de atención primaria inaugurada por Minsal.

Responsable: Minsal / SSMS / Municipalidad de La Cisterna. Ubicación: Bombero Encalada375, La Cisterna.

Estado: **Operativa**.  Información: 2025-07-15. Última revisión: 2026-10-31.

- [Minsal: inauguración nuevo CESFAM Eduardo Frei](https://www.minsal.cl/ministra-de-salud-ximena-aguilera-inaugura-moderno-cesfam-eduardo-frei-montalva-en-la-cisterna/) — 2025-07-15.
- [Salud Responde: directorio RM](https://saludresponde.minsal.cl/lugares-y-horarios-metropolitana/) — sin fecha editorial; revisión al corte.
- [Mercado Público: inauguración del nuevo recinto en Bombero Encalada375](https://www.mercadopublico.cl/PurchaseOrder/Modules/PO/DetailsPurchaseOrder.aspx?qs=cZYRViUVCJpRrcGWAjk9UA%3D%3D) — 2025-07-15.
- Cartografía: [OpenStreetMap: perímetro cartografiado, way 1422491570](https://www.openstreetmap.org/way/1422491570). Referencia: al perímetro cartografiado del recinto; no al acceso.

- El polígono OSM identifica CESFAM Eduardo Frei Montalva en Bombero Óscar Encalada375; se distingue del antiguo recinto Ossa140. No se verificó el punto exacto de entrada.
- La relación con cada vivienda requiere revisar accesos y recorridos reales.

### Parque Cenco Florida

Desarrollo privado de espacios abiertos y gastronomía vinculado al centro comercial.

Responsable: Cenco Malls. Ubicación: Recinto Cenco Florida, La Florida; perímetro de la intervención pendiente.

Estado: **En construcción**.  Información: 2026-08-05. Última revisión: 2026-10-31.

- [Cenco Malls: resultados segundo trimestre 2026, página 8](https://www.cencomalls.com/sites/cencomallscom/files/2026-08/Earnings%20Release%20Cenco%20Malls%202T26%20(ESP).pdf) — 2026-08-05.

- La pista de patinaje es una apertura parcial; no equivale a la operación completa del parque.
- No se presume acceso público irrestricto ni horarios definitivos.
- No se verificó una geometría precisa de la intervención; no se calcula distancia ni se asigna cercanía a una ficha.
- La relación con cada vivienda requiere revisar accesos y recorridos reales.

### Multifamily Cenco Florida

Proyecto de uso residencial asociado al centro comercial, con obras iniciadas según el responsable.

Responsable: Cenco Malls. Ubicación: Recinto Cenco Florida; emplazamiento específico pendiente.

Estado: **En construcción**.  Información: 2026-08-05. Última revisión: 2026-10-31.

- [Cenco Malls: resultados segundo trimestre 2026, página 8](https://www.cencomalls.com/sites/cencomallscom/files/2026-08/Earnings%20Release%20Cenco%20Malls%202T26%20(ESP).pdf) — 2026-08-05.

- No confundir con el proyecto de Mallplaza y Salfacorp.
- No se verificó una geometría precisa de la intervención; no se calcula distancia ni se asigna cercanía a una ficha.
- Las obras pueden generar ruido, tránsito de construcción y cambios en la intensidad de uso.
- No se presupone que añadir viviendas beneficie el valor de otros inmuebles.

### Mejoramiento Parque Castillo Urizar

Mejoramiento de espacio público con licitación de obras adjudicada.

Responsable: Municipalidad de Macul / Gobierno Regional Metropolitano. Ubicación: Bandejón central Castillo Urizar, entre Los Espinos y avenida Quilín, Macul.

Estado: **Adjudicada**. Adjudicación de obra 2287-104-LR24; no se acredita inicio físico. Información: 2026-01-08. Última revisión: 2026-10-31.

- [Mercado Público: obra 2287-104-LR24 adjudicada](https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=4a9cNLN+xlW03jplPWg+hA%3D%3D) — 2026-01-08.
- [Mercado Público: asistencia técnica 2287-31-LE26](https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=MzbKrK23Yau4TwoiyvM6Ig%3D%3D) — 2026-09-29.
- [CORE: tramo y financiamiento del mejoramiento](https://coresantiago.cl/core-aprueba-construccion-de-alcantarillado-en-talagante-buses-para-distintas-comunas-reposicion-de-luminarias-mejoramiento-de-veredas-y-espacios-publicos/) — sin fecha editorial; revisión al corte.
- Cartografía: [OpenStreetMap: perímetro cartografiado, way 41769568](https://www.openstreetmap.org/way/41769568). Referencia: al perímetro del bandejón intervenido; no a un acceso.

- La licitación de asistencia técnica de septiembre no demuestra por sí sola que la obra haya comenzado.
- Polígono OSM41769568 etiquetado leisure=park sin nombre, identificado por su emplazamiento exacto entre Los Espinos y Quilín y las calzadas Castillo Urizar conforme a la delimitación CORE. No se utiliza Plaza Castillo Urizar al sur de Quilín.
- La relación con cada vivienda requiere revisar accesos y recorridos reales.

### Ampliación Escuela de Construcción Civil UC

Ampliación de quinto piso en ejecución estructural informada por la universidad.

Responsable: Pontificia Universidad Católica de Chile. Ubicación: Campus San Joaquín, edificio Escuela de Construcción Civil.

Estado: **En construcción**.  Información: 2026-08-19. Última revisión: 2026-10-31.

- [UC: ampliación Escuela Construcción Civil en ejecución](https://infraestructura.uc.cl/noticias/475-avance-de-obra-ampliacion-5-piso-escuela-de-construccion-civil-uc) — 2026-08-19.

- Es equipamiento de acceso institucional, no un servicio abierto automáticamente a residentes.
- No se verificó una geometría precisa de la intervención; no se calcula distancia ni se asigna cercanía a una ficha.
- La relación con cada vivienda requiere revisar accesos y recorridos reales.

### Parque Metropolitano Sur Cerro Chena

Parque con obras aún por finalizar y recepción pendiente según acuerdo institucional.

Responsable: Gobierno de Santiago / MINVU. Ubicación: Cerro Chena, San Bernardo; acceso del proyecto pendiente.

Estado: **En construcción**. Obras y recepción aún pendientes; apertura no confirmada. Información: 2026-10-08. Última revisión: 2026-10-31.

- [MINVU: acuerdo para futura apertura Parque Cerro Chena](https://www.minvu.gob.cl/noticia/minvu-y-gobierno-de-santiago-alcanzan-acuerdo-para-apertura-del-parque-cerro-chena/) — 2026-10-08.

- No se verificó una geometría precisa de la intervención; no se calcula distancia ni se asigna cercanía a una ficha.
- La relación con cada vivienda requiere revisar accesos y recorridos reales.

### Parque Pulmón Verde de San Bernardo

Proyecto de parque y mejoras viales con financiamiento sectorial informado por el municipio.

Responsable: MINVU / Municipalidad de San Bernardo. Ubicación: Terreno adquirido a Bancard; sector Sánchez–Padre Hurtado.

Estado: **Con financiamiento confirmado**. Financiamiento MINVU comunicado; diseño participativo en desarrollo. Información: 2026-10-16. Última revisión: 2026-10-31.

Término estimado documentado: 2029, proyección municipal de octubre de 2026; sujeta a ejecución y recepción.. Sujeto a cambios.

- [San Bernardo: compromiso y financiamiento Pulmón Verde](https://www.sanbernardo.cl/historica-inversion-de-10-000-millones-del-minvu-dara-vida-al-nuevo-parque-pulmon-verde-y-300-viviendas-sociales-en-san-bernardo/) — 2026-10-16.

- No se verificó una geometría precisa de la intervención; no se calcula distancia ni se asigna cercanía a una ficha.
- La relación con cada vivienda requiere revisar accesos y recorridos reales.

### Parque Estadio Nacional · áreas abiertas

Áreas comunes para actividad física y recreación; se registra el parque habilitado, no una supuesta conclusión de todas las mitigaciones exteriores.

Responsable: Instituto Nacional de Deportes. Ubicación: Recinto entre Grecia, Pedro de Valdivia, Guillermo Mann y Marathon.

Estado: **Operativa**. Áreas comunes abiertas; los recintos deportivos tienen reglas independientes. Información: 2026-08-05. Última revisión: 2026-10-31.

- [IND: acceso a las áreas abiertas del Parque Estadio Nacional](https://ind.cl/noticias/parque-estadio-nacional-amplia-horario-para-la-practica-de-actividad-fisica-en-sus-areas-abiertas/) — 2026-08-05.
- [Operador: Parque Estadio Nacional](https://parqueestadionacional.cl/) — sin fecha editorial; revisión al corte.
- [IND: estado de mitigaciones exteriores al 06-03-2026](https://www.camara.cl/verDoc.aspx?prmID=265129&prmTIPO=DOCUMENTOCOMUNICACIONCUENTACOMISION&prmTipoOrigen=4) — 2026-03-06.
- Cartografía: [OSM: perímetro Parque Deportivo Estadio Nacional, relación 16289078 (ODbL 1.0)](https://www.openstreetmap.org/relation/16289078). Referencia: al perímetro del parque; no a un acceso.

- IND acredita acceso a áreas abiertas. El oficio de marzo de 2026 mantiene mitigaciones exteriores pendientes; no se presentan como terminadas.
- Eventos masivos pueden producir cierres, ruido y mayor tránsito. Consultar acceso vigente.
- Los recintos deportivos y de alto rendimiento no son todos de acceso libre.

### Parque Mapocho Río

Parque lineal con áreas verdes y equipamiento recreativo.

Responsable: MINVU / SERVIU Metropolitano. Ubicación: Ribera sur del Mapocho, Quinta Normal y Cerro Navia.

Estado: **Operativa**. Apertura total de sus seis etapas documentada por MINVU. Información: 2025-03-04. Última revisión: 2026-10-31.

- [MINVU: apertura de los últimos tramos de Mapocho Río](https://www.minvu.gob.cl/noticia/gobierno-entrega-parque-mapocho-rio-a-la-ciudadania-tras-inauguracion-de-ultima-etapa-en-cerro-navia/) — 2025-03-04.

- Sólo se recuperó cartografía de un tramo; no se utiliza como perímetro de todo el parque ni se fuerza asociación desde Quinta Normal o Renca.
- El río y las autopistas condicionan los recorridos; compartir ribera o comuna no acredita acceso directo.

### Teleférico Bicentenario

Sistema de transporte por cable en construcción.

Responsable: MOP / Dirección General de Concesiones. Ubicación: Canal San Carlos–Parque Metropolitano–Ciudad Empresarial.

Estado: **En construcción**. Instalación de cabinas documentada por MOP. Información: 2026-06-18. Última revisión: 2026-10-31.

Término estimado documentado: Primer trimestre de 2027, estimación MOP de 18-06-2026; sujeta a cambios.. Sujeto a cambios.

- [MOP: instalación de cabinas del Teleférico Bicentenario](https://www.mop.gob.cl/comienza-instalacion-de-las-121-cabinas-de-pasajeros-del-teleferico-bicentenario-que-entrara-en-operacion-en-2027/) — 2026-06-18.

- No se validaron coordenadas de accesos; no se asocia por compartir comuna.
- Conecta Huechuraba se ubica en Los Libertadores, no en Ciudad Empresarial.
- Las obras y accesos pueden alterar tránsito y circulación peatonal.

### Túnel Lo Ruiz

Dos túneles y conexiones a la red vial metropolitana.

Responsable: MOP / Autopista Central. Ubicación: Cerro Lo Ruiz y conexiones viales del Nudo Quilicura.

Estado: **En construcción**. Obras en ejecución documentadas por MOP. Información: 2026-08-19. Última revisión: 2026-10-31.

Término estimado documentado: Mediados de 2029, estimación MOP de 19-08-2026; sujeta a cambios.. Sujeto a cambios.

- [MOP: construcción del Túnel Lo Ruiz](https://www.mop.gob.cl/construccion-de-tunel-lo-ruiz-que-va-a-descongestionar-el-nudo-quilicura-ya-tiene-un-20-de-avance/) — 2026-08-19.

- Sin cartografía completa de enlaces validada; no se atribuye una distancia desde viviendas ni se garantizan menores tiempos.
- Considerar desvíos, ruido de faenas y tránsito de carga.

### Renovación Parque El Trébol

Renovación de espacio comunitario con senderos, equipamiento inclusivo y áreas de recreación.

Responsable: Municipalidad de Independencia / Autopista Central / DGC MOP. Ubicación: Avenida Fermín Vivaceta, Independencia.

Estado: **En construcción**. Inicio de obras informado el 30-10-2026. Información: 2026-10-30. Última revisión: 2026-10-31.

Inicio estimado documentado: Inicio informado el 30-10-2026.

Término estimado documentado: Plazo aproximado de ocho meses informado al inicio; no equivale a fecha de apertura garantizada.. Sujeto a cambios.

- [Municipalidad de Independencia: inicio de renovación Parque El Trébol](https://www.independencia.cl/municipalidad-de-independencia-autopista-central-y-direccion-general-de-concesiones-inician-obras-para-renovar-el-parque-el-trebol/) — 2026-10-30.
- [VíasChile: inicio de obras de renovación Parque El Trébol](https://www.viaschile.cl/municipalidad-de-independencia-autopista-central-y-direccion-general-de-concesiones-inician-obras-para-renovar-el-parque-el-trebol/) — 2026-10-30.

- La fuente no fija un polígono o acceso preciso; no se confunde con la Plazoleta El Trébol de Santiago.
- Durante las faenas puede haber restricciones de acceso, polvo y ruido.

### Hospital Zona Norte · adquisición de terreno

Asignación presupuestaria para la adquisición de terreno destinado a un futuro hospital.

Responsable: Minsal / Servicio de Salud Metropolitano Norte. Ubicación: Sector Valle Grande, Lampa.

Estado: **Con financiamiento confirmado**. Financiamiento confirmado exclusivamente para adquirir el terreno; no para ejecutar el hospital completo. Información: 2026-08-17. Última revisión: 2026-10-31.

- [Minsal: presupuesto para adquisición del terreno de Hospital Zona Norte](https://www.minsal.cl/minsal-anuncia-que-el-nuevo-hospital-para-la-zona-norte-de-la-rm-se-hara-en-lampa/) — 2026-08-17.

- No se confirma financiamiento total de construcción, inicio de faenas ni apertura.
- La cobertura potencial de la red no acredita cercanía a cada proyecto de Conchalí, Independencia o Quilicura.
- Un terreno financiado no implica servicios disponibles ni una fecha de atención.

### Mall Vivo Santiago · etapa II

Proyecto de centro comercial y usos complementarios evaluado ambientalmente.

Responsable: Inmobiliaria Vivo Santiago SpA. Ubicación: Avenida Vicuña Mackenna, sector estación Ñuble.

Estado: **Aprobada**. RCA favorable N°202213001571, de 06-10-2022; aprobación respaldada por fallo informado el 06-06-2025. Información: 2025-06-06. Última revisión: 2026-10-31.

- [Segundo Tribunal Ambiental: aprobación ambiental Mall Vivo Santiago Etapa II](https://tribunalambiental.cl/r-532-2025-admite-19/) — 2025-06-06.
- [Responsable: proyecto Vivo Santiago](https://www.vivosantiago.cl/) — sin fecha editorial; revisión al corte.

- La aprobación ambiental no confirma financiación ni construcción actual.
- No se publican fechas de apertura ni distancias sin perímetro validado.
- Evaluar ruido, carga vehicular y mayor intensidad de uso; no asumir un beneficio inmobiliario.

### Extensión Ciclovía Av. Cerrillos

Extensión de ciclovía con aprobación administrativa documentada.

Responsable: SEREMI de Transportes y Telecomunicaciones RM. Ubicación: Avenida Cerrillos, comuna de Cerrillos.

Estado: **Aprobada**. Aprobación del proyecto por Resolución Exenta 986 de SEREMI MTT, publicada 20-04-2026. Información: 2026-04-20. Última revisión: 2026-10-31.

- [BCN: Resolución 986/2026, aprobación Extensión Ciclovía Av. Cerrillos](https://www.bcn.cl/leychile/Navegar?idNorma=1223340&idVersion=2026-04-20) — 2026-04-20.

- No se ha confirmado ejecución o financiamiento ni se ha validado trazado preciso para medir desde Alto Buzeta.
- Una aprobación de diseño no acredita infraestructura utilizable.

### Urbanización vial Las Condes 7039–7083

Permiso para dispositivos de rodado y paradas de transporte público en el entorno del predio.

Responsable: Dirección de Obras Municipales de Las Condes / titular del proyecto. Ubicación: Av. Las Condes 7039 y 7083 / General Carol Urzúa 7080.

Estado: **Aprobada**. Permiso de urbanización voluntaria 55, de 21-09-2026, para MMV N°4 y 5. Información: 2026-09-21. Última revisión: 2026-10-31.

- [DOM Las Condes: permiso de urbanización voluntaria 55/2026](https://transparencia.lascondes.cl/transparencia/actos_resolucion_urbanizacion.html) — 2026-09-21.
- [DOM Las Condes: recepción de frente predial Torre B](https://transparencia.lascondes.cl/transparencia/actos_resolucion_obras_definitivas.html) — 2026-06-16.

- La recepción del frente predial Torre B en junio corresponde a un acto distinto; no se confunde con el permiso de septiembre.
- Ubicación predial coincidente, pero plano S-8086/S-8098 no validado geométricamente; no se inventa distancia cero ni una asociación pública.
- El permiso no acredita que las medidas N°4 y 5 estén construidas.

## Implementación y comprobaciones

La integración se mantiene en el módulo común de las 131 fichas; sólo añade contenido cuando hay relaciones admitidas, con un máximo inicial de tres obras. Conserva el diseño aprobado, el menú Expertise · Asset Portafolio · Contacto y los datos comerciales. El listado, el mapa, los filtros y las fichas calculan desde el mismo registro.

El control automático exige 131 revisiones únicas, correspondencia exacta entre informe y relaciones públicas, ausencia de duplicados, bloqueo de ubicaciones disputadas y validación numérica de distancias. Las pruebas existentes de catálogo, filtros y mapa comprueban regresiones. Se conservan HTML de fichas, precios, superficies, disponibilidad, formularios y funciones.

La validación visual de escritorio y móvil se registra con la entrega de la vista previa. Las teselas externas de OpenStreetMap fueron bloqueadas durante la revisión inicial; la interfaz permite ocultar el fondo y conserva las geometrías, los filtros y el listado. No se afirma disponibilidad universal del proveedor ni una prueba de todos los dispositivos. No se enviaron formularios reales.

## Pendientes de evidencia, no proyectos sin revisar

Los candidatos excluidos y los motivos están en `pendingCandidates` del registro de cobertura. Los casos incluyen permisos o estados contradictorios, aperturas progresivas, geometrías y accesos no documentados, etapas privadas sin fecha y direcciones incompletas. Resolverlos requiere nueva evidencia; no se sustituyen con suposiciones.

## Vista previa y trazabilidad

La URL y el despliegue de esta revisión se registran en [ENTREGA.md](ENTREGA.md). La versión anterior queda documentada en [MUESTRA-INICIAL.md](MUESTRA-INICIAL.md).

Publicado por autorización expresa en el despliegue dpl_72BPGbcxhuj55cztQnAJ7fohvcvq. No se crearon tareas automáticas ni revisiones programadas. Véase [publicación y comprobaciones](PUBLICACION.md).
