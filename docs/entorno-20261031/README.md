# Entorno y desarrollo urbano — informe para revisión

**Fecha de corte y última revisión: 31 de octubre de 2026. Estado: muestra funcional preparada; no publicada en producción.**

La implementación permite explorar obras documentadas y consultar sus relaciones con proyectos del catálogo. Esta entrega contiene **9 obras en 5 regiones y 11 relaciones individualizadas en 3 zonas**: Concepción, Puerto Varas y Coquimbo. No constituye una investigación exhaustiva del catálogo. Los **120 proyectos sin asociación** no deben interpretarse como lugares sin obras: su investigación individual sigue pendiente. Seis de las nueve obras se presentan como información territorial general, sin asignarlas a viviendas concretas.

## Auditoría de partida

Se tomó como base la versión de producción `c9b66b6e9ff44bf7eb91ff9502f1e858438856f8`. La revisión inicial de `main` (`86e200ec191b38af355061e21bc0fc1e549cce3b`) resultó desactualizada frente a producción; no se utilizó como base final de integración.

El inventario contiene **131 ubicaciones de proyectos** del registro existente. Se conserva su procedencia y fecha de revisión; no se realizó una nueva geocodificación completa ni una verificación en terreno. `catalog-audit.json` es la captura de auditoría inicial; las relaciones aprobadas posteriormente están en `data/urban-development.json` y su resumen calculado en `verified-relationships.json`.

Se reutilizaron los componentes, estilos y recursos cartográficos existentes. La integración mantiene el menú aprobado **Expertise · Asset Portafolio · Contacto**. La página general se conecta con el catálogo y las fichas sin añadir otra opción al menú principal. No se modifican precios, superficies, disponibilidad, formularios ni condiciones comerciales.

## Obras incluidas y evidencia

Una obra documentada puede formar parte del listado general sin tener precisión geográfica suficiente para mostrarse como cercana a una vivienda. Los registros sin geometría se conservan en el listado, pero no se coloca un marcador aproximado ni se calcula una distancia.

| Obra | Región | Estado y alcance | Fecha de información | Relaciones |
| --- | --- | --- | --- | --- |
| Puente Industrial | Biobío | Operativa | 2026-09-07 | 0 |
| Nuevo Puente Ferroviario Biobío | Biobío | Operativa | 2025-11-11 | 3 |
| Tren Llanquihue–Puerto Montt · Puerto Varas | Los Lagos | Operativa | 2026-09-09 | 3 |
| Línea 7 de Metro | Región Metropolitana | En construcción | 2026-03-19 | 0 |
| Línea 8 de Metro | Región Metropolitana | Aprobada ambientalmente: Calificación ambiental favorable; ejecución no confirmada en este registro | 2026-05-29 | 0 |
| Línea 9 · trabajos previos en Santa Rosa con Alameda | Región Metropolitana | En construcción: Obras previas: excavaciones arqueológicas | 2026-08-12 | 0 |
| Nuevo Hospital San Pablo de Coquimbo | Coquimbo | En construcción: Construcción confirmada por informe ejecutivo DGC de agosto de 2026. | 2026-10-23 | 5 |
| Parque Urbano Cerro Grande | Coquimbo | Operativa: Apertura documentada en septiembre de 2025; actividades del operador CEAZA corroboradas en septiembre de 2026. | 2026-09-23 | 0 |
| Borde costero Playa Chinchorro · segunda etapa | Arica y Parinacota | Operativa: Inauguración confirmada por DOP el 16-09-2026. | 2026-09-16 | 0 |

### Fuentes directas por obra

**Puente Industrial** — Responsable: MOP / Dirección General de Concesiones y Sociedad Concesionaria Puente Industrial. Cruce del río Biobío entre Hualpén y San Pedro de la Paz.

- [Concesionaria: primer año de operación](https://www.puenteindustrial.cl/puente-industrial-cumple-su-primer-ano-de-operaciones-redisenando-la-conectividad-vial-en-el-gran-concepcion/) — 2026-09-07.
- [DGC: ficha de concesión y mapa](https://concesiones.mop.gob.cl/project/concesion-vial-puente-industrial/) — sin fecha editorial explícita; revisada el 31-10-2026.
- Cartografía: [Mapa de la concesión enlazado por DGC](https://www.google.com/maps/d/viewer?mid=1MpIgvPhisjYRZ186qjPNb2gISMY).

**Nuevo Puente Ferroviario Biobío** — Responsable: EFE / Ministerio de Transportes y Telecomunicaciones. Cruce ferroviario entre Concepción y San Pedro de la Paz.

- [MTT: habilitación total del nuevo puente](https://mtt.gov.cl/archivos/38592) — 2025-11-11.
- [SEA: expediente ambiental y alcance territorial](https://seia.sea.gob.cl/expediente/ficha/fichaPrincipal.php?id_expediente=2143540297) — sin fecha editorial explícita; revisada el 31-10-2026.
- Cartografía: [OpenStreetMap: huella del nuevo puente, way 1414187625](https://www.openstreetmap.org/way/1414187625).

**Tren Llanquihue–Puerto Montt · Puerto Varas** — Responsable: EFE Sur. Estación Puerto Varas, acceso principal cartografiado.

- [Transporte Informa: servicio e itinerario vigente](https://loslagos.transporteinforma.cl/noticias/anuncian-puesta-en-marcha-del-tren-llanquihue-puerto-montt/) — 2026-09-09.
- [Ministerio del Interior: inauguración del servicio](https://interior.gob.cl/noticias/2025/04/29/presidente-boric-inaugura-tren-puerto-montt-llanquihue-junto-a-ministros-elizalde-y-munoz/) — 2025-04-29.
- Cartografía: [OpenStreetMap: acceso principal, nodo 8787773125](https://www.openstreetmap.org/node/8787773125).

**Línea 7 de Metro** — Responsable: Metro de Santiago. Corredor Renca–Vitacura; acceso de Cal y Canto descrito en Plaza Prat.

- [Gobierno de Santiago: encuentro de túneles de Línea 7](https://www.gobiernosantiago.cl/2026/03/19/autoridades-participan-del-encuentro-de-tuneles-en-estacion-cal-y-canto-de-futura-linea-7/) — 2026-03-19.

**Línea 8 de Metro** — Responsable: Metro de Santiago / SEA Región Metropolitana. Trazado proyectado entre Providencia y Puente Alto; cola de maniobras en Las Condes.

- [BCN: notificación RCA 20261301132 de 19/05/2026](https://www.bcn.cl/leychile/navegar?idNorma=1224602) — 2026-05-29.
- [SEA: descripción del Estudio de Impacto Ambiental](https://infofirma.sea.gob.cl/DocumentosSEA/MostrarDocumento?docId=2024%2F07%2F19%2Ff085-758d-4dd5-b87c-58e20cd71536) — 2024-07-19.

**Línea 9 · trabajos previos en Santa Rosa con Alameda** — Responsable: Metro de Santiago / Red Movilidad. Santa Rosa con Alameda, sector Santa Lucía.

- [Red Movilidad: excavaciones y traslado de parada](https://www.red.cl/red-comunica/futura-construccion-linea-9-de-metro-parada-7-metro-santa-lucia-se-traslada-hacia-el-sur-por-trabajos-de-excavacion-en-santa-rosa-con-alameda/) — 2026-08-12.

**Nuevo Hospital San Pablo de Coquimbo** — Responsable: Minsal / Servicio de Salud Coquimbo / Dirección General de Concesiones MOP / Sociedad Concesionaria Hospital Coquimbo S.A.. Sector La Cantera, Coquimbo; numeración oficial contradictoria: Minsal 2379, DGC 2370..

- [Informe ejecutivo DGC, agosto 2026](https://concesiones.mop.gob.cl/uploads/sites/4/2026/10/Informe-Ejecutivo_Hospital-Coquimbo-agosto2026.pdf) — 2026-08.
- [Plan de Inversiones Minsal](https://plandeinversionesensalud.minsal.cl/hospital-san-pablo-de-coquimbo-ii-etapa/) — 2026-09.
- [Panel Técnico: discrepancia D12-2026-39](https://www.panelconcesiones.cl/noticias/ver/comunicado-discrepancia-d12-2026-39) — 2026-10-23.
- Cartografía: [OpenStreetMap: polígono Construcción Nuevo Hospital de Alta Complejidad de Coquimbo (ODbL 1.0)](https://www.openstreetmap.org/way/1125463653).

**Parque Urbano Cerro Grande** — Responsable: MINVU / SERVIU / Municipalidad de La Serena; Centro de Educación Ambiental CEAZA. Cerro Grande, La Serena; acceso sector Avenida Cuatro Esquinas..

- [Delegación Presidencial Coquimbo: apertura](https://www.dprcoquimbo.dpr.gob.cl/2025/09/26/nuevo-parque-urbano-cerro-grande-abre-sus-puertas/) — 2025-09-26.
- [CEAZA: actividades y funcionamiento en2026](https://www.ceaza.cl/2026/09/23/centro-de-educacion-ambiental-ceaza-reune-a-927-participantes-durante-su-primer-semestre-de-actividades-en-cerro-grande/) — 2026-09-23.
- Cartografía: [OpenStreetMap: polígono Parque Urbano Cerro Grande (ODbL 1.0)](https://www.openstreetmap.org/way/1214567323).

**Borde costero Playa Chinchorro · segunda etapa** — Responsable: Dirección de Obras Portuarias, MOP. Paseo costero entre calle Buenos Aires y conexión con mejoramiento de Playa Las Machas..

- [DOP: inauguración segunda etapa](https://dop.mop.gob.cl/2026/09/16/mop-inaugura-renovacion-de-13-kilometros-del-borde-costero-de-playa-chinchorro-de-arica-con-inversion-que-supera-los-4-mil-millones/) — 2026-09-16.
- [DOP: descripción del tramo intervenido](https://dop.mop.gob.cl/2026/04/07/dop-impulsa-conservacion-integral-del-borde-costero-de-playa-chinchorro-en-arica-para-reforzar-seguridad-y-estandar-urbano/) — 2026-04-07.

### Estados, fechas y discrepancias relevantes

- **Puente Industrial:** una ficha genérica MOP conserva información de construcción de 2025. Se prioriza la comunicación del responsable de septiembre de 2026 que acredita operación. El mapa de DGC documenta el trazado, no todos sus accesos ni los recorridos desde cada vivienda.
- **Línea 7:** construcción respaldada por el hito de túneles de marzo de 2026. Fines de 2028 se presenta únicamente como estimación documentada, sujeta a cambios. Faltan accesos futuros precisos para relaciones individuales.
- **Línea 8:** la RCA `20261301132`, de 19-05-2026, acredita calificación ambiental favorable. **No acredita financiamiento ni inicio de construcción.** Las obras de maniobra en Las Condes no implican una estación de pasajeros en esa comuna. No se atribuyen distancias ni fecha de apertura.
- **Línea 9:** el registro describe excavaciones arqueológicas previas en Santa Rosa con Alameda y alteraciones de circulación. No equivale a la construcción de toda la línea ni a una estación operativa.
- **Hospital San Pablo de Coquimbo:** construcción respaldada por DGC, agosto de 2026. Minsal indica La Cantera 2379 y DGC 2370; se emplea el polígono del recinto, sin geocodificar por esa numeración contradictoria. DGC informa una fecha contractual máxima de puesta en servicio provisoria de 07-02-2028 y existe la discrepancia D12-2026-39 en trámite. Se omiten fecha pública de apertura, porcentajes e inicios contradictorios. La etiqueta histórica OSM `opening_date=2027` no determina el estado ni calendario.
- **Parque Cerro Grande:** la apertura y actividad están documentadas, pero no se validó un acceso público preciso. Se descartó como acceso un portón cartografiado privado/cerrado. El proyecto más próximo supera 3,7 km del perímetro; no se fuerza una relación de cercanía.
- **Playa Chinchorro:** la segunda etapa está inaugurada, pero falta delimitar con precisión su tramo y accesos. No se utiliza el centro de la playa ni se asigna automáticamente a todos los proyectos de Arica.

## Relaciones individualizadas

Los nombres y coordenadas de proyectos proceden del catálogo y su registro de ubicaciones; las obras y asociaciones se mantienen en una sola fuente de datos. Las siguientes distancias son aproximaciones geográficas, no recorridos.

| Proyecto | Obra | Distancia y referencia |
| --- | --- | --- |
| Campus Llacolén | Nuevo Puente Ferroviario Biobío | Aprox. 1,19 km en línea recta · al perímetro del puente; no a una estación |
| Vista Llacolén A | Nuevo Puente Ferroviario Biobío | Aprox. 1,26 km en línea recta · al perímetro del puente; no a una estación |
| Vista Llacolén B | Nuevo Puente Ferroviario Biobío | Aprox. 1,26 km en línea recta · al perímetro del puente; no a una estación |
| Edificio Nórdico | Tren Llanquihue–Puerto Montt · Puerto Varas | Aprox. 760 m en línea recta · al acceso principal cartografiado de Puerto Varas |
| Edificio Índigo | Tren Llanquihue–Puerto Montt · Puerto Varas | Aprox. 1,44 km en línea recta · al acceso principal cartografiado de Puerto Varas |
| INN Puerto Chico | Tren Llanquihue–Puerto Montt · Puerto Varas | Aprox. 1,83 km en línea recta · al acceso principal cartografiado de Puerto Varas |
| Cumbres de Peñuelas | Nuevo Hospital San Pablo de Coquimbo | Aprox. 2,66 km en línea recta · al perímetro del recinto en construcción; no al acceso |
| Costanera Coquimbo Edificio A | Nuevo Hospital San Pablo de Coquimbo | Aprox. 2,79 km en línea recta · al perímetro del recinto en construcción; no al acceso |
| Costanera Coquimbo Edificio B | Nuevo Hospital San Pablo de Coquimbo | Aprox. 2,79 km en línea recta · al perímetro del recinto en construcción; no al acceso |
| Playa Peñuelas | Nuevo Hospital San Pablo de Coquimbo | Aprox. 2,95 km en línea recta · al perímetro del recinto en construcción; no al acceso |
| Marina Pacífico | Nuevo Hospital San Pablo de Coquimbo | Aprox. 2,97 km en línea recta · al perímetro del recinto en construcción; no al acceso |

## Método de distancia y criterios de interpretación

Para puntos se utiliza distancia geodésica de Haversine. Para trazados y perímetros se calcula la menor distancia geográfica a sus segmentos; no se utiliza el centro visual del mapa. Las distancias se recalculan desde las coordenadas y geometrías, sin copiar cifras independientes en fichas y listado.

**Puerto Varas:** el destino es el acceso principal cartografiado, nodo OSM 8787773125, integrante del edificio de estación 293126469. Se distingue explícitamente del trazado ferroviario. La verificación del acceso es documental/cartográfica; no se verificaron en terreno pendientes, cruces, veredas ni accesibilidad universal.

**Puente Ferroviario Biobío:** el destino es el perímetro de la infraestructura. El puente no es una estación ni un acceso público al tren; los pasillos descritos en el expediente sirven para mantenimiento y evacuación. La asociación expresa proximidad territorial y permite considerar continuidad de red, ruido y vibraciones sin cuantificar efectos en viviendas. El río y el corredor ferroviario son barreras relevantes.

**Hospital de Coquimbo:** el destino es el perímetro del terreno en construcción, no una entrada futura. Los cruces y conexiones con La Cantera pueden aumentar la distancia efectiva. La asociación no acredita acceso peatonal directo.

El registro distingue acceso, perímetro y trazado. No calcula tiempos caminando o en automóvil, no promete plusvalía y no estima rentabilidad. Los posibles beneficios se expresan como mecanismos sujetos a condiciones. Las molestias y cambios de uso se señalan como aspectos por evaluar, sin presentarlos como efectos medidos.

## Investigación pendiente, excluida de la publicación

| Obra o ámbito | Motivo y siguiente evidencia necesaria |
| --- | --- |
| Hospital Regional de Ñuble | Preparación/apertura progresiva y autorizaciones aún pendientes; no está acreditada la operación completa. Resolver contradicciones antes de clasificarlo. |
| Mejoramiento y ampliación Parque Costanera Concepción | Prensa de agosto de 2026 describe anteproyecto de etapa 3. Falta corroboración primaria reciente de estado, alcance, financiamiento y geometría. |
| Viaducto Chacabuco | La fuente oficial de octubre de 2025 estimaba primer trimestre de 2026; prensa posterior desplaza el plazo a diciembre. Falta fuente primaria actual que confirme estado y cronograma. |
| 120 proyectos sin relaciones | Completar búsqueda individual, ubicación y accesos de obras pertinentes; ausencia de asociación no es ausencia de infraestructura. |
| Seis obras sin relaciones individualizadas | Revisar accesos y pertinencia territorial antes de asociarlas; no basta compartir comuna o región. |

Fuentes para resolver pendientes:

- Ñuble, ubicación: [Plan de inversiones Minsal](https://plandeinversionesensalud.minsal.cl/hospital-de-nuble/).
- Ñuble, preparación al 25-09-2026: [Minsal](https://www.minsal.cl/subsecretario-de-redes-asistenciales-destaca-avances-y-fortalecimiento-de-la-red-publica-de-salud-en-nuble/).
- Ñuble, oxígeno y autorización pendiente al 30-10-2026: [Hospital Clínico Herminda Martín](https://hospitaldechillan.cl/web/hospital-regional-de-nuble-instala-estanque-de-oxigeno-medicinal-para-su-futura-operacion/).
- Costanera Concepción, pista periodística del 18-08-2026: [Radio UdeC](https://www.radioudec.cl/minvu-avanza-en-nuevo-parque-costanera-como-pieza-clave-de-la-transformacion-del-borde-del-rio-biobio/).
- Viaducto Chacabuco, fuente oficial histórica del 14-10-2025: [Delegación Presidencial Biobío](https://dprbiobio.dpr.gob.cl/2025/10/14/viaducto-chacabuco-entra-en-su-etapa-final-y-espera-entrega-definitiva-para-primer-trimestre-2026/).
- Viaducto, plazo posterior aún por corroborar: [Diario Concepción, 18-08-2026](https://www.diarioconcepcion.cl/ciudad/2026/08/18/viaducto-chacabuco-pruebas-iluminacion-concepcion.html?amp=1).

La página general del nuevo hospital de Ñuble presenta contenido incoherente y una afirmación de atención ambulatoria en septiembre que no concuerda con las comunicaciones posteriores. No se adopta esa afirmación como evidencia de apertura. Se conserva el pendiente para revisión expresa, sin incorporar información dudosa al sitio.

## Implementación y comprobaciones

`data/urban-development.json` es la fuente única de obras, estados, evidencia, geometrías y relaciones. Reutiliza `data/proyectos.json` y `data/project-locations.json` para la identidad y ubicación de proyectos. El módulo común calcula y filtra resultados para la página general, mapa y fichas. Cada ficha muestra inicialmente **hasta tres obras**, con estado, distancia, cambio potencial, fuentes, fecha y detalles desplegables. Si no hay una relación verificada, no se añade contenido genérico.

La página general incorpora listado y mapa vinculados, filtros por región, comuna, tipo y estado, y enlaces a proyectos relacionados. Los estados se distinguen mediante texto y señales visuales. Se mantiene la identidad de Sollahms y la lectura móvil. Las obras sin coordenadas aparecen en el listado con su limitación, sin marcadores ficticios.

Comprobaciones reportadas por el agente integrador:

- **28 pruebas unitarias aprobadas**, incluyendo controles numéricos de distancia, validez de evidencia, integridad de relaciones y comportamiento de los datos compartidos.
- Revisión en navegador de escritorio y de vista móvil de 390 px mediante iframe; comprobación adicional de ausencia de desbordamiento horizontal a 375 px.
- Navegación a fichas, vínculos con la página de entorno, filtros y comportamiento alternativo cuando no carga el fondo del mapa.
- La carga de las teselas de OpenStreetMap fue bloqueada en el entorno de vista previa. Se comprobó la alternativa de mapa sin fondo y el listado utilizable, pero **no se acredita una comprobación visual completa del mapa base externo**.

Estas comprobaciones no equivalen a una auditoría exhaustiva de todos los recorridos, dispositivos, conexiones externas o funcionalidades históricas del sitio. No se realizó verificación topográfica ni visita a terreno. No se ejecutaron pruebas enviando datos de clientes por formularios.

## Vista previa y entrega

**Enlace de vista previa: pendiente de completar por el agente integrador.** No se inventa una URL ni se indica una publicación no realizada. La ruta de la nueva página es `/entorno-desarrollo-urbano.html`.

Los datos y la implementación quedan preparados para revisión. La extensión exhaustiva al catálogo y los pendientes documentales continúan abiertos. No se ha publicado en producción ni se han creado tareas automáticas o revisiones programadas. Las actualizaciones se realizarán únicamente cuando el usuario las solicite.
