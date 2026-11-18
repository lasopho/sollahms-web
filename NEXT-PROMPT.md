# Continuar autónomamente el Asset Portafolio de Sollahms

Repositorio: lasopho/sollahms-web. Corte17/11/2026, America/Santiago. El objetivo de información comercial confiable y filtros funcionales para los131 proyectos sigue abierto. Continuar trabajo autorizado; no repetir auditorías ni certificaciones con los mismos hashes.

## Punto actual

El deployment corregido está READY y verificado, todavía SIN PROMOCIÓN:
- ID dpl_3m4WNrEAtGDgLm6nUMrqxkLsyTcr.
- URL https://project-wrapp-qtcdudl1x-lsandoval2-8260s-projects.vercel.app/proyectos.html.
- SHA875bd80ddb650b376cb3dd53af4ffae066fcd48f.
- Targetproduction, ceroaliases. Creado una sola vez con permiso AUTH-DEPLOYMENT-PR35-20261117-01, ya consumido. No volver a pedir ese permiso ni crear más deployments.

Próximo paso externo: solicitar autorización independiente para promover ESTE MISMO deployment a sollahms.cl y sus alias existentes, sin rebuild ni otrodeployment y sin cambiar DNS, SSO o variables. La promoción/publicación aún no está autorizada. Leer PLAN-PROMOCION-PR35.json e INTERVENCIONES-PROPIETARIO.json antes de preguntar; si ya está presentada, no repetirla ni interpretar silencio como aprobación. La herramienta prevista es VercelMCP request_promote con deploymentId3m4, projectIdprj_URomRRU0MAy4etGKP5gWv3Qv4DGH yteamIdteam_A9VNIW2f2K1IJpd2pGdvDmEN.

Producción continúa9e8212264e0bac24f392d8340d6e55eabb17499a, deployment dpl_Gm75zZeuxYTqfnrJdHcKREqoQUUQ. Los cuatrodominios sollahms.cl, www.sollahms.cl, sollhams.cl y project-wrapp.vercel.app siguen enGm75. Preservar redirects308 dewww/sollhams a sollahms.cl. Main86e200ec191b38af355061e21bc0fc1e549cce3b intacto. Verificar referencias y producción antes de cualquier acción real; reconciliar si aparecen cambios inesperados.

## Código y autorización ya ejecutada

PR35 https://github.com/lasopho/sollahms-web/pull/35 está cerrado/merged. Primerpush, creaciónDraft, Ready, merge y deployment corregido tuvieron permisos expresos separados y se ejecutaron; no repetir esas solicitudes.
- Rama destino codex/footer-sin-frase-20261116 apunta875bd80ddb650b376cb3dd53af4ffae066fcd48f.
- Padres delmerge:36ef9d9baec37d92cdda8ac6acbcaf2cac959335 y9700d65fed15ee56584987573f1493b1fb52c9a4.
- Árbol06ba531790509767eea856b703160d02cbf5fa65, idéntico al candidato9700.
- Rama fuente codex/cotizaciones-mismo-origen-20261117 conserva9700d65fed15ee56584987573f1493b1fb52c9a4 local/remoto.
- Checkout técnico /private/tmp/sollahms-referencias-documentales-131-20261117, árbollimpio.
- Cincoarchivos: doscargadores, sus dostests y exclusiónfalse de deployments de la nueva rama. Origen/destino/main mantienen deployments automáticos desactivados.

Corrección: ambos fetch de las proyecciones públicas usan credentials:same-origin. El navegador gestiona su sesión normal sólo dentro del propio dominio; no se leen cookies o tokens, se añaden headers de credenciales ni se cambiaSSO. Se mantienen redirect:error, timeouts, SHA256pins, allowlists y ausencia de fallback a originales.

El deployment anterior dpl_B7PfYYNveGXD5pjns6sg6yAqMHL7@36ef permanece BLOQUEADO y NUNCA se promoverá. Su permiso de creación también está consumido. Allí se reprodujeron302/ERR_FAILED y0/131 enDonPepe2D UF3500–3600; el archivo original estaba correcto. La corrección9700 resolvió ese defecto en3m4.

## Evidencia real y límites

- 1.672/1.672 digests SHA1 recibidos coinciden con el inventario local SHA1/SHA256, cotejados independientemente; cero faltantes/extras/diferentes y siete rutaslambda.
- Paquete /private/tmp/sollahms-cotizaciones-mismo-origen-release-20261117, pin ded2e412ecdca2087562c8fdb44533073dc6b740430089eba341804d6d382834. Son1614estáticos+57archivos de7funciones+config. Sólo dosJS difieren deB7;1670archivos,131fichas,config/410 y dosJSON públicos intactos.
- Pruebas específicas: rojo2fallos esperados con omit, verde10/10cargadores. Revisión independiente aprobada; no suites generales repetidas.
- Chrome real3/3enfocados: ambasfuentes públicas cargan200 sin redirección de autenticación; EuroDonPepe2D UF3562 yNollagamCostaneraA3D UF5070, cadauno1/131. Euroconditional304 válido también observado. Capturas sintruncamiento, cero excepciones, errores o warnings deconsola. CDPNetwork/Runtime desactivados.
- No sumar esos subconjuntos a49Euro/19Nollagam/23integración/7Chrome anteriores ni aF10/F13. No se repitieron responsive, cuatrovistas o escenariosfinancieros.
- Observación: entorno protegido conserva avisoMetro preexistente. Código/datos Metro9e→36ef iguales y ambosrecursos públicos actualesHTTP200 conbytes iguales alstage; no es una nueva certificación completa deMetroUI. Informar esa limitación en la solicitud de promoción.
- 155protegidos,21originales,dosproyecciones,131fichas,sietefunciones y313IDs Leben intactos. No hay nuevas recepciones/precios/stock o cierreshistóricos.

## Documentación y seguridad

Checkout documental /private/tmp/sollahms-auditoria-leben-20261116, rama codex/auditoria-leben-20261116. Consultar HEAD local/remoto actual. Leer docs/objetivo-principal-asset-portafolio/ESTADO-PR35.json, ESTADO-PUBLICACION.json, CANDIDATO-CARGA-MISMO-ORIGEN.json, INTERVENCIONES-PROPIETARIO.json, CONTROL-DE-AVANCE.md y PLAN-PROMOCION-PR35.json. Evidencia en deployment-pr35-20261117/, deployment-pr34-20261117/, correccion-carga-mismo-origen-20261117/ y preparacion-deployment-pr35/.

NUNCA desplegar /private/tmp/sollahms-pr33-release-20261117: paquete raw conhistorial interno, en cuarentena, nunca publicado. PaqueteB7 en /private/tmp/sollahms-proyecciones-publicas-release-20261117 también se conserva inmutable como evidencia, no para promoción.

EuroJSON público pin0e8df1048d5ed5e1c6e2e3fff764d9fd6a4bb8ba78a73dcfc77b6ea108eb2272; Nollagam pin12412065e8aa418b148795ca1af2cf5edbdd67a583de0f2569256cd953051eee. Conservan21Euro/17Nollagam y cincocategorías sinprecio; Diagonal Vicuña siguependiente. Fechas deowner no confirman stock o vigencia. Iris/documental permanece sólo local:16referencias/15proyectos; no se habilita públicamente al promover.

Plaza213/C7 conserva su vínculo exacto, sin extender a313/C6/C8. Novo109 yEndémico45 documentados aparte; Internos no se convierte en útil/interior/total. Mood1D1B UF3753,20 y2D2B UF4678,45 sin plano confirmado; no repreguntar. Leben454referencias incluidas20cotizaciones y dosadicionalesSuecia separados;313IDs intactos. Proyecciones administrativas no son evidencia nueva; Ownvendido fuera sólo de preparado. No repetir SantoL009/BAUML013/D03.

No modificar fichas, precios/direcciones de origen, CRM360, AI Lab, Resend, formularios, finanzas, funciones, dominios, SSO o variables; no generadores, forcepush, main, PatioBrasil o seisregistros históricos. No usar el checkout original con cambios ajenos. Aplicación sólo en checkout técnico; ramaLeben documental.

Si Iris requiere autenticación, Chrome oficial visible y acceso personal del propietario con OTP/CAPTCHA; nunca leer/guardar credenciales, cookies o tokens ni eludir seguridad. Para metadatosVercel conservar únicamente los campos necesarios: no volcar respuestas completas de aliases. Pausar sólo la dependencia que requiere intervención y continuar trabajo independiente. Actualizar resultados reales, sincronizar lo autorizado, verificar hashes/árboleslimpios y entregar siempre el siguiente prompt completo sin pedir al propietario que lo copie.
