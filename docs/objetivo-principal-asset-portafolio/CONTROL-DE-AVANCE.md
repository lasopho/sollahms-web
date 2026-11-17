# Control del objetivo principal: Asset Portafolio

Última actualización: 17/11/2026. **Objetivo en ejecución**: información comercial confiable y filtros funcionales para los 131 proyectos del universo productivo acordado. La revisión de un PR o la existencia de un dato publicado no completa este objetivo. Este control sustituye la necesidad de que el propietario dirija cada fase.

## Universo y revisión realizada

Se leyeron y clasificaron estructuras existentes de los 131 slugs, con nueve campos esenciales por proyecto, capas, punteros, fechas declaradas y hashes. Esto es reutilización y trazabilidad de antecedentes existentes; no son 131 certificaciones de combinaciones ni evidencia comercial nueva. El registro distingue confirmado, parcial, histórico, contradictorio, desconocido y no aplicable a nivel de fuente/atributo. “Confirmado” sólo tiene el alcance de la referencia citada. Un campo desconocido no impide consultas que no lo requieren.

| Inmobiliaria del catálogo actual | Proyectos |
| --- | ---: |
| AJ Urbana | 5 |
| Crescer | 2 |
| Ecasa | 15 |
| Euro | 21 |
| Ingevec | 16 |
| Leben | 14 |
| León | 5 |
| Maestra | 19 |
| Nollagam | 7 |
| Norte Verde | 18 |
| Sento | 7 |
| Sudamericana | 1 |
| Vesant | 1 |

Fuentes y diferencias de universos: [INVENTARIO-DE-FUENTES.json](INVENTARIO-DE-FUENTES.json). Detalle de los 131: [CLASIFICACION-COMERCIAL-131.json](CLASIFICACION-COMERCIAL-131.json). El denominador es `data/proyectos.json` del SHA técnico `165f918aba402a0eb3313c85e144af2b4a7e8651`; ese archivo es idéntico al publicado y tiene 131 slugs únicos.

- La matriz histórica también tiene 131, pero contiene Patio Brasil y no Vergara Domeyko. El catálogo actual contiene Vergara y no Patio Brasil. No se traslada ni restaura ningún registro.
- La aplicación histórica de auditoría tiene 137. Los seis ajenos al actual son Atelier Prat Oficinas, Box Santiago, Corrientes Oficinas, La Casona de Buin, Patio Brasil y Urbano Centro.
- Leben: 14 etiquetas del catálogo, 13 en su expediente técnico y 12 activos preparados F9. Own vendido queda fuera de la oferta preparada, sin borrar su historia. Parque Germania es el 14º: la comercialización coincidente Leben/ESEPE ya está documentada; la relación societaria no se infiere y no requiere repetir una pregunta al propietario. Verne pertenece a Norte Verde.
- La antigua matriz “pendiente de auditoría” para otras 118 filas no invalida revisiones comerciales posteriores ya existentes; tampoco se declara que esas 118 estén certificadas globalmente.

## Hitos completados y límites

1. Filtros comerciales implementados localmente; referencias compatibles por precio/D/B/superficies, métricas explícitas y desconocidos sin conversiones automáticas. Datos publicados y preparado Leben separados.
2. PR [#32](https://github.com/lasopho/sollahms-web/pull/32) sincronizado y abierto en Draft. Head `165f918aba402a0eb3313c85e144af2b4a7e8651`; base `codex/footer-sin-frase-20261116` / `daf16e7dd560301029357ce79a7af0b0e9a7e67b`.
3. Cuatro defectos F12 corregidos en F13 y revisión independiente F14 cerrada **APROBADO CON OBSERVACIONES**. Cero defectos bloqueantes encontrados en ese delta. Sin checks/reviews de GitHub; su ausencia no es aprobación. [Dictamen verificable](../catalog-data-completeness-20261116/leben/fase14-revision-pr32-20261117/INFORME-FASE14-REVISION-INDEPENDIENTE.md).
4. Los 155 protegidos y las 131 fichas conservan sus hashes; aplicación y fuentes no se editaron durante F14 ni durante esta clasificación documental.
5. Fuentes existentes de los 131 inventariadas; revisión detallada de alcance Euro reutilizada: 21 proyectos, 12 con expediente comercial owner, 11 de esos con 21 valores de precio. Los otros nueve conservan sus revisiones oficiales existentes; no se convierten sus resúmenes en modelos.

## Información recuperada y trabajo en ejecución

Se recuperaron referencias a 21 fuentes estructuradas para clasificación de los nueve campos: tipo, precio, dormitorios, baños, útil, total, entrega, estado y amenities. Se conserva el inventario más amplio de fuentes y documentos previos. Los campos resumen/proyección siguen parciales; ningún `verified` heredado acredita todas las combinaciones. No se asocia un precio “desde” a la superficie menor ni a una unidad distinta.

Euro tiene [registro específico](EURO-FUENTES-Y-ALCANCES.json): 42 referencias de brochures (41 con D/B), cinco modelos de revisión oficial y 21 precios owner tipológicos separados. No existe asociación acreditada precio+modelo+área. Rosas conserva cinco totales utilizables por referencia; seis totales medios de Mapocho son sólo de exhibición. Mapocho A mantiene correspondencia documental no resuelta; el tipo por defecto del importador no es una declaración del propietario. No se modifica su dato publicado.

Leben conserva 454 referencias, incluidas 20 cotizaciones, y dos adicionales Suecia separados. Son documentos, no stock. Las 16 proyecciones administrativas de tipo no son nueva recepción. Cobertura preparada precio+D en diez proyectos, precio+D/B en cinco y precio+superficie en cero. Los 313 IDs pendientes históricos permanecen intactos; no se cuentan avances parciales como cierres.

La clasificación fue contrastada de forma independiente: 21/21 hashes, 3.288 punteros base, 4.329 rutas con índice/campo y 1.100 rutas relativas válidos, cero errores. Ver VERIFICACION-CLASIFICACION-131.json. Se prepararon diecinueve búsquedas agrupadas para los21 Euro en CONSULTAS-ESENCIALES-EURO.json, reutilizando modelos y resúmenes previos.

La investigación específica Iris ya continúa: la ficha Euro Diagonal Vicuña /1104 abrió sin solicitar login y se leyó la unidad235 con precio externo,1D/1B,28,68m² internos y2,08m² terraza. No se equipara interior con útil ni se modifica el precio Sollahms. La evidencia se está registrando en una capa externa independiente. Continúan búsquedas sobre los9 Euro fueraowner12 y faltas esenciales de Maestra/Vesant. No se reabren los PDFs ni exportaciones ya fallidas sin una condición nueva. No se ha solicitado autenticación nueva; acceso público no prueba sesión autenticada.

## Dependencias e intervención selectiva

| Dependencia | Estado y condición de resolución | Trabajo que continúa |
| --- | --- | --- |
| Ready for Review del PR32 | Sin autorización; F14 no pidió aprobación ni cambió Draft. Solicitar permiso concreto sólo al cerrar el paquete revisable. | Reutilización documental y preparación de datos. |
| Merge e integración remota | Sin autorización independiente. No ejecutar. | Desarrollo local posterior cuando exista un cambio necesario y autorizado, sin alterar el candidato durante la revisión. |
| Deployment/publicación/promoción | Sin autorización independiente. No crear previews ni deployments. | QA local pertinente a cambios nuevos y preparación de publicación. |
| Iris | Catálogo y ficha Diagonal accesibles sin login solicitado; eso no acredita sesión autenticada. Si aparece login, abrir Chrome oficial visible y esperar al propietario; no leer ni almacenar credenciales, cookies o tokens. | Revisión documental ajena a la sesión. |
| Leben: precios/estados/entregas ya pendientes del propietario | Conservar las respuestas y preguntas previas F9; Santo L009 y BAUM L013 no se vuelven a solicitar. | Otras referencias, proyectos e inmobiliarias. |
| Conflictos técnicos y alcance de planos | Conservar ambos lados hasta evidencia específica. No bloquean búsquedas que no usan esos campos. | Tipos, ubicaciones y demás campos acreditados. |

No se han creado nuevas solicitudes al propietario a partir de una celda desconocida. Primero Iris, brochures, documentos y respuestas existentes; sólo preguntar por un dato esencial que realmente no pueda recuperarse. Las once discrepancias técnicas, F3-C001 y D-03 se conservan en sus expedientes y no se convierten en impedimentos genéricos para los filtros.

## Pruebas aprobadas y verificaciones pendientes

- Históricas F10: 84/84 Node, 16/16 Chrome, cinco anchos y cuatro vistas.
- Históricas F13: 57/57 motor + 10/10 filtros; 6/6 controles Chrome nuevos. Los cinco grupos nuevos están incluidos en las 57; no sumar subconjuntos. No se repitieron suites certificadas sin cambios.
- F14: lectura independiente y comprobación de hashes (cinco delta, diecisiete PR, once artefactos F13 y 155 protegidos); cero código/pruebas modificados. No se generó build.
- La clasificación de datos no equivale a pruebas de aplicación para los 131. Queda verificar las combinaciones respaldadas al incorporar capas nuevas, con reproducciones específicas ante defectos nuevos, y QA funcional/visual/responsive del resultado autorizado.

## Producción, permisos y seguridad

Producción permanece en `b761ddeaea2fa526870e6af25658046e31b571d7`, deployment `dpl_9b2Fp33LqsL5NuB2p7JLdxx9t9gu`. No se observaron deployments nuevos en la lista consultada. Dominios y SSO no se modificaron. Ramas técnica y documental mantienen exclusión automática de deployments. Main no se toca.

Autorizados: investigación, reutilización, extracción, clasificación, pruebas/correcciones locales necesarias y sincronización documental en la rama existente. No autorizados: Ready, merge, nueva rama/push/PR fuera del permiso específico, deployments, publicación, promoción, dominios, SSO, variables, gastos y acciones irreversibles. Se conserva el checkout original con cambios ajenos. No se modifican CRM360, AI Lab, Resend, formularios, fichas, precios publicados, direcciones, finanzas o funciones; no se ejecutan generadores.

## Criterios de aceptación finales

- Cada uno de los 131 slugs dispone de identidad y procedencia, alcance y estado explícito de los campos esenciales; lo desconocido no se inventa.
- Se incorporan sólo hechos respaldados y compatibles por referencia, etapa/modelo/unidad y métrica. Los datos incompletos permiten únicamente las consultas acreditadas.
- No persisten coincidencias falsas conocidas en las combinaciones implementadas; consultas activas con atributos desconocidos no producen positivos.
- Los filtros y las cuatro vistas pasan las pruebas pertinentes, incluido QA visual y responsive del alcance final.
- La preservación de producción y servicios protegidos queda verificada, y la documentación está sincronizada.
- Integración y publicación se ejecutan sólo con sus autorizaciones, seguidas de comprobación real en producción. Hasta entonces el objetivo sigue abierto.

El siguiente punto de trabajo se conserva en [NEXT-PROMPT.md](../../NEXT-PROMPT.md). Continuar sin pedir al propietario que copie el prompt ni esperar nueva fase para tareas autorizadas.
