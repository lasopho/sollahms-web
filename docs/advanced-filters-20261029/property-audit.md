Auditoría de propiedades para filtros avanzados

131 proyectos y 13 inmobiliarias normalizados, sin modificar aplicación ni precios.

- 747 filas respaldadas; 726 elegibles para la etapa de referencia. Cada fila conserva sus propios dormitorios, baños, superficies y evidencia.
- 62 proyectos tienen pares dormitorios/baños; 52 también tienen superficie tipada en esa misma fila. Los rangos agregados no se cruzan para fabricar modelos.
- Fechas: 17 proyectos con año verificable (2027, 2028, 2029), 62 con entrega inmediata verificable. Las fechas residenciales de Verne e Irarrázaval siguen excluidas. Estados NV no confirmados por la actualización comercial se conservan como reportados, sin llave de filtro confirmada.
- Sento usa sento-review; León usa leon-plan-surfaces; Plaza usa plaza-las-condes-verified. Unidades privadas del propietario quedan fuera del índice.
- Nollagam conserva 113 variantes y decimales originales. Interior no se convierte en Útil. Sellos históricos no son stock.
- Etapas excluidas de la referencia: nucleo-costanera: 8, terratolten: 5, alto-san-joaquin: 8. No se mezcla una superficie de otra etapa con el precio desde del catálogo.
- Endémico documenta casas con Interior separado de Útil; Reserva Mayor 2 conserva un mínimo de terreno, sin inventar máximo ni lote exacto.
- Locales no heredan baños ni superficies residenciales; Verne Oficinas no entra en la ficha residencial.
- Jardín/patio privado sólo con evidencia enlazada: inn-puerto-chico, eleuterio-ramirez. La característica aislada de proyecto no se cruza con dormitorios. Áreas verdes o rooftop común no equivalen a jardín/terraza privada.
- Tipo de propiedad exige evidencia explícita del proyecto. Dormitorios/Residencial solos no establecen Departamento. Cada prueba guarda regla, fragmento y puntero. Tipos pendientes: alto-buzeta, plaza-cervantes, mapocho-3521-edificio-a, froilan-roa-5731-torre-norte, froilan-roa-5731-torre-sur, parque-germania, own, monjitas-690.

Regeneración
`python build_filter_property_audit.py --root RUTA_FUENTE --output RUTA_JSON --report RUTA_MD`

El generador lee las fuentes primarias en cada ejecución; el JSON es una proyección derivada. No contiene precios nuevos. Se validaron 1553 punteros resolubles y la coherencia de filas comerciales.
