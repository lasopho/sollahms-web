# Panel privado de bonos pie

Publicado en **https://sollahms.cl/bonos-pie** con acceso exclusivo mediante el correo corporativo elegido por el titular. El ingreso real quedó confirmado por el titular y observado directamente en el navegador: la tabla cargó el inventario completo. No hay registro abierto de usuarios.

El runtime publicado es `14d99d8fb286950a211b254f5d738b0abe18217e`, deployment `dpl_AraH5152864kmJWKpNjbe2ovaJa7`. Se promovió el mismo ID previamente verificado, sin reconstruirlo. La publicación y su hora America/Santiago constan en `publication.json`. Los commits posteriores de documentación no alteran ese runtime.

## Acceso y aislamiento

Una función Node.js nueva sirve la página y su API. El servidor valida la única dirección configurada en `BONOS_ADMIN_EMAIL` antes de enviar el código. La dirección personal del administrador no aparece en HTML, JavaScript ni configuración pública. Los códigos de ocho dígitos vencen a los diez minutos, admiten cinco intentos y están vinculados a la cuenta para la que se emitieron. Se consumen mediante escritura condicional. Los desafíos antiguos sin administrador o para otra cuenta quedan rechazados.

Las sesiones duran ocho horas y se revocan al cerrar sesión. Las cookies son `__Host-`, Secure, HttpOnly, SameSite Strict y Path=/. No se añadió la opción de recordar dispositivos ni una contraseña nueva. Cada página, recurso privado y lectura de datos exige la sesión; las mutaciones requieren origen permitido, JSON y CSRF. Las respuestas privadas no se almacenan en caché y llevan noindex. La protección de Vercel permanece intacta: SSO all_except_custom_domains y autoAssignCustomDomains=false; la autenticación de la aplicación protege el dominio corporativo.

Se reutilizan Vercel, el remitente Resend y los recursos corporativos existentes. El almacén Blob es privado; no se añadió una base de datos ni se modificó el CRM. Las lecturas de Blob usan la representación original sin compresión para conservar ETags fuertes y las escrituras usan ifMatch para impedir pérdidas por concurrencia. Los datos comerciales, evidencia e historial permanecen exclusivamente en almacenamiento autenticado y copias privadas del titular.

## Consulta y actualización

El panel permite buscar proyectos; filtrar por comuna, inmobiliaria, estado y porcentaje; ordenar; consultar condiciones, unidades, fechas y evidencia; y exportar los resultados como CSV con protección frente a fórmulas. Conserva máximos, mínimos y rangos de porcentaje y no mezcla porcentajes con UF como si fueran una sola medida. Los datos desconocidos y las identidades ambiguas permanecen señalados. Las fechas de vigencia no se infieren cuando la fuente no las publica.

La consulta de Iris es manual y autorizada. Recargar datos lee únicamente las verificaciones guardadas. La importación autenticada actualiza por identificador y versión, conserva antecedentes y permite actualizar datos sin reconstruir el panel. No hay extracción automática, sondeo ni credenciales de Iris en la aplicación. Las unidades participantes reflejan la cobertura observada y pueden ser parciales cuando la fuente tiene paginación.

La dirección principal es /bonos-pie y la pantalla de acceso /bonos-pie/acceso. Las dos rutas antiguas bajo /interno/bonos-pie se conservan por compatibilidad. No se añadieron enlaces públicos, entradas de sitemap ni cambios en robots o preferencias de entrenamiento.

## Verificación

- Nueve pruebas de seguridad aprobadas: privacidad de página/API, códigos de un uso, concurrencia, límites, vencimientos, origen, CSRF, revocación, integridad comercial y cambio de administrador.
- Siete comprobaciones sintéticas del nuevo acceso corporativo y diez del panel: búsqueda, filtros, orden, evidencia, CSV, importación y login. Responsive comprobado en Chrome a 320, 390, 768, 1024 y 1440 px; no se declara una prueba física de Safari/iPhone.
- `verification/production-summary.json`: 1.739 UID SHA1 y ocho funciones coincidentes; los 1.672 archivos públicos y 57 fuentes anteriores permanecen idénticos.
- `verification/public-http.json`: doce solicitudes HTTPS públicas sin cookies ni bypass; API y recursos privados devuelven 401, y las páginas públicas comprobadas conservan sus bytes. El archivo Blob privado devuelve 403 sin credenciales.
- `verification/authenticated-access.json`: ingreso real del titular y observación directa del panel autenticado en el dominio corporativo.

Se preservan las 152 fichas públicas, catálogo, precios, tipologías, formularios, CRM, navegación, sitemap y SEO/GEO. Este panel privado no acredita mejoras de indexación, posiciones ni citas de Google, OpenAI o Bing. La continuidad SEO no fue la autorización de publicación: esta procedió del encargo expreso del titular, conservado en `authorization.json`.

## Continuidad

`candidate-manifest.json`, `runtime-verification.json` y `publication.json` vinculan fuente, artefacto y producción. Los registros superseded-* pertenecen a candidatos anteriores y no describen la versión actual. No incluir códigos, cookies, claves, respuestas comerciales por proyecto ni sesiones de navegador en esta carpeta o en Git.

Las verificaciones son de lectura:

```sh
python3 docs/bonos-pie-20261125/verify-deployment.py \
  --deployment-id dpl_AraH5152864kmJWKpNjbe2ovaJa7 \
  --source-commit 14d99d8fb286950a211b254f5d738b0abe18217e \
  --phase production
```

El candidato ya está publicado. No ejecutar el script de creación para duplicarlo. Toda publicación posterior requiere reconciliar la producción vigente y el alcance del nuevo encargo.
