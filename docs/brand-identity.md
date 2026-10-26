# Identidad oficial Sollahms

Referencia aprobada por el propietario: captura del 26/10/2026, 09:55:21.
El logo es **Sollahms.**, sin eslogan: letras verde **#003229**, punto **#E9C176**.
Su forma procede del Manrope original del sitio, peso 800, tracking -0.065em.
Los contornos se extrajeron del WOFF2 existente; no se calcaron píxeles ni se
sustituyó la fuente. `docs/unified-logo-20261026/master.json` registra su hash.

- Maestro transparente: `assets/branding/sollahms-logo.svg`.
- Contraste sobre verde: `sollahms-logo-light.svg`, mismos nueve contornos y
  proporciones, letras **#EEF3EE**, punto dorado. No es otra composición.
- Favicon: la misma S, clara sobre verde. No comprimir el nombre completo.
- `scripts/build-brand-assets.py` exporta ambos logos y favicon desde una sola
  definición. Sus dependencias son herramientas locales de autoría, nunca
  dependencias del sitio ni de las funciones.
- `assets/css/sollahms-brand.css` fija ancho 114px (104px móvil), relación
  860:162 y altura automática. Respetar el espacio libre incluido en el SVG.
  No aplicar filtros, recortes, sombras, espaciado tipográfico o estiramientos.
- Enlace hacia `/`, nombre accesible **Sollahms**, imagen decorativa dentro
  del enlace. El foco de teclado permanece visible.
- `scripts/brand_identity.py` integra el recurso en páginas y plantillas;
  `scroll_presence.py` lo aplica al generar fichas sin cambiar la animación.
  No reintroducir logos escritos con fuentes del navegador.
- La mención de la empresa en títulos, párrafos, copyright y textos legales
  es contenido, no una versión alternativa del logo. Se conserva ese contenido.

WhatsApp/redes: `og-sollahms-square-v3.png`, 1254×1254. Conserva el fondo,
la composición, los márgenes y la línea editorial separada de la imagen
aprobada. Sólo cambia el rectángulo del antiguo logo. El exportador comprueba
que todos los píxeles exteriores permanecen idénticos al original decodificado.
El SVG maestro no contiene esa línea editorial ni ningún eslogan.
La organización en JSON-LD apunta al maestro transparente. Las imágenes
históricas sin referencias activas quedan recuperables en Git y Vercel.

Validar con `python scripts/verify-brand-identity.py`, revisión real de cabecera
y pie en escritorio/móvil y comprobación de los recursos públicos tras publicar.
