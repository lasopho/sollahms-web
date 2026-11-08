# Segmentación de indicadores — alcance corporativo v2

El segmento estratégico se define por la **lista positiva de 11 URL** de `scope-v2.json`. Las fichas no se excluyen del sitio; se excluyen de este análisis. Todo informe indica `scope_id`, hash de la lista, motor, propiedad, periodo, zona, país, dispositivo, filtros, definición de posición y origen verificable.

## Tres clases de evidencia

| Clase | Tratamiento |
|---|---|
| Informe nativo filtrado a la lista positiva exacta | Puede sustentar indicadores exclusivos del alcance si se conserva y revisa su filtro/procedencia |
| Informe general del dominio | Etiquetar **general no filtrado**, con posible inclusión de fichas; no atribuirlo al segmento corporativo |
| Tabla por página o inspecciones por URL | Seleccionar solo URL incluidas; describir límites, muestreo o truncamiento. No convertir automáticamente sus sumas en totales nativos del segmento |

Si solo hay cifras globales, las métricas exclusivas permanecen `null` y la comparación corporativa se declara no disponible. No calcular “global menos fichas” ni imputar tráfico a páginas sin detalle suficiente. No puntuar ni analizar el rendimiento de las fichas para conseguir un total corporativo.

## Obtención en Google y Bing

Reutilizar las propiedades autorizadas existentes. Obtener dos vistas separadas cuando estén disponibles: contexto general no filtrado y rendimiento filtrado a las URL incluidas. En GSC, usar el filtro de página que permita representar la lista exacta (por ejemplo, expresión regular anclada de alternativas exactas) y conservar captura/exportación del filtro. La expresión orientativa se conserva en `scope-v2.json`; comprobar la semántica del filtro real antes de usar el informe. No asumir que Bing dispone de los mismos operadores o informes: si no permite obtener la serie del grupo exacto, conservar análisis por URL y declarar que el total/comparación del segmento no está disponible.

Para comparaciones de 30 contra 30 se necesitan 60 fechas consecutivas completas del segmento, y 180 para 90 contra 90. Mantener igual motor, alcance, definición, filtros y zona en ambos periodos. Una serie del dominio de fase anterior no se compara como si tuviera el nuevo alcance. Puede reimportarse retrospectivamente si se obtiene un informe válido con el mismo filtro para todos los periodos.

## Herramientas offline

El importador `seo_measurement.py` conserva su función de normalizar originales. La corrección añade `seo_scope.py` sin modificar el importador histórico.

### Clasificar detalle por página o indexación

```bash
python scripts/seo_scope.py segment --input docs/seo-measurement/.local/LOTE/normalized-pages.json --scope docs/seo-measurement/scope-v2.json --output docs/seo-measurement/.local/LOTE/included-pages.json
```

Solo se conservan filas incluidas para análisis. Se informa cuántas filas se apartaron por exclusión/técnicas/desconocidas, sin métricas o rankings de fichas. Las desconocidas quedan retenidas para clasificación, no se incorporan por descarte. El resultado no es una serie diaria ni un total nativo: no habilita por sí mismo una comparación exclusiva de 30/90 días.

### Vincular una serie diaria realmente filtrada

Normalizar primero el CSV diario exportado del motor. Después preparar un JSON de evidencia **real, no una plantilla rellenada por suposición**:

```json
{
  "source": "google_search_console",
  "property": "sc-domain:sollahms.cl",
  "method": "native_exact_allowlist",
  "included_urls": ["REEMPLAZAR POR LAS 11 URL EXACTAS DEL REGISTRO"],
  "reviewed_by_operator": true,
  "evidence_file": "filtro-y-procedencia.txt",
  "evidence_sha256": "SHA256_DEL_ARCHIVO_REAL"
}
```

El archivo referenciado debe documentar la extracción autorizada y el filtro nativo que realmente se aplicó, con captura, petición/exportación y metadatos suficientes para revisarlo. La lista declarada debe ser exactamente la del registro. Un hash protege integridad; no demuestra por sí solo que el motor aplicó el filtro ni convierte un informe global en uno filtrado. La revisión humana de esa procedencia sigue siendo indispensable. No colocar esta declaración sobre un informe global.

```bash
python scripts/seo_scope.py bind-daily --input docs/seo-measurement/.local/LOTE/daily.json --scope docs/seo-measurement/scope-v2.json --proof docs/seo-measurement/.local/LOTE/filter-proof.json --output docs/seo-measurement/.local/LOTE/scoped-daily.json
python scripts/seo_scope.py compare --input docs/seo-measurement/.local/LOTE/scoped-daily.json --end AAAA-MM-DD --scope docs/seo-measurement/scope-v2.json --output docs/seo-measurement/.local/LOTE/scoped-comparison.json
```

Las guardas comprueban coincidencia de fuente, propiedad, lista, archivo/hash y revisión declarada. La comparación exige el mismo alcance/hash; rechaza series globales sin vinculación. Los filtros añadidos conservan esa separación también frente al comparador histórico. No resuelven datos falsos ni reemplazan la autenticidad del export.

## Definiciones y límites

- CTR: clics/impresiones del mismo informe/segmento; no promediar porcentajes de páginas.
- Posición: definición del motor y agregado de su informe. Las medias exportadas conservan sus límites; no equivalen a un ranking fijo ni se mezclan definiciones de Bing.
- Indexación: inspecciones/cobertura del motor solo de las URL incluidas. Una muestra no permite afirmar cobertura completa de las 11.
- Consultas/países/dispositivos: mismas listas/filtros. No sumar dimensiones para recuperar totales ocultos o consultas anonimizadas.
- Conversiones: solicitudes aceptadas y contactos cualificados atribuibles a páginas incluidas mediante evidencia. Métricas generales o sin página de origen quedan generales/no atribuibles, no corporativas exclusivas. Colaboración y clics en WhatsApp se informan aparte.
- Nuevas URL/alias: clasificar con procedencia antes de incluir; mantenerlas fuera si existe duda de que sean fichas. No modificar rutas ni canonicals para facilitar el análisis.
- IA: aplicar la versión 2 y contar solo fuentes/citas elegibles. Las respuestas originales pueden contener fichas, pero esas referencias no generan puntuaciones de proyecto ni crédito del segmento.
