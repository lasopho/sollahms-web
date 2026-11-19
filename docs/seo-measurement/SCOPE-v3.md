# Alcance corporativo SEO/GEO vigente — versión 3

19/11/2026, America/Santiago. El encargo actual sustituye el alcance operativo de v2 para trabajo nuevo. El [registro ejecutable](scope-v3.json) incluye **12 URL canónicas**, conserva v2 y sus evidencias sin reescribirlas y excluye expresamente el catálogo. Las anclas de Expertise y servicios pertenecen a la portada; no son páginas adicionales.

Las consultas siguientes expresan intención editorial, no volumen, posiciones ni resultados medidos. El inventario procede de las páginas existentes en la base productiva y de la documentación indicada. No se crean servicios, oficinas, ciudades o páginas nuevas.

| URL pública | Propósito principal | Consultas objetivo | Relación útil con otras páginas |
|---|---|---|---|
| [Portada](https://sollahms.cl/) | Identidad de Sollahms y asesoría para personas, empresas e inversionistas | Sollahms; Sollams como consulta de medición; asesoría inmobiliaria Chile | Presenta servicios en `#expertise`; deriva a asesoría, guías, empresa y tributación |
| [Asesoría](https://sollahms.cl/agenda-asesoria.html) | Solicitar una conversación y explicar el acompañamiento y las ubicaciones publicadas | asesoría para comprar o invertir; solicitar asesoría inmobiliaria | Deriva a contacto y guía; cobertura de proyectos sin afirmar oficinas o cita confirmada |
| [Contacto](https://sollahms.cl/contacto.html) | Resolver una consulta sobre una propiedad o comparar alternativas | contacto Sollahms; consulta inmobiliaria | Conecta la consulta concreta con la evaluación más amplia de Asesoría |
| [Centro de Orientación](https://sollahms.cl/centro-orientacion.html) | Elegir un punto de partida y explorar herramientas educativas | presupuesto para comprar vivienda; proceso de compra Chile | Ordena rutas hacia guía, comparador, empresa y beneficios tributarios |
| [Guía hipotecaria](https://sollahms.cl/guia-hipotecaria.html) | Entender pie, dividendo, costos y condiciones de financiamiento | pie crédito hipotecario; dividendo UF; gastos de compra | Amplía el Centro y conduce al comparador para contrastar escenarios |
| [Comparador hipotecario](https://sollahms.cl/comparador-hipotecario.html) | Comparar escenarios y referencias con supuestos explícitos | comparar crédito hipotecario UF Chile; tasa y CAE | Usa fundamentos de la guía y conecta con orientación y contacto |
| [Cuándo comprar](https://sollahms.cl/cuando-comprar-propiedad.html) | Distinguir compra en blanco, en verde y entrega inmediata | comprar en blanco o en verde; entrega inmediata | Relaciona decisión de etapa con presupuesto, financiamiento y revisión de antecedentes |
| [Entorno y desarrollo urbano](https://sollahms.cl/entorno-desarrollo-urbano.html) | Explicar cómo evaluar conectividad, infraestructura y sus límites | conectividad y compra de vivienda; entorno y desarrollo urbano | Complementa la evaluación de ubicación sin prometer plusvalía ni alterar fichas |
| [Inversión para empresas](https://sollahms.cl/inversion-inmobiliaria-empresas.html) | Ordenar la compra a nombre de una sociedad, financiamiento y riesgos | comprar propiedades a nombre de empresa Chile; inversión inmobiliaria SpA | Amplía la ruta empresarial desde portada y Centro; conecta con tributación y asesoría |
| [Beneficios tributarios](https://sollahms.cl/beneficios-tributarios-inmobiliarios.html) | Distinguir reglas y condiciones tributarias aplicables a cada situación | beneficios tributarios inmobiliarios Chile; DFL2; artículo 55 bis | Complementa compra personal y empresarial; utiliza respaldo oficial y documental contextual |
| [Trabaja con nosotros](https://sollahms.cl/trabaja-con-nosotros.html) | Recibir propuestas de colaboración corporativa | colaborar con Sollahms; trabaja con nosotros Sollahms | Recorrido específico de colaboración; no sustituye contacto comercial ni anuncia empleos inexistentes |
| [Privacidad](https://sollahms.cl/privacidad.html) | Explicar tratamiento de datos y consentimiento | privacidad Sollahms; datos de formularios Sollahms | Respalda formularios y relaciones de confianza; sin campañas genéricas de captación |

La marca oficial sigue siendo **Sollahms**. `Sollams` a secas es la consulta prioritaria de seguimiento y se mide separada de `Sollahms`, `Solams`, `Solamp` y `Solamps`. Las variantes no se añaden artificialmente a metadatos, contenido público o datos estructurados. En esta tabla se documentan únicamente como instrucciones de medición.

La revisión inicial distinguió las ubicaciones de proyectos de la cobertura del servicio. Posteriormente, el 19/11/2026, el titular confirmó asesoría en las 34 comunas de 10 regiones del [registro de cobertura](service-coverage-20261119.json), incluidas Concepción y San Pedro de la Paz. La última preferencia editorial es omitir la modalidad de atención en el texto público. Esto no acredita oficinas o sucursales, no incorpora Los Ángeles y no altera las 12 URL del alcance ni el inventario de proyectos.

## Exclusiones y conservación

`/proyectos.html`, Asset Portafolio y sus rutas equivalentes quedan fuera de optimización, campañas y resultados corporativos. También todas las fichas individuales, alias y rutas retiradas, sus datos, filtros, inventarios y recursos. El registro reúne 152 identidades canónicas leyendo únicamente `detalleUrl` de los 131 registros originales y `slug` de los 21 proyectos de la extensión productiva. La regla alcanza futuras fichas aunque aún no figuren en esa lista. Un alias o una URL desconocida nunca se incluye por descarte.

`/fuentes-respaldo-documental.html` conserva su función de consulta, respaldo y verificación: referencias, categorías, relaciones fuente–página y enlaces. Está fuera de campañas SEO/GEO, solicitudes de indexación y cambios de sitemap. Sus enlaces contextuales desde páginas incluidas pueden conservarse. No se transforma en página de adquisición.

Las exclusiones son de estrategia y medición. No desindexan, eliminan ni alteran contenido, canonical, directivas, sitemap, funcionamiento o recursos. LinkedIn y los perfiles externos quedan fuera de optimización. `404.html` y `410.html` siguen como páginas técnicas.

## Guardas y comparabilidad

`scripts/seo_scope.py` admite registros v2 y v3. Solo v3 reconoce la lista opcional `excluded_strategy_urls`, valida que no se solape con otras categorías y entrega el contador `excluded_strategy` al segmentar. La clasificación es estricta: conserva fragmentos como una misma página, pero no normaliza host, protocolo, query o alias. Estos últimos quedan `unknown`, fuera de la lista positiva, hasta una clasificación documentada.

La versión del alcance y la del protocolo IA son independientes. Se conservan el protocolo v2, sus preguntas y los planes históricos. Una observación nueva que use este alcance deberá declarar `corporate-education-v3`; los registros de v2 no se reinterpretan. El catálogo incluido en v2 impide comparar totales de ambos alcances como una misma serie. Para comparar se requiere el mismo conjunto explícito de páginas o un subconjunto común verificado.

No hay nueva medición de ranking, indexación o citas por crear este registro. Los datos ausentes continúan como `null`, nunca cero. Las tablas parciales no acreditan totales diarios nativos.

## Fuentes del inventario

- [Alcance v2 histórico](SCOPE-v2.md), [estrategia v2](STRATEGY-v2.md) y [SEO corporativo de octubre](../seo-corporate-20261029/README.md).
- [Portada y servicios](../home-seo-20261025/research-and-decisions.md), [guía hipotecaria](../mortgage-guide-20261029/README.md) y [etapas de compra](../purchase-stage-20261029/README.md).
- [Centro de Orientación](../centro-auditoria-20261116/INFORME-AUDITORIA.md), [entorno urbano](../entorno-20261031/README.md) y [asesoría y regiones](../agenda-regions-responsive-20261115/README.md).
- [Integración empresarial](../enterprise-seo-20261114/INFORME.md), [auditoría empresarial](../inversion-empresas-20261114/AUDITORIA-FINAL.md) y [antecedente de preparación tributaria](../tributarios-publicacion-20261115/INTENTO-DETENIDO.md). Los estados productivos de estos documentos son históricos; no sustituyen la verificación actual.
- HTML corporativo y referencias de identidad de la base productiva actual; [observaciones actuales](runs/2026-11-19-corporate-improvements/public-observations.json). Las páginas excluidas no se auditan ni optimizan para elaborar este inventario.
