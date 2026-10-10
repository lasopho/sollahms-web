# Sollahms — integración financiera lista para revisión

Fecha de QA: 10 de octubre de 2026. Rama independiente: `codex/integracion-financiera-sollahms`.

## Preview y alcance

[Preview protegida del catálogo](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/proyectos.html). [Comparador integrado](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/comparador-hipotecario.html).

La primera Preview auditada fue `dpl_AmM8myg6tnH3rv2qQXxmY8trV8is`, commit `9b3d6e2a006890a8a63f6e7f6d0aa98e5f29b11c`, URL inmutable `https://project-wrapp-jeg9t29ud-lsandoval2-8260s-projects.vercel.app`. El cierre añade evidencia, correcciones documentales, compatibilidad del Host del servidor QA local y elimina los valores de demostración del HTML inicial del simulador: no aparece un precio de ejemplo mientras se verifica un proyecto. La revisión intermedia `54f932f` se comprobó READY, con 148 fichas, Mapocho sin precio y la protección vigente. En esa comprobación final se detectó además que la tarjeta fija destacada podía dejar el tercer botón fuera de una pantalla de escritorio baja; se corrige con altura máxima y desplazamiento interno sólo desde 1024 px. El último SHA y su despliegue READY se contrastan con Vercel en la entrega final; la URL de rama conduce a esa revisión.

La protección existente de Vercel sigue habilitada (`all_except_custom_domains`). No se crean accesos de bypass ni se cambian permisos. Las páginas Preview tienen `noindex, nofollow`; los formularios avisan y el backend rechaza envíos reales en Preview. El build publica 155 HTML, assets, sitemap y sólo los JSON `proyectos` e `hipotecario`. Fuentes de investigación, tests, documentos, lib, API y secretos no se copian al directorio público.

La integración conserva los historiales de fichas `bd42519dd4a1997af6c5b24dfcf67f1622197110` y comparador `fb018398a28949a028c807d9a809f16d37aa0fde` mediante un commit de dos padres. [Resolución individual de conflictos](integracion-financiera-avance.md). Main conserva `69eb89524d38071a5b5df6a032e105f0aa958d87`; Production conserva `dpl_B2yGdPCsFsg9fdHdVUBYF9j6qwsF`. No se fusiona ni publica allí ni se alteran las ramas de origen.

## Funciones y procedencia

- **148 fichas integradas**: una acción “Simular crédito hipotecario” por ficha, con slug confiable. Consultar proyecto y Agendar Asesoría conservan sus enlaces y contexto. No se pasan nombres o precios por parámetros manipulables de URL.
- **115 precios desde precargables, 33 pendientes**: fecha, campo contrastado y fuente oficial HTTPS son obligatorios; una revisión futura o de más de 30 días no se usa como vigente. El precio desde no representa una cotización de una unidad. Modificarlo identifica valor del visitante. Sin precio oficial, el campo queda vacío.
- **Comparador existente reutilizado**: mismo motor, reglas, ofertas y fechas bancarias originales. CMF sólo aplica al escenario exacto y geografía/tipo de activo compatibles. Cambiar precio, pie, plazo o ubicación retira la selección y tasa bancaria. Comercial y Terreno admiten exploración manual sin atribuirles referencias de vivienda CMF.
- **Buscador opcional**: renta individual/complementada, deudas, criterios 25%/30%, plazo 5–40 años, pie 5–90%, ahorro UF/CLP, aporte mensual y horizonte 0–600 meses. Conserva búsqueda, región, comuna, estado, tipo, precio máximo y ordenamientos existentes. A–E separa suficiencia de pie y presupuesto; E sigue visible. Un filtro ordinario de precio máximo sí excluye precios desconocidos porque el visitante lo selecciona explícitamente.
- **Privacidad**: renta, ahorro y deudas se calculan sólo en memoria. La transición explícita guarda por cinco minutos exclusivamente proyecto/monto/pie/plazo/tasa/convención/origen, sin identidad o capacidad personal; se consume una vez y se elimina incluso si no pasa la validación. Contacto requiere consentimiento, conserva el escenario y el servidor deriva contexto, procedencia y recálculo. RUT opcional conserva su tratamiento: validación propia y exclusión del proveedor externo.
- **Facilidades de pie**: modelo por campo/fuente/fecha preparado. No se rellenan condiciones sin evidencia; las entregas verificadas del catálogo original se conservan.

## Pruebas automatizadas repetidas después del último ajuste

```sh
node --test tests/*.test.mjs tests/booking-project-context.mjs tests/form-regression.mjs tests/rut*.mjs tests/integration-*.mjs
python3 tests/validate-project-details.py
python3 tests/validate-final-adjustments.py
python3 tests/validate-financial-integration.py
VERCEL_ENV=preview VERCEL_GIT_COMMIT_REF=codex/integracion-financiera-sollahms node scripts/package-vercel.mjs
```

**136 pruebas, 136 aprobadas, cero fallas, cero omitidas.** Incluyen los 148 contextos, 115/33 precios, caducidad, extremos/entradas inválidas, complementación/deudas, criterios, ahorro/horizontes, conversión, A–E, amortización independiente, tasa cero/ausente, CMF exacta, activos/geografía, transición temporal, almacenamiento bloqueado, cancelación asincrónica y limpieza, consentimiento, recálculo de API, RUT, duplicados y fallos/aceptación del proveedor. Las pruebas usan proveedores simulados, sin correos ni reservas reales.

Los tres validadores Python pasan: 148 páginas y CTAs; 3.137 enlaces internos; los otros contenidos de las 148 fichas permanecen idénticos a la base salvo cuatro enlaces CSS de sus botones; 137 mapas, 98 instancias de recorridos y 633 elementos de imagen conservados. Los 509 archivos de assets originales —496 fotografías— mantienen sus hashes. Navegación de escritorio/móvil contrastada en 154 páginas públicas; 153 destinos originales más comparador en sitemap. Datos comerciales, investigación, agenda y tratamiento del RUT conservados.

Build aprobado: 155 HTML con noindex y dos JSON públicos, sin exposición de rutas privadas.

## Navegador y dispositivos

La navegación real en la Preview auditó **las 148 fichas a 390 píxeles**, no sólo una muestra: enlace de simulación y contexto correctos, consulta/agenda presentes, controles táctiles, ninguna imagen local cargada rota ni desbordamiento horizontal. [Registro por ficha](qa/integracion-fichas-movil.json).

Se verificaron catálogo y comparador a **320, 375, 768 y 1280 píxeles**, además del catálogo financiero y fichas a 390. Una, dos y tres columnas según tamaño, sin desbordamiento; campos con altura táctil de 48 px. [Registro responsive](qa/integracion-responsive.json), [catálogo móvil](qa/integracion-catalogo-movil.png), [buscador escritorio](qa/integracion-buscador-escritorio.png), [comparador tablet](qa/integracion-comparador-tablet.png). Se mantuvieron verde `#003229`, dorado `#E9C176`, navegación de tres enlaces/agenda y cabecera ASSET PORTAFOLIO/Catálogo inmobiliario.

La comprobación final a **1280 × 720** encontró y corrigió la altura de las tarjetas fijas de las cuatro destacadas. Ahora su contenido admite desplazamiento dentro de la pantalla y el acceso por teclado desplaza el control enfocado. Las cuatro acciones de simulación navegan correctamente y cargan los precios oficiales: Distrito Centro 2.715, Suecia 8.247, INN Puerto Chico 9.816 y Plaza Las Condes 8.858 UF; B.COME estándar 2.490 UF también pasa. El botón enfocado de Distrito termina a 656 px y la tarjeta a 704 px dentro de una ventana de 720 px. [Prueba por ficha](qa/integracion-tarjetas-escritorio.json), [captura de la tarjeta](qa/integracion-tarjeta-destacada-escritorio.png). La regla CSS nueva no aplica debajo de 1024 px, preservando el comportamiento móvil ya comprobado.

Flujos observados:

| Flujo | Resultado |
|---|---|
| Catálogo normal y orden UF | 148 visibles; 115 precios ordenados correctamente ascendente/descendente y 33 pendientes. |
| Precio máximo 3.000 UF / comercial | 71 / 3 resultados, iguales al catálogo fuente; limpiar vuelve a 148. |
| Buscador y filtros existentes | Clasifica 148; filtro Ñuble conserva resultados y muestra Distrito Centro. |
| Distrito: renta/ahorro | Casos A, B, C y D comprobados cambiando ambos parámetros; complemento, deudas y ahorro CLP comprobados. |
| Proyecto sin precio | Mapocho Edificio A sigue visible como E; Abrir simulador conserva identidad y solicita valor manual vacío. |
| Simular este escenario | Distrito Centro conserva 2.715 UF, pie 20%, plazo 20 años y tasa manual 4,5%; vuelta a ficha y agenda conservan slug. |
| CMF | Escenario 4.000 UF/pie 25%/20 años/Santiago muestra tres referencias; seleccionar Scotia y cambiar a 30 años deja tasa vacía y cero referencias. |
| Contacto hipotecario | Checkbox sin consentir bloquea envío; con consentimiento y espera válida devuelve éxito sólo con proveedor simulado. |
| Agenda | Disponibilidad y reserva ficticia del 14/10/2026 11:00 completadas con contexto Distrito Centro; no se crea evento real. |
| Errores / duplicados | API y frontend probados con mocks: Preview 503, conflicto, proveedor no disponible, consentimiento, reintentos y bloqueo durante envío. |
| Mapa y Matterport | Independencia 4745: mapa por dirección verificada cargado; Matterport original renderiza escena y cambio a Dollhouse. |
| Otro recorrido | Piloto 305 B.COME de Rito3D renderiza panorama original en ficha móvil. |
| Consola | Sin errores observados en catálogo, comparador y la muestra de recorridos al cierre. |

[Evidencia de flujos](qa/integracion-flujos-navegador.json), [contadores locales](qa/integracion-formularios-local.json), [Matterport](qa/integracion-matterport-movil.png), [Rito3D](qa/integracion-rito3d-movil.png). Servidor QA aislado: 1 contacto, 1 disponibilidad, 1 reserva, 3 llamadas al proveedor simulado y **cero solicitudes externas**. El ajuste de Host localhost del servidor de pruebas conserva la validación de origen del backend; no debilita esa regla.

Las 98 integraciones y sus fuentes permanecen intactas. Esta integración reabre dos proveedores y un mapa, además de la revisión de todas las fichas y la evidencia histórica completa; **no se afirma una nueva exploración exhaustiva de cada habitación de los 98 visores ni una prueba física en todos los teléfonos**. Los dos visores ya pendientes (Endémico general y Vista Bulnes Sentiovr) mantienen aviso/enlace y no se presentan como disponibles.

## Contraste financiero y rendimiento

[Fuentes oficiales y supuestos](integracion-fuentes-financieras-2026-10-10.md). UF SII del 10/10/2026: **$41.136,24**. Simulación manual ilustrativa, sin oferta bancaria: propiedad 4.000 UF, pie 800 UF / $32.908.992, capital 3.200 UF, 20 años y tasa anual efectiva 4,5%. Motor **20,089257090229005 UF / $826.396,50**; amortización independiente **20,089257090229125 UF**, diferencia 1,21×10⁻¹³ UF. La interfaz redondea a 20,09 UF / $826.397.

Benchmark del cálculo de las 148 propiedades: cinco rondas de preparación y 100 mediciones, **p50 9,659 ms**, **p95 14,204 ms**, máximo 23,365 ms. Fixture renta $3.500.000, ahorro 800 UF, pie 20%, 20 años y tasa manual 4,5%: A105/B2/C0/D8/E33. [Muestras y cálculo](qa/integracion-performance.json).

En la interacción automatizada móvil de 375 píxeles, evaluar y renderizar tomó 446 ms de tiempo de pared incluyendo automatización. **No es una medición de CPU móvil, Lighthouse ni Core Web Vitals**. No se evalúa red real de cada teléfono o carga de todos los proveedores externos; los visores se cargan a petición del visitante.

## Correcciones y límites pendientes

Se corrigieron la presentación exacta de la UF, respuestas tardías tras limpiar/editar búsqueda, eliminación de escenarios anteriores, clasificación ante UF caducada, procedencia al editar precio, selección bancaria fuera de escenario/geografía/activo, integración/recálculo/consentimiento de contacto, carga inicial sin precio de ejemplo y acceso al tercer botón en tarjetas destacadas de escritorio bajo. Las suites y validadores se repitieron con resultado aprobado.

Límites para revisión:

1. **UF diaria**: esta revisión contiene UF oficial del 10/10/2026. El siguiente día necesita actualización oficial; mientras tanto, el buscador queda pendiente y no muestra conversiones CLP actuales. Un archivo ausente/inválido bloquea evaluación y permite reintento. No se añadió una fuente automática con credenciales ni servicios pagados.
2. **Referencias bancarias**: sus fechas originales no se renuevan. Scotia vence por antigüedad interna el 11/10. La fuente detallada CMF no pudo reabrirse hoy; se conserva evidencia del 09/10 y alcance exacto. Otras comunas metropolitanas quedan geográficamente pendientes para CMF hasta confirmar su alcance. Ningún precio vigente del catálogo coincide exactamente con 4.000 UF.
3. **Datos comerciales originales**: 33 precios, 52 fechas/condiciones de entrega, 9 direcciones y 8 portadas siguen pendientes. Hay 137 mapas y 11 ubicaciones sin mapa, 18 proyectos Matterport y 62 con experiencias oficiales. Las cuatro identidades de etapa pendientes son Mapocho Edificio A, Froilán Norte, Froilán Sur y Lomas de Puyai 3. El registro original conserva superficies y demás campos pendientes por proyecto.
4. **Seguros, gastos, pie y elegibilidad**: se muestran sólo datos verificados; una categoría no es aprobación. El nuevo modelo de facilidades del pie no acredita ofertas comerciales. Se conserva RUT sin enviarlo a terceros.
5. **Servicios reales**: Preview no envía correos ni reserva llamadas. Éxito real de Resend/calendario y aprobación bancaria no se validaron ni se declaran completados mediante esta entrega.

Se entrega esta Preview para revisión humana. **No se hace merge a main, no se despliega en Production y no se contratan servicios.**
