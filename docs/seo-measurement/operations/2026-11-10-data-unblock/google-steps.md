## 1. Google — operación del propietario

**Acceso en Codex:** no hay conector GSC ni navegador controlable. La marca DNS ya documentada no identifica la propiedad real ni abre sus informes. El propietario realiza estos pasos en su navegador habitual; no comparte contraseña, cookies ni correo de acceso.

1. Abrir https://search.google.com/search-console/ con la cuenta que ya administra Sollahms. En el **selector de propiedad** de arriba a la izquierda, buscar `sollahms.cl` como **Dominio** (identificador que registraremos: `sc-domain:sollahms.cl`) o el prefijo existente `https://sollahms.cl/`. Elegir la propiedad real accesible; registrar su nombre exacto y tipo. Si hay ambas, identificar cuál tiene historial y conservar fuentes separadas, sin sumar sus cifras. Si no aparece ninguna, revisar las otras cuentas propias ya autorizadas o solicitar al titular actual acceso de lectura a la propiedad existente. Detenerse antes de **Añadir propiedad**.
2. Guardar captura recortada del selector y nombre de la propiedad en `gsc-property.png` y anotarlo en el manifiesto de entrega. Ocultar avatar/email/lista de otras propiedades. El dato que desbloquea este paso es la propiedad seleccionada y su panel accesible, no el registro DNS.
3. Ir a **Rendimiento → Resultados de búsqueda** (*Performance → Search results*). En **Fecha** elegir el intervalo más amplio realmente disponible, o **Personalizado**, desde la fecha más antigua seleccionable hasta el último día completo confirmado. Registrar inicio, fin, última actualización y si hay datos preliminares; no prometer historia anterior a la cuenta. En el selector de granularidad encima del gráfico, usar **Diaria/Daily**. Mantener el tipo de búsqueda exacto visible y registrarlo; no mezclar tipos ni la vista 24 horas. Activar clics, impresiones, CTR y posición.
4. Primero guardar la vista completa sin filtros de página/país en la carpeta **`google/general-no-filtrada/`**. Es únicamente contexto del dominio y puede contener fichas: no se analizan ni se contabilizan como segmento corporativo. Después crear el filtro del segmento: **+ Añadir filtro** (en variantes anteriores, **+ Nuevo**) → **Páginas** → **Personalizado (regex)** → **Coincide con la expresión regular** → pegar la expresión de abajo → **Aplicar**. No utilizar “URL contiene sollahms.cl”, que incluiría las fichas. Guardar `gsc-scope-filter.png` con la expresión completa y verificar en la pestaña Páginas que ninguna URL ajena al registro pase al segmento; si algo no coincide, conservarlo sin reclasificarlo como incluido.
5. Con ese filtro y sin filtro de país, pulsar **Exportar** (arriba a la derecha) → **CSV** o **Microsoft Excel**. Si el ZIP/libro ya contiene **Fechas, Páginas, Consultas, Países y Dispositivos**, basta una descarga por conjunto de filtros. Solo si falta una tabla, abrir esa pestaña y exportarla si se ofrece; no repetir paquetes idénticos. Guardar el original completo con nombre de entrega `gsc-performance-max-history` y su extensión real; si las tablas se descargan separadas, usar los nombres de la tabla de abajo. Conservar el gráfico/totales y la captura del filtro junto al archivo.
6. Repetir la exportación (o solamente las tablas faltantes) después de **+ Añadir filtro → País → Chile → Aplicar**, en la carpeta **`google/corporate-education-v2/CL/`**. La serie anterior va en **`google/corporate-education-v2/ALL/`**. Países y dispositivos son desgloses marginales, no una tabla cruzada fecha×página×consulta×país×dispositivo: no se inventará ese cruce. Si el reporte ofrece países agrupados o la dimensión no está disponible, registrar el estado, no un cero.

| Vista abierta al exportar | Nombre de entrega sugerido (mantener extensión original) |
|---|---|
| Fechas | `gsc-performance-max-history-dates` |
| Páginas | `gsc-performance-max-history-pages` |
| Consultas | `gsc-performance-max-history-queries` |
| Países | `gsc-performance-max-history-countries` |
| Dispositivos | `gsc-performance-max-history-devices` |

Las carpetas separan la vista general, el segmento y Chile; no cambiar los nombres o celdas internos. Registrar filas exportadas y máximo/truncación visible. La exportación de interfaz puede limitar tablas a **1.000 filas**; dividir por mes o por URL incluida puede recuperar más detalle visible, pero no garantiza recuperar filas omitidas/anonimizadas. Si ya hay exportaciones históricas anteriores o un archivo BigQuery/API operativo, aportarlo como fuente separada; no habilitar ahora exportación masiva ni otra integración. [Exportaciones oficiales](https://support.google.com/webmasters/answer/12919797?hl=en).

**Advertencia concreta para importar:** GSC puede mostrar `~`/`-` como no disponible y descargarlos como **0**. Anotar esas celdas y adjuntar captura; esos ceros quedan pendientes de revisión y no se aceptan como valor medido. Las consultas anónimas/omitidas y las distintas agregaciones explican diferencias de totales: no sumar tablas para reconstruir la información oculta. Las fechas diarias nativas son PT; no convertirlas a Santiago ni usar 09/11 como día completo antes/después. [Dimensiones y zona](https://support.google.com/webmasters/answer/17011259?hl=en).

**Indexación:** **Indexación → Páginas** (*Indexing → Pages*) → **Exportar**, si aparece, como `gsc-page-indexing` en `google/general-no-filtrada/`; guardar fecha de actualización y captura del resumen. Abrir solamente razones que afecten a URL incluidas si hace falta su evidencia. Este informe puede mostrar ejemplos limitados, por lo que no sustituye las 11 inspecciones. No pulsar **Validar corrección**. [Informe](https://support.google.com/webmasters/answer/7440203?hl=en).

**Sitemaps:** **Indexación → Sitemaps** → abrir la fila **ya existente** que corresponda. Guardar `gsc-sitemaps.png` y `gsc-sitemap-detail.png` con URL, enviado, última lectura, estado y páginas descubiertas. Si hay Exportar, conservar también `gsc-sitemaps` en su formato real. Si la lista está vacía, guardar ese estado; el informe no lista necesariamente sitemaps descubiertos por robots u otras vías. No usar **Añadir un sitemap**, **Enviar**, borrar ni reenviar. [Informe](https://support.google.com/webmasters/answer/7451001?hl=en).

**Inspección:** pegar cada una de las 11 URL exactas del registro en la barra superior **Inspeccionar cualquier URL…**, pulsar Intro y leer la versión **indexada**. Expandir **Indexación de páginas** y guardar estado/motivo literal, último rastreo, permitido rastrear/indexar, obtención de página, canonical declarada y elegida, y sitemap si se informa. Guardar capturas `gsc-inspection-01.png` a `gsc-inspection-11.png` con URL visible, y una fila por URL en la plantilla de inspección. Valores no mostrados quedan vacíos/`unknown`, nunca cero. No pulsar **Probar URL publicada/Test live URL** ni **Solicitar indexación/Request indexing**. [Herramienta](https://support.google.com/webmasters/answer/9012289/).

### Filtro positivo exacto de las 11 páginas

Copiar una sola línea sin añadir espacios. El prefijo `(?-i)` activa coincidencia sensible a mayúsculas; el resto procede de la lista positiva vigente:

```text
(?-i)^(?:https://sollahms\.cl/|https://sollahms\.cl/proyectos\.html|https://sollahms\.cl/agenda\-asesoria\.html|https://sollahms\.cl/contacto\.html|https://sollahms\.cl/privacidad\.html|https://sollahms\.cl/comparador\-hipotecario\.html|https://sollahms\.cl/trabaja\-con\-nosotros\.html|https://sollahms\.cl/guia\-hipotecaria\.html|https://sollahms\.cl/cuando\-comprar\-propiedad\.html|https://sollahms\.cl/centro\-orientacion\.html|https://sollahms\.cl/entorno\-desarrollo\-urbano\.html)$
```

Orden de inspección (idéntico al registro vigente):

01. `https://sollahms.cl/`
02. `https://sollahms.cl/proyectos.html`
03. `https://sollahms.cl/agenda-asesoria.html`
04. `https://sollahms.cl/contacto.html`
05. `https://sollahms.cl/privacidad.html`
06. `https://sollahms.cl/comparador-hipotecario.html`
07. `https://sollahms.cl/trabaja-con-nosotros.html`
08. `https://sollahms.cl/guia-hipotecaria.html`
09. `https://sollahms.cl/cuando-comprar-propiedad.html`
10. `https://sollahms.cl/centro-orientacion.html`
11. `https://sollahms.cl/entorno-desarrollo-urbano.html`
