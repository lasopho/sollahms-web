# Direcciones al mapa — 2026-10-26

**Publicado y verificado:** https://sollahms.cl/proyectos.html — código `5885616a4621d5e562f78bca0b09485a59211862`, deployment `dpl_B5M5RA5Jxh8aoAEo1EQUezyAhLVW` (READY). 126 de 132 proyectos ubicados. Ver `release.json`, `browser-qa.json`, `public-checks.json` y las capturas reales de escritorio y móvil. El rollback anterior permanece READY.

Base exacta: producción `dpl_28hHJhKMBo2x9WLsGULRxKpHaUf2`, runtime `c9fb22a4ac378a0149329b37e431b4ec5d80d66a`, fuentes/evidencias `e9e533071effc5da44112e3fda9ec34b276dc9bd`.
Rama independiente `codex/catalog-address-pins-20261026`. Main conservada en `86e200ec191b38af355061e21bc0fc1e549cce3b`; despliegues Git desactivados, incluida esta rama.

## Alcance
126 de 132 proyectos ubicados (62 incorporaciones; antes 64). Los seis restantes conservan tarjeta, listado y ficha. `pending-locations.json` explica el impedimento específico: no se exige precisión de puerta ni de torre, pero no se aceptan centros de calle/comuna o puntos contradictorios a cientos de metros. La tolerancia del propietario no constituye una medición de exactitud de dos metros.

Se conserva sin cambios `data/proyectos.json`, todas las fichas y datos comerciales. Solo cambian en el artefacto público `data/project-locations.json` y `assets/js/catalog-map.mjs`: puntos, dirección del conjunto cuando la ficha carece de dirección propia e indicación discreta de ubicación referencial. 1.155 de 1.157 archivos runtime, incluidas todas las funciones, idénticos a producción.

## Procedencia y criterio
- Direcciones existentes del propietario, fichas, brochures auditados y enlaces de ubicación publicados por las inmobiliarias.
- Consultas estructuradas puntuales a Nominatim: un hilo, una máquina, intervalo mínimo de 1,2 s, User-Agent identificable, caché persistida. Sin geocodificación de visitantes. Política: https://operations.osmfoundation.org/policies/nominatim/ . Geocodificación OSM bajo ODbL; atribución conservada en sitio y registros.
- Coordenadas propias de Vesant y ubicaciones publicadas para anuncios identificados en Andrássy/Cliperty, Enlace Inmobiliario, SJGroup, RGL y Best Place to Live. No se copian precios, disponibilidades ni contactos de esos portales.
- `accepted-locations.json`, `broker-location-evidence.json`, `additional-location-evidence.json` y las revisiones de fuentes permiten reproducir cada decisión.
- `status: verified` significa correspondencia revisada de proyecto/dirección. `precision` distingue punto de dirección estimado, centro de edificio y referencia publicada de proyecto; no representa un levantamiento topográfico.
- No se consultan APIs de Google con credenciales ajenas ni se descargan resultados de Google Maps para generar la base. Se descartan centros `@`/`!2d` de cámara, oficinas comerciales y puntos de interés. Los enlaces de destino publicados por el titular se revisan por identidad.
- Plaza Cervantes A/B, Mapocho general/A y Froilán Roa Norte/Sur comparten coordenada del conjunto y permanecen seleccionables. No se inventan separaciones entre torres.
- Se mantienen las comunas comerciales existentes de Parque Quinta, Quintavista, Origen Atacama y Centenario; las diferencias administrativas de OSM quedan en la evidencia. No se modifica información comercial por inferencia.

## Verificación y despliegue
20 pruebas automatizadas: integridad de 132 registros, puntos anteriores intactos, procedencia, etapas coincidentes, filtros/orden/vistas y descarte de homónimos. Pruebas reales de navegador y resultado de publicación se guardan en `browser-qa.json` y `release.json`.

`prepare-release.py` reutiliza los archivos inmutables ya publicados; `copy-build.mjs` verifica SHA-256 de los 1.157 archivos antes de producir Build Output API. Preview y producción reciben el mismo artefacto. No se envían formularios ni correos.

Rollback autorizado: `request_rollback` del mismo proyecto/equipo hacia `dpl_28hHJhKMBo2x9WLsGULRxKpHaUf2`, verificado READY antes de publicar. No se eliminan versiones anteriores ni se debilita Deployment Protection.
