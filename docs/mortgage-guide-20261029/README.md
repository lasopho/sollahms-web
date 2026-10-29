# Guía hipotecaria · 29-10-2026

Nueva página `/guia-hipotecaria.html`: doce módulos originales, diez términos desplegables, seis preguntas frecuentes, ejemplo en UF/CLP ilustrativos, beneficios fechados y trece referencias oficiales consultables. Mantiene verde, oro, Inter, Manrope y logo del sitio. No afiliación ni respaldo institucional de CMF.

## Componentes y mantenimiento

- `data/mortgage-guide-content.json`: contenidos originales, fuentes, fecha y bloque de beneficios. No tasas bancarias prefijadas.
- `scripts/build-mortgage-guide.py`: HTML estático semántico; contenido disponible sin JavaScript.
- `assets/css/mortgage-guide.css`: presentación responsive y movimiento reducido; simulador estático ante el efecto de scroll.
- `assets/js/mortgage-guide-engine.mjs`: cálculos y validación puros. Reutiliza conversión de tasa de `mortgage-engine.mjs`.
- `assets/js/mortgage-guide.mjs`: interacción, errores por campo, resultados y enlace al contacto existente. Sin almacenamiento, cookies, analítica de entradas ni envíos financieros.
- `official-uf.mjs` y `/api/uf`: servicio existente sin cambios. Fuente SII, sólo fecha vigente en Chile; actualización inicial, al regresar a la pestaña, manual y cada 15 minutos. Si falla, mantiene cálculos en UF y omite equivalencias en pesos.
- `scripts/guide_navigation.py` y `assets/css/guide-navigation.css`: enlace en los menús existentes y en los 140 footers previos, además de la guía; breakpoint de tablet para acomodar el cuarto enlace. Los errores 404/410 conservan su cabecera mínima. Integrado en generadores de marca y cabecera de fichas.

Para regenerar: editar datos revisados, ejecutar `python scripts/build-mortgage-guide.py` y luego `python scripts/package-mortgage-guide.py`. No ejecutar el empaquetado histórico para reconstruir funciones. Revisar fuentes cambiantes antes de publicar; en particular el reemplazo de DS 42 debe revisarse antes de 28-02-2027. No asumir vigencia a partir de la fecha de publicación de una norma.

## Simulador e integración

Cuotas mensuales constantes en UF por amortización francesa: capital×i/[1−(1+i)^−n]; a tasa 0, capital/n. Convención nominal anual/12 o efectiva anual convertida. Precio 100–1000000 UF, pie 0–100% o UF, financiamiento 0–100%, tasa 0–25%, plazo entero 1–40 años. Son límites de herramienta, no productos bancarios. No modela gracia, prepago ni evolución de tasas o UF.

Seguros y cargos mensuales ingresados se suponen constantes en UF. Campo vacío significa desconocido y no integra el subtotal; cero debe ingresarse expresamente. Separa dividendo base y con seguros. Informa capital, pie, intereses, suma de cuotas y subtotal/total modelado; no calcula CAE ni CTC contractual. Tabla anual con precisión interna completa, dos decimales visibles en UF y pesos enteros.

Ejemplo voluntario: 4000 UF, pie 20%, tasa nominal hipotética 4%,20 años ⇒ 19,3913705375814 UF/mes. El ejemplo escrito usa UF hipotética $40.000; el simulador convierte con UF oficial cuando está disponible. Ninguna tasa inicial se presenta como oferta.

Handoff desde fichas: `/guia-hipotecaria.html?proyecto=don-tomas#simulador`. Se acepta sólo un slug publicado y se lee el precio actual de `data/proyectos.json`; otros precios/parámetros se ignoran. El precio del catálogo es de lectura y puede desvincularse para un escenario propio. No modifica los datos comerciales. La asesoría recibe sólo el slug público verificado y conserva formulario, consentimiento, validación, destino e idempotencia actuales.

## Validación

- 34 pruebas vigentes aprobadas: matemática independiente, tres modos de pie, tasa nominal/efectiva/cero, amortización, costos desconocidos/cero, extremos e inválidos, slug malicioso/no publicado, UF actual/vencida y contacto obligatorio.
- Preservación automática: el contenido fuera de header/footer y enlace CSS de todas las páginas previas permanece byte a byte. Los131 cuerpos de fichas, precios, datos, APIs, comparador anterior, motion y formularios no cambian.
- El artefacto conserva exactamente funciones congeladas, configuración de rutas, retiro Patio Brasil 410 y sincronización de nueve registros comerciales. No nuevos endpoints ni proveedores.
- Navegador: 1440, 1024, 768, 390 y 320 px; sin desbordamiento horizontal de página. Acordeones por teclado, menú móvil/escape, enfoque de resultados, formatos decimales, error de tasa, ejemplo, seguros, fuentes visibles y UF oficial 41.237,01 del 29/10/2026.
- Ficha Don Tomás→guía conserva precio 2360,10 UF, tasa vacía y contacto asociado. Inicio→guía→asesoría conserva consentimiento y cuatro campos; sin envío real de leads.
- Nota de legado: `tests/advisory.test.mjs` conserva siete fallos idénticos en el baseline y esta rama porque prueba el flujo antiguo de email o teléfono sin los cuatro campos ahora exigidos. No se alteró esa suite ni el contrato actual. `required-commercial-fields.test.mjs` pasa sus cuatro pruebas con ambos handlers y transporte aislado. Detalles en los archivos de resultados.

## Publicación controlada

Baseline: `dpl_JAYMooKS6Sa8mSTjyPfbazAo6aqT`. Overlay congelado en `deployment-files.json` (1507 registros, 1503 archivos de artefacto). `main:false` y rama `codex/mortgage-guide-20261029:false`. No merge a main ni reconstrucción de funciones. La evidencia final de producción se agrega después del despliegue.


## Evidencia de publicación

Publicado en https://sollahms.cl/guia-hipotecaria.html. Deployment `dpl_3V498DSS6puAcpfmzGe9D3Rf17vH`, fuente `de743d3da7ebac242b1292e7aa75eee107b1b0c0`. El SHA256 final coincide entre preview y producción: `87b5d9fd19b52e4aed66cf2a54de2a045037aa9a7c7f7e4d46bcc58d2903f9c2`. Dominio, portada, ficha, datos y páginas de error comprobados; Patio Brasil conserva HTTP 410. Ver `production.json` y `guide-desktop.jpg`.
