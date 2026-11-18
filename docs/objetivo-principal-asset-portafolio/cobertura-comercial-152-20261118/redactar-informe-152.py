#!/usr/bin/env python3
"""Render one consolidated repository report from pinned documentary indices."""
import json
from pathlib import Path
p=Path(__file__).resolve().parent;j=json.loads((p/'INDICE-COBERTURA-152.json').read_text());a=json.loads((p/'ANALISIS-COMBINACIONES-152.json').read_text());x=json.loads((p/'COBERTURA-21.json').read_text());fields={'tipo_propiedad':'Tipo de propiedad','precio':'Precio UF','dormitorios':'Dormitorios','banos':'Baños','util':'Útil','total':'Total','entrega':'Entrega','estado':'Estado comercial','amenities':'Amenities','estacionamiento':'Estacionamiento','bodega':'Bodega'}
lines=['# Datos esenciales sin respaldo suficiente: catálogo de 152 proyectos','',
'Corte: **18/11/2026**. Producción `d3fb474f08b81a965d2e0eac927adf88671968c0`, deployment `dpl_FkyZZgpki5HSpKMRJQFgJE451d3G`. Los **152 proyectos están indexados en once campos**. Se conservan las matrices originales de 131, sus 1.993 punteros y los 313 IDs históricos; se añade una vista documental de los 21 incorporados, sin nuevas recepciones ni hechos comerciales.',
'',
'Este es el único informe consolidado de faltantes de este corte. Reutiliza fuentes y certificados existentes; no repite las 158 fichas Iris, auditorías, planos, suites o QA responsive. La producción consultada sigue READY en el mismo ID/SHA. No se cambió aplicación, catálogo, precio, dirección, función, formulario o servicio.',
'',
'## Qué significan los conteos','',
'Las vistas contienen **1.672 celdas: 80 confirmadas en su alcance original, 1.125 parciales y 467 desconocidas en los alcances indexados**, repartidas estas últimas en 150 proyectos. No son 467 solicitudes al propietario, pendientes históricos, unidades ni datos definitivamente inexistentes. Parcial significa respaldo limitado a referencia/modelo/etapa o mención general; no obliga a reconstruir inventarios. Una fuente fechada no acredita stock o vigencia actual.',
'',
'La conciliación conserva tres excepciones explícitas: **BAUM y Santo ya tienen precio publicado; INN Puerto Chico ya tiene útil en sus modelos publicados**. Sus estados documentales anteriores no se reescriben ni se usan para afirmar que nunca se recuperó ese valor. Tampoco se infiere confirmación comercial del propietario, relación precio–plano o aplicabilidad a otras unidades. Véase [conciliación de alcances](CONCILIACION-ALCANCES-131.json).',
'',
'| Campo | Confirmado en su alcance | Parcial | Desconocido en la vista | Límite relevante |','| --- | ---: | ---: | ---: | --- |']
limits={'tipo_propiedad':'Cabecera y producto de la referencia se separan; 21 referencias unitarias nuevas no tienen tipo propio.','precio':'Siete desconocidos documentales incluyen BAUM/Santo con precio publicado. Cinco proyectos no tienen testigo de precio publicado.','dormitorios':'Tipología literal no equivale a dormitorios numéricos; cinco Estudio nuevos no se convierten en 0D.','banos':'Baño de otro modelo o producto no se presta a una cotización.','util':'INN tiene útil publicada en otro alcance; Internos de los 21 nuevos no es útil.','total':'Internos, terraza, patio y terreno no se suman para inventar total.','entrega':'Centro Santa Ana tiene Entrega futura sin período; Kiez Por definir. No inferir entrega legal.','estado':'Entrega o existencia en Iris no acreditan estado comercial actual.','amenities':'19 proyectos nuevos tienen descriptores filtrables; Kiez/Ámbar sólo notas generales no habilitadas.','estacionamiento':'33 parciales son menciones/ofertas en alcance; inclusión global y disponibilidad exacta siguen sin acreditar para152.','bodega':'Inclusión global y disponibilidad exacta siguen sin acreditar para152; exclusión del precio no implica ausencia física.'}
for f,label in fields.items():
 c=j['summary']['coverageStatesByField'][f];lines.append(f"| {label} | {c.get('confirmado',0)} | {c.get('parcial',0)} | {c.get('desconocido',0)} | {limits[f]} |")
lines += ['', '## Faltantes que afectan a búsquedas concretas','',
'- **Precio:** Angamos, Diagonal Vicuña, Own, Los Alerces y Valle Los Ingleses III no tienen testigo de precio en la capa publicada indexada. No recuperar campañas descartadas ni inferir stock; Own se conserva como publicado y se excluye sólo de la oferta preparada cuando corresponde. Las tipologías sin precio de otros proyectos conservan su desconocido específico, aunque exista otra referencia de precio en ese proyecto.',
'- **Superficies:** 70/61 celdas de útil/total siguen desconocidas en las vistas. Los 21 nuevos sólo aportan Internos y Terraza en referencias exactas; las lecturas archivadas de planos no aportan útil/total admisibles. No recalcular ni extrapolar. INN útil está documentada en modelos, sin vínculo a su precio publicado.',
'- **Relaciones entre datos:** precio y D/B/áreas deben corresponder a una misma referencia. Mood conserva sus cotizaciones por tipología y perfiles de planos separados; no se repreguntan precios ni se inventa unidad/modelo. Nuevo Vivaceta y Compañía 1735 conservan prioridad owner sin tomar baños/áreas del perfil Iris para esa cotización. Las referencias unitarias Iris de los 21 nuevos no heredan el tipo de su cabecera.',
'- **Estado, entrega y uso:** 19 de los nuevos no tienen estado comercial explícito; Kiez no tiene entrega definida y Centro Santa Ana no tiene período concreto. Casa/Departamento no confirma uso Residencial. Estas carencias sólo restringen sus predicados activos.',
'- **Amenities y espacios privados:** Estacionamiento aparece en notas generales de18 proyectos nuevos, incluida una nota general de inclusión en Altos del Peñón; no tiene asociación unidad/precio o disponibilidad acreditada. No convertirla en inclusión privada. Kiez y Ámbar tienen notas Ascensor/Estacionamiento sin descriptores de filtro habilitados. Los adicionales Suecia permanecen fuera del precio del inmueble.',
'- **Identidades y conflictos:** Verne202 conserva conflicto UI Departamento/Estudio frente a plano Oficina1O+1B; Plaza Cervantes conserva su conflicto de torre/edificio; Mapocho y Froilán no cruzan sus alcances. Parque Panamá/Local, Vergara Domeyko/Local y Bordevivo/Local no reciben atributos residenciales. No repetir consultas agotadas o sustituir estos límites por coincidencias positivas.',
'',
'## Combinaciones admitidas por las fuentes actuales','',
'Conteos estáticos de proyectos con un testigo conjunto, **no búsquedas ejecutadas, stock ni certificación de todos los rangos/cartesianos**. Se suman sólo identidades disjuntas131+21. No se suman capas Leben o suplemento24a. La ausencia de un eje no demuestra ausencia de un valor aislado fuera de esos ejes. [Detalle reproducible](ANALISIS-COMBINACIONES-152.json).',
'', '| Familia en una referencia compatible | 131 originales publicados | 21 nuevos publicados | D3 / 152 |','| --- | ---: | ---: | ---: |']
labels={'precio':'Precio UF','precio_D':'Precio + dormitorios','precio_D_B':'Precio + dormitorios + baños','precio_util':'Precio + útil','precio_total':'Precio + total','D_B':'Dormitorios + baños','D_B_util':'Dormitorios + baños + útil','D_B_total':'Dormitorios + baños + total','precio_tipo':'Precio + tipo'}
for k,label in labels.items():lines.append(f"| {label} | {a['summaries']['original131'][k]} | {a['summaries']['publishedExpansion21'][k]} | {a['summaries']['publishedD3_152'][k]} |")
lines += ['',
'El suplemento24a conserva su único testigo precio+D/B+útil/total de Plaza213/C7 local y no publicado. La integración pendiente no se considera un dato comercial faltante ni autoriza publicar ese testigo.',
'',
'## Verificación de filtros reutilizada','',
'El [mapa de aceptación](ACEPTACION-FILTROS.json) relaciona 15 criterios con sus fuentes, líneas y certificados. Trece módulos runtime D3 coinciden con el manifiesto del paquete publicado; los diez archivos de pruebas actuales sólo se leyeron como texto. Los certificados de F10/F13/PR33–36 se conservan sin sumarlos entre sí. No se identificó defecto o preocupación nueva que requiera reproducción aislada.',
'',
'Cobertura existente: precio/tipología compatibles, D/B, útil/total explícitas, región/comuna, entrega/estado, amenities por alcance y AND/OR, tipos, desconocidos activos e inactivos, combinaciones, vistas, fallos de fuente y separación financiera. Se conserva el QA publicado152/GPR9, 1.721 digests, cinco alias y cinco recursos públicos verificados. Estos controles no completan valores comerciales ni prometen todas las combinaciones posibles.',
'',
'## Detalle único por proyecto','',
'Cada fila enumera los campos desconocidos en su vista fuente. El asterisco indica un valor ya presente en otro alcance publicado: no se solicita de nuevo. Las celdas parciales y sus límites completos se consultan en el [índice compuesto](INDICE-COBERTURA-152.json), que enlaza las matrices originales sin reconstruirlas. «—» significa ninguna celda desconocida en esa vista, no inventario completo ni certificación de todas las consultas.',
'', '| Proyecto / inmobiliaria | Campos desconocidos en la vista fuente | Excepción o límite adicional |','| --- | --- | --- |']
for slug,pj in j['projectsBySlug'].items():
 rescued={q['field'] for q in pj['supportedValueInOtherPublishedScope']};unknown=', '.join(fields[f]+('*' if f in rescued else '') for f in pj['unknownFieldsInSourceView']) or '—';notes=[]
 if rescued:notes.append('Valor publicado en otro alcance: '+', '.join(fields[f] for f in fields if f in rescued)+'.')
 if pj.get('numericExactBedroomsUnknown'):notes.append('Estudio literal; D numérico desconocido.')
 if slug in ['kiez','edificio-ambar-urbano']:notes.append('Amenities: notas generales, sin descriptor habilitado.')
 if slug=='centro-santa-ana':notes.append('Entrega futura sin período filtrable.')
 if slug=='condominio-altos-del-penon':notes.append('Nota general de estacionamiento incluido sin asociación.')
 lines.append('| '+pj['name'].replace('|','/')+' / '+pj['developer'].replace('|','/')+' | '+unknown+' | '+(' '.join(notes) or 'Alcance en el índice; no extender a otras referencias.')+' |')
lines += ['',
'## Intervenciones y condición de cierre','',
'Permanecen **únicamente las dos solicitudes ya presentadas**, sin nuevas preguntas:',
'',
'1. `AUTH-PUSH-PR-SUPPLEMENT-20261118-01`: respuesta para primer push/PR Draft del candidato congelado24a. No ejecutar ni repreguntar. La base solicitada era875 y el destino ahoraD3: reconciliar conservando el original antes de actuar si llega respuesta. Ready, merge, deployment y publicación necesitan permisos propios.',
'2. `OWNER-BATH-IRARR1970-20261118-01`: baños del estudio en su alcance/fuente. Conservar desconocido hasta respuesta, sin bloquear otros proyectos.',
'',
'La clasificación documental152 y la conciliación de certificados de este corte están realizadas. **El objetivo global sigue abierto** por las integraciones y respuestas pendientes; no hay información nueva recuperada ni corrección de código que justifique otra fase o nuevos permisos ahora. Continuar sólo tareas independientes autorizadas con evidencia concreta nueva; no generar otra auditoría vacía ni pedir al propietario que dirija fases. Mantener producciónD3, 152 identidades, 131 fichas originales y servicios protegidos. Ver [NEXT-PROMPT](../../../NEXT-PROMPT.md).','']
(p/'INFORME-DATOS-ESENCIALES-NO-RECUPERADOS.md').write_text('\n'.join(lines))
print('Informe único generado:',len(j['projectsBySlug']),'filas de proyectos; sin nuevos hechos o preguntas.')
