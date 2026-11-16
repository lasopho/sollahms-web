> Actualización del 16/11/2026, 10:52 Santiago: el propietario autorizó expresamente la publicación de Contacto. Se creó el Production aislado `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`, que aprobó el [gate productivo](production-release-20261116/production-gate.json), sus 1.660 fuentes, siete funciones, 32 controles HTTP y cinco anchos. La promoción y comprobación pública están en curso; ambos dominios se conservan en ByUhr hasta completar ese paso. La autorización y evidencias nuevas están en `production-release-20261116/`. El texto siguiente conserva el cierre de la fase Preview, anterior a esta autorización.

# Contacto conciliado y verificado en Preview privada

**Preparación completada el 16/11/2026, America/Santiago.** El pie corporativo de PR #26 y la corrección del selector de PR #28 están integrados sobre los bytes productivos de ByUhr. La [Preview privada de Contacto](https://project-wrapp-cyqjausfq-lsandoval2-8260s-projects.vercel.app/contacto.html) está READY y conserva SSO. La etapa productiva queda separada y pendiente de autorización expresa para Contacto.

- Preview nueva: `dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh`, creada a las 09:43:39 Santiago.
- Producción conservada: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`; ambos dominios siguen asignados a ella.
- [PR #29 de integración](https://github.com/lasopho/sollahms-web/pull/29): abierto en Draft sobre `codex/eliminar-recorridos-global-20261115`, sin fusionar #27.
- Rama nueva: `codex/contacto-baseline-productivo-20261116`, checkout independiente `/private/tmp/sollahms-contacto-baseline-20261116`.

## Conciliación y preservación

Se verificaron los HEAD remotos y estados de PR #26 (`055787d`), #28 (`967d556`), #27 (`98ba61d`) y #25 (`f4249e9`). No había commits posteriores a esos puntos. #25 es la rama hermana de cobertura territorial; se conserva separada y no se incorporó. No se integraron ramas antiguas completas ni se utilizó `main` para reconstruir el sitio. [Conciliación](CONCILIACION.md), [registro de coordinación](coordination.json).

El SHA declarado por ByUhr, confirmado en GitHub y Vercel, es `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`; las referencias discrepantes del encargo se conservaron como antecedentes. La aprobación `7ebad405d403f62306039b08193a58b35bef8bfc` y el cierre `98ba61d103059ab488cb85216c9bc95214aee82a` permanecen en el historial. [Identidad comprobada](baseline-live.json).

| Elemento | Resultado |
| --- | --- |
| Artefacto completo | 1.660 rutas; un cambio en `static/contacto.html` y 1.659 archivos idénticos a ByUhr |
| Páginas y fichas | 147 HTML; las 131 fichas permanecen idénticas |
| Recorridos | Conservadas las 66 rutas aprobadas, incluidos 64 HTML y dos CSS; ninguna restauración |
| Funciones/config | Siete bundles, 57 archivos y config v3 idénticos |
| Contacto aprobado | 18.655 bytes; SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1` |
| Contratos estáticos | 20 comprobaciones aprobadas: encabezado, main, formulario, scripts, metas, JSON-LD, canonical, campos, consentimiento y RUT |

Inventario del candidato: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`. El baseline recuperado conserva el inventario `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. Se reutilizaron bytes existentes comprobados por tamaño/SHA1/SHA256 y vinculados al árbol actual de ByUhr: 1.594 archivos del source cache y 66 del mapa documentado. Cero cuerpos descargados y cero builders, generadores o eliminación repetida. [Recuperación](recovery/README.md), [manifiesto completo](candidate-manifest.json), [archivos modificados](modified-files.json), [preservación](PRESERVACION.md).

El HTML es exactamente el aprobado en `967d556`; su integración queda en `e95357fffa031dce3ac29a254b49c02e240a997f`. `a1f2930475e23ebb87bac1f8443877b06883fe60`, declarado por la Preview, añade únicamente en `vercel.json` el bloqueo de despliegue automático de la rama nueva. Los ajustes de otras ramas y el config efectivo desplegado no cambian. El resto de los commits de esta etapa documenta el resultado; su HEAD final se obtiene del historial del informe.

## QA específico del candidato

Los cinco anchos **1440, 1024, 768, 390 y 320 px** completan el QA de Contacto: encabezado y navegación, pie de tres/una columnas, selector completo, indicador nativo a 320, cuatro campos visibles/obligatorios, validaciones vacías, RUT inválido/válido, consentimiento, WhatsApp directo, recursos, consola y ausencia de overflow. Se conservaron 15 capturas y se inspeccionaron visualmente las cinco páginas; los recortes de selector 320 y pies 320/1440 también se revisaron a resolución original. [QA y fases](qa/README.md), [revisión visual](visual-review.json).

La selección por teclado se comprobó mediante búsqueda por letra, Tab al summary opcional y al consentimiento, y retorno con Shift+Tab. No se certifica una selección por ArrowDown/Home que el harness había supuesto. Un diagnóstico con Enter produjo **un evento DOM vacío**, detenido por la validación del cliente: cero POST, solicitudes comerciales, leads, correos o reservas. El resumen conserva ese evento aunque el agregado del intento crudo inicial quedó en cero por una aserción anticipada. Las fases aceptadas tienen cero eventos submit y todos los datos sintéticos se limpiaron.

También se corrigió la secuencia del harness que limpiaba RUT antes de pulsar consentimiento: el blur del campo vacío cambiaba la geometría durante el clic. La prueba final verifica RUT inválido/válido, deja estabilizar la interfaz, comprueba el consentimiento y limpia al finalizar. Se repitieron únicamente las interacciones pendientes; las capturas y la geometría ya aceptadas permanecieron intactas. No se cambió el producto para adaptar las pruebas.

La verificación remota aprobó **1.660 rutas/SHA1 y 32/32 casos HTTP**: Contacto 200, once recursos locales, portada, seis fichas, siete funciones con métodos seguros, fuentes internas denegadas y Patio Brasil 410. No se repitieron los 524 controles ni las 1.485 rutas históricas: las otras 1.659 entradas siguen idénticas. La preservación del backend no se presenta como una prueba de entrega real a CRM 360 o Resend. [Verificación API/HTTP](verification/README.md).

Los nueve HTML medidos conservan el source completo como prefijo exacto y únicamente agregan un script de toolbar de Vercel de 163 bytes, firma observada `8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc`. Se clasificó esa firma exacta sobre los cuerpos guardados, sin modificar aplicación, respuestas ni configuración. No se aceptó HTML arbitrario ni se repitió la pasada HTTP. El QA bloqueó deliberadamente esa toolbar; sus avisos se distinguen de errores JavaScript de aplicación. [Diagnóstico de entrega](verification/html-injection-diagnostic.json).

## Privacidad, límites y continuidad

SSO permanece `all_except_custom_domains`; el acceso anónimo confirma 302 hacia `vercel.com` con TLS válido. No se cambiaron dominios, credenciales, variables, proveedores ni protecciones. La CLI rechazó un primer intento con `--skip-domain`, opción exclusiva de Production; el modo dry y la API confirmaron cero deployments antes de corregir esa opción. Se creó una única Preview, sin crear ni promover Production. [Creación](preview-created.json), [trazabilidad de intentos](preview-attempts.json).

Node 24.22.3, Vercel CLI 65.16.0 e identidad autenticada fueron comprobados. Los procesos y perfiles propios se cerraron; no se alteraron los checkouts de Documents o Projects. Los PR #26/#28/#27 continúan abiertos en Draft y su historia queda intacta; #25 tampoco se modificó.

El candidato queda preparado para revisión y una etapa productiva posterior con autorización propia. [Gate de cierre](preview-approval.json), [siguiente prompt completo de publicación](SIGUIENTE-PROMPT-PUBLICACION.md), [continuidad](../../NEXT-PROMPT.md).
