# Verificación del catálogo completo — 9 de octubre de 2026

Rama `codex/fichas-proyectos-completas`, creada desde `origin/main` en un worktree independiente. El checkout compartido `codex/site-visual-system-v1` permanece limpio. Los cambios no se fusionan ni se despliegan a producción.

## Cobertura y fuentes

- 148 proyectos reales; 148 fichas desarrolladas: 144 nuevas y 4 destacadas revisadas conservando su estructura.
- 13 inmobiliarias investigadas; 143 fuentes de proyecto identificadas y 5 identidades de etapa aún pendientes.
- 18 proyectos con Matterport, 23 modelos o URLs Matterport/MPEmbed.
- 137 mapas, basados en direcciones oficiales: 133 fichas nuevas y 4 destacadas. Google determina el marcador; no se publican coordenadas estimadas.
- 139 proyectos con fotografías oficiales descargadas; 491 WebP locales con URL, origen, dimensiones y hashes en `data/fuentes-imagenes.json`.
- 62 proyectos con experiencias oficiales enlazadas, 100 instancias y 98 integraciones habilitadas. Las instancias repetidas corresponden a enlaces que la inmobiliaria publica explícitamente para ambas etapas.
- 10 fichas sin campos pendientes; 138 fichas mantienen algún dato pendiente. Este estado describe la evidencia comercial disponible, no la existencia de la página.

El inventario por proyecto y sus fuentes está en [registro-fichas-proyectos.md](registro-fichas-proyectos.md) y en `data/registro-fichas.json`. `data/fichas-proyectos.json` conserva evidencias, notas, fotografías originales, comprobaciones HTTP y verificaciones visuales. El catálogo previo permanece en `data/catalogo-original-fichas.json`; sus precios y datos no corroborados no se publican como actuales.

Etapas sin identidad oficial exacta confirmada:

- Plaza Cervantes - Torre A (`plaza-cervantes`)
- Mapocho 3521 - Edificio A (`mapocho-3521-edificio-a`)
- Froilán Roa 5731 - Torre Norte (`froilan-roa-5731-torre-norte`)
- Froilán Roa 5731 - Torre Sur (`froilan-roa-5731-torre-sur`)
- Lomas de Puyai 3 (`lomas-de-puyai-3`)

Las seis fichas Domeyko, Jofré, Curicó, San Ignacio, Angamos y Mirador La Florida publican rangos de superficies incompatibles entre encabezado y plantas. Se retiraron sus rangos globales útil/total y mínimos de superficie; `surfaceEvidence` conserva 41 plantas individuales. No se consolida un stock que la fuente no acredita. También se corrigieron dirección, precio, entrega y equipamiento de las destacadas cuando la fuente actual difiere del catálogo anterior.

## Pruebas completadas

- `python3 tests/validate-project-details.py`: 148 páginas, 3.284 enlaces internos, 137 mapas, 153 URLs únicas de sitemap. Comprueba fuentes de los embeds, hosts HTTPS permitidos, identidad de modelos, enlaces originales, ubicación verificada, precios pendientes, IDs, contactos y reservas contextuales. Incluye las cuatro destacadas.
- `node --test tests/booking-project-context.mjs`: 6 pruebas aprobadas. Comprueba contexto de proyectos conocidos, payload previo sin proyecto, rechazo de slugs desconocidos/tipos inválidos/claves adicionales y errores del proveedor. Usa un backend simulado; no envía reservas ni correos reales.
- Auditoría HTTP local: 148 fichas, 501 recursos y 296 enlaces contextuales de consulta/asesoría con respuesta 200; sin errores. Registro en [qa/http-verificacion.json](qa/http-verificacion.json).
- Generación repetida de fichas y destacadas: resultados idénticos en 162 archivos de páginas/datos/registro/sitemap/contexto. `git diff --check` aprobado.
- Navegación en navegador: catálogo con 148 enlaces, búsqueda de un proyecto de etapa pendiente, enlace a su detalle y ordenación por UF dejando precios desconocidos al final. Menú móvil abre y cierra; «Consultar proyecto» rellena el asunto correcto; «Agendar Asesoría» muestra el proyecto y el enlace de regreso.
- Escritorio de 1440 píxeles y tamaños 320, 390 y 768: se revisaron ficha residencial, nombre largo/etapa pendiente, parcela, comercial y destacadas. Las 15 combinaciones registradas no muestran desbordamiento horizontal ni imágenes cargadas rotas. Registro en [qa/responsive-verificacion.json](qa/responsive-verificacion.json); la navegación por secciones admite desplazamiento horizontal dentro de su propia barra.
- Matterport: activación real del piloto de Independencia 4745 y del visor existente de Suecia, con escenas 3D renderizadas. Mapa de Independencia 4745 cargado con controles interactivos. Capturas [móvil](qa/movil.jpg) y [Matterport](qa/matterport.jpg).

## Visores y límites comprobados

Se intentaron las 98 URLs únicas inicialmente identificadas. Se revisaron capturas de todos los visores, con reintentos cuando estaban cargando: 95 muestran una escena o una interfaz oficial coherente con el proyecto. La evidencia por URL y sus capturas están en [qa/recorridos-verificacion.json](qa/recorridos-verificacion.json) y `qa/recorridos/`.

Una portada con Play acredita que la experiencia original cargó dentro de la ficha; no demuestra navegación exhaustiva de todas las habitaciones. El registro distingue `valid_interface` de `valid_scene`. Los recorridos conservan un enlace al original y permiso de pantalla completa. No se aceptaron tours de otros proyectos.

- Endémico: la experiencia interior Casa D funciona. Su segundo visor general permaneció vacío después del reintento; queda enlace oficial y disponibilidad pendiente, sin iframe vacío.
- Vista Bulnes: el visor Sentiovr permaneció negro tras espera y también falló un intento con parámetros normalizados. Queda enlace oficial con aviso pendiente. Su experiencia de entorno funciona y permanece integrada.
- HA Strip Center: el enlace antiguo de Lanube360 abrió un portal general de parcelas sin identidad HA/ECASA. Se retiró del conjunto de recorridos del proyecto; se conserva la evidencia en `unavailableVirtualTours` y el pendiente de un enlace propio vigente.
- Los enlaces oficiales que devolvían 404 o DNS inexistente también constan en `unavailableVirtualTours` por proyecto.
- Se observó un error de permiso de sensores en el proveedor Plango de Eleuterio Ramírez; la interfaz/escena cargó. No se concedieron permisos de sensores ni se modificaron protecciones del navegador.
- La comprobación móvil cubre diseño y navegación de las fichas; no se verificó físicamente cada visor en todos los dispositivos. La revisión adicional de visores móviles se vio interrumpida por el timeout del navegador al abrir Sentiovr. Los iframes usan ancho adaptable, pantalla completa y enlace original.

## Datos y ubicaciones pendientes

Hay 34 precios, 52 fechas/condiciones de entrega y 9 direcciones pendientes. También quedan 89 superficies útiles y 53 totales sin corroboración, 7 distribuciones de dormitorios y 14 de baños residenciales. La parcela tiene superficie de terreno verificada. Los campos no aplicables a parcelas/comerciales no se presentan como pendientes residenciales.

11 proyectos mantienen el apartado de ubicación sin mapa, porque falta dirección exacta, comuna o una referencia de acceso inequívoca:

- Reserva Mayor 2 (`reserva-mayor-2`)
- Endémico Pichilemu (`endemico`)
- Plaza Cervantes - Torre A (`plaza-cervantes`)
- Mapocho 3521 - Edificio A (`mapocho-3521-edificio-a`)
- Froilán Roa 5731 - Torre Norte (`froilan-roa-5731-torre-norte`)
- Froilán Roa 5731 - Torre Sur (`froilan-roa-5731-torre-sur`)
- Edificio Verne (`edificio-verne`)
- Jofré 157 (`jofre-135`)
- Edificio Parque Quinta (`parque-quinta`)
- Lomas de Puyai 3 (`lomas-de-puyai-3`)
- Mirador La Florida (`mirador-la-florida`)

La consulta de Jofré conserva el nombre oficial actual y registra la discrepancia de acceso 135/157. Parque Quinta conserva su dirección oficial y deja pendiente la comuna administrativa. Mirador La Florida conserva Calle Eugenia sin inventar el número histórico 14.

## Continuación y regeneración

1. Revisar la inmobiliaria y registrar evidencia específica por campo en `data/fichas-proyectos.json`; declarar `verifiedFields` solo con respaldo oficial. Confirmar etapa y stock antes de reutilizar datos de una ficha general.
2. Actualizar `data/proyectos.json` únicamente con datos corroborados. Para un lote revisado: `python3 scripts/import-project-research.py archivo.json --image-cache ruta-cache`, cuando ese cache de imágenes esté disponible.
3. Ejecutar `python3 scripts/update-featured-verification.py`, `python3 scripts/build-project-details.py`, `python3 tests/validate-project-details.py` y `node --test tests/booking-project-context.mjs`.
4. Comprobar visores, fotos y responsive tras cada cambio sustancial; conservar fuentes, fechas y capturas. El precio representa lo que publica la fuente en la fecha indicada, no una garantía de stock o de condiciones comerciales.

La rama contiene los lotes de desarrollo inicial, Euro/Norte Verde/Nollagam, Maestra/Ecasa/Vesant/AJ/Crescer/Sudamericana, Leben/Ingevec/León/Sento y el cierre de calidad. No quedan páginas por crear; los pendientes se enumeran por ficha para completar su evidencia cuando exista una fuente suficiente.
