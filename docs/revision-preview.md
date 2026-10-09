# Revisión de Preview — 9 de octubre de 2026

Rama: `codex/fichas-proyectos-completas`, repositorio `lasopho/sollahms-web`. Trabajo aislado en el worktree de esta rama. Sin merge a `main`, sin promoción ni despliegue a Production.

[**Abrir Preview de la rama**](https://project-wrapp-git-codex-fichas-eb9b71-lsandoval2-8260s-projects.vercel.app/proyectos.html)

El despliegue Git de Vercel correspondiente a `eb587fe6820fc7fa3a7ba7a56ef12c7246a65959` alcanzó `READY`, con destino Preview y alias exclusivo de esta rama. El siguiente commit de cierre contiene la corrección adicional de contacto y estas evidencias; Vercel actualizará el mismo alias. La identidad del despliegue final se confirma aparte al terminar, para evitar incluir una referencia circular al commit de este documento.

## Alcance y bloqueo de acceso remoto

Vercel protege esta Preview con SSO. La apertura directa en navegador llegó al inicio de sesión. La revisión automática de permisos rechazó `vercel_web_fetch_vercel_url`: crear o reutilizar un enlace temporal permite compartir el acceso a una Preview protegida, y requiere autorización específica. La autorización se pidió y permanece pendiente. No se cambió la protección del proyecto ni se aplicó un método alternativo para eludirla.

Las comprobaciones HTTP y de navegador de este informe usan el **paquete estático Preview `dist` servido localmente**, con los mismos archivos públicos que produce Vercel. Los handlers de formularios se ejecutaron con proveedores simulados. No se atribuyen estas pruebas al despliegue remoto autenticado. El build remoto y sus logs sí se comprobaron mediante Vercel. Antes de dar por cerrada la verificación remota debe probarse el alias protegido con acceso autorizado.

La huella de los 665 archivos públicos del paquete revisado es `7f45b893f1291c7f4614e643f7d0075ee6439bca8c6e29870f2ba15c2da171d0`. [Auditoría HTTP y hashes](qa/preview-http.json).

## Resultados

| Comprobación | Resultado y alcance |
| --- | --- |
| Catálogo | 148 proyectos y enlaces a sus 148 fichas. Búsqueda, filtros, resultados vacíos, limpieza y menú móvil funcionales. Orden UF ascendente/descendente correcto; los 33 precios desconocidos permanecen al final. |
| Páginas y recursos | 148 detalles, 508 recursos y 296 enlaces contextuales con HTTP 200 en el paquete local. 13 rutas de código, documentación y datos de investigación inaccesibles en la salida pública. |
| Validación estructural | 148 páginas, 3.285 enlaces internos, 137 mapas y 153 URLs de sitemap aprobados. |
| Responsive completo | Las 148 fichas revisadas en navegador a 320, 768 y 1440 píxeles: encabezados correctos, sin desbordamiento horizontal ni imágenes cargadas rotas. No equivale a probar cada visor en un dispositivo físico. |
| Consultar → Agendar | Los 148 proyectos conservan nombre, asunto, título de agenda y regreso a su ficha. También se comprobaron contacto genérico y parámetros inválidos. |
| Formularios/API | 24 pruebas aprobadas: validación de payload, contexto, calendario chileno, errores del proveedor, límites, escape de contenido y bloqueo de envíos Preview. Se revisaron además 153 escenarios de lógica de contacto. |
| Navegador y formularios | Disponibilidad, horario ocupado, error del proveedor, conflicto de reserva y bloqueo Preview correctos. Cambio de hora invalida la disponibilidad anterior. Contacto conserva campos ante error y restaura el asunto contextual tras éxito simulado. Ninguna reserva ni mensaje real. |
| Mapas | 137 consultas contrastadas con la dirección oficial; faltan 11 mapas por ubicación insuficiente. Se verificó la carga interactiva de Google Maps en móvil para Independencia 4745. No se atribuye precisión propia al marcador de Google. |
| Recorridos | 98 URLs únicas respondieron HTTP 200. La revisión visual existente confirma 95 interfaces o escenas oficiales; 2 visores siguen pendientes y 1 enlace ajeno fue retirado. Se activaron nuevamente una escena Matterport de Independencia 4745 en móvil y un recorrido ECASA de Terratoltén 1. |
| Identidad visual | Se compararon fichas nuevas y la destacada Suecia: jerarquía amplia, fotografías oficiales, espacios, verde `#003229`, dorado `#E9C176`, CTA visibles y navegación adaptable. Las destacadas mantienen su diseño. Se respeta reducción de movimiento. |

Las pruebas se guardan en [qa/preview/](qa/preview/): [validación](qa/preview/details-validation.json), [API](qa/preview/api-tests.txt), [móvil](qa/preview/mobile148.json), [tablet](qa/preview/tablet148.json), [escritorio](qa/preview/desktop148.json), [contextos](qa/preview/context148.json), [catálogo](qa/preview/catalogue.json), [escenarios de formularios](qa/preview/form-scenarios.json) y [registro local sin solicitudes externas del backend](qa/preview/server-journal.json). Las capturas incluyen escritorio destacado/nuevo, Matterport móvil, mapa y formularios.

El HTTP 200 de un visor confirma el documento, no todas sus habitaciones. La evidencia visual por URL sigue en [qa/recorridos-verificacion.json](qa/recorridos-verificacion.json). Endémico (visor general) y Vista Bulnes (Sentiovr) conservan enlace oficial y aviso pendiente, sin iframe vacío. El enlace antiguo de HA Strip Center sigue retirado porque abría un portal general de otro contenido.

## Correcciones realizadas

- Añadida configuración Vercel con salida pública explícita: HTML, assets y catálogo; APIs empaquetadas aparte. Preview añade `noindex`, `robots.txt` restrictivo y aviso de formularios.
- Reservas y contacto devuelven `preview_read_only` en Preview antes de acceder a proveedores, incluso con credenciales configuradas. El comportamiento Production se comprobó exclusivamente con un proveedor simulado.
- Corregidos los dos enlaces «Agendar Asesoría» de contacto para conservar el proyecto validado. El asunto contextual se restaura después de `form.reset()` y se respeta el asunto personalizado antes del envío.
- Confirmada Plaza Cervantes Torre A y añadida su fotografía oficial. Las otras cuatro etapas mantienen los datos comerciales pendientes.

## Revisión de las cinco identidades

| Proyecto | Evidencia oficial y decisión |
| --- | --- |
| Plaza Cervantes Torre A | [Campaña vigente de Maestra](https://maestra.cl/promocion-gastos-operacionales/), anunciada del 01 al 31 de octubre de 2026, identifica la Torre A, La Cisterna y entrega inmediata. Publica dos valores desde UF 2.327 y UF 2.527 sin vincularlos a tipologías. Se registra el mínimo anunciado con nota visible; stock y condiciones pendientes. Dirección, planos, fecha efectiva y recorrido no se tomaron de otra torre. |
| Mapocho 3521 Edificio A | [Landing oficial histórica de Euro](https://landing.euroinmobiliaria.cl/bancasantander) menciona Torre A/unidad 508A, en campaña vencida de agosto de 2025. La equivalencia con «Edificio A» y el acceso actual no están acreditados. Se conserva pendiente y no se reutilizan precios históricos ni datos del proyecto general. |
| Froilán Roa 5731 Torre Norte | [Proyecto oficial](https://www.euroinmobiliaria.cl/proyectos/froilan-roa-5731) y [brochure](https://euroinmobiliaria.cl/storage/219/Brochure-Froilan-Roa.pdf) describen dos torres sin identificar Norte/Sur. No se atribuyen precio ni entrega del conjunto a esta etapa. |
| Froilán Roa 5731 Torre Sur | Mismas fuentes oficiales; correspondencia de torre pendiente. No se transfieren datos del distinto proyecto Ingevec Froilán Roa 5746. |
| Lomas de Puyai 3 | El [catálogo oficial ECASA](https://ecasa.cl/proyectos) permite identificar Puyai y Puyai 2, pero no confirma la etapa 3. Los datos de terceros no se usan para completar identidad, ubicación o precio. |

Fuentes, fragmentos, campos corroborados y notas se conservan en `data/fichas-proyectos.json`; el [inventario de las 148 fichas](registro-fichas-proyectos.md) mantiene todos los pendientes por proyecto.

## Pendientes restantes

148 fichas desarrolladas; 144 con fuente identificada y 4 identidades exactas pendientes. Hay 18 proyectos con Matterport, 137 con mapa, 140 con fotografías oficiales (492 archivos) y 62 con alguna experiencia oficial enlazada.

138 fichas contienen algún campo pendiente: 33 precios, 52 fechas/condiciones de entrega y 9 direcciones, además de superficies, equipamiento o disponibilidad omitidos por sus fuentes. Hay 11 proyectos sin mapa y 2 visores con disponibilidad visual pendiente. [Resumen de cantidades](qa/resumen.json).

La revisión local no detecta errores técnicos abiertos. **La comprobación funcional del despliegue remoto protegido sigue pendiente de acceso autorizado.** No se autoriza merge ni publicación en Production con este informe; corresponde revisar la Preview y aprobar después.
