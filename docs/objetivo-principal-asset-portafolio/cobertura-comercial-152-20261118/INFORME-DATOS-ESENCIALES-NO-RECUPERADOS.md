# Datos esenciales sin respaldo suficiente: catálogo de 152 proyectos

Corte: **18/11/2026**. Producción `d3fb474f08b81a965d2e0eac927adf88671968c0`, deployment `dpl_FkyZZgpki5HSpKMRJQFgJE451d3G`. Los **152 proyectos están indexados en once campos**. Se conservan las matrices originales de 131, sus 1.993 punteros y los 313 IDs históricos; se añade una vista documental de los 21 incorporados, sin nuevas recepciones ni hechos comerciales.

Este es el único informe consolidado de faltantes de este corte. Reutiliza fuentes y certificados existentes; no repite las 158 fichas Iris, auditorías, planos, suites o QA responsive. La producción consultada sigue READY en el mismo ID/SHA. No se cambió aplicación, catálogo, precio, dirección, función, formulario o servicio.

## Qué significan los conteos

Las vistas contienen **1.672 celdas: 80 confirmadas en su alcance original, 1.125 parciales y 467 desconocidas en los alcances indexados**, repartidas estas últimas en 150 proyectos. No son 467 solicitudes al propietario, pendientes históricos, unidades ni datos definitivamente inexistentes. Parcial significa respaldo limitado a referencia/modelo/etapa o mención general; no obliga a reconstruir inventarios. Una fuente fechada no acredita stock o vigencia actual.

La conciliación conserva tres excepciones explícitas: **BAUM y Santo ya tienen precio publicado; INN Puerto Chico ya tiene útil en sus modelos publicados**. Sus estados documentales anteriores no se reescriben ni se usan para afirmar que nunca se recuperó ese valor. Tampoco se infiere confirmación comercial del propietario, relación precio–plano o aplicabilidad a otras unidades. Véase [conciliación de alcances](CONCILIACION-ALCANCES-131.json).

| Campo | Confirmado en su alcance | Parcial | Desconocido en la vista | Límite relevante |
| --- | ---: | ---: | ---: | --- |
| Tipo de propiedad | 12 | 138 | 2 | Cabecera y producto de la referencia se separan; 21 referencias unitarias nuevas no tienen tipo propio. |
| Precio UF | 10 | 135 | 7 | Siete desconocidos documentales incluyen BAUM/Santo con precio publicado. Cinco proyectos no tienen testigo de precio publicado. |
| Dormitorios | 8 | 144 | 0 | Tipología literal no equivale a dormitorios numéricos; cinco Estudio nuevos no se convierten en 0D. |
| Baños | 10 | 133 | 9 | Baño de otro modelo o producto no se presta a una cotización. |
| Útil | 2 | 80 | 70 | INN tiene útil publicada en otro alcance; Internos de los 21 nuevos no es útil. |
| Total | 5 | 86 | 61 | Internos, terraza, patio y terreno no se suman para inventar total. |
| Entrega | 12 | 115 | 25 | Centro Santa Ana tiene Entrega futura sin período; Kiez Por definir. No inferir entrega legal. |
| Estado comercial | 10 | 118 | 24 | Entrega o existencia en Iris no acreditan estado comercial actual. |
| Amenities | 11 | 130 | 11 | 19 proyectos nuevos tienen descriptores filtrables; Kiez/Ámbar sólo notas generales no habilitadas. |
| Estacionamiento | 0 | 33 | 119 | 33 parciales son menciones/ofertas en alcance; inclusión global y disponibilidad exacta siguen sin acreditar para152. |
| Bodega | 0 | 13 | 139 | Inclusión global y disponibilidad exacta siguen sin acreditar para152; exclusión del precio no implica ausencia física. |

## Faltantes que afectan a búsquedas concretas

- **Precio:** Angamos, Diagonal Vicuña, Own, Los Alerces y Valle Los Ingleses III no tienen testigo de precio en la capa publicada indexada. No recuperar campañas descartadas ni inferir stock; Own se conserva como publicado y se excluye sólo de la oferta preparada cuando corresponde. Las tipologías sin precio de otros proyectos conservan su desconocido específico, aunque exista otra referencia de precio en ese proyecto.
- **Superficies:** 70/61 celdas de útil/total siguen desconocidas en las vistas. Los 21 nuevos sólo aportan Internos y Terraza en referencias exactas; las lecturas archivadas de planos no aportan útil/total admisibles. No recalcular ni extrapolar. INN útil está documentada en modelos, sin vínculo a su precio publicado.
- **Relaciones entre datos:** precio y D/B/áreas deben corresponder a una misma referencia. Mood conserva sus cotizaciones por tipología y perfiles de planos separados; no se repreguntan precios ni se inventa unidad/modelo. Nuevo Vivaceta y Compañía 1735 conservan prioridad owner sin tomar baños/áreas del perfil Iris para esa cotización. Las referencias unitarias Iris de los 21 nuevos no heredan el tipo de su cabecera.
- **Estado, entrega y uso:** 19 de los nuevos no tienen estado comercial explícito; Kiez no tiene entrega definida y Centro Santa Ana no tiene período concreto. Casa/Departamento no confirma uso Residencial. Estas carencias sólo restringen sus predicados activos.
- **Amenities y espacios privados:** Estacionamiento aparece en notas generales de18 proyectos nuevos, incluida una nota general de inclusión en Altos del Peñón; no tiene asociación unidad/precio o disponibilidad acreditada. No convertirla en inclusión privada. Kiez y Ámbar tienen notas Ascensor/Estacionamiento sin descriptores de filtro habilitados. Los adicionales Suecia permanecen fuera del precio del inmueble.
- **Identidades y conflictos:** Verne202 conserva conflicto UI Departamento/Estudio frente a plano Oficina1O+1B; Plaza Cervantes conserva su conflicto de torre/edificio; Mapocho y Froilán no cruzan sus alcances. Parque Panamá/Local, Vergara Domeyko/Local y Bordevivo/Local no reciben atributos residenciales. No repetir consultas agotadas o sustituir estos límites por coincidencias positivas.

## Combinaciones admitidas por las fuentes actuales

Conteos estáticos de proyectos con un testigo conjunto, **no búsquedas ejecutadas, stock ni certificación de todos los rangos/cartesianos**. Se suman sólo identidades disjuntas131+21. No se suman capas Leben o suplemento24a. La ausencia de un eje no demuestra ausencia de un valor aislado fuera de esos ejes. [Detalle reproducible](ANALISIS-COMBINACIONES-152.json).

| Familia en una referencia compatible | 131 originales publicados | 21 nuevos publicados | D3 / 152 |
| --- | ---: | ---: | ---: |
| Precio UF | 126 | 21 | 147 |
| Precio + dormitorios | 66 | 17 | 83 |
| Precio + dormitorios + baños | 0 | 15 | 15 |
| Precio + útil | 0 | 0 | 0 |
| Precio + total | 0 | 0 | 0 |
| Dormitorios + baños | 73 | 16 | 89 |
| Dormitorios + baños + útil | 37 | 0 | 37 |
| Dormitorios + baños + total | 53 | 0 | 53 |
| Precio + tipo | 106 | 19 | 125 |

El suplemento24a conserva su único testigo precio+D/B+útil/total de Plaza213/C7 local y no publicado. La integración pendiente no se considera un dato comercial faltante ni autoriza publicar ese testigo.

## Verificación de filtros reutilizada

El [mapa de aceptación](ACEPTACION-FILTROS.json) relaciona 15 criterios con sus fuentes, líneas y certificados. Trece módulos runtime D3 coinciden con el manifiesto del paquete publicado; los diez archivos de pruebas actuales sólo se leyeron como texto. Los certificados de F10/F13/PR33–36 se conservan sin sumarlos entre sí. No se identificó defecto o preocupación nueva que requiera reproducción aislada.

Cobertura existente: precio/tipología compatibles, D/B, útil/total explícitas, región/comuna, entrega/estado, amenities por alcance y AND/OR, tipos, desconocidos activos e inactivos, combinaciones, vistas, fallos de fuente y separación financiera. Se conserva el QA publicado152/GPR9, 1.721 digests, cinco alias y cinco recursos públicos verificados. Estos controles no completan valores comerciales ni prometen todas las combinaciones posibles.

## Detalle único por proyecto

Cada fila enumera los campos desconocidos en su vista fuente. El asterisco indica un valor ya presente en otro alcance publicado: no se solicita de nuevo. Las celdas parciales y sus límites completos se consultan en el [índice compuesto](INDICE-COBERTURA-152.json), que enlaza las matrices originales sin reconstruirlas. «—» significa ninguna celda desconocida en esa vista, no inventario completo ni certificación de todas las consultas.

| Proyecto / inmobiliaria | Campos desconocidos en la vista fuente | Excepción o límite adicional |
| --- | --- | --- |
| Distrito Centro / Maestra | Útil, Total, Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Reserva Mayor 2 / Vesant | Baños, Útil, Total, Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vista Llacolén B / Maestra | Útil, Total, Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio B.Come — Concepción / León | Útil, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vista Llacolén A / Maestra | Útil, Total, Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Campus Llacolén / Maestra | Útil, Total, Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Núcleo Costanera / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Wayra / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Lamara / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Alto Buzeta / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Independencia 4745 / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vistamar / Maestra | Útil, Total, Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Costanera Coquimbo Edificio A / Nollagam | Útil, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Costanera Coquimbo Edificio B / Nollagam | Útil, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Ecuador / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Coronel Godoy / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Indi / Leben | Útil, Total | Alcance en el índice; no extender a otras referencias. |
| Edificio Vivaceta / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Bezanilla / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Jardines de Alvarado / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Santa María / Nollagam | Útil | Alcance en el índice; no extender a otras referencias. |
| Plaza Cervantes - Torre B / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Teatinos 750 / AJ Urbana | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Vista Amunategui / AJ Urbana | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Endémico / Ecasa | Útil, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Playa Peñuelas / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Serrano - Torre A / Maestra | Útil, Total, Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Plaza Cervantes - Torre A / Maestra | Útil, Total, Entrega, Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vista Costanera / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vista Reloncaví / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Downtown San Martín / AJ Urbana | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vista Morandé / AJ Urbana | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Don Pepe 154 / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Plaza de Lourdes / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Santa Elena 1670 / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Plaza Quilicura / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Mapocho 3521 - Edificio A / Euro | Útil, Total, Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Lira 622 / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Dual 390 LTO / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Entre Vicuñas / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Lomas de Puyai / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| FerroParque / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Froilán Roa 5731 - Torre Norte / Euro | Baños, Útil, Total, Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Rosas 1444 / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Guillermo Mann 1401 / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Froilán Roa 5731 - Torre Sur / Euro | Baños, Útil, Total, Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio San Francisco 1204 / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Cumbres de Peñuelas / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio BAUM / Leben | Precio UF*, Útil, Total, Estado comercial, Estacionamiento, Bodega | Valor publicado en otro alcance: Precio UF. |
| Diagonal Paraguay / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| INN Puerto Chico / Leben | Útil* | Valor publicado en otro alcance: Útil. |
| Edificio Suecia / Leben | Útil, Total | Alcance en el índice; no extender a otras referencias. |
| Capitanes / Leben | Útil | Alcance en el índice; no extender a otras referencias. |
| Parque Germania / Leben | Tipo de propiedad, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Argomedo / Leben | Útil, Total | Alcance en el índice; no extender a otras referencias. |
| Edificio Mood / Leben | — | Alcance en el índice; no extender a otras referencias. |
| Edificio Índigo / Leben | Útil, Total | Alcance en el índice; no extender a otras referencias. |
| Edificio Verne / Norte Verde | Baños, Útil, Total, Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Santo / Leben | Precio UF*, Útil, Total, Estado comercial, Estacionamiento, Bodega | Valor publicado en otro alcance: Precio UF. |
| Edificio Living Town / Leben | Útil, Total | Alcance en el índice; no extender a otras referencias. |
| Edificio Bold / Leben | Útil | Alcance en el índice; no extender a otras referencias. |
| Domeyko 2055 / Sento | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vergara Domeyko / Norte Verde | Baños, Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Parque Panamá / Norte Verde | Baños, Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Playa Serena / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Don Tomás / Crescer | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Plaza Las Condes / Sento | Bodega | Alcance en el índice; no extender a otras referencias. |
| Mapocho 3521 / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Jofré 157 / Sento | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Irarrázaval / Norte Verde | Baños, Útil, Total, Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Parque Quinta / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Quintavista / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Don Rafael / Crescer | Útil, Total, Bodega | Alcance en el índice; no extender a otras referencias. |
| Terrazzo / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| VIMA / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Los Lilenes / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Nueva Esmeralda / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| El Aromo / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Espacio Victoria / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Terratoltén / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Pintor Cicarelli III / Maestra | Útil, Total, Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Trinidad III / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Liverpool / Nollagam | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Mirador La Florida / Sento | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Alto Goycolea / Nollagam | Útil | Alcance en el índice; no extender a otras referencias. |
| Eleuterio Ramírez / Nollagam | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Barrio Zenteno / Nollagam | Útil | Alcance en el índice; no extender a otras referencias. |
| Urban La Florida / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vicuña Mackenna 6896 / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Vicuña Mackenna 7589 / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Aires La Florida 2 / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Uruguay / León | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Enlace Mackenna / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Novo Catedral / Sudamericana | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Carmen Marín / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Gregorio de la Fuente / León | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Matta 016 / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Plaza Nova / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Parque Don Lautaro / León | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Cáceres / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Pintor Cicarelli I / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Pintor Cicarelli II / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Origen Atacama / Norte Verde | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Abdón Cifuentes / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Don Ignacio / Ingevec | Entrega, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Tocornal / Ingevec | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Centenario 1 / Ingevec | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Curicó 77 / Sento | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| San Ignacio / Sento | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Angamos 205 / Sento | Precio UF, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Conecta Huechuraba / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Bordevivo / Norte Verde | Baños, Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Mirador Mapocho / Maestra | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Alto San Joaquín / Ecasa | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vista Bulnes / Norte Verde | Baños, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Jardines de Ramón Cruz / León | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vitro / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Mirador Irarrázaval / Euro | Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Alto Irarrázaval / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| José Pedro Alessandri / Euro | Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vicuña Mackenna 1432 / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vicente Valdés / Euro | Entrega, Estado comercial, Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Diagonal Vicuña / Euro | Precio UF, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Vista Portugal / Euro | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Marina Pacífico / Euro | Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Nova Parque / Euro | Amenities, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Own / Leben | Tipo de propiedad, Precio UF, Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Monjitas 690 / AJ Urbana | Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Los Alerces / Ingevec | Precio UF, Entrega, Estado comercial, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Valle Los Ingleses III / Ingevec | Precio UF, Entrega, Estado comercial, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Nórdico / Leben | — | Alcance en el índice; no extender a otras referencias. |
| Alameda 4719 / Euro | Útil, Total, Estado comercial, Estacionamiento, Bodega | Estudio literal; D numérico desconocido. |
| Compañía 1735 / Sento | Útil, Total, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Nuevo Vivaceta / Ecasa | Útil, Total, Bodega | Estudio literal; D numérico desconocido. |
| Condominio Altos del Peñón / GPR | Útil, Total, Estado comercial, Bodega | Nota general de estacionamiento incluido sin asociación. |
| Condominio Reserva Santa Clara / GPR | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Hacienda Santa Clara / GPR | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Plaza Nos / GPR | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Sendero Santa Clara / GPR | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Terrazas del Mirador / GPR | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Altos del Mirador / GPR | Útil, Total, Estado comercial, Estacionamiento, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Hacienda Junquillar / GPR | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Condominio Hacienda Volcanes / GPR | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Kiez / Leben | Útil, Total, Entrega, Estado comercial, Bodega | Amenities: notas generales, sin descriptor habilitado. |
| Centro Santa Ana / AJ Urbana | Útil, Total, Estado comercial, Bodega | Estudio literal; D numérico desconocido. Entrega futura sin período filtrable. |
| Edificio Ambar Urbano / Euro | Útil, Total, Estado comercial, Bodega | Amenities: notas generales, sin descriptor habilitado. |
| Espacio V / Euro | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Edificio Botánico / Norte Verde | Útil, Total, Estado comercial, Bodega | Estudio literal; D numérico desconocido. |
| Balmaceda / Ingevec | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Prat / Ingevec | Útil, Total, Estado comercial, Bodega | Estudio literal; D numérico desconocido. |
| Vicuña Mackenna Capital / Ingevec | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |
| Mirador Capital / Ingevec | Útil, Total, Estado comercial, Bodega | Alcance en el índice; no extender a otras referencias. |

## Intervenciones y condición de cierre

Permanecen **únicamente las dos solicitudes ya presentadas**, sin nuevas preguntas:

1. `AUTH-PUSH-PR-SUPPLEMENT-20261118-01`: respuesta para primer push/PR Draft del candidato congelado24a. No ejecutar ni repreguntar. La base solicitada era875 y el destino ahoraD3: reconciliar conservando el original antes de actuar si llega respuesta. Ready, merge, deployment y publicación necesitan permisos propios.
2. `OWNER-BATH-IRARR1970-20261118-01`: baños del estudio en su alcance/fuente. Conservar desconocido hasta respuesta, sin bloquear otros proyectos.

La clasificación documental152 y la conciliación de certificados de este corte están realizadas. **El objetivo global sigue abierto** por las integraciones y respuestas pendientes; no hay información nueva recuperada ni corrección de código que justifique otra fase o nuevos permisos ahora. Continuar sólo tareas independientes autorizadas con evidencia concreta nueva; no generar otra auditoría vacía ni pedir al propietario que dirija fases. Mantener producciónD3, 152 identidades, 131 fichas originales y servicios protegidos. Ver [NEXT-PROMPT](../../../NEXT-PROMPT.md).
