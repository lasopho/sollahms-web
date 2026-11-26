# Panel privado de bonos pie

Implementación aislada para consultar verificaciones comerciales de Iris desde `/interno/bonos-pie`. La entrada `/interno/bonos-pie/acceso` solicita un código enviado exclusivamente a la cuenta configurada en `BONOS_ADMIN_EMAIL`. No existe registro de usuarios ni elección de destinatario desde el navegador.

## Arquitectura y privacidad

Se reutilizan el proyecto Vercel, el remitente Resend y los recursos corporativos de Sollahms. Una función Node.js nueva sirve la página, los recursos del panel y su API. Los seis archivos de interfaz no contienen información comercial ni credenciales. La página, los datos y `panel.js`/`panel.css` requieren una sesión verificada. Solo los recursos básicos de acceso son anónimos.

Vercel conserva `ssoProtection.deploymentType=all_except_custom_domains` y `autoAssignCustomDomains=false`. La autenticación de la aplicación protege el dominio corporativo; la protección de Vercel permanece como capa independiente en el hostname técnico. `noindex` y las directivas de caché complementan la autenticación.

Se añadió un almacén Blob **privado** porque las funciones no tienen un disco durable y la información debe poder actualizarse sin reconstruir el panel. No se añadió una base de datos ni se modificó el CRM. Los registros comerciales, sus evidencias y el historial se guardan exclusivamente en ese almacén. Las credenciales solo se suministran mediante variables del servidor; no se versionan ni se incluyen en las respuestas.

Los códigos tienen ocho dígitos, vencen a los diez minutos, admiten hasta cinco intentos y se consumen mediante escritura condicional. El envío está limitado en almacenamiento persistente. Las sesiones duran ocho horas y se revocan en el servidor al cerrar sesión. Las cookies usan el prefijo `__Host-`, `Secure`, `HttpOnly`, `SameSite=Strict` y `Path=/`. Las mutaciones requieren sesión, origen admitido, JSON y token CSRF. Las lecturas de autenticación evitan caché y las escrituras usan control de concurrencia por ETag. Las lecturas de Blob solicitan `Accept-Encoding: identity` y rechazan ETags débiles, para conservar el identificador fuerte requerido por las actualizaciones condicionales de documentos grandes.

## Consulta y actualización

La interfaz permite buscar, filtrar por comuna/inmobiliaria/estado/porcentaje, ordenar, abrir condiciones y evidencia, y exportar los resultados filtrados como CSV. La exportación conserva los calificadores de porcentaje y neutraliza fórmulas de hojas de cálculo. No combina porcentajes y montos en UF como si fueran la misma magnitud.

La consulta de Iris es manual y autorizada; **Recargar datos** lee exclusivamente el almacén privado. No hay sondeo, extracción automática ni credenciales de Iris en la aplicación. La importación autenticada actualiza por identificador, comprueba la versión esperada y conserva antecedentes anteriores. No se ejecutan reintentos silenciosos frente a conflictos. Las promociones vencidas permanecen visibles con su evidencia y quedan fuera del indicador de beneficios vigentes.

Los estados admitidos son `confirmed`, `conditional`, `promotion_only`, `no_information`, `not_found` y `pending`. Las clasificaciones consultadas requieren fecha y evidencia. Las coincidencias requieren nombre, inmobiliaria y ubicación validados; el bono pie necesita una mención explícita. `percentageKind` conserva `maximum`, `minimum`, `exact`, `range` o `unknown`, con `percentageMax` para el extremo superior de un rango. Una promoción o descuento sin evidencia de bono pie no recibe un porcentaje de bono.

## Preservación de producción

La base reconciliada es `dpl_4tBq9YFz3BKoiXiJE5G5hBjPXMwW`, fuente `3f02788b971c2691afbe5c21e269077f00c1ce14`. Sus 1.730 fuentes se conservan salvo `config.json`, donde se anteponen solamente las dos rutas privadas. Las nueve fuentes nuevas pertenecen a la función protegida. El resultado contiene 1.739 archivos y ocho funciones.

La verificación completa del primer despliegue aislado `dpl_9g92sC2Az5HRD6SssmUbSVtH6EHQ` confirmó los 1.739 UID SHA1 frente al manifiesto local. La prueba real posterior detectó un ETag débil en la lectura de documentos grandes de Blob y bloqueó las actualizaciones condicionales. Ese despliegue **no fue promovido ni recibió los aliases públicos**. La evidencia anterior se conserva en `verification/superseded-9g92-*`; acredita la correspondencia de sus fuentes, pero no la corrección funcional de ese runtime.

La fuente del runtime corregido es `253d6f91fb4f238120f45d616657d690850e6381` y su inventario es `b38304390fbfc44d769350dcc7c6324940d46bbdc5b484a2662b92e0e648e372`. La compilación corregida coincide con el artefacto y aprueba ocho pruebas de seguridad, incluida la regresión de lectura con ETag fuerte. La tarea principal creó el candidato Production `dpl_B2uxLakokJHhaisYEm6deMwsUpfo` con `--skip-domain`; estos scripts de auditoría no crean ni promueven despliegues por su cuenta. La prueba remota completa y la verificación real de acceso deben quedar registradas antes de asignar dominios.

El candidato conserva los 1.672 archivos estáticos públicos y las 57 fuentes de funciones anteriores. El inventario público, fichas, precios, tipologías, formularios, CRM, navegación, sitemap, preferencias de entrenamiento y contenido SEO/GEO quedan preservados. No se atribuye a este panel privado ninguna mejora de búsqueda, indexación o citas de Google, OpenAI o Bing.

## Pruebas y evidencias

- `runtime-verification.json`: ocho pruebas de seguridad aprobadas con almacenamiento y correos sintéticos; compilación en memoria idéntica al artefacto y hashes de las fuentes revisadas.
- `qa/results.json`: búsqueda, filtros, orden, calificadores, detalle/evidencia, XSS, CSV, importación y login con datos sintéticos. Sin desbordamiento de página a 1440, 1024, 768, 390 y 320 píxeles; tabla desplazable en tablet y tarjetas en móvil. Esto prueba Chrome con tamaños representativos, no una ejecución física de Safari/iPhone.
- `verification/isolated-summary.json` y `verification/isolated-source-comparisons.json`: recorrido remoto completo, identidad del runtime, protección Vercel, conservación de configuración y variables por metadata, y aliases todavía en la base anterior durante la comprobación.
- Las pruebas reales de OTP, acceso a Blob privado, datos autenticados y bloqueo anónimo se registran por separado en la entrega de la tarea principal. Las pruebas sintéticas y el inventario remoto no sustituyen esa verificación.

Ningún archivo de esta carpeta debe incluir códigos, cookies, claves, respuestas comerciales por proyecto o sesiones de navegador.

## Scripts de continuidad

Los scripts usan la autenticación existente de la CLI con proyecto y equipo explícitos. Nunca solicitan valores de variables, descifran secretos, generan tokens, crean sesiones de prueba ni cambian la protección de Vercel.

`verify-deployment.py` solo ejecuta GET. Para comprobar el candidato aislado:

```sh
python3 docs/bonos-pie-20261125/verify-deployment.py \
  --deployment-id dpl_B2uxLakokJHhaisYEm6deMwsUpfo \
  --source-commit 253d6f91fb4f238120f45d616657d690850e6381 \
  --phase isolated
```

Después de promover **ese mismo ID**, repetir con `--phase production`. El modo exige que los aliases oficiales apunten al candidato; no promueve nada por sí mismo.

`create-production.py` realiza un preflight de lectura por defecto y requiere un SHA completo con `--expected-commit`. Solo `--execute` habilita una creación aislada Production. La tarea principal gestiona la creación del candidato corregido: no ejecutar este script para duplicarlo. Antes de cualquier uso futuro hay que reconciliar la base productiva y el historial de intentos; un archivo de intento se crea exclusivamente para impedir repeticiones accidentales. La promoción es una operación posterior, sujeta a las pruebas reales de acceso requeridas por el titular.

Documentación primaria aplicada: [Blob privado](https://vercel.com/docs/vercel-blob/private-storage), [lecturas y escrituras condicionales](https://vercel.com/docs/vercel-blob/using-blob-sdk), [Production sin asignar dominios](https://vercel.com/docs/cli/deploy), [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).

## Dirección corta preparada

Se preparó `/bonos-pie`, con `/bonos-pie/acceso` para el acceso existente. Los enlaces anteriores `/interno/bonos-pie` siguen funcionando como alias. Los ocho controles de seguridad y la reconstrucción aprobaron; 1.672 archivos públicos y 57 fuentes de funciones previas permanecen intactos. La opción de recordar dispositivos no se añadió. Este cambio está preparado localmente y no se ha desplegado: queda pendiente aclarar si el titular quiere retirar toda autenticación, permitiendo el acceso a cualquiera que conozca o descubra la dirección. No se interpreta una URL oculta como acceso exclusivo.

El deployment B2ux y sus pruebas históricas describen la versión anterior. El manifiesto y snapshot actuales corresponden al candidato local de dirección corta; no deben presentarse como una verificación remota de ese deployment. Véase `route-change.json`.

## Acceso con correo de Sollahms preparado

El titular eligió inicio de sesión con correo de Sollahms. La pantalla propone `contacto@sollahms.cl`, dirección corporativa existente, y solicita un código de un solo uso. No se añadió recordar dispositivos ni contraseña nueva. El servidor valida el correo permitido antes de leer presupuesto o enviar mensajes; cada desafío guarda su administrador y no puede convertirse en una sesión para una cuenta distinta. Los desafíos antiguos sin administrador quedan rechazados. Las nueve pruebas de seguridad y siete comprobaciones sintéticas de UI aprobaron.

La revisión automática rechazó actualizar la variable de administrador porque el titular no indicó explícitamente la dirección completa. No se aplicó el cambio ni se envió correo. La asignación de `contacto@sollahms.cl` está pendiente de confirmación expresa; la ruta corta y el nuevo acceso permanecen preparados y sin publicar. Véase `verification/corporate-admin-assignment-pending.json`.
