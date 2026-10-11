# Revisión de Preview — 9 de octubre de 2026

Rama: `codex/fichas-proyectos-completas`, repositorio `lasopho/sollahms-web`. Trabajo aislado en el worktree de esta rama. Sin merge a `main`, sin promoción ni despliegue a Production.

[**Abrir Preview de la rama**](https://project-wrapp-git-codex-fichas-eb9b71-lsandoval2-8260s-projects.vercel.app/proyectos.html)

El despliegue Git `dpl_FwXjXqkZ1GzKNxoAGv9mSBeCDg4M`, correspondiente a `f1e9162bf98e4697b4c2fa81615c17e807c322cf`, alcanzó `READY` y se probó directamente en Vercel. El commit de cierre añade únicamente documentación y evidencias de esas pruebas; los archivos públicos y handlers no cambian. Vercel actualizará el mismo alias de rama. La identidad del despliegue final se confirma aparte al terminar para evitar una referencia circular al commit de este informe.

## Entornos y acceso a Preview

Vercel mantiene la protección SSO. El GET público sin sesión devuelve 302 hacia Vercel Authentication, como registra [qa/preview-remote-http.json](qa/preview-remote-http.json). La revisión automática había rechazado crear un enlace temporal porque permite compartir una Preview protegida; ese enlace no se creó y no se cambiaron permisos.

La navegación directa al alias final funcionó después en la sesión existente del navegador y permitió completar la revisión remota. No es necesaria una autorización de enlace temporal para las pruebas ya realizadas. Para abrir la Preview en otra sesión puede requerirse inicio de sesión en Vercel.

Se distinguen dos entornos: el paquete estático Preview `dist` servido localmente, con proveedores simulados para éxito, conflictos y fallos; y la Preview alojada en Vercel, revisada directamente en navegador. Las 148 fichas, sus tres tamaños, los 148 contextos de contacto/agenda, los 137 mapas y los enlaces de las 98 integraciones se comprobaron también en el despliegue remoto. [Resumen remoto](qa/preview/remote-summary.json).

La huella de los 665 archivos públicos del paquete revisado es `7f45b893f1291c7f4614e643f7d0075ee6439bca8c6e29870f2ba15c2da171d0`. [Auditoría HTTP y hashes](qa/preview-http.json).

## Resultados

| Comprobación | Resultado y alcance |
| --- | --- |
| Catálogo | 148 proyectos y enlaces a sus 148 fichas. Búsqueda, filtros, resultados vacíos, limpieza y menú móvil funcionales. Orden UF ascendente/descendente correcto; los 33 precios desconocidos permanecen al final. |
| Páginas y recursos | 148 detalles, 508 recursos y 296 enlaces contextuales con HTTP 200 en el paquete local. 13 rutas de código, documentación y datos de investigación inaccesibles en la salida pública. |
| Validación estructural | 148 páginas, 3.285 enlaces internos, 137 mapas y 153 URLs de sitemap aprobados. |
| Responsive completo | Las 148 fichas revisadas tanto localmente como en Vercel a 320, 768 y 1440 píxeles (444 comprobaciones remotas): encabezados correctos, sin desbordamiento horizontal ni imágenes cargadas rotas. No equivale a probar cada visor en un dispositivo físico. |
| Consultar → Agendar | Los 148 proyectos, comprobados también en Vercel, conservan nombre, asunto, título de agenda y regreso a su ficha. También se comprobaron contacto genérico y parámetros inválidos. |
| Formularios/API | 24 pruebas aprobadas: validación de payload, contexto, calendario chileno, errores del proveedor, límites, escape de contenido y bloqueo de envíos Preview. Se revisaron además 153 escenarios de lógica de contacto. |
| Navegador y formularios | Disponibilidad, horario ocupado, error del proveedor, conflicto de reserva y bloqueo Preview correctos. Cambio de hora invalida la disponibilidad anterior. Contacto conserva campos ante error y restaura el asunto contextual tras éxito simulado. En Vercel se consultó disponibilidad y se comprobaron los bloqueos de reserva/contacto con datos ficticios. Ambos mostraron el aviso Preview antes de acceder al proveedor de envío. Ninguna reserva ni mensaje real. |
| Mapas | 137 consultas contrastadas con la dirección oficial; faltan 11 mapas por ubicación insuficiente. En Vercel se activaron los 133 botones de mapa y se comprobaron los 4 iframes de las destacadas: 137 fuentes y enlaces correctos. Se verificó además la carga interactiva de Google Maps en móvil para Independencia 4745. No se atribuye precisión propia al marcador de Google. |
| Recorridos | 98 URLs únicas respondieron HTTP 200. La revisión visual existente confirma 95 interfaces o escenas oficiales; 2 visores siguen pendientes y 1 enlace ajeno fue retirado. Las 98 integraciones (95 URLs únicas activas) coinciden con sus fuentes oficiales en Vercel. Se activaron nuevamente en la Preview remota una escena Matterport de Independencia 4745 en móvil y una escena ECASA de Terratoltén 1 en escritorio. |
| Identidad visual | Se compararon fichas nuevas y la destacada Suecia: jerarquía amplia, fotografías oficiales, espacios, verde `#003229`, dorado `#E9C176`, CTA visibles y navegación adaptable. Las destacadas mantienen su diseño. Se respeta reducción de movimiento. |

Las pruebas se guardan en [qa/preview/](qa/preview/): [validación](qa/preview/details-validation.json), [API](qa/preview/api-tests.txt), [móvil](qa/preview/mobile148.json), [tablet](qa/preview/tablet148.json), [escritorio](qa/preview/desktop148.json), [contextos](qa/preview/context148.json), [catálogo](qa/preview/catalogue.json), [escenarios de formularios](qa/preview/form-scenarios.json) y [registro local sin solicitudes externas del backend](qa/preview/server-journal.json). Las capturas incluyen escritorio destacado/nuevo, Matterport móvil, mapa y formularios. La evidencia remota adicional está en [responsive](qa/preview/remote-responsive148.json), [contextos](qa/preview/remote-context148.json), [mapas/visores](qa/preview/remote-widgets148.json) y [formularios](qa/preview/remote-forms.json). Las capturas con prefijo `remote-` corresponden a Vercel.

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

La revisión local y la revisión remota en la sesión del navegador no detectan errores técnicos abiertos. Los registros de activación no implican navegación exhaustiva por todas las habitaciones ni pruebas físicas de cada visor en todos los dispositivos. Las limitaciones comerciales y los dos visores pendientes permanecen visibles. No se autoriza merge ni publicación en Production con este informe; corresponde revisar la Preview y aprobar después.
