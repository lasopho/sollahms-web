# Identidad visual de Sollahms

Referencia: portada aprobada publicada en `dpl_7ynhuaYPMN3VryB73zFLq5m6TJDE` (fuentes `047c3f03b59b9421ad23f995d1986e683d89ce01`). La implementación compartida es `assets/css/sollahms-theme.css`, cargada al final de las 141 páginas públicas y de las plantillas.

## Colores y usos

| Token `--s-` | Valor | Uso |
|---|---|---|
| green | `#003229` | Marca, títulos, texto principal, botones primarios, selección y éxito |
| green-hover | `#145849` | Interacción sobre verde; derivado del brillo de la portada |
| green-deep | `#00291F` | Extremo oscuro del degradado aprobado |
| gold | `#E9C176` | Botones de asesoría, acentos y líneas de jerarquía |
| gold-hover | `#FFDEA5` | Interacción sobre botones dorados |
| gold-ink | `#806228` | Texto dorado sobre superficies claras; no usar el dorado claro como texto sobre blanco |
| white | `#FFFFFF` | Paneles, controles y texto sobre verde |
| canvas | `#F8F9FF` | Fondo de página aprobado |
| soft | `#EEF3EE` | Superficies secundarias, hover suave, información y éxito |
| section | `#F5F7F3` | Sección de asesoría |
| muted | `#4B6059` | Texto secundario y ayudas legibles |
| line | `#CDD7CF` | Separadores y bordes decorativos |
| field-line | `#81948B` | Bordes de controles interactivos; contraste >=3:1 sobre blanco |
| on-dark | `#EEF3EE` | Texto secundario sobre fondos oscuros |
| error / error-soft | `#994025` / `#FFF6F1` | Errores: texto, borde y superficie; conservar siempre mensaje textual |
| warning-soft | `#FFFAF0` | Condiciones y pendientes comerciales; texto oscuro |
| disabled | `#EDF0ED` | Controles deshabilitados, con texto muted y sin transparencia |

El degradado `--s-hero` conserva exactamente la composición de la portada: radial verde `rgba(20,88,73,.42)`, radial dorado `rgba(233,193,118,.08)` y fondo de 155 grados de green a green-deep. Las fotografías conservan su geometría; `--s-photo-shade` refuerza el verde detrás de los títulos sobre imagen para sostener su legibilidad. No recolorear logos, fotografías, renders ni planos de terceros.

## Formas y jerarquía

- Radio común de **8 px** en botones, campos, tarjetas y paneles; **4 px** en etiquetas y avisos pequeños. Mantener círculos y cápsulas cuando su forma comunique un elemento circular.
- Escala compartida de espacios **8, 16, 24 y 32 px**. Conservar las grillas, puntos de quiebre y tamaños de texto de cada página; no forzar todas las fichas a una sola estructura.
- Panel blanco, borde line, acento superior gold en asesoría. Sombra normal `0 10px 32px rgb(0 50 41 / .04)`; hover `0 16px 40px rgb(0 50 41 / .08)`; encabezado `0 18px 54px rgb(0 50 41 / .08)`.
- Inter para lectura y Manrope para títulos, respetando las fuentes ya utilizadas.
- Foco de teclado de 3 px verde con separación blanca de 3 px: visible sobre fondo claro y oscuro. En navegación horizontal, anillo interior para evitar recortes. En colores forzados, usar Highlight/GrayText/CanvasText.
- El verde señala selección, acción principal y éxito; el rojo identifica errores. Los estados no se comunican únicamente mediante color: conservar mensajes, `aria-invalid`, `aria-pressed`, `disabled` y `aria-busy` existentes.

## Movimiento

- Transición común **220 ms**, rápida **160 ms**, curva `cubic-bezier(.22,.61,.36,1)`.
- Transicionar color, fondo, borde y sombra; no animar el tamaño o posición de campos.
- Tarjetas de portada: elevación máxima **2 px**, sin zoom de fotografía. Diagrama decorativo: respiración suave de 7 s con amplitud de 2 px, sin ocultar texto.
- `prefers-reduced-motion: reduce`: eliminar animaciones, transiciones y desplazamiento suave, y evitar elevación al pasar el cursor. **No eliminar transformaciones de composición** que centran los rótulos del diagrama.
- Desvanecimiento compartido al desplazarse mediante `scroll-presence.js`: sólo opacidad en los bordes de la pantalla, sin cambiar posiciones ni tamaños; opacidad completa en el área de lectura. Formularios, navegación, paneles financieros y estados permanecen estáticos. Sin JavaScript, con movimiento reducido, al imprimir, con colores forzados o al enfocar un elemento, el contenido permanece visible.
- Carga: cursor de progreso y mensaje existente. Deshabilitado: cursor no permitido y superficie estable; no ocultar el texto con opacidad.

## Conservación

Los nombres del menú de portada son literalmente **Expertise · Asset Portafolio · Contacto**. Los encabezados de Contacto y Asesoría también conservan esos nombres aprobados; se sustituyen allí los rótulos antiguos Servicios/Proyectos, sin cambiar destinos. Los archivos HTML conservan los demás contenidos, enlaces de navegación, formularios, scripts, metadatos, JSON-LD y medios. Los cambios se limitan a CSS y sus enlaces versionados. No modificar el catálogo, los datos comerciales, UF, cálculo, consentimiento, agenda ni presentación de WhatsApp para resolver un problema visual.

Antes de publicar, comparar las 141 páginas con la versión base ignorando únicamente estilos y enlaces CSS; revisar las familias de fichas en escritorio y móvil. Mantener los despliegues automáticos desactivados y publicar manualmente el paquete validado, conservando las funciones exactas de producción.
