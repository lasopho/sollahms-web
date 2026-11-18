# Continuar autónomamente el Asset Portafolio de Sollahms

Repositorio: lasopho/sollahms-web. Corte17/11/2026, America/Santiago. El objetivo de datos comerciales confiables y filtros para los131 proyectos sigue abierto. Continuar tareas autorizadas; no repetir auditorías ni certificaciones sin cambios o defectos nuevos.

## Estado y siguiente acción

El permiso AUTH-DEPLOYMENT-PR34-20261117-01 fue respondido «Autorizar deployment sin dominios» y ejecutado una sola vez con CLI oficial65.16.0 --prebuilt --environment production --skip-domain. No reutilizarlo ni solicitarlo otra vez.

Deployment creado:
dpl_B7PfYYNveGXD5pjns6sg6yAqMHL7
https://project-wrapp-8bwqnl4p5-lsandoval2-8260s-projects.vercel.app/proyectos.html
SHA36ef9d9baec37d92cdda8ac6acbcaf2cac959335, READY/production, cero aliases. Sus1672digests coinciden y tiene siete rutaslambda. No hubo build, promoción, asignación de dominios ni cambios enSSO/variables.

B7 está BLOQUEADO PARA PROMOCIÓN por un defecto descubierto en la revisión: ambos JSON públicos de cotizaciones recibieron302 y ERR_FAILED porque susfetch usan credentials:omit. La consulta DonPepe2D/UF3500–3600 devuelve0/131. Chrome tiene sesión activa y la navegación normal alJSON Euro muestra el archivo correcto. No se leyeron cabeceras de autenticación, cookies o tokens. La reproducción enfocada no tuvo truncamiento; la primera captura amplia sí y no permite certificar ausencia de errores. CDPNetwork/Runtime quedaron desactivados.

La corrección LOCAL ya está terminada:
- Rama codex/cotizaciones-mismo-origen-20261117.
- Checkout /private/tmp/sollahms-referencias-documentales-131-20261117.
- Commit9700d65fed15ee56584987573f1493b1fb52c9a4, padre36ef.
- Cinco archivos y árbol limpio. Push, PR35 Draft, Ready y merge autorizados expresamente y ejecutados; no repetir esos permisos.
- Sólo cambia credentials:omit a same-origin en dos cargadores de rutas públicas relativas; sus dos tests y exclusiónfalse de la rama completan el delta.
- Pins, allowlists, timeouts, redirect:error y rechazo sin fallback intactos. No hay lectura de credenciales ni cambios de seguridad.
- Reproducción roja:2fallos esperados. Verde:10/10 pruebas específicas de carga. Revisión independiente APROBADO PARA INTEGRACIÓN LOCAL, sin bloqueantes. Falta comprobar la corrección en un futuro deployment protegido autorizado.
- 155protegidos,21originales y dos proyecciones públicas intactos. Metro es preexistente por comparación literal de código/datos9e→36ef; no ampliar este delta ni afirmar nueva certificación dinámica de Metro.

PR35 https://github.com/lasopho/sollahms-web/pull/35 ya está cerrado/merged. Merge875bd80ddb650b376cb3dd53af4ffae066fcd48f, padres36ef/9700 y árbol06ba531790509767eea856b703160d02cbf5fa65 idéntico al candidato. Rama destino apunta875; fuente9700 conservada y main86 intacto. No hubo deployment porpush/PR/Ready/merge35. Cero checks/reviews consultados no equivale a aprobación. Próximo paso: solicitar permiso independiente para un único deployment NUEVO del paquete corregido, prebuiltproduction con skip-domain. Preparación exacta en preparacion-deployment-pr35/. Promoción/publicación exige permiso posterior propio. Consultar INTERVENCIONES-PROPIETARIO.json para no repetir preguntas.

## Documentación y pruebas

Rama documental codex/auditoria-leben-20261116, checkout /private/tmp/sollahms-auditoria-leben-20261116. Consultar HEAD local/remoto actual. Leer docs/objetivo-principal-asset-portafolio/CANDIDATO-CARGA-MISMO-ORIGEN.json, ESTADO-PR35.json, ESTADO-PR34.json, ESTADO-PUBLICACION.json, INTERVENCIONES-PROPIETARIO.json y CONTROL-DE-AVANCE.md.

Evidencia real del deployment y defecto: deployment-pr34-20261117/. Cotejo completo por CLI GET porque el conector devolvía listado parcial; no interpretar omisiones del listado como archivos faltantes. Sólo se conservaron dominios, deploymentIDs y redirects del cotejo de aliases; metadatos de acceso innecesarios no se usaron ni se incorporaron a los archivos.

Corrección, logs rojo/verde, recibo y parche exacto: correccion-carga-mismo-origen-20261117/. Recibo SHA11666a33e033a8081933a71da6e7aa8563837213d738f00bc2fcee8f3f5578a2. No sumar los10selectivos a las49Euro/19Nollagam/23integración/7Chrome anteriores; esos resultados son históricos y no se reejecutaron para este defecto. No ejecutar suites generales ni generar builds.

El paquete B7 /private/tmp/sollahms-proyecciones-publicas-release-20261117 permanece inmutable, inventario31eee39b568fa35a32cbab1dfe1ace80ac8b1d1ac1486d0456f1e98cde6f9b19. No promoverlo. El nuevo paquete /private/tmp/sollahms-cotizaciones-mismo-origen-release-20261117 está preparado y vinculado al merge875, inventario ded2e412ecdca2087562c8fdb44533073dc6b740430089eba341804d6d382834. Tiene1672archivos: sólo los dos cargadores difieren deB7;1670idénticos,131fichas/57archivos de7funciones/config/410 y2JSON preservados. Sus recibos están en correccion-carga-mismo-origen-20261117/paquete/. No tuvo build, Chrome ni deployment. No alterar los recibos/QA originales.

NUNCA desplegar /private/tmp/sollahms-pr33-release-20261117: conserva losJSONraw con historial interno y está en cuarentena. No llegó a producción.

## Producción, datos y límites

Producción permanece9e8212264e0bac24f392d8340d6e55eabb17499a, dpl_Gm75zZeuxYTqfnrJdHcKREqoQUUQ, READY en https://sollahms.cl. Cuatro aliases permanecen enGm75: sollahms.cl, www.sollahms.cl, sollhams.cl y project-wrapp.vercel.app. Main86e200ec191b38af355061e21bc0fc1e549cce3b intacto.

PR34 ya está cerrado/merged en36ef, padresCB/3082 y árbol7cf85af3571dc90f6b425ad69a3b9700394dc471. Fuente codex/proyecciones-publicas-cotizaciones-20261117 conserva3082; la fuente anterior dePR33 conserva c56f199a0a6e0d9c15ca3d26969603e9f3d88919. No repetir permisos push/PR/Ready/merge33o34. Origen nuevo y destino excluyen deployments automáticos.

Las proyecciones públicas conservan21 precios Euro y17 Nollagam; cinco categorías Nollagam sin precio y Diagonal Vicuña pendiente. Euro pin0e8df1048d5ed5e1c6e2e3fff764d9fd6a4bb8ba78a73dcfc77b6ea108eb2272; Nollagam pin12412065e8aa418b148795ca1af2cf5edbdd67a583de0f2569256cd953051eee. No son nuevas recepciones, stock o vigencia confirmada.

Fuente documental sólo local:16referencias/15proyectos, Iris15sinprecio yPlaza213/C7 con vínculo exacto propio, sin extender a313/C6/C8. Novo109 yEndémico45 documentados aparte; Internos no se convierte en útil/interior/total. Mood conserva1D1B UF3753,20 y2D2B UF4678,45 sin asociación de planos confirmada; no repreguntar. Leben454referencias incluidas20cotizaciones, dos adicionalesSuecia separados,313IDs históricos intactos. Proyecciones administrativas no son evidencia nueva; Own vendido fuera sólo de preparado. No repetir SantoL009/BAUML013/D03.

No modificar fichas, precios/direcciones de origen, CRM360, AI Lab, Resend, formularios, finanzas, funciones, dominios, SSO o variables. No ejecutar generadores, restaurar Patio Brasil o seis proyectos históricos, hacer forcepush o usar el checkout original con cambios ajenos. Aplicación sólo en checkout técnico y documentación sólo en rama documental.

Si Iris necesita autenticación, Chrome oficial visible y acceso personal del propietario con OTP/CAPTCHA; nunca leer/guardar credenciales, cookies o tokens ni eludir seguridad. Pausar sólo la dependencia y continuar tareas independientes. Actualizar resultados reales, sincronizar únicamente lo autorizado, verificar hashes/árboles limpios y entregar el siguiente prompt completo sin pedir al propietario que lo copie para continuar.
