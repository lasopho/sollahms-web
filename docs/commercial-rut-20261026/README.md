# RUT opcional en formularios comerciales

Base publicada: `1396c3694a3b906202c9baecee8475b9f1eb63b3`, deployment `dpl_HbPQb4nq6Riwpt2iK3WUJgLXGGbq`. Fuentes/evidencia: `908e551a696ef744d3db09517802231973e15000`. Rama independiente `codex/commercial-rut-20261026`, despliegues Git deshabilitados y main intacta.

Los 135 formularios de portada/contacto/asesoría/fichas y el formulario de asesoría hipotecaria reciben RUT opcional después del nombre. No existe una modalidad vigente que lo exija. El módulo compartido `rut.mjs` valida módulo 11 sin consultas externas; `rut-field.mjs` normaliza la presentación. Se permite el dígito K, con o sin puntos/guion. El servidor vuelve a comprobarlo y sólo utiliza el valor normalizado.

Se reutilizan los destinos y contratos `/api/advisory` y `/api/contact`. El RUT acompaña la solicitud y su consentimiento; no determina elegibilidad, no activa CRM ni consultas financieras. No se agrega a URLs, sujetos de correo, analítica, logs o respuestas públicas. La idempotencia almacena únicamente una clave opaca, huella y tiempos, como antes. No se guardan datos reales en las pruebas o evidencias.

La función publicada de contacto contenía protecciones posteriores a la copia fuente del repositorio. Se recuperó exactamente del artefacto autorizado, SHA-256 `3b962afe425eb7413a38ee74956c7a9f0766829bcad6d5667b46cde8c055bffe`, antes de aplicar el cambio. Se conservan consentimiento, origen, límites, control de preview, canal explícito, catálogo público restringido e idempotencia. La ruta CRM preexistente conserva su activación explícita; no se cambió configuración ni credenciales.

Las pruebas son sintéticas y sustituyen todo transporte. El preview de QA usa exclusivamente un receptor simulado sin credenciales ni red; ese receptor queda fuera del artefacto de producción. Se verifican ambos destinos, RUT vacío/válido/inválido/K, variantes de formato, errores sin eco, reintentos y datos comerciales intactos. El resultado de éxito mantiene la distinción entre aceptación para envío y entrega al buzón.

La privacidad y el consentimiento describen identificación y continuidad de la evaluación solicitada, sin marketing. Las simulaciones permanecen anónimas hasta solicitar asesoría. No se agregan otros campos.

Rollback: restaurar `dpl_HbPQb4nq6Riwpt2iK3WUJgLXGGbq` mediante `request_rollback` del proyecto `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`. No ejecutar salvo necesidad de recuperación.

## Publicado y verificado

Versión `34bded6cd287d80f1207780ef1fc0c4f5e125d56`, deployment `dpl_8xfJsBW1M88w25SGXwXe5gGehz4H`. Se verificaron 136 formularios, 2.220 controles de conservación, 18 pruebas aisladas y 166/166 comprobaciones HTTP públicas. UF SII del 26/10/2026: CLP 41.221,08. Sin logs de error/fatal en la ventana revisada.

Capturas reales, sin datos personales: [escritorio](desktop.jpg) y [móvil](mobile.jpg). Las recepciones se probaron exclusivamente con datos sintéticos y transporte simulado; no se comprobó entrega a un buzón real. Véanse `browser-qa.json`, `public-checks.json`, `release.json` e `isolated-tests.txt`.
