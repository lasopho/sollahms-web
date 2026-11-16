# SOLLAHMS — AUTORIZACIÓN INTEGRAL DE CORRECCIÓN, QA Y PUBLICACIÓN — ELIMINACIÓN DE RECORRIDOS VIRTUALES

## 1. AUTORIZACIÓN EXPRESA DEL PROPIETARIO

El propietario autoriza expresamente completar todas las etapas necesarias para terminar esta intervención, incluyendo:

- Diagnóstico y corrección del empaquetado.
- Preparación de Build Output API.
- Creación de nuevas Previews privadas.
- Modificaciones técnicas estrictamente necesarias para corregir esta intervención.
- Pruebas locales y remotas.
- Correcciones iterativas.
- Actualización del PR #27.
- Aprobación técnica del candidato.
- Preparación de publicación productiva.
- Publicación final en sollahms.cl.
- Promoción del deployment verificado.
- Cierre documental y generación automática del siguiente prompt.

Esta autorización comprende las operaciones de GitHub y Vercel necesarias para completar este objetivo.

**No solicitar nuevas confirmaciones para cada etapa ya comprendida en esta autorización.**

La publicación productiva sólo podrá ejecutarse cuando se hayan superado todos los controles de aceptación establecidos en este documento.

## 2. IDENTIFICACIÓN DEL PROYECTO

Repositorio: `lasopho/sollahms-web`

Rama de trabajo:
`codex/eliminar-recorridos-global-20261115`

PR:
https://github.com/lasopho/sollahms-web/pull/27

Último commit documental conocido:
`7170f30aa56abef2001df2f74359a79f39e31dd2`

Proyecto Vercel:
`project-wrapp`

ID:
`prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`

Equipo:
`team_A9VNIW2f2K1IJpd2pGdvDmEN`

Producción de referencia:
`dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`

Preview defectuosa:
`dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF`

## 3. OBJETIVO FINAL

Eliminar definitivamente los recorridos virtuales de las 131 fichas de proyectos inmobiliarios y publicar una versión funcional, correctamente empaquetada y verificada.

Conservar íntegramente:

- Fotografías y galerías.
- Planos.
- Videos promocionales.
- Datos comerciales.
- Precios y tipologías.
- Formularios y captación de leads.
- WhatsApp.
- Mapas.
- Navegación.
- SEO y GEO.
- Recursos compartidos y funciones actuales.

No repetir la eliminación ya implementada.

## 4. ETAPA 1 — PREPARACIÓN Y VALIDACIÓN

Leer obligatoriamente:

- `AGENTS.md`
- `NEXT-PROMPT.md`
- `docs/recorridos-eliminacion-20261115/INFORME-CIERRE.md`
- `docs/recorridos-eliminacion-20261115/packaging-20261115/INFORME-DIAGNOSTICO.md`
- `docs/recorridos-eliminacion-20261115/packaging-20261115/NEXT-PROMPT-CORRECCION.md`

Verificar el HEAD remoto y preservar cambios posteriores.

No utilizar `main` como fuente de reconstrucción de las fichas.

## 5. ETAPA 2 — CORRECCIÓN DEL EMPAQUETADO

La causa raíz ya está documentada: Vercel recibió los archivos como fuentes ordinarias y no interpretó correctamente Build Output API.

Utilizar la preparación aislada existente:

- `prepare-isolated.py`
- `check-local.py`
- `check-functions.mjs`

Preparar la estructura:

`.vercel/output/config.json`

`.vercel/output/static/`

`.vercel/output/functions/`

Conservar:

- 1.660 archivos runtime.
- 66 cambios autorizados.
- 1.594 archivos idénticos.
- 57 archivos de funciones.
- Siete bundles ejecutables.

Verificar todos los hashes, tamaños e imports.

No ejecutar generadores históricos ni alterar fichas para solucionar errores de rutas.

## 6. ETAPA 3 — NUEVA PREVIEW PRIVADA

Crear una nueva Preview mediante el mecanismo oficial de Vercel Build Output API.

Utilizar `vercel deploy --prebuilt --environment=preview` desde el directorio aislado preparado.

Antes de ejecutar:

- Comprobar versión y disponibilidad de CLI.
- Confirmar proyecto y equipo.
- Comprobar autenticación.
- Verificar los manifiestos.
- Confirmar que `VERCEL_ENV=preview`.
- Mantener SSO `all_except_custom_domains`.

No utilizar despliegues ordinarios de fuentes.

No utilizar `--prod` en esta etapa.

Esperar a que el deployment alcance READY.

Registrar el identificador, URL y SHA.

## 7. ETAPA 4 — VERIFICACIÓN REAL DEL DEPLOYMENT

No considerar READY como sinónimo de funcionamiento correcto.

Comprobar:

1. Portada `/`.
2. Las 131 rutas originales de las fichas.
3. Recursos `/assets/...`.
4. CSS y JavaScript.
5. Las siete funciones ejecutables.
6. Los endpoints y sus métodos.
7. Configuración de salida.
8. Ausencia de recursos internos de funciones expuestos como archivos estáticos.
9. Protección SSO.
10. Ausencia de asignación de dominios productivos.

INN Puerto Chico debe funcionar en:

`/inn-puerto-chico.html`

No aceptar rutas alternativas bajo `/static/`.

## 8. ETAPA 5 — QA COMPLETO DE LAS 131 FICHAS

Ejecutar controles reales sobre las 131 fichas.

Resoluciones obligatorias:

- 1440 px.
- 768 px.
- 390 px.
- 320 px.

Verificar:

- Ausencia de recorridos virtuales.
- Ausencia de botones y enlaces residuales.
- Correcta composición visual.
- Ausencia de espacios vacíos.
- Galerías fotográficas.
- Planos.
- Videos promocionales.
- Mapas.
- Encabezados y pies.
- Navegación.
- Imágenes y recursos.
- Formularios y campos.
- Enlaces de WhatsApp.

Priorizar:

- INN Puerto Chico.
- Bcome.
- Núcleo Costanera.
- Plaza Las Condes.
- Bordevivo.
- Distrito Centro.

Completar las 131 fichas; no extrapolar resultados de una muestra.

Las pruebas anteriores permanecen como evidencia histórica y no reemplazan el nuevo QA remoto.

No enviar formularios, leads, reservas ni correos reales.

No activar operaciones CRM 360 ni Resend.

## 9. ETAPA 6 — CORRECCIONES ITERATIVAS

Si se detectan incidencias:

1. Identificarlas.
2. Determinar su causa.
3. Corregir el mínimo de archivos necesario.
4. Mantener los cambios comerciales y funcionales ajenos intactos.
5. Ejecutar pruebas de regresión.
6. Actualizar hashes y manifiestos.
7. Crear una nueva Preview privada cuando sea necesario.
8. Repetir las comprobaciones afectadas.

No detenerse por incidencias técnicas que puedan resolverse dentro del alcance autorizado.

No declarar aprobada una etapa con pruebas pendientes.

## 10. ETAPA 7 — PREPARACIÓN PRODUCTIVA

Una vez que la Preview supere todos los controles:

1. Actualizar el PR #27 con las correcciones definitivas.
2. Ejecutar las comprobaciones de integración y revisar el delta respecto de su base.
3. Verificar que no existan cambios ajenos.
4. Preparar el paquete productivo desde los mismos bytes runtime aprobados.
5. Crear un deployment de Production sin asignación automática de dominios, mediante el procedimiento oficial de Vercel.
6. Verificar el deployment preparado y sus funciones.
7. Comprobar las rutas, recursos, protección y configuración productiva.
8. Comparar los hashes y el manifiesto con el candidato aprobado.

No utilizar la promoción de una Preview para asumir que se está publicando exactamente el mismo artefacto probado. Preparar y verificar el artefacto productivo de acuerdo con el procedimiento oficial.

## 11. ETAPA 8 — PUBLICACIÓN DEFINITIVA

Una vez superados los controles productivos:

- Publicar el deployment verificado en `sollahms.cl`.
- Mantener `www.sollahms.cl` correctamente asociado.
- Comprobar ambos dominios.
- Verificar HTTP y HTTPS.
- Comprobar portada y fichas.
- Revisar recursos, funciones y formularios sin enviar datos.
- Confirmar que no existen errores de publicación.
- Registrar el deployment productivo definitivo.

Conservar identificado el deployment anterior como referencia de recuperación.

No ampliar el alcance de la publicación a otras páginas o funcionalidades.

## 12. CRITERIOS DE ACEPTACIÓN PRODUCTIVA

La tarea sólo podrá declararse terminada cuando:

- Las 131 fichas funcionen.
- No existan recorridos virtuales.
- Fotografías, galerías y planos estén preservados.
- Las cuatro resoluciones estén verificadas.
- Las siete funciones estén correctamente registradas.
- Los formularios y contactos conserven su comportamiento.
- No existan errores bloqueantes.
- La nueva versión esté publicada.
- Ambos dominios productivos estén comprobados.
- Los manifiestos y hashes coincidan con el candidato aprobado.

## 13. PROTECCIONES

Esta autorización se limita a la intervención de eliminación de recorridos virtuales y sus correcciones necesarias.

No autoriza:

- Modificar CRM 360.
- Modificar Sollahms AI Lab.
- Alterar credenciales o divulgar secretos.
- Cambiar configuraciones de seguridad sin necesidad técnica demostrada.
- Activar nuevos proveedores.
- Crear gastos o suscripciones.
- Cambiar precios o contenido comercial.
- Modificar páginas educativas o corporativas ajenas.
- Cambiar el sitemap o iniciar campañas SEO/GEO ajenas a esta tarea.

Mantener intactos los controles de privacidad y seguridad.

## 14. CONTINUIDAD AUTÓNOMA OBLIGATORIA

Durante todo el proceso:

- Ejecutar consecutivamente las etapas autorizadas.
- Evitar solicitudes de confirmación repetitivas.
- Resolver autónomamente incidencias dentro del alcance.
- Registrar commits y evidencias.
- No repetir pruebas ya certificadas sin necesidad.
- Actualizar documentación después de cada hito relevante.

Al terminar generar:

`INFORME-CIERRE.md`

`NEXT-PROMPT.md`

El siguiente prompt debe incluir el estado real, deployment definitivo, SHA, pruebas, incidencias y cualquier tarea posterior pendiente.

## 15. ENTREGA FINAL

Entregar un resumen ejecutivo con:

1. Resultado de la eliminación.
2. Número de fichas verificadas.
3. Resultados responsive.
4. Estado de las siete funciones.
5. PR y commits.
6. Deployment final.
7. Fecha y hora de publicación en America/Santiago.
8. Confirmación de funcionamiento de ambos dominios.
9. Comparación de preservación.
10. Enlaces a informe y evidencias.
11. Siguiente prompt completo.

**INSTRUCCIÓN FINAL:**

Completar el ciclo autorizado de corrección, verificación y publicación.

No confundir una Preview READY con una publicación aprobada.

No declarar terminada la intervención hasta que el sitio productivo esté funcionando correctamente y todas las evidencias estén documentadas.