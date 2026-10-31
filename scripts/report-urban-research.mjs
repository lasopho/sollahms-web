import fs from 'node:fs';
import {publicWorks,relationshipsFor,distanceLabel,statusLabel} from '../assets/js/urban-works-model.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const dir='docs/entorno-20261031/';
const data={...read('data/urban-development.json'),projects:read('data/proyectos.json'),locations:read('data/project-locations.json')};
const audit=read(dir+'catalog-coverage.json');
const works=publicWorks(data),rels=works.flatMap(w=>relationshipsFor(data,w.id).map(r=>({...r,workName:w.name})));
fs.writeFileSync(dir+'verified-relationships.json',JSON.stringify(rels,null,2)+'\n');
const lines=[
'# Entorno y desarrollo urbano — revisión del catálogo completo',
'',
'**Corte: 31 de octubre de 2026. Preparado para revisión; no publicado en producción.**',
'',
`Se concluyó una revisión documental de **${audit.reviewedProjects}/${audit.totalProjects} proyectos**, en ${new Set(audit.projects.map(p=>p.region)).size} regiones. El registro público contiene **${works.length} obras verificadas y ${rels.length} relaciones**, correspondientes a **${audit.projectsWithRelationships} proyectos**. Las búsquedas se organizaron por comuna y sector, con una evaluación individual de cada dirección.`,
'',
'La cobertura completa significa que no quedan proyectos sin revisar en este ciclo. **No significa que se hayan identificado todas las inversiones existentes ni que todas las coordenadas heredadas se hayan verificado nuevamente.** Los candidatos que no cumplen el respaldo o la precisión necesarios quedan excluidos de las asociaciones y documentados como pendientes de evidencia.',
'',
'## Entregables y control de cobertura',
'',
'- [Resultado de los 131 proyectos](COBERTURA.md).',
'- [Registro individual: búsquedas, fuentes, justificaciones y pendientes](catalog-coverage.json).',
'- [Auditoría independiente de ubicaciones](location-review.json).',
'- [Relaciones y distancias calculadas](verified-relationships.json).',
'- [Pruebas ejecutadas](tests.txt) y [preservación del paquete](package-checks.json).',
'- [Datos únicos utilizados por fichas, mapa y filtros](../../data/urban-development.json).',
'',
'| Resultado | Proyectos |','| --- | ---: |',
`| Con relaciones verificadas incorporadas | ${audit.outcomes.reviewed_verified||0} |`,
`| Revisados sin asociación admitida | ${audit.outcomes.reviewed_no_verified||0} |`,
`| Revisados con ubicación bloqueada | ${audit.outcomes.location_blocked||0} |`,
'',
'“Sin asociación admitida” no significa ausencia de obras: puede existir una inversión documentada cuya geometría, acceso o relación territorial no permite incorporarla a la ficha.',
'',
'## Ubicaciones y restricciones',
'',
'La auditoría conserva las direcciones, coordenadas y procedencia del catálogo. Se comprobó integridad e identidad de los 131 registros, con revisión documental focalizada de anomalías; no se hizo un levantamiento topográfico ni una nueva geocodificación integral. Cuatro registros carecen de dirección precisa y Vicuña Mackenna 7589 presenta una discrepancia con coordenadas del expediente SEA. Se bloquean nuevas asociaciones, sin alterar datos comerciales ni corregir por inferencia:',
'',
...audit.blockedProjectSlugs.map(slug=>'- '+data.projects.find(p=>p.slug===slug).nombre+' (`'+slug+'`).'),
'',
'Pintor Cicarelli III conserva una alerta de precisión registrada en la auditoría. No se afirma que el punto sea erróneo sin evidencia suficiente.',
'',
'## Método y alcance',
'',
'- Se revisaron transporte, vialidad, salud, educación, parques, equipamiento e inversiones privadas por zona. Se priorizaron organismos públicos, expedientes y responsables de inversión. Las consultas y resultados están en el registro individual.',
'- Las aprobaciones ambientales, compras de terrenos, licitaciones, adjudicaciones y anuncios se distinguen de las obras en ejecución. La adquisición del terreno Hospital Zona Norte no se presenta como financiación de la construcción del hospital.',
'- Distancias geográficas mediante Haversine para puntos y menor distancia a segmentos para perímetros y trazados, incluidos polígonos múltiples. Se indica el destino medido: entrada, perímetro o punto de referencia del recinto. No son recorridos ni tiempos de viaje.',
'- Para trenes y Metro sólo se admiten distancias a accesos documentados. Las nuevas líneas sin accesos precisos permanecen como contexto general sin relaciones inventadas.',
'- Un perímetro cartográfico de parque o recinto existente no delimita necesariamente cada frente de obra; esta diferencia se informa en las fichas. Una proximidad geográfica no acredita accesibilidad peatonal, derecho de atención sanitaria, acceso público a espacios privados ni efectos económicos.',
'- Se describen posibles cambios y molestias sin prometer plusvalía, rentabilidad o efectos porcentuales.',
'',
'## Obras verificadas',
'',
'| Obra | Región | Estado | Información | Relaciones |','| --- | --- | --- | --- | ---: |',
...works.map(w=>`| ${w.name} | ${w.region} | ${statusLabel(w.status)}${w.statusDetail?' · '+w.statusDetail:''} | ${w.informationDate} | ${relationshipsFor(data,w.id).length} |`),
'',
'## Evidencia y limitaciones por obra',
'',
];
for(const w of works){
 lines.push('### '+w.name,'',w.description,'','Responsable: '+w.responsible+'. Ubicación: '+w.locationText+'.', '',`Estado: **${statusLabel(w.status)}**. ${w.statusDetail||''} Información: ${w.informationDate}. Última revisión: ${w.reviewedOn}.`, '');
 if(w.estimatedStart)lines.push('Inicio estimado documentado: '+w.estimatedStart+'.','');
 if(w.estimatedEnd)lines.push('Término estimado documentado: '+w.estimatedEnd+'. Sujeto a cambios.','');
 for(const s of w.sources)lines.push('- ['+s.title+']('+s.url+') — '+(s.date||'sin fecha editorial; revisión al corte')+'.');
 if(w.geometrySource)lines.push('- Cartografía: ['+w.geometrySource.title+']('+w.geometrySource.url+'). Referencia: '+w.geometryLabel+'.');
 lines.push('',...(w.uncertainties||[]).map(s=>'- '+s),...(w.cautions||[]).map(s=>'- '+s),'');
}
lines.push('## Implementación y comprobaciones','',
'La integración se mantiene en el módulo común de las 131 fichas; sólo añade contenido cuando hay relaciones admitidas, con un máximo inicial de tres obras. Conserva el diseño aprobado, el menú Expertise · Asset Portafolio · Contacto y los datos comerciales. El listado, el mapa, los filtros y las fichas calculan desde el mismo registro.', '',
'El control automático exige 131 revisiones únicas, correspondencia exacta entre informe y relaciones públicas, ausencia de duplicados, bloqueo de ubicaciones disputadas y validación numérica de distancias. Las pruebas existentes de catálogo, filtros y mapa comprueban regresiones. Se conservan HTML de fichas, precios, superficies, disponibilidad, formularios y funciones.', '',
'La validación visual de escritorio y móvil se registra con la entrega de la vista previa. Las teselas externas de OpenStreetMap fueron bloqueadas durante la revisión inicial; la interfaz permite ocultar el fondo y conserva las geometrías, los filtros y el listado. No se afirma disponibilidad universal del proveedor ni una prueba de todos los dispositivos. No se enviaron formularios reales.', '',
'## Pendientes de evidencia, no proyectos sin revisar','',
'Los candidatos excluidos y los motivos están en `pendingCandidates` del registro de cobertura. Los casos incluyen permisos o estados contradictorios, aperturas progresivas, geometrías y accesos no documentados, etapas privadas sin fecha y direcciones incompletas. Resolverlos requiere nueva evidencia; no se sustituyen con suposiciones.', '',
'## Vista previa y trazabilidad','',
'La URL y el despliegue de esta revisión se registran en [ENTREGA.md](ENTREGA.md). La versión anterior queda documentada en [MUESTRA-INICIAL.md](MUESTRA-INICIAL.md).', '',
'No se ha publicado en Sollahms.cl ni se han creado tareas automáticas o revisiones programadas. La producción se mantiene en el despliegue dpl_8rAgvVQSGPF9WbbDHsgeCHV3dkn5 hasta una autorización expresa.', '');
fs.writeFileSync(dir+'README.md',lines.join('\n'));
console.log(JSON.stringify({works:works.length,relationships:rels.length,projects:audit.projectsWithRelationships,geometries:works.filter(w=>w.geometry).length}));
