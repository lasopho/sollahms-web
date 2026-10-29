# Amenities unificados

Se ajustaron las 131 fichas activas de todas las inmobiliarias. Los 121 grupos
con listas usan un único componente; 813 elementos mantienen el contenido y los
condicionantes propios de cada proyecto. Los avisos de equipamiento por confirmar
se conservan sin convertirlos en prestaciones. Las dos descripciones de
terminaciones redactadas como párrafo se conservan como texto.

## Sistema central

- `data/amenities.json`: nombres homologados, alias de las fuentes y 45 SVG propios.
  Conserva los nueve dibujos de la referencia Plaza Las Condes y agrega 36 del
  mismo lenguaje (gimnasio, cowork, quinchos, mascotas, jardines, juegos,
  seguridad, conserjería, spa, terminaciones y otros equipamientos).
- `scripts/project_amenities.py`: render estático reusable, adaptación de todas
  las estructuras existentes, deduplicación y validación de nombres desconocidos.
- `assets/css/project-amenities.css`: grilla, tipografía, espaciado y geometría.
  Tres columnas en escritorio, dos hasta 900 px y una hasta 520 px. SVG de 26 px,
  trazo 1,5, extremos y uniones redondeados, color `--s-green`, sin deformación.
- `scripts/project_header_b.py`: integración compartida con todos los generadores.
  Los overrides de Plaza Las Condes y Nollagam y el importador Maestra también
  aplican el componente antes de la política final de rótulos de imágenes.
- `tests/amenities.py`: cobertura de las 131 fichas, idempotencia, contrato SVG,
  aliases, condiciones, datos enriquecidos y alta de futuros proyectos.

## Criterio editorial

Laundry Room pasa a Lavandería; Bike Parking y denominaciones genéricas
equivalentes pasan a Bicicleteros; Hall/Lobby a Hall de acceso y lobby;
Sala/Salón E-commerce a E-commerce / Mail Room. Se homologan capitalización,
salones, cowork y nombres simples de servicios. Se preservan cantidades,
azotea/panorama, interior/exterior, equipamiento, horarios y condiciones por unidad.
Bodegas, lockers, lavado de mascotas y spa mantienen su significado específico.

Monjitas 690 tenía dos listas superpuestas. Se conserva la lista enriquecida y
se integra el dato de piscina panorámica. Se elimina la repetición de Sport bar
y los ocho rótulos generales redundantes sin perder cantidades o calificadores.

## Mantenimiento

1. Registrar un amenity verificado en la fuente del proyecto.
2. Agregar su `source`, `label` e `icon` en `data/amenities.json`. Reutilizar un
   icono semánticamente apropiado; si falta, dibujar su SVG dentro del mismo
   `viewBox="0 0 24 24"`, sin relleno, con margen y detalle equivalentes.
3. Ejecutar `python scripts/project_amenities.py` para actualizar todas las fichas.
   El comando también actualiza listas ya estandarizadas cuando cambia el catálogo.
4. Ejecutar `python scripts/project_amenities.py --check` y
   `python tests/amenities.py`. Un rótulo nuevo sin mapeo detiene la generación.
5. Revisar el resultado en escritorio, tablet y móvil antes de publicar.

## Preservación y publicación

`preservation.json` enumera las 131 fichas y sus hashes. El cotejo contra el
commit base confirma que fuera de los bloques de amenities y la hoja de estilos
agregada, el HTML es idéntico. Formularios, enlaces, precios, planos, imágenes,
mapas, cabecera, pie y scripts permanecen iguales.

La publicación usa una superposición de 131 HTML y una hoja CSS sobre el manifiesto
congelado `docs/nollagam-20261028/deployment-files.json`. No reconstruye funciones
desde fuentes históricas. Conserva la sincronización del catálogo de contacto,
la retirada HTTP 410 de Patio Brasil, las rutas y la protección de despliegues.
`deployment-files.json` es el nuevo manifiesto reproducible; `release.json`
registra las verificaciones y los identificadores finales de despliegue.
