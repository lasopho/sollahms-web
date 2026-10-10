# Navegación del comparador: integración posterior

La rama `codex/fichas-proyectos-completas` utiliza el menú principal «Expertise», «Asset Portafolio», «Contacto». «Asset Portafolio» enlaza a `/proyectos.html`; «Agendar Asesoría» conserva su destino y contexto. El menú se aplica tanto en escritorio como en móvil.

El comparador hipotecario no existe en esta rama. La auditoría de sólo lectura encontró `comparador-hipotecario.html` exclusivamente en `codex/comparador-hipotecario` (referencia inspeccionada `fb018398`). No se modificó ese checkout ni se fusionaron ramas.

Al integrar posteriormente el comparador:

1. En su navegación principal de escritorio y móvil, renombrar «Proyectos» como «Asset Portafolio», conservando `/proyectos.html` como destino y los estilos de enlace.
2. Ajustar ambas variantes a las tres opciones solicitadas: «Expertise», «Asset Portafolio», «Contacto». La opción actual «Hipotecario» del menú superior deberá retirarse al reconciliar esa navegación; el contenido, los accesos fuera de ese menú y las funcionalidades del comparador se conservan.
3. Mantener el botón de agendamiento y su destino existente; comprobar anchos móviles, teclado, apertura/cierre y enlaces.
4. No traer los archivos, lógica, datos ni estilos del comparador a la rama de fichas para efectuar este ajuste. Hacerlo en la integración autorizada posteriormente y repetir las pruebas del comparador en su versión vigente.

Esta nota documenta un cambio pendiente para la integración; no declara implementada ni probada la navegación del comparador en la Preview de fichas.
