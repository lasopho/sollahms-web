# Brochures Yapo/IRIS: procedencia y preparación de publicación

Actualización del 10/10/2026 en `codex/integracion-financiera-sollahms`.

El titular confirmó que los brochures de AJ Urbana e Ingevec fueron entregados mediante Yapo/IRIS y que el contrato contempla su uso promocional por corredores. Esta aclaración sustituye el supuesto anterior de una licencia individual pendiente para cada fotografía, render o plano. Los recursos comprendidos en la autorización contractual no requieren esa licencia adicional.

El texto de las cláusulas «Publicidad sobre el Proyecto» y «Entrega de materiales», los sitios permitidos y las condiciones de vigencia/reutilización no están disponibles todavía para contrastar el alcance. La procedencia está registrada como declaración del titular; la cobertura contractual específica sigue pendiente de contraste. No se inventó una cláusula, una fecha de vigencia ni una autorización de redistribución del repositorio público.

## Contenido preparado

| Proyecto existente | Imágenes de brochure | Planos | Portada |
| --- | ---: | ---: | --- |
| Downtown San Martín | 5 | 19 | Living y cocina, pág. 5 |
| Edificio Teatinos 750 | 4 | 15 | Fachada, pág. 5 |
| Edificio Vista Amunátegui | 5 | 19 | Fachada, pág. 1 |
| Monjitas 690 | 4 | 2 | Patio interior, pág. 13 |
| Vista Morandé | 8 | 23 | Fachada, pág. 1 |
| Centenario 1 | 9 | 5 | Fachada nativa, pág. 1 |
| Tocornal | 8 | 5 | Fachada nativa, pág. 1 |
| Vivaceta | 5 | 4 | Fachada, pág. 5 |
| **Total** | **48** | **92** | **8 portadas** |

Las galerías mantienen las imágenes oficiales anteriores y suman 66 imágenes visibles en estas ocho fichas. Se conserva la atribución a cada inmobiliaria y página del brochure; las ocho fichas identifican el canal Yapo/IRIS. Las rutas históricas terminadas en `-preview` se conservan para no romper enlaces: su nombre no determina los permisos de publicación.

El catálogo sigue teniendo exactamente 148 proyectos. Los Alerces y Valle Los Ingleses III continúan como candidatos privados y no se agregan al catálogo. No se cambian datos comerciales, mapas, recorridos, motores financieros ni formularios. Centenario mantiene exclusivamente Centenario 1151, Santiago en los recursos públicos.

## Controles técnicos

- El perfil de contenido depende de la cobertura contractual documentada, no de `VERCEL_ENV` ni de una licencia individual.
- Una cobertura verificada debe indicar sitio, uso promocional web, documentos cubiertos, fecha de contraste y hash de evidencia privada. El contrato completo queda fuera de Git y de `dist`.
- Si falta un recurso ya cubierto por contrato, el build falla. No recupera silenciosamente una galería anterior ni vuelve a un placeholder.
- Sólo se copian los 140 derivados seleccionados y comprobados mediante SHA256. Se excluyen originales PDF, contratos, hojas comerciales, candidatos y archivos adicionales dentro de los lotes. Los enlaces simbólicos se rechazan.
- `SOLLAHMS_BROCHURE_PROFILE=public-web` exige cobertura contractual verificada de ambos lotes. No autoriza ni ejecuta un despliegue.
- Preview conserva la protección de Vercel, `noindex` y el bloqueo de mensajes/reservas reales. La diferencia con un build público local se limita a los controles de revisión.
- El build genera un inventario privado en `.vercel/brochure-build-inventory.json`; no lo expone como JSON público.

Los precios públicos previamente verificados se conservan como «Desde UF». Los proyectos sin precio confirmado siguen mostrando «Consultar precio». Modelos históricos, superficies o condiciones del brochure no crean precios ni stock vigentes. Los documentos originales y sus condiciones comerciales no se publican.

## Paquete reproducible

`scripts/create-brochure-bundle.py` prepara un archivo fuente privado con código, medios seleccionados e inventarios de hashes. Verifica el paquete en un entorno temporal antes de guardarlo y produce un `source.tgz` determinista con fragmentos compatibles con el transporte nativo de Vercel. No sube archivos, no crea secretos y no despliega.

```sh
python3 scripts/create-brochure-bundle.py \
  --output-directory /ruta/privada/fuera/del/repositorio \
  --node /ruta/al/runtime/node
```

Los originales no son dependencias del build: los derivados ya aprobados están incluidos en el paquete. Los materializadores AJ e Ingevec verifican hashes/dimensiones contra el manifiesto de sólo lectura y trabajan en staging. Nunca actualizan automáticamente la aprobación de un medio cuando otro encoder produce bytes diferentes.

La cobertura de un sitio web y la inclusión de medios en un repositorio público son canales que deben contrastarse con el contrato. Hasta disponer de ese alcance, los 36 derivados nuevos de Ingevec permanecen fuera del índice Git y viajan únicamente en el paquete privado de la Preview protegida. Este estado no se presenta como una licencia individual faltante.

## Verificación

Resultados locales: **196/196 pruebas Node y 22/22 pruebas Python de materialización**, tres validadores estructurales/de integración y el validador hipotecario aprobados. **444 comprobaciones de las 148 fichas** en escritorio (1440), tablet (834) y móvil (390), sin fallos de portada/estado sin imagen, navegación ni desbordamiento. Las ocho fichas modificadas tienen 24 comprobaciones adicionales de atribución, galerías y modelos.

**808 rutas/recursos locales y 140 hashes de medios** correctos; cinco rutas de candidatos/manifiestos/scripts excluidas con 404. Dos generaciones independientes dieron el mismo archivo fuente SHA256 `4665863789825c5a500db0c29ec23813e947b0e2b85688605029350b1121ce39`, con 842 archivos y 140 medios. Cero solicitudes externas en el servidor de pruebas. La revisión textual de 306 archivos de código/datos/salida no detectó referencias privadas. El OCR local de los 140 medios no detectó cifras ni condiciones comerciales incrustadas.

Se verifican la selección completa de medios, conservación de las 148 fichas, precios, estados, datos financieros, mapas y recorridos, y ausencia de candidatos/documentos privados en el output. Las pruebas del perfil contractual usan evidencia sintética exclusivamente en fixtures temporales; nunca marcan como verificado el contrato real.

La reconstrucción desde originales produjo exactamente 104 recursos AJ y 36 Ingevec, coincidentes con sus hashes aprobados, sin modificar medios ni manifiestos existentes. La regresión de contacto y agenda usa proveedores simulados y verifica el bloqueo de envíos en Preview.

Esta actualización reemplaza las restricciones descritas como «licencia individual pendiente» en informes anteriores. La habilitación pública real permanece pendiente del contraste contractual, sin merge a `main`, modificación de otras ramas ni despliegue de Production.
