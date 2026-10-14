> Registro de la Preview validada antes del merge. La integración a main y sus resultados propios se documentan en [Merge Sento a main](merge-sento-main.md). Los archivos completos de QA de esa Preview permanecen en el paquete durable de esta conversación.

# SOLLAHMS — Correcciones finales de Sento

Entrega del 14 de octubre de 2026. Este informe sustituye la presentación y los resultados de la Preview anterior.

**Resultado:** siete fichas existentes, 45 planos cruzados individualmente por proyecto y código, 125 superficies visibles verificadas y ninguna ficha adicional. Se eliminó «Documentación del proyecto» del generador y de los siete HTML. Permanecen internamente los seis PDF, las referencias oficiales y las auditorías.

La fuente de trabajo es `/private/tmp/sollahms-sento-work`, rama `codex/sento-cartera-documentada`, basada en la última entrega validada. El workspace compartido había pasado a la rama de León; esta corrección no escribe allí. El commit base es `dfa5b5b73173b246fd29921ad3514fa53e4bf0c4`; los archivos de esta corrección se conservan como cambios de trabajo y evidencia, sin atribuirlos a ese commit.

## Siete proyectos

| Proyecto | Ruta conservada | Fotografías | Planos | Superficies visibles | Condición que queda documentada |
| --- | --- | ---: | ---: | ---: | --- |
| Curicó 77 | `/curico-77.html` | 5 | 11 | 31 | D2 no aparece en las tarjetas actuales; se conserva únicamente su total de 25 m² del PDF. |
| Domeyko 2055 | `/domeyko-2055.html` | 7 | 3 | 9 | A5/B5 usan el diagrama original completo del PDF y las cifras actuales de su código. |
| Jofré 157, brochure Jofré 135 | `/jofre-135.html` | 6 | 4 | 11 | Cuatro objetos de plano idénticos en el PDF oficial ofrecido por Jofré 157; ninguna ficha duplicada. A1 sin terraza explícita. |
| Mirador La Florida | `/mirador-la-florida.html` | 7 | 9 | 27 | A4 usa el original oficial completo sin banda AGOTADO; se conserva el PDF y la comparación de versión. |
| Plaza Las Condes | `/plaza-las-condes.html` | 7 | 9 | 23 | B5/C2 muestran sólo 48,09/76,77 m² totales del PDF; los componentes de las tarjetas oficiales repiten otros modelos. |
| San Ignacio, brochure 270 / web 280 | `/san-ignacio.html` | 6 | 3 | 8 | Se conserva el desarrollo y la ruta; A3/D1 usan los objetos gráficos originales. A3 sin terraza explícita. |
| Angamos 205 | `/angamos.html` | 17 | 6 | 16 | A2/A4 tienen dormitorios desconocidos y baño confirmado; C6 muestra sólo el total oficial de 51,36 m². |
| **Total** | **7 rutas** | **55** | **45** | **125** | **0 duplicados** |

La lista completa de 45 códigos y sus valores queda en [Resumen de publicación de planos](qa/sento-final/plan-publication-summary.md) y [registro maestro interno](../data/sento-plan-audit.json). Hay 127 valores numéricos verificados internamente; los dos ceros de terraza confirmados se omiten de la presentación. Los datos desconocidos permanecen `null`. No se publicaron promedios, cálculos de superficie, ceros inventados ni valores de un modelo parecido.

Los datos comerciales se contrastaron de nuevo el 14 de octubre y no cambiaron respecto a la entrega anterior. No se modificaron precios, promociones ni stock a partir de los PDF. Jofré permanece vendido y sin precio. Cada precio conserva unidad, descuento incluido, exclusión de estacionamiento/bodega y condición de cotización.

## Presentación y fidelidad

Los planos muestran «Tipología CÓDIGO — distribución confirmada» y un bloque compacto de superficies, con el total en mayor tamaño y peso. Se mantuvo el diseño destacado de Plaza Las Condes y las galerías, mapas, recorridos y acciones de consulta, agenda y crédito. Se retiraron botones PDF, enlaces documentales a Sento, fechas de auditoría, textos de procedencia y la navegación hacia la sección eliminada. Los avisos esenciales de imágenes, medidas, disponibilidad y equipamiento quedan discretos.

Se reemplazaron cinco recortes con texto editorial antiguo por el objeto gráfico completo de su mismo PDF: Domeyko A5/B5, San Ignacio A3/D1 y Plaza C4. No se borraron cotas, habitaciones ni geometría. Mirador A4 proviene de su JPEG oficial de 930 × 930; no se afirma igualdad de píxeles en la región que antes tapaba la banda. [Cambios de recursos](qa/sento-final/plan-asset-changes.json).

Los 45 planos y sus derivados conservan exactamente los píxeles decodificados de la fuente seleccionada. Los originales pequeños se presentan sin ampliación por encima de su tamaño nativo. Se conservan 283 recursos publicados de Sento, incluidos los seis PDF; sus enlaces comerciales desaparecen y la documentación no entra en los dos JSON públicos del catálogo. Los seis PDF mantienen los SHA-256 de recepción. [Reproducción independiente](qa/sento-final/materializer-reproduction.json): 225 archivos de los seis brochures reconstruidos en una carpeta temporal, todos idénticos en bytes.

Las auditorías de [39 planos PDF](qa/sento-final/plan-pdf-audit.md) y [6 Angamos](qa/sento-final/angamos-plan-audit.md) conservan las versiones discrepantes y sus fuentes. Las dos auditorías tienen hashes independientes fijados en los guardas de generación/publicación; una cifra calculada para C6 o un plano prestado se rechazan.

## Pruebas y comandos

| Verificación final | Aprobadas | Fallidas / omitidas | Duración y evidencia |
| --- | ---: | --- | --- |
| Regresión histórica Node | **323/323**, 32 lotes | 0 / 0 dentro de la selección | 789,810 s sumados; [comandos, nombres y TAP completos](qa/sento-final/coverage-complete.json). |
| Python | **130/130** | 0 | 45,374 s; mismo recibo compuesto. |
| Validador hipotecario | **Aprobado** | 0 | 0,077 s; mismo recibo compuesto. |
| Tres fallas originales, individuales | **3/3** en fuente y **3/3** en copia limpia | 0 / 0 | Seis ejecuciones exactas; [informe histórico](qa/sento-final/historical-regression-report.md). |
| Sento: fuentes, alcance, píxeles y paquete | **12/12** | 0 / 0 | 76,492 s; [comando y resultado](qa/sento-final/sento-validation.json), [salida](qa/sento-final/sento-validation.tap). |
| Presentación y regeneración | **5/5** | 0 / 0 | 1,580 s; [recibo](qa/sento-final/final-presentation-report.json), [TAP](qa/sento-final/final-presentation.tap). Dos ejecuciones reales del generador en fixture: 1,219 s. |
| Navegador: escritorio/tablet/móvil | **1.581 controles**, 21 vistas | 0 | Aproximadamente 100 s; [recibo visual](qa/sento-final/final-browser-report.json). 135 visitas de modelos, 375 valores visibles y 66 capturas. |
| Fuente preparada para Vercel | **1.627 archivos idénticos** | 0 diferencias | [Comparación de dos builds](qa/sento-final/deployment-dist-comparison.json). |
| Preview remota | **68/68 recursos** y HEAD | 0 | 100,038 s; [comprobación autenticada](qa/sento-final/preview-report.json). |

El primer intento de la copia limpia registró 322/323 por un PNG de evidencia histórica omitido al copiar `docs/qa`. Se restituyeron exactamente sus 163.434 bytes y hash fijado, y se repitió íntegra la suite implicada: 10/10. Se conservaron ambos intentos. Los 27 casos privados de release de otras carteras siguen **no ejecutados**, fuera del denominador histórico de 323, conforme a la clasificación original; no se añadieron exclusiones.

Las tres pruebas originales son los inventarios de `tests/aj-urbana.test.mjs:179`, `tests/ingevec-brochures.test.mjs:214` y `tests/official-contexts.test.mjs:340`. El [informe histórico](qa/sento-final/historical-regression-report.md) identifica sus nombres literales, errores iniciales y seis ejecuciones individuales. Sus asserts, inventarios, hashes y clasificación no cambiaron en esta solicitud. La investigación detectó objetos Git bajo iCloud y lecturas `dataless` con timeout; se recuperó el grafo auténtico desde GitHub, se validó `fsck` y se eliminó la dependencia externa del clone. La cobertura final se demuestra por lotes equivalentes, sin presentarla como una ejecución monolítica.

Las pruebas específicas añadidas verifican la eliminación persistente de documentación, los valores por código y el rechazo de superficies calculadas o planos de otro modelo. Se normalizó únicamente el separador tipográfico `/` frente a `·`, y se admitieron valores desconocidos `null` no publicables; todo valor numérico exige origen. Los controles de formularios interceptaron 21 solicitudes: cero mensajes, reservas o escrituras reales.

Comandos principales, ejecutados en la copia aislada con Node/Python del runtime disponible:

```sh
VERCEL_ENV=preview VERCEL_GIT_COMMIT_REF=codex/sento-cartera-documentada node scripts/package-vercel.mjs
node --test tests/sento-validation.mjs
node --test --test-concurrency=1 tests/sento-final-presentation.mjs
node tests/qa-sento.mjs --root /private/tmp/sollahms-sento-work --base http://127.0.0.1:8089 --output /private/tmp/sollahms-sento-final-browser
```

Las rutas de binarios, variables Poppler/Python, entornos mínimos y comandos exactos de las 32 suites constan en los recibos enlazados. Los 66 PNG copiados sin cambios y sus hashes están en [inventario de capturas](qa/sento-final/screenshots.json).

## Límites pendientes de la fuente

- **Curicó D2:** no hay tarjeta oficial actual por código; faltan útil/terraza. Se conserva total PDF.
- **Curicó C2-1:** el campo Terraza publica 41,01 m² con un asterisco sin explicación establecida; no se deduce una superficie de jardín.
- **Plaza B5/C2:** faltan componentes fiables de esos modelos; se conservan únicamente los totales PDF.
- **Angamos A2/A4:** las fuentes públicas no resuelven Estudio frente a un dormitorio; no se publica un número de dormitorios.
- **Angamos C6:** útil 48,37 + terraza 2,89 no coincide con total 51,36. Se publica el total declarado y se retienen los componentes internamente, sin recalcularlo.
- **Stock y accesos:** bandas RESERVADO de origen no acreditan stock actual; no se certificó disponibilidad por unidad. Las numeraciones y accesos discrepantes conservan sus avisos discretos y evidencia interna.
- **Resolución:** los objetos originales pequeños y los planos Angamos C4/C6 de 800 px limitan el detalle disponible; no se reconstruyeron ni agrandaron artificialmente.

Estas limitaciones corresponden a información no resuelta en las fuentes, no a pruebas pendientes de la selección histórica.

## Preview y preservación

**[Abrir la Preview final](https://project-wrapp-4xe4tkg4b-lsandoval2-8260s-projects.vercel.app/proyectos.html)**. Despliegue `dpl_8mFiPJHxhHprUdiVwQW4eJzu2MJY`, **READY**, destino Preview, sin alias. Build Vercel: **36,88 s**. La autenticación y los dominios del proyecto existente siguen iguales; no hubo promoción ni dominio de Production. [Recibo del despliegue](qa/sento-final/deployment.json).

La comprobación GET/HEAD autenticada aprobó **68/68 recursos con HTTP 200**: siete fichas, página del catálogo, JSON público, CSS Sento, siete portadas, 45 planos y seis PDF. Las ocho páginas HTML contienen exactamente los bytes del build y únicamente el script final de Vercel Toolbar de 163 bytes con el ID de este despliegue. Los otros 60 recursos coinciden directamente por SHA-256. El HEAD de Angamos confirma `noindex` y la política CSP configurada. No se normalizaron ni descartaron otras diferencias. [Informe remoto](qa/sento-final/preview-report.json).

Los 127 proyectos ajenos mantienen sus filas en los tres registros, sus HTML y contextos; la prueba de dos builds conserva 127 fichas compiladas y 1.198 recursos ajenos sin diferencias. Se mantiene el baseline independiente, con SHA-256 `78fa927b17b0d7cda3f58744f6ba8c134a0b8cd36306b250cfd92af4e01d4d19`. Los cambios respecto a la fuente de la Preview anterior están en [inventario de diferencias](qa/sento-final/followup-source-differences.json).

La fuente y las evidencias de esta corrección tienen una copia durable en `sento-final-2026-10-14` del espacio de archivos de esta conversación. Incluye el [parche de texto](qa/sento-final/followup-source.patch), los seis planos sustituidos, los PDF originales y los recibos. El README distingue este paquete de cambios del checkout completo y conserva el contexto congelado de la entrega Sento.

**No se modificaron otras inmobiliarias en esta corrección, no se hizo merge a main y no se modificó Production.**
