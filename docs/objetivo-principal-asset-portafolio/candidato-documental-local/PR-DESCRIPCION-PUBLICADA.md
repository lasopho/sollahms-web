El catálogo correlaciona los filtros con la referencia que respalda cada precio, sin prestar atributos entre tipologías, unidades o etapas.

- Origen Atacama Local usa UF 2.697,78 y admite UF 2.600–2.800; antes seleccionaba el precio de Estudio.
- Don Pepe1542D usa su cotización owner UF 3.562, separada de1D UF 3.306,18.
- Costanera Coquimbo A3D usa UF 5.070, separada de2D UF 4.210.
- Un Local Euro seleccionado sólo por precio conserva `oferta=local` tanto en tarjeta como en mapa.

Se reutilizan las fuentes del propietario ya existentes: 20 proyectos/41filas de tablas publicadas fechadas, 21precios Euro y17precios Nollagam (más5categorías sin precio). No se editaron datos ni precios de origen ni se recibieron precios nuevos. Los JSON Euro/Nollagam se verifican por SHA-256 antes de normalizar; un fallo limita sus consultas con precio y muestra un aviso accesible persistente. Sin precio se conservan las consultas anteriores. Las cotizaciones sin respaldo de tipo, baños o superficies no heredan esos atributos.

La tarjeta financiera sólo puede mostrar el escenario del proyecto original cuando coincide con el importe y la tipología seleccionados, incluyendo etapas Ecasa. No cambia fórmulas, módulos, orden financiero ni el widget general. Los matches Euro se autentican y congelan para impedir préstamos desde resultados copiados o alterados.

La revisión documental permanece exclusivamente local: loopback + `revision_documental=1`, antes de fetch, con dos fixtures fijados por hash. Conserva16referencias/15proyectos dentro de131identidades; las15Iris tienen precio comercial nulo y Plaza213/C7 usa su cotización y plano exactos. No habilita esa capa en producción ni acredita stock. Los dos hallazgos documentales posteriores siguen separados de estos fixtures.

Validación del último delta, sin sumar subconjuntos:

- 42/42 Euro,23/23 integración Nollagam y13/13 guard financiero;34/34 casos de tipologías anteriores vueltos a verificar por el cambio compartido del motor (112/112 en la ejecución conjunta).
- 83/83 regresiones pertinentes. Normalizador Nollagam18/18 y consumidor14/14 aceptados por sus hashes sin repetirlos.
- 23/23 controles Chrome nuevos: cuatro vistas, anchos375y1280, correlación, desconocidos, enlaces Local y fallo503 controlado de las dos fuentes.
- 155protegidos y21fuentes coincidentes;131fichas y siete funciones intactas.
- Los cortes documentales previos32/17/83/22 y las certificacionesF10/F13 se conservan como historia, sin sumarlos a este resultado.

Observaciones: una pestaña previa quedó en Cargando; su causa no se confirmó. Una pestaña nueva y su recarga obtuvieron recursos locales200, completaron23controles y registraron cero excepciones/errores de consola. El servidor estático no ejecuta `/api/uf` ni certifica escenarios financieros. No se enviaron formularios.

Para una futura release habrá que incluir los dos JSON owner originales como recursos, preservando sus hashes; actualmente no están en el paquete congelado1663. No se preparó un build ni se creó un deployment.

PR en Draft:25archivos, head `c56f199a0a6e0d9c15ca3d26969603e9f3d88919`, base `9e8212264e0bac24f392d8340d6e55eabb17499a`. Deployments automáticos excluidos en ambas ramas. Sin Ready, merge o publicación. Producción sigue en9e/Gm75 y el objetivo global de datos131 continúa abierto.

[Estado y evidencias documentales](https://github.com/lasopho/sollahms-web/blob/codex/auditoria-leben-20261116/docs/objetivo-principal-asset-portafolio/ESTADO-PR33.json).
