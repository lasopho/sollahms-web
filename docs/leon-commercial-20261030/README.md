# León — actualización comercial de cinco fichas

Fuente: tabla autorizada por Sollahms el 30/10/2026. Se conserva el nombre, slug y ruta existentes de cada proyecto. No se importan campañas externas ni se inventa stock.

| Ficha | Precios autorizados por tipología (UF) | Desde UF | Dirección | Estado | Entrega informada |
|---|---|---:|---|---|---|
| /condominio-uruguay.html | 2D: 4.433 | 4.433 | Uruguay 8866, La Florida | En recepción final | Inmediata |
| /condominio-parque-don-lautaro.html | 2D: 7.778; 3D: 8.611 | 7.778 | Av. Consistorial 6501, Peñalolén | En blanco | Octubre 2028 |
| /bcome.html | Estudio: 2.930; 1D: 3.441; 2D: 3.855 | 2.930 | Paicaví 1485, Concepción | En verde | 1.er semestre 2027 |
| /gregorio-de-la-fuente-a.html | 1D: 3.349; 2D: 5.048; 3D: 6.510 | 3.349 | Gregorio de la Fuente 3011, Macul | En recepción final | Inmediata |
| /jardines-de-ramon-cruz.html | 2D: 5.044; 3D: 5.600 | 5.044 | Ramón Cruz 3291, Macul | En recepción final | Inmediata |

Concepción usa la opción regional existente «Biobío» (Región del Biobío), evitando duplicarla; las restantes comunas, Región Metropolitana. Ramón Cruz conserva la denominación completa anterior en trazabilidad y las mismas coordenadas verificadas. Ninguna fecha se presenta como garantizada. “Inmediata” en el filtro comercial no acredita habilitación legal; los tres proyectos en recepción final quedan fuera de la recomendación educativa de entrega inmediata.

## Fuente y sincronización

Los valores activos están en `data/proyectos.json`, con ofertas estables `0d`, `1d`, `2d` y `3d`, prioridad del propietario y fecha. `data/fichas-proyectos.json` conserva investigación y antecedentes históricos. `owner-input.json` es evidencia de entrada, no una segunda base operativa. `scripts/leon_commercial.py` consume el catálogo para las fichas y la proyección de filtros; el importador de investigación impide sobrescribir los campos comerciales autorizados.

Tarjetas, listado y mapa usan el precio de la tipología seleccionada para comparar y ordenar. Los enlaces conservan identificador de oferta y origen público; la cotización y Guía hipotecaria resuelven el precio desde el catálogo. El simulador anterior también recibe el precio desde con procedencia fechada. Sus límites de antigüedad, cálculos, formularios y destinos no se modifican.

La proyección de contacto habilita sólo los campos comerciales explícitos de estas cinco identidades León. Mantiene la anulación de medios protegidos y todas las restricciones Sento; no difunde los registros de investigación ni utiliza un spread de datos privados. La función de contacto, sus validaciones y sus canales de recepción permanecen iguales.

## Conservación y pendientes

Se conservaron 114 imágenes, incluidos 36 planos, así como galerías, iframes, formularios, estilos, parallax, superficies y amenities. Los otros 126 proyectos y sus filtros quedan idénticos. No se crearon iconos ni se añadieron fotografías.

Los modelos documentados de 1 dormitorio en Uruguay y Jardines no tienen precio autorizado: permanecen consultables y no coinciden con rangos de precio. Los baños de estudios de Bcome y las discrepancias de superficies indicadas en los planos siguen pendientes. Gimnasios u otros espacios mostrados únicamente en fotografías/renders mantienen su nota documental y no generan coincidencias verificadas sin respaldo textual o plano explícito. Disponibilidad, precio de unidad, inclusiones y recepción final deben confirmarse al cotizar.

## Pruebas

- 139 comprobaciones de precios, ubicación, estados, entregas, filtros combinados, orden, oferta y contexto del simulador/cotización.
- 344 comprobaciones de conservación y bloqueo de sobrescrituras; regeneración focalizada idempotente.
- 69 comprobaciones de proyección financiera: cinco precios desde, rechazo de datos comerciales incoherentes y vencidos, conservación de las restricciones Sento y ausencia de medios protegidos.
- Regresión existente: 85 comprobaciones Sento, 77 AJ Urbana, 194 ECasa y diez pruebas del catálogo.
- Regeneración compartida de las cinco fichas conserva sus once precios. La reconstrucción global de facetas reproduce las cinco proyecciones León; sólo aparecen diferencias preexistentes de orden/null en tres registros ECasa, que no se incluyen en la publicación.

## Paquete y recuperación

Base final: producción `dpl_DqeEbUHFWijsXgRuvCSh4kHAqsuW`, código `f6980e3c374b2c56c5053191513d0d4ad34a30ae`, con informe posterior en `92ebd6ebb598b19f3bf6238a5795ca552ba47f6a`. Se detectó esta actualización Sento durante la verificación y se conservaron sus siete registros completos, fichas, ofertas, filtros y excepción del precio mínimo de Plaza. El recibo SHA1 de hashes runtime coincide con producción: `7f8954cee91e4a047aa8a66c5592446d1eb28d43`; el script de preparación también coincide: `8405547b58ff4a90766e67e4d0aaa210e7d13ffc`.

Se reutiliza la rama manual activa `codex/sento-commercial-20261030` mediante avance directo desde el commit de informe vigente. No se fusionan ramas antiguas, no se modifica `main` ni `vercel.json`, ni se cambian los despliegues automáticos. `scripts/package-leon-commercial.py` aplica una lista cerrada de trece archivos públicos y un módulo de proyección de contacto, y conserva los restantes 1.607 archivos runtime. No reconstruye recursos exclusivos de Preview. Se mantienen el retiro HTTP 410 de Patio Brasil y las sincronizaciones comerciales anteriores.

El manifiesto anterior se conserva en `baseline-deployment-files.json`. El deployment base queda disponible para rollback sin reconstrucción. Los identificadores finales y comprobaciones de navegador/publicación se agregan después de validar el candidato.

## Verificación en navegador antes de la publicación

Chrome real a 1440×1000 y 390×950: cinco fichas con los once precios, sin desbordamientos ni imágenes rotas cargadas. Bcome con Biobío + Concepción + León + Departamento + 2D + máximo UF 4.000 devuelve UF 3.855 en tarjetas, listado y mapa. El enlace mantiene oferta 2d y origen buscador; la cotización conserva la selección y la guía muestra 3855 UF. La conversión UF proviene del servicio existente. No se enviaron formularios ni correos.

El paquete sincroniza 53 registros autorizados del catálogo interno de contacto, conservando los otros 78. Los 126 proyectos ajenos a León mantienen idénticos datos y facetas respecto de la producción Sento.
