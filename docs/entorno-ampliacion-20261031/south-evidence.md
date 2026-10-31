# Ampliación sur — corte 31 de octubre de 2026

Resultado: tres registros actualizados, una obra de alcance limitado nueva y ocho asociaciones. No se editaron datos centrales ni comerciales.

| Candidato | Decisión | Evidencia y precisión |
|---|---|---|
| Hospital Puerto Varas | Huella aprobada recuperada; tres asociaciones | RCA 115/2020 del SEA, tabla 4.2, página 4. Cinco vértices A–E, WGS84/UTM18S, convertidos con pyproj a longitud/latitud. Tabla y plano inspeccionados visualmente. Distancias al perímetro: INN 1167 m, Índigo 1003 m, Nórdico 1112 m. No son distancias a entradas. |
| Parque Costanera Puerto Varas | Extremo inicial documentado; tres asociaciones | DOP, 7 mayo 2026: Punta Diamantes es la esquina Vicente Pérez Rosales/Imperial. Nodo OSM 2747295009 compartido por ambas vías. Distancias a esta referencia: INN 156 m, Índigo 246 m, Nórdico 984 m. No se dibuja un trazado ni se afirma que sea la parte del parque más próxima. |
| Acceso oriente Cochrane | Extremo vial documentado; nueva asociación Bold | Presentación MOP/MINVU ante Senado, 21 agosto 2025, página 6: pavimentación Cochrane hasta Serrano. Licitación vigente 5751-25-O126 corresponde exclusivamente a acceso oriente. Nodo OSM 1194228688 de Lord Cochrane/Serrano; Bold queda a 754 m en línea recta a esta referencia. No se supone construido el puente. |
| Hospital Regional Ñuble | Publicar únicamente Servicio de Imagenología operativo; nueva asociación Distrito Centro | Operador confirma inauguración 15 octubre 2025 y mantiene instrucciones de atención, dirección O’Higgins 1651 e ingreso por Rosauro Acuña. OSM way342881682 identifica el mismo recinto (numeración1679 discrepante registrada). Distancia al perímetro hospitalario797m, no a la puerta del servicio. Nota oficial30oct2026 confirma habilitación de oxígeno pendiente de autorización: no se declara operación integral. |
| Parque Metropolitano Puerto Montt | Mantener pendiente geometría | Revisadas delimitación municipal entre cuatro calles, licitación de diseño656-12-LQ19 y documento territorial GORE. No se obtuvo plano georreferenciado del terreno42.841m². No se dibuja el cuadrante como polígono real. |

## Archivo de evidencia

- `hospital-pv-rca.pdf`: copia primaria íntegra, obtenida desde firma.sea.gob.cl/publicaciones/72/f8/2148881741.pdf. El expediente SEA2144020264 identifica RCA115 del9nov2020.
- `hospital-pv-conversion.json`: datos UTM originales, CRS, método y coordenadas resultantes.
- `hospital-pv-sea.html`: declaración primaria con dirección y rol; no fue suficiente para el polígono y se reemplazó por la RCA para ese fin. El enlace al anexo DIA devolvió una página HTML de bloqueo; ese falso PDF fue eliminado.
- `hospital-nuble-osm.xml`: recinto completo, nombre y dirección del objeto contrastados con el operador.
- `costanera-pv-esquina.xml` y `cochrane-esquina.xml`: elementos OSM exactos que vinculan el nodo a las dos calles documentadas. Son extractos probatorios, no archivos completos del mapa.

## Incertidumbres

El micrositio oficial `hospitaldechillan.cl/web/nuevohospital/` devolvió versiones con fechas contradictorias de traslado del Centro Ambulatorio, texto pendiente de validar y un aviso anómalo. No se emplea como fundamento de una apertura integral. La operación de Imagenología se fundamenta en la noticia institucional fechada y su página propia de atención.

Las referencias puntuales de Cochrane y Costanera no sustituyen las huellas completas; sus etiquetas públicas deben conservar esta precisión. Ninguna distancia es recorrido ni habilitación actual de acceso. No se calcularon tiempos.

## Comprobaciones

Ocho pares obra/proyecto únicos. Los snapshots de dirección, comuna, latitud y longitud coinciden con el registro central. Distancias calculadas usando `geometryDistance` del modelo existente. Ninguna asociación se apoya en un centro de ciudad o en un inmueble de ubicación bloqueada. `resolvedPendingIds` queda vacío porque los pendientes anteriores son grupos de múltiples candidatos, y estos resultados no permiten cerrar el grupo completo.
