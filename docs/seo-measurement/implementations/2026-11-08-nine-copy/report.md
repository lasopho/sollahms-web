# Nueve mejoras implementadas en la rama — sin publicación

**Fecha:** 8 de noviembre de 2026, America/Santiago.
**Rama:** `codex/seo-medicion-20261108`.
**Base de implementación:** `87108f3fc6d10994d456388c106e79a5b538bffc`; la rama remota coincidía al iniciar. Se conserva toda la revisión y el trabajo anterior.

## Estado de los cambios

| ID | Página | Implementación |
|---|---|---|
| H01 | Portada | Solo la meta description; JSON-LD y demás metadatos intactos |
| H02 | Portada | Párrafo bajo H1: compra para vivir e inversión |
| H03 | Portada | Texto de «Define tu objetivo» |
| O01 | Centro | Explicación breve y enlaces a guía/comparador |
| O02 | Centro | Nombre del enlace al comparador y orientación sobre fuente/vigencia, con el mismo destino |
| G01 | Guía | Nuevo párrafo tras el aviso de privacidad de escenarios y antes de las acciones existentes |
| C01 | Comparador | Límites educativos en la introducción, manteniendo el enlace a la guía |
| C02 | Comparador | Ayuda que distingue opciones de simulación de condiciones bancarias |
| C03 | Comparador | Párrafo previo al formulario que aclara el propósito de la orientación |

Se usaron los textos exactos aprobados en [proposals.md](../../reviews/2026-11-08-four-pages/proposals.md). Cada reemplazo y la inserción están presentes una sola vez. No se ampliaron servicios, datos del asesor ni condiciones financieras.

## Base y fuentes de las páginas

Los cuatro HTML raíz coincidían byte a byte con las capturas publicadas de la revisión: portada 57.861 bytes, centro 23.273, guía 44.488 y comparador 23.124. Los hashes y la comprobación se registran en `validation.json`. No se partió de main ni se reemplazaron páginas con un manifiesto congelado antiguo.

Portada, centro y comparador son fuentes HTML directas. La guía además tiene el generador específico `scripts/build-mortgage-guide.py`: se añadió únicamente el mismo párrafo G01 a su sección hardcodeada, para conservarlo en una regeneración futura. No se ejecutó el generador ni se tocó el helper compartido de metadatos. La prueba de preservación revierte solo esas inserciones/reemplazos y exige recuperar exactamente la base anterior.

## Archivos modificados

- `index.html`
- `centro-orientacion.html`
- `guia-hipotecaria.html`
- `comparador-hipotecario.html`
- `scripts/build-mortgage-guide.py`: solo G01 en la plantilla de la guía.
- `tests/test_seo_nine_copy.py` y `tests/seo-nine-copy-browser.py`: comprobaciones específicas.
- Este directorio de documentación, resultados y capturas.

No se modificaron títulos, H1, CSS, navegación aprobada, scripts de aplicación, campos, consentimiento, validaciones, datos enviados, fórmulas, rangos, variables, resultados, precios, cifras financieras, robots, sitemap, canonical, JSON-LD, componentes compartidos ni configuración. No se editó ninguna ficha.

## Pruebas ejecutadas ahora

### Preservación de contenido y funcionamiento

**8 comprobaciones específicas aprobadas**, registradas en [static-tests.txt](static-tests.txt): nueve cambios únicos y todos los demás bytes de las páginas preservados; coincidencia de la base con las capturas publicadas; títulos/H1/scripts/estilos/canonical idénticos; solo una descripción meta cambiada; controles y formularios preservados; enlaces originales intactos y tres enlaces educativos añadidos; ubicación y durabilidad de G01; despliegue automático desactivado.

**48 pruebas existentes aprobadas** con datos sintéticos o transporte inyectado:

| Comando | Resultado | Evidencia |
|---|---|---|
| `node --test tests/mortgage-engine.test.mjs tests/mortgage-data.test.mjs` | 20 aprobadas | [mortgage-tests.txt](mortgage-tests.txt) |
| `node --test --test-name-pattern='^(?!Context trusts)' tests/mortgage-guide.test.mjs` | 7 aprobadas | [guide-tests.txt](guide-tests.txt) |
| `node --test tests/orientation-20261031.mjs` | 18 aprobadas | [orientation-tests.txt](orientation-tests.txt) |
| Selección de tres pruebas de `required-commercial-fields.test.mjs` | 3 aprobadas | [contact-fields-tests.txt](contact-fields-tests.txt) |

Las pruebas de datos financieros conservan sus fechas y referencias históricas de fixture: no certifican ofertas vigentes ni resultados SEO. La prueba de contexto de la guía usa objetos sintéticos, sin revisar ni abrir fichas reales. Los transportes de contactos están inyectados/simulados; no se envió ningún contacto real.

### Revisión local de navegador

El resultado y capturas actuales están en [browser/results.json](browser/results.json) y [galería de capturas](screenshots.md). La prueba sirve la base y la propuesta desde servidores `127.0.0.1`, conserva los recursos locales y bloquea destinos externos. Toda API queda interceptada; UF se simula como no disponible y no se presenta como valor oficial vigente. No se navega a fichas o páginas de agenda/contacto externas a las cuatro revisadas.

**Resultado actual: aprobado.** Se completaron 16 cargas locales (cuatro páginas × dos versiones × dos tamaños), ocho comparaciones antes/después, 12 comprobaciones nativas de formularios vacíos y 16 capturas nuevas. Sin excepciones JavaScript ni desbordamiento horizontal, antes o después de las interacciones. Los fingerprints de formularios, controles, consentimiento y contacto son idénticos.

Los resultados de fixtures también coinciden: comparador 20,09 UF mensuales; ejemplo de guía 19,39 UF y 20 filas de amortización; presupuesto del Centro 2.269,74 UF; comparación de cotizaciones 8 UF y 14,03 UF. No son ofertas ni métricas reales. Se interceptaron 12 GET de UF; ningún POST llegó al servidor y no se permitió ninguna solicitud remota.

La única incidencia de consola corresponde a una fuente externa de Google bloqueada deliberadamente por aislamiento en el comparador; aparece igual en la base y en la propuesta. No se corrigieron fuentes o estilos ajenos a esta tarea. La última ejecución y las capturas son de esta implementación, no evidencia histórica reutilizada.

## Protección contra publicación

`vercel.json` conserva `git.deploymentEnabled.main=false` y `git.deploymentEnabled["codex/seo-medicion-20261108"]=false`. El proyecto consultado mantiene `live=false`. El workflow existente no publica esta rama al hacer push. No se cambiaron esas protecciones ni se ejecutaron comandos de despliegue/promoción o fusiones.

La configuración de empaquetado apunta a `prepare-output.mjs`, que no está en este checkout y pertenece al flujo de artefactos congelados. No se ha reparado ni ejecutado ese empaquetado: las pruebas de esta intervención usan los HTML estáticos locales. No se presenta el resultado como un build o paquete publicado.

## Pendiente antes de publicar

1. Revisión y autorización explícita del propietario para la publicación; esta tarea autoriza solo implementación en la rama.
2. Preparar el paquete de publicación desde la versión vigente mediante el flujo ya establecido, conservando sus funciones y salvaguardas. No reconstruir ni promover un manifiesto antiguo por defecto.
3. Repetir la verificación del candidato que se prepare para esa publicación; los mocks locales no demuestran entrega real de contactos ni disponibilidad de fuentes externas.

La falta de métricas no bloqueó la implementación ni se volvió a investigar. No se reconstruyeron protocolos, no se activó AI Lab y no se atribuyen visitas, posiciones, citas o conversiones a cambios no publicados.
