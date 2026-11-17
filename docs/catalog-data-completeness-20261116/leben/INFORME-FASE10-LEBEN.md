# Fase 10 — filtros comerciales locales por referencia

Corte: 17/11/2026, America/Santiago. Repositorio `lasopho/sollahms-web`. No se recibió evidencia inmobiliaria nueva ni se cerraron campos documentales.

## Resultado

Se preparó una implementación local funcional sobre la producción verificada, con motor puro por referencia, adaptación de la evidencia Leben, controles integrados y presentación coherente en tarjetas, listado y mapa. El modo predeterminado conserva los datos publicados. El modo explícito «Referencias Leben · 16 nov 2026» utiliza la evidencia preparada de doce proyectos y conserva los datos publicados de los demás. Own permanece en la entrada y se excluye de la oferta preparada por la declaración F049 de vendido.

La autorización del encargo cubre preparar y probar una implementación local aislada. No se creó PR, deployment, publicación, promoción o merge. No se modificó main. La rama técnica permanece local. La rama de auditoría recibe únicamente documentación y un parche de revisión bajo `docs/`.

## Bases e inventarios comprobados

- Auditoría local/remota inicial: `aec138b70c6c620477a7b12c54941633f88e90da`, rama `codex/auditoria-leben-20261116`.
- Producción resuelta por el dominio Sollahms: deployment `dpl_9b2Fp33LqsL5NuB2p7JLdxx9t9gu`, READY/production, commit `b761ddeaea2fa526870e6af25658046e31b571d7`, rama `codex/footer-sin-frase-20261116`. No se usó main como sustituto de producción.
- Main remoto verificado: `86e200ec191b38af355061e21bc0fc1e549cce3b`.
- Checkout técnico: `/private/tmp/sollahms-filtros-comerciales-fase10-20261117`, rama `codex/filtros-comerciales-fase10-20261117`. Commit final en `CANDIDATO-TECNICO.json`.
- Producción actual: 131 proyectos. Aplicación conservada en la rama de auditoría: 137. Los seis exclusivos de esa aplicación anterior son `atelier-prat-oficinas`, `box-santiago`, `corrientes-oficinas`, `la-casona-de-buin`, `patio-brasil` y `urbano-centro`. No se trasladó ninguno al candidato.
- La matriz histórica auditada de 131 tampoco es idéntica a producción: contiene Patio Brasil y no Vergara Domeyko; producción contiene Vergara Domeyko y no Patio Brasil. Se preservan los dos universos. Patio Brasil conserva su retiro productivo.

## Diagnóstico corregido

El informe F9 describía correctamente el árbol de aplicación de su rama, con filtros básicos. La producción posterior ya tiene filtros avanzados. No se reemplazó esa arquitectura por el HTML antiguo.

| Control | Producción examinada | Ajuste local F10 |
|---|---|---|
| Texto, ubicación, estado, precio, tipo de activo | Existentes | Se conservan; se corrige correlación con referencias |
| Tipo de propiedad, dormitorios, baños | Existentes | Baños pasa a principales; desconocidos no coinciden por defecto |
| Superficies | Existentes, con métrica útil predeterminada | Elección explícita útil/total; un enlace antiguo con otra métrica conserva el rango y exige selección visible, sin convertir superficies |
| Entrega, amenities, rasgos, inmobiliaria | Existentes | En Más filtros; sin materiales o terminaciones decorativas |
| Estacionamiento y bodega | Sin controles de alcance comercial separados | Adicional general, incluido y disponibilidad por unidad son predicados distintos |
| Metro, modalidades legales y cuatro vistas | Existentes | Se preservan; no se presta elegibilidad legal histórica al modo preparado |
| Fuente de referencias | Sin capa F9 local | Selector publicado/preparado con fecha y recuperación ante fallo |

El caso residual de clasificación estaba en `variantFits`: la negación «no es local/oficina/terreno» aceptaba un tipo ausente como residencial. La corrección exige una propiedad residencial explícita. El guardado superior de tipos ya evitaba algunos casos, pero no justificaba conservar esa coincidencia en variantes mixtas. `null`, `undefined`, cadenas y cero se tratan según su significado, sin convertir faltantes en cero. Dormitorios cero sigue siendo un filtro activo válido.

## Reglas y evidencia

Cada consulta de precio, propiedad, D/B, superficie y rasgos privados necesita un único testigo compatible. Una cotización no toma la superficie de un plano distinto, ni una etapa toma el estado o entrega de otra. La superficie está separada por rótulo. Las máscaras de discrepancia afectan sólo al atributo cuestionado y mantienen los demás.

Se conservan 330 referencias UI, 104 planos y 20 cotizaciones: 454 referencias documentales, nunca 454 unidades disponibles. Dos adicionales de Suecia quedan separados del precio del inmueble. La proyección añade 16 referencias administrativas de existencia de tipos explícitos, identificadas `project-fact`; no son recepciones, cotizaciones, modelos nuevos ni stock y no prestan tipo a otra referencia.

Los false de catálogo propuestos por omisión de brochure se mantienen como contexto, pero se consultan como desconocidos de ausencia física. Amenities residenciales no se atribuyen a locales sin alcance explícito. Estacionamiento/bodega adicionales no prueban inclusión o disponibilidad por unidad.

En datos publicados se conservan importes y políticas vigentes, incluidas las ofertas y etapas existentes. Al activar precio junto con un atributo de opción se exige su vínculo explícito; ciertas coincidencias anteriores desaparecen porque carecían de esa asociación. La prueba León que antes aceptaba combinar precio 2D con baños/total de otro plano ahora exige cero; D/B/total sin precio conserva su coincidencia válida.

## Cobertura documental y funcional

| Consulta respaldada por una misma referencia | Proyectos de los doce |
|---|---:|
| Precio | 10 |
| Precio + dormitorios | 10 |
| Precio + dormitorios + baños | 5 |
| D/B + útil + total | 2 |
| D/B + total | 5 |
| Precio + útil / precio + total | 0 / 0 |
| Tipo detallado + precio | 3 |
| Piscina + gimnasio, ambos | 8 |
| Oferta adicional general de estacionamiento | 10 |
| Disponibilidad de estacionamiento por unidad | 0 |

Estos conteos se ejecutaron con el evaluador real, no con una unión de atributos a nivel de proyecto. `COBERTURA-FUNCIONAL.json` conserva consultas y testigos. La API permite comprobar útil y total simultáneamente para las regresiones documentales; la interfaz ofrece una métrica por consulta. No se afirma que cualquier combinación esté cubierta en todos los proyectos.

La ejecución local agrega capacidad de búsqueda y no publica la evidencia F049. Una tarjeta preparada presenta el precio y los hechos de un mismo testigo, su clase de fuente y fecha, y disponibilidad por confirmar. Si el testigo es un plano sin precio, muestra «Precio de esta referencia por confirmar». La búsqueda financiera se conserva en datos publicados; se oculta en modo preparado para no evaluar una referencia con el precio publicado de otra. Sus módulos y fórmulas permanecen intactos.

Saldo documental: **313 pendientes históricos, cero cierres nuevos**. No se generaron IDs de recepción, hechos o resoluciones F6. Continúan vigentes las parcialidades y discrepancias F9; no se reabrieron solicitudes del propietario ni se consultó Iris de nuevo.

## Verificación

- **84/84 pruebas Node**: 32 escenarios F9, 20 regresiones del motor, 14 del adaptador, 3 de presentación, 10 de filtros existentes y cinco suites comerciales/Metro. Las suites incluyen sus comprobaciones internas; no se suman dos veces al total.
- **16/16 comprobaciones Chrome**: resultados y anchos finales en `PRUEBAS-NAVEGADOR.json`. Verificados 1440, 1024, 768, 390 y 320 px sin desbordamiento; tarjetas/listado/mapa/split, URL, chips, reinicio, desconocidos, mixtos, foco, error de fuente y referencias sin precio. Se probaron las fuentes tipográficas oficiales con GET estáticos permitidos.
- El mapa usa la biblioteca productiva existente. Teselas externas y API UF se bloquearon en QA; no se certifican servicios remotos, cálculo financiero, cotizaciones, reservas o disponibilidad. No hubo envíos ni solicitudes de escritura.
- SHA-256 de 155 archivos protegidos coincide con producción: las 131 fichas, catálogo central y facetas, marca, tema, animación, módulos financieros/contacto y páginas corporativas incluidas. Los demás árboles protegidos no tienen diff. Se comprobaron las 19 fuentes canónicas del manifiesto F9 sin diferencias.
- No se ejecutaron generadores de aplicación. La configuración de deployments de la auditoría conserva `false`; no se cambió configuración de producción. El checkout original con cambios ajenos no fue utilizado para editar.

## Inventario y reproducción

Quince archivos del candidato: siete ajustes de interfaz/integración (`proyectos.html`, CSS de filtros, controles, engine vigente, catálogo, modelo y mapa), dos módulos nuevos (evaluador y adaptador), un JSON de evidencia preparada, cuatro archivos nuevos de pruebas y la actualización de la expectativa León. Listado y hashes exactos en `CANDIDATO-TECNICO.json`.

`IMPLEMENTACION-LOCAL.patch` contiene únicamente ese diff contra producción. Es un artefacto de revisión documental; ningún archivo de aplicación de la auditoría cambia. Su aplicación inversa fue comprobada contra el candidato. Para restaurarlo en otro checkout limpio de la base verificada: `git apply --check RUTA/IMPLEMENTACION-LOCAL.patch` y después aplicar el parche. No aplicarlo sobre la rama documental o sobre producción.

Pruebas desde el checkout técnico, Node 24:

```sh
node --test tests/commercial-filter-data.test.mjs tests/commercial-filter-engine.test.mjs tests/commercial-filter-presentation.test.mjs tests/catalog-filters.test.mjs tests/metro.test.mjs tests/ecasa-commercial.test.mjs tests/aj-commercial.test.mjs tests/sento-commercial.test.mjs tests/leon-commercial.test.mjs
```

Para navegador: servidor estático sólo localhost, Playwright y Chrome; ejecutar `node tests/commercial-filter-browser.mjs`. Admite `F10_BASE_URL`, `F10_CHROME_PATH` y `F10_BROWSER_OUTPUT`. La cobertura se reproduce con `verificar-cobertura.mjs`, variables `F10_TECH_CHECKOUT`, `F10_AUDIT_CHECKOUT` y `F10_COVERAGE_OUTPUT`. Los logs, testigos, capturas y manifiesto permiten revisar el resultado sin repetir Iris o fases documentales.

## PR posterior

El candidato queda preparado para revisión, sin PR creado. Antes de llevarlo a GitHub como rama técnica, se debe autorizar ese paso y garantizar su exclusión de deployments. Revisar por separado la corrección de falsos positivos y la exposición de la capa preparada F049; el permiso de pruebas locales no publica precios. Conservar las políticas comerciales verificadas, las fichas y todos los servicios protegidos. Revalidar producción y resolver sólo cambios reales posteriores; no repetir la auditoría ni iniciar Euro. Ajustar los identificadores de caché y el empaquetado de un futuro release únicamente dentro de un alcance aprobado.

El manual Iris no cambia: no se navegó ni se descubrieron secciones nuevas. La continuidad real queda en `SIGUIENTE-PROMPT.md` y en el `NEXT-PROMPT.md` raíz.
