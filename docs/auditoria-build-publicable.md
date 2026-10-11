# Auditoría del build publicable

La auditoría conserva la composición aprobada del catálogo: **144 proyectos**, con **16 fichas Ingevec** y 128 de otras inmobiliarias. No modifica fichas, precios, modelos ni disponibilidad. La aprobación contractual y el despliegue en Production se controlan por separado.

## Resultado del cierre del 11/10/2026

La inspección independiente de los directorios completos `sollahms-launch-public/dist` y `sollahms-launch-preview/dist` aprobó sin errores: **144 proyectos, 151 páginas HTML, 6.183 referencias locales, 21 portadas del lote, 127 imágenes y 142 planos seleccionados**, 144 canonical de fichas y 150 URL del sitemap. Los 269 recursos gráficos coincidieron con los hashes de los manifiestos. Los archivos y el contenido comercial de ambos builds fueron equivalentes después de normalizar únicamente las tres diferencias de revisión documentadas. No se realizaron solicitudes de red, mensajes ni reservas.

Las siete pruebas positivas/negativas del auditor y las tres pruebas de seguridad aprobaron. Diez fichas aún no incluyen `og:image`; se registra como mejora opcional de la vista compartida en redes sociales, sin cambiar las fichas aprobadas ni bloquear las fotografías visibles.

## Verificación independiente

`tests/audit_public_build.py` inspecciona dos directorios ya construidos: el contenido público preparado sin desplegar y su equivalente en Preview protegida. No accede a proveedores externos ni envía mensajes o reservas.

Comprueba:

- Las 144 identidades, las 151 rutas HTML y la ausencia de los seis proyectos retirados.
- Las **21 portadas** AJ Urbana/Ingevec y los **269 recursos seleccionados**: 127 imágenes y 142 planos, con sus hashes exactos y enlaces desde la ficha correspondiente.
- Imágenes, hojas de estilo, módulos, enlaces y anclas locales del build.
- Un H1, descripción y canonical correctos en cada ficha; los 150 enlaces únicos del sitemap; robots publicable y página 404 no indexable.
- Ausencia de PDF originales, contratos, inventarios privados, candidatos, carpetas internas y auditorías visibles en las fichas. Se mantienen los datos financieros públicos que necesita el buscador.
- Igualdad de los archivos y sus bytes entre los dos builds. Sólo normaliza la protección de indexación y el aviso de formularios de revisión. La protección de acceso de Vercel y el bloqueo de mensajes/reservas se verifican por separado.

Ejemplo de ejecución, con el comprobante fuera del repositorio y del contenido desplegable:

```sh
python3 tests/audit_public_build.py \
  --source /private/tmp/sollahms-integracion-financiera \
  --public /private/tmp/sollahms-launch-public/dist \
  --preview /private/tmp/sollahms-launch-preview/dist \
  --receipt /private/tmp/sollahms-launch-public-audit.json
```

Los controles negativos de `tests/test_public_build_audit.py` deben rechazar recursos seleccionados ausentes, documentos privados, una identidad alterada, auditorías visibles, diferencias comerciales entre builds y canonical incorrecto. El contenido completo y equivalente debe aprobarse.

## Seguridad de formularios y cabeceras

La validación compartida de disponibilidad y reservas rechaza un `Origin` distinto al de la solicitud **antes de leer el cuerpo o acceder al proveedor**, igual que el formulario de contacto. Las solicitudes sin `Origin` conservan compatibilidad con clientes de servidor. Continúan las restricciones POST, JSON, tamaños máximos, campos admitidos, fechas, horarios y respuestas de error generales.

El despliegue incorpora `X-Content-Type-Options: nosniff`, política de referencias `strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` y CSP `base-uri 'self'; object-src 'none'; frame-ancestors 'self'`. Esta CSP controla URL base, plugins y sitios que pueden enmarcar Sollahms. No impone restricciones de carga que bloqueen los mapas, recorridos oficiales, módulos financieros o scripts actuales. No sustituye las validaciones de entrada ni las listas permitidas de visores.

Las pruebas de `tests/launch-security.test.mjs` utilizan un proveedor simulado local: rechazan ocho solicitudes de orígenes ajenos sin leer su cuerpo ni realizar accesos externos y conservan disponibilidad/reserva para solicitudes válidas. No crean reservas reales.

## Límites y conservación de recursos

La auditoría de archivos no garantiza la disponibilidad futura de todos los visores externos. No agrega `hreflang` hacia páginas inglesas que aún no existen. Las fichas que carecen de `og:image` se registran como mejora opcional; se conservan sus contenidos aprobados.

Los recursos Ingevec que no se distribuyen mediante Git deben formar parte del archivo fuente privado reproducible usado para desplegar. Un checkout Git incompleto debe fallar al preparar el perfil publicable; no debe convertir silenciosamente las galerías, planos o portadas aprobadas en placeholders. Los contratos, originales e inventarios privados permanecen fuera del directorio público.
