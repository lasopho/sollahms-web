# Metadatos: dirección del panel privado

Solicitud del titular: cambiar la página de `sollahms.cl/bonos-pie` a `sollahms.cl/metadatos`. El nombre general, título del navegador, acceso y enlaces internos pasan a Metadatos. Las secciones de bonos, planes de pago y dividendo se conservan.

Ruta canónica: `/metadatos`, acceso: `/metadatos/acceso`. Las cuatro rutas antiguas (`/bonos-pie`, `/bonos-pie/acceso` y sus variantes `/interno/bonos-pie`) redirigen 308 a su equivalente nuevo, admitiendo barra final. La respuesta de redirección conserva no-store/noindex; `Location` no contiene fragmento para que el navegador mantenga anclas existentes.

No se cambian la API interna, nombres de cookies, Path=/, permisos, cuenta administradora, retos OTP, sesiones ni prefijo de almacenamiento. Los datos privados existentes se reutilizan sin migración. El correo de acceso enlaza la nueva dirección. Los cálculos, estilos, controles y descargas de cada sección permanecen iguales.

Baseline reconciliado: `dpl_8bs5Zs78MVhN4ErYAt78Xy2UNrTR`, fuente `3a7537ce34f403a439665a6ae3df9ee39a8a79aa`, pin `ed1a616d3a57cf887dcfc6a982aba1d1e48e80a13980c06a12f4296f8c342658`: 1741 archivos, 1672 estáticos y ocho funciones. Sólo cambian la configuración de las seis rutas privadas y seis archivos del handler privado. El resto de la configuración, sitios públicos, catálogo, formularios, sitemap y 57 fuentes de otras funciones deben conservar sus bytes.

Las 56 pruebas de seguridad y matemáticas pasaron. Los scripts del cliente sólo cambian sus redirecciones de navegación; IDs de controles, motor financiero y estilos conservan sus bytes. El paquete compilado deniega datos y módulos sin sesión y usa la nueva ruta de acceso. La guarda de publicación verifica también que no cambió ninguna ruta pública. Después de promover el mismo candidato se comprueban los cinco alias, redirecciones antiguas, login anónimo y sesión real.

La publicación está comprendida en la autorización expresa original de desarrollar, probar y publicar el panel privado con autenticación real, y en esta solicitud concreta de nueva dirección. La rama de trabajo conserva sus cambios sin fusionarse a main ni a la rama SEO. La dirección privada no se añade al sitemap ni a la navegación pública, y no se atribuyen efectos de visibilidad a este cambio.

Referencias técnicas: [Vercel Build Output Configuration](https://vercel.com/docs/build-output-api/configuration) y [RFC 9110, fragmentos en Location](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.2). Los registros de publicación y comprobación final se agregan al cerrar.
