# Preservación estática de Contacto sobre ByUhr

**PASS: un cambio de runtime y 1.659 entradas idénticas.** La revisión reutiliza los inventarios certificados y comprueba localmente los contratos del HTML. No ejecuta el preparador, builders, pruebas históricas de 202 casos, la matriz de 524 controles ni solicitudes a proveedores. El QA de navegador y la verificación remota se documentan por separado.

## Identidades y alcance

| Referencia | Identidad |
| --- | --- |
| Baseline publicado | `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5` |
| Runtime del baseline | `c97bfa5aba80329f18e3db8058ec5c3fada80cc4` |
| Fuente aprobada de Contacto | `967d556730e20ef86bae6ecee11ec6152434c8ae` |
| Commit del HTML conciliado | `e95357fffa031dce3ac29a254b49c02e240a997f` |
| Commit de control de autodeploy | `a1f2930475e23ebb87bac1f8443877b06883fe60` |
| Rama independiente | `codex/contacto-baseline-productivo-20261116` |

Inventario canónico de ByUhr: `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. Inventario candidato: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`. Son hashes de inventarios; no son SHAs de commits ni digests de ZIPs Lambda.

Los dos inventarios contienen las mismas 1.660 rutas. Solo cambia `static/contacto.html`: 16.829 → 18.655 bytes. El candidato tiene SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1` y coincide byte por byte con el archivo de los tres commits de Contacto indicados. Los tamaños y hashes se cotejaron con el [contrato de fuente](contacto-source-contract.json), el [inventario recuperado](recovery/recovered-inventory.json) y el [manifiesto candidato](candidate-manifest.json).

## Contratos conservados

La comparación entre el HTML del output ByUhr y el del stage confirma igualdad literal en:

| Región | Cantidad conservada |
| --- | --- |
| Header / main / formulario | 1 / 1 / 1 |
| Scripts completos | 5 |
| Metas | 20 |
| Tags `link` del head | 9 |
| Opciones del selector | 4 |

El head vuelve a ser idéntico al retirar únicamente `style#contact-footer-style` y `style#contact-selector-responsive`. El cambio permitido sigue limitado al pie corporativo y esos dos estilos inline; no se integra la cobertura territorial del PR #25. Los enlaces modificados del footer forman parte de ese cambio aprobado: la igualdad de `link` de la tabla se refiere a los tags del head.

Los bloques JSON-LD permanecen iguales y se analizaron como JSON válido. El canonical conserva `https://sollahms.cl/contacto.html`; tampoco cambian las metas de SEO/GEO. Esta comprobación es de preservación técnica, sin optimización ni ampliación de contenido.

Los cuatro campos comerciales mantienen atributos, referencias y orden: Nombre completo, RUT, Correo electrónico y Teléfono. Siguen siendo obligatorios, al igual que el consentimiento, que no aparece premarcado. El formulario completo, sus opciones y las referencias de validación RUT son idénticos. `advisory.mjs`, `rut-field.mjs`, `commercial-fields.mjs` y `form-operation.mjs` conservan sus registros de tamaño/SHA.

## Runtime e integraciones

Las 57 entradas de las siete funciones conservan tamaño, SHA1 y SHA256 respecto de ByUhr, incluidas sus configuraciones, handlers y dependencias. Por tanto el código de integración y backend está preservado byte por byte en el artefacto; no se ejecutaron los handlers ni se probaron proveedores en esta revisión. No se afirma entrega real de CRM/Resend, equivalencia de valores secretos entre entornos ni identidad de ZIPs compilados opacos del proveedor.

Los 66 cambios publicados de Recorridos —64 HTML y dos CSS— siguen presentes con sus hashes posteriores a la eliminación. Se cotejó la lista histórica con ambos inventarios: ninguna de esas 66 rutas cambia en este candidato. También permanecen las versiones productivas conciliadas de `assets/js/urban-works-model.mjs`, `comparador-hipotecario.html` y `data/urban-development.json`. No se reconstruyó el sitio a partir de una rama histórica.

## Configuración y límites

La única diferencia de `vercel.json` frente a `98ba61d` es `git.deploymentEnabled["codex/contacto-baseline-productivo-20261116"] = false`. Al retirar esa entrada nueva, el objeto de configuración vuelve a ser idéntico. No se modifican sus demás propiedades ni las reglas existentes de otras ramas.

El `config.json` efectivo del output conserva sus 3.916 bytes y SHA256 `ef32ad5c7a069d7de482a7a92f5022a0c852cd0b9b896a735a48bd12bae71f05`. La preservación de ajustes remotos del proyecto corresponde a la evidencia del proceso principal/verificador; esta revisión no consultó ni actualizó project settings, variables o protecciones.

El alcance vigente sigue siendo una Preview privada y su documentación. Este resultado no autoriza Production, promoción, publicación, dominios ni merges. No se enviaron formularios ni se realizaron llamadas comerciales. No se modificaron otros checkouts, archivos de aplicación o el índice de Git para redactar este cierre.

Detalle reproducible de comparaciones, hashes por región, las 57 entradas de funciones, las 66 rutas retenidas y límites: [preservation.json](preservation.json). La identidad del baseline y la recuperación existente están en [recovery/recovery-report.json](recovery/recovery-report.json).
