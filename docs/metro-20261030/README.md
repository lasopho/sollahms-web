# Metro — preview 30/10/2026

## Entrega
Preview: https://project-wrapp-9xl2iwg34-lsandoval2-8260s-projects.vercel.app/proyectos.html
Deployment: dpl_9kTURhGgPB471rvhV4PjS73o9Eo5
Código: 9bb3cf3efa84383104d9ba9979cdc99f4d837510
**No promover sin aprobación nueva del propietario.** Producción no se ha modificado durante esta tarea.
Base vigente conservada: teléfono oficial 7b83ea31c7f26307b8109aebf14a10530b6465ec / dpl_DKnCS5UxqJ911mY9dVdcQP9HBciW; incluye León y Sento. main intacta. Rama codex/metro-preview-20261030 con despliegues automáticos desactivados.

## Alcance comprobado
131 proyectos; 100 RM con asociaciones geográficas. 126 ubicaciones físicas de estación, 143 asociaciones estación/línea y 7 líneas operativas. Combinaciones reunidas en un punto. Distancias Haversine redondeadas para presentación, nunca minutos caminando. Se conservan todas las estaciones dentro de 1 km y la más próxima hasta 5 km para información; no se infieren accesos.

Tarjetas/Listado/Mapa/Lista + mapa comparten datos, filtros y orden. Radio geográfico 300/500/800/1000 m; OR entre líneas, prioridad de estación, AND con categorías comerciales. Fichas RM consumen centralmente la misma proyección al aproximarse a ubicación. Controles de capas independientes, geometría diferida, selección mapa/lista, navegación sin GPS. Se corrigió la persistencia de vista al regresar mediante el enlace de la ficha.

## Fuentes y actualización
- Coordenadas y geometrías: https://geoide.minvu.cl/server2/rest/services/INFORMACION_EXTERNA/Metro/MapServer (capas 0 y 1). Respuestas originales en este directorio.
- Nombres e identificadores operativos: selector oficial https://www.metro.cl/ (143 opciones, agrupadas por línea), exportado en metro-official-stations.json.
- MINVU conserva nombres provisionales y estados históricos: build-metro-network.py los concilia con los nombres/identificadores oficiales, incluyendo extensiones L2/L3 ya abiertas. No interpretar el antiguo campo PROYECTADO como estado actual.
- L7: https://www.gob.cl/noticias/avances-linea-7-metro-santiago-nueva-estacion-parque-araucano/
- L9: https://www.gob.cl/noticias/comienzo-obras-linea-9-metro-santiago-trayecto-inicio-operaciones/
- L8 RCA: https://www.bcn.cl/leychile/navegar?idNorma=1224602
- DTPM GTFS vigente consultado: https://www.dtpm.cl/index.php/gtfs-vigente ; no usado como fuente geométrica.
- Base del mapa existente: OpenStreetMap, atribución conservada. Geometrías MINVU con identificadores OSM y crédito ODbL. Sin logos ni plano esquemático de Metro.

Actualizar las respuestas oficiales archivadas, revisar estados y nombres, ejecutar python scripts/build-metro-network.py y node scripts/build-metro-connectivity.mjs, luego tests/metro.test.mjs. Las dos regeneraciones se comprobaron deterministas. No ejecutar generadores comerciales históricos ni sobrescribir precios autorizados.

## Pendientes explícitos
No existen rutas peatonales ni accesos oficiales verificados en este lote; medición/tiempo caminando están deshabilitados. Política del servicio público de rutas revisada en https://routing.openstreetmap.de/about.html: no usarlo para extracción masiva ni equiparar línea recta a caminata. Se necesita un proveedor/dataset compatible y accesos revisados para habilitar rutas.
L7/L8/L9 tienen metadatos contextuales, no estaciones o trazados precisos aprobados para esta vista; capas futuras deshabilitadas. No se inventaron coordenadas.
No se encontró licencia explícita de reutilización en el servicio MINVU. Antes de publicación pública debe aclararse su alcance o sustituirse por una fuente con permiso inequívoco. Este candidato protegido no es una autorización de uso general.

## Validación
1390 comprobaciones Metro; 10 pruebas del motor existente. AJ 77, ECasa 194, Sento 85, León 139 comprobaciones satisfactorias.
13 recursos de runtime HTTP200 y contenidos iguales al candidato (HTML únicamente añade la barra oficial Vercel Preview).
Chrome real: escritorio1440x1000, móvil390x950, tablet768x1024. Sin desbordamiento horizontal móvil/tablet. La Florida + hastaUF4500 + L4/L5 + radio800m devuelve16 de131 en todas las vistas; selección DonPepe154 sincronizada; ficha muestra VicenteValdés180m en línea recta; regreso conserva filtros y vista; limpiar restablece131; otras regiones ocultan controles Metro. Capas, zoom de teclado, enlaces y ausencia de errores de consola revisados. No se enviaron formularios.
Se reutilizan evidencias de funciones/media/comercio inalterados. No se afirma una prueba exhaustiva de todos los dispositivos ni una validación de rutas peatonales inexistentes.

## Paquete y recuperación
deployment-files.json contiene el paquete congelado exacto de1632entradas. Diferencia contra producción:13 recursos estáticos (7nuevos) y configuración/hashes. Funciones, datos comerciales, media y protecciones Sento idénticos. No se reconstruyó el árbol público indiscriminadamente.
Revisar alias de producción otra vez antes de cualquier futura promoción. Recuperación de producción disponible en dpl_DKnCS5UxqJ911mY9dVdcQP9HBciW; no se necesitó rollback porque no se promovió.
Capturas reales desktop.jpg y mobile.jpg, no simulaciones.
