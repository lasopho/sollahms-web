"""Build a private report and sanitized evidence from the authorized source reads."""
import argparse
import html
import json
import re
from pathlib import Path

TITLE = 'Evolución SEO/GEO y captación — Nov 19, 2026'


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--private-dir', type=Path, required=True)
    p.add_argument('--report-skill', type=Path, required=True)
    p.add_argument('--html-output', type=Path, required=True)
    a = p.parse_args()
    out = Path(__file__).resolve().parent
    google = json.loads((a.private_dir / 'comparison-data.json').read_text())
    bing_raw = json.loads((a.private_dir / 'bing-summary.json').read_text())
    chat_raw = json.loads((a.private_dir / 'chatgpt-summary.json').read_text())
    bing = {key: bing_raw[key] for key in ['observedAt', 'recordingTimezone', 'source', 'property', 'scopeId', 'cautions']}
    bing['weeks'] = [{key: week[key] for key in ['period', 'pageTableScope', 'nativeTimezone', 'corporateRows', 'nativeExactAllowlistTotal', 'absentIncludedURLs', 'absentRowsAreNotMeasuredZeros']} for week in bing_raw['weeks']]
    bing['aiPerformance'] = {key: bing_raw['aiPerformance'][key] for key in ['observedAt', 'source', 'selectedDuration', 'citationSources', 'totalCitationsDisplayed', 'averageCitedPagesDisplayed', 'queryRows', 'sampledData', 'scope', 'interpretation']}
    chat = {key: chat_raw[key] for key in ['startedAtUTC', 'startedAtSantiago', 'prompt', 'service', 'paidApiRequests', 'conversation', 'personalization', 'searchModeSelected', 'reasoningLabel', 'exactModel', 'effectiveLocation', 'completionObservedAtUTC', 'responseCompleted', 'searchActivityObserved', 'currentObservationValid', 'brandMention', 'brandRecommendation', 'domainLink', 'visibleCitation', 'scope', 'historicalComparison', 'cautions', 'newModelPromptsSent']}
    chat['sourceCoverage'] = {key: chat_raw['sourceCoverage'][key] for key in ['primaryChips', 'additionalSourcesInspected', 'additionalSourcesUnexposed', 'uniqueURLs', 'uniqueDomains', 'urls', 'scope']}
    for name, data in [('google-comparison.json', google), ('bing-comparison.json', bing), ('chatgpt-observation.json', chat)]:
        (out / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    e = html.escape
    rows = []
    for r in google['rows']:
        b = r['before']
        n = r['after']
        position = '—' if n['positionApprox'] is None else f"{n['positionApprox']:.1f}"
        rows.append(f'<tr><td>{e(r["label"])}{" (nueva)" if r["newPage"] else ""}</td><td class="n">{b["impressions"] if b else "—"}</td><td class="n">{n["impressions"]}</td><td class="n">{"0 → " if b else "— → "}{n["clicks"]}</td><td class="n">{position}</td></tr>')
    bing_rows = ''.join(f'<tr><td>{"Portada" if r["url"].endswith(".cl/") else "Contacto"}</td><td class="n">—</td><td class="n">{r["impressions"]}</td><td class="n">{r["clicks"]}</td></tr>' for r in bing['weeks'][1]['corporateRows'])
    # The prose before the starter template also mentions the literal <style>
    # tag. Restrict the match to the template so prose/backticks cannot enter CSS.
    skill_source = a.report_skill.read_text()
    template = skill_source.split('## Starter template', 1)[1]
    style_match = re.search(r'<style>(.*?)</style>', template, flags=re.S)
    if style_match is None:
        raise ValueError('The report skill starter template has no CSS block')
    style = style_match[1]
    article = f'''
<ul class="finding"><li><b>Objetivo:</b> más solicitudes de asesoría calificadas desde Google, Bing y ChatGPT Search.</li><li><b>Señal inicial:</b> la portada pasa de 0 a 13 apariciones en Google; sus clics siguen en 0.</li><li><b>Acción de hoy:</b> conservar la comparación, configurar las cuentas y corregir el candidato de medición antes de aprobar una publicación.</li></ul>
<h2 id="comparacion-google">Google: dos periodos comparables</h2>
<p>Aparición significa una impresión registrada, no una persona ni una visita. Son 02–08 y 11–17 de noviembre, siete días cada uno; la semana actual aún está incompleta.</p>
<div class="tw"><table><thead><tr><th>Página</th><th class="n">Apariciones 02–08</th><th class="n">Apariciones 11–17</th><th class="n">Clics anterior → actual</th><th class="n">Posición actual aprox.</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<div class="note"><p>Diez páginas tienen siete filas explícitas en ambos periodos. Empresas y Beneficios son nuevas y no tienen referencia anterior comparable. No sumamos páginas como si fueran el total nativo del sitio ni calculamos porcentajes sobre una base cero.</p><p>La posición es una media aproximada derivada de pocas impresiones y consultas mezcladas; no es un puesto fijo. Países y dispositivos: todos. Las fechas de Google usan zona del Pacífico.</p></div>
<p>El rendimiento leído termina el 17 de noviembre. No mide el efecto de los cambios publicados el 19 de noviembre a las 07:54:02 de Santiago.</p>
<h2 id="comparacion-bing">Bing y Microsoft: datos recuperados de la cuenta existente</h2>
<div class="tw"><table><thead><tr><th>Página</th><th class="n">Apariciones 02–08</th><th class="n">Apariciones 11–17</th><th class="n">Clics 11–17</th></tr></thead><tbody>{bing_rows}</tbody></table></div>
<p>La tabla de páginas de Bing declara tráfico Web, aunque el gráfico general mezcla Web and Chat. El periodo anterior no reporta filas corporativas: queda desconocido, no cero. Las otras diez páginas tampoco tienen filas actuales. La interfaz no indica su zona horaria.</p>
<ul class="finding"><li><b>Microsoft Copilots and Partners:</b> AI Performance muestra 0 citas y 0 páginas citadas en el selector de tres meses; es información muestreada del dominio.</li><li><b>Límite:</b> esos ceros no prueban ausencia universal de menciones y no miden ChatGPT Search.</li></ul>
<h2 id="comparacion-chatgpt">ChatGPT Search: primera observación actual recuperable</h2>
<p>Pregunta exacta: «{e(chat['prompt'])}».</p>
<div class="tw"><table><thead><tr><th>Fecha</th><th>Observación</th><th>Calidad de evidencia</th></tr></thead><tbody><tr><td>12/11/2026</td><td>Sollahms no apareció, según referencia anterior.</td><td>Narración recuperada; faltan respuesta y fuentes originales.</td></tr><tr><td>19/11/2026 · 11:55 Santiago</td><td>Sin mención, recomendación, enlace ni cita visible de Sollahms.</td><td>Respuesta actual y todas sus citas visibles revisadas.</td></tr></tbody></table></div>
<p>Una pregunta en un chat temporal nuevo, sin personalización y con búsqueda activa. Se inspeccionaron nueve chips y sus tres fuentes adicionales: siete URL únicas de seis dominios. La ubicación efectiva y el modelo exacto no se mostraron. El antecedente tiene otra calidad de evidencia; todavía no acredita una evolución semanal comparable.</p>
<h2 id="de-visibilidad-a-solicitudes">De aparecer a recibir solicitudes</h2>
<div class="tw"><table><thead><tr><th>Etapa</th><th>Herramienta</th><th>Qué vamos a comprobar</th></tr></thead><tbody><tr><td>Aparecer en búsquedas</td><td>GSC, Bing y pruebas directas de IA</td><td>Impresiones, consultas, clics, indexación, menciones y citas por plataforma.</td></tr><tr><td>Usar la web</td><td>Google Analytics y Microsoft Clarity</td><td>Sesiones observadas, CTA, primera interacción con herramientas y comienzo de formularios, con permiso.</td></tr><tr><td>Solicitud aceptada</td><td>Acuse del formulario + evento limitado</td><td>El servicio de envío aceptó o el CRM confirmó persistencia. Se distingue de una entrega al buzón.</td></tr><tr><td>Lead calificado / cierre</td><td>Gestión comercial y CRM existentes</td><td>Recepción, deduplicación, calificación y resultado confirmado. Hoy sin serie atribuible medida.</td></tr></tbody></table></div>
<p>Un clic en WhatsApp no acredita una conversación. La colaboración laboral o empresarial se separa de los compradores e inversionistas. Las tasas se calculan con la misma cohorte y ventana; GSC y Analytics no tienen el mismo denominador.</p>
<h2 id="trabajo-de-hoy">Orden de trabajo de hoy</h2>
<ol><li><strong>Conservar el estudio:</strong> estrategia permanente, alcance corporativo y tres plataformas identificados.</li><li><strong>Fijar el punto de comparación:</strong> las tablas anteriores y una observación real de ChatGPT Search; guardar fechas y límites.</li><li><strong>Preparar medición de uso:</strong> GA4 vinculado a OpenSEO y Clarity configurado; candidato con consentimiento independiente y política actualizada.</li><li><strong>Conectar acciones con solicitudes:</strong> eventos de CTA, herramienta, comienzo de formulario y acuse válido. La calificación comercial se verifica aparte.</li><li><strong>Publicar una versión revisada y medir:</strong> comprobar producción, conservar lo publicado, validar el candidato y registrar su T0 al aprobarse; después comparar periodos equivalentes antes de elegir otra mejora pequeña.</li></ol>
<p>La integración cubre las doce páginas corporativas en GA4 y seis sin herramientas/filtros en Clarity. Catálogo, fichas y Centro documental mantienen su acceso y funcionamiento y no incorporan estas etiquetas. El PR de medición hereda los ajustes menores de portada del PR #38; ambos forman parte del candidato que debe revisarse.</p>
<h2 id="privacidad-y-estado">Privacidad y estado de la instalación</h2>
<ul class="finding"><li><b>GA4:</b> propiedad 565158660, identificador G-LTFBQKVNY2; dominio principal, Santiago y CLP. Medición mejorada global, señales, publicidad y datos proporcionados por usuarios desactivados; conservación individual de dos meses. Seis dimensiones de evento y solicitud aceptada como evento clave, sin valor monetario.</li><li><b>Clarity:</b> proyecto zg5i98wnxm; modo Strict y cookies desactivadas por defecto, con señal Consent V2 después de elegir. El ensayo conserva sus valores de proveedor: cookies de un año y un día y atributo Secure=false; no se les aplica el límite de GA4.</li><li><b>Sitio:</b> candidato y política en revisión; todavía sin publicar. La elección rechazada debe conservar navegación, herramientas y contacto.</li><li><b>Contrato de datos:</b> excluir información personal y financiera, limitar las direcciones y mantener Clarity fuera de simuladores y filtros. La configuración del panel por sí sola no acredita el comportamiento del SDK.</li></ul>
<div class="note"><p><strong>SDK corregido y comprobado en el artefacto exacto:</strong> el recibo final del módulo 15388b73 acredita una sola vista con URL/referrer limitados, cookies de GA4 Secure, SameSite=Lax y 60 días, y ninguna marca sintética visible en el contenido Clarity interceptado. Los 60 días no describen las cookies de Clarity. El ensayo usa SDK reales en caché y bloquea la red de recogida: cero beacons y contactos enviados. El fallo inicial queda conservado como antecedente.</p><p>Quedan tres ajustes de privacidad en borrador GTM sin publicar: eventos automáticos OFF, datos propios OFF y cookies de Analytics de dos meses desde la primera visita. La aprobación debe cubrir ese borrador y el sitio concretos; tras publicar el borrador aprobado, obtener SDK nuevo y repetir la prueba interceptada antes de preparar la publicación del sitio. Es una comprobación futura exigida por el cambio de configuración remota, no un fallo del ensayo actual.</p></div>
<h2 id="criterio-para-cambiar">Cómo decidir los cambios graduales</h2>
<ul class="finding"><li><b>Publicaciones actuales:</b> el PR #37 facilitó descubrir Beneficios, conectó Centro/Entorno con la identidad y mejoró el acceso al contacto empresarial. Su publicación es técnica; todavía falta medir su efecto.</li><li><b>Primera prioridad:</b> seguir las dos URL pendientes de indexación y las consultas reales, y completar el recorrido de medición hasta solicitudes.</li><li><b>Estabilidad:</b> con pocos datos no se justifica reescribir títulos o contenido correcto solo por impaciencia. Cada cambio lleva página, problema, criterio del estudio y comprobación.</li></ul>
<p>El enfoque por etapas y por impacto comercial de <a href="https://seoaustral.com/" target="_blank" rel="noopener">SEO Austral</a> sirve como referencia de servicio aportada por el titular. Lo aplicamos al estudio y alcance propios; sus resultados comerciales anunciados no se trasladan a Sollahms.</p>
<h2 id="candidato-privado-verificado">Candidato privado verificado, sin publicar</h2>
<ul class="finding"><li><b>Revisión:</b> <a href="https://github.com/lasopho/sollahms-web/pull/39" target="_blank" rel="noopener">PR #39</a>, fuente <code>f914590010cf0b4ac930c41a59b648da3be1ab31</code>. La <a href="https://project-wrapp-7ukmzmy6h-lsandoval2-8260s-projects.vercel.app" target="_blank" rel="noopener">preview privada</a> está READY y conserva su protección.</li><li><b>Artefacto:</b> 1727 de 1727 archivos remotos coinciden por identificador SHA1 con el inventario local sellado; 57 archivos de siete funciones y la configuración coinciden. Las funciones y la configuración conservan la base productiva certificada.</li><li><b>HTTP:</b> 14 comprobaciones de páginas corporativas, robots y sitemap, y cuatro recursos nuevos aprobados; acceso anónimo redirigido a autenticación. Los resultados HTTP proceden de la tarea principal y no repiten solicitudes de formularios o proveedores.</li><li><b>SDK:</b> PASS del módulo exacto <code>15388b73</code> con SDK reales en caché y red de recogida interceptada. El borrador GTM de tres ajustes y la nueva comprobación posterior a su publicación aprobada siguen siendo un paso futuro.</li><li><b>Producción:</b> ambos dominios siguen en <code>dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH</code>, fuente <code>df78d77f</code>; configuración del proyecto y protección sin cambios. No se ha publicado este candidato ni el borrador GTM.</li></ul>
<h2 id="how-this-report-was-made">How this report was made</h2>
<p>Generated by the <a href="https://openseo.so/docs/skills/seo-report" target="_blank" rel="noopener">OpenSEO Report skill</a>, run by Codex on Nov 19, 2026.</p>
<ul class="finding"><li><b>Fuentes:</b> lecturas GSC nativas por URL exacta, datos finalizados Web; doce consultas nuevas del 11–17, referencia previa de siete días preservada y comprobada. No hay comparación completa 28/28.</li><li><b>Verificado:</b> Bing existente y ChatGPT Search real mediante navegador; cuentas GA4/Clarity mediante panel y lectura independiente de Analytics Admin.</li><li><b>Alcance:</b> corporate-education-v3; se descartan catálogo, fichas y Centro documental de los resultados corporativos.</li></ul>
<details><summary>Evidencia, método y límites</summary><p>Google: siete fechas explícitas en ambas ventanas para diez páginas; dos nuevas sin base previa. Los ceros son filas de origen, no fechas rellenadas. CTR se deriva de clics/impresiones y posición de ponderación diaria; con cero impresiones quedan desconocidos. No se crean totales nativos sumando tablas parciales.</p><p>Bing: se preservaron selectores y cabeceras diarias. El texto accesible del gráfico desplaza un día su rango; no se usa para convertir zonas o reemplazar las fechas seleccionadas. Las filas por página son Web; el gráfico mezcla Web y Chat.</p><p>ChatGPT: una ejecución iniciada el 19/11/2026 a las 11:55:13 Santiago. Esfuerzo Pro; modelo exacto no expuesto y ubicación efectiva desconocida. Se revisó la respuesta y todas las citas visibles; no se conoce el conjunto interno de recuperación. El primer antecedente del 12/11 es narrativo y no permite calcular una tasa de crecimiento.</p><p>Antecedentes conservados: el informe del 11/11 documentó impresiones generativas de Google anteriores a T0; no se sustituyen por la medición Web de esta revisión ni se presentan como ChatGPT. Los originales de cuentas, respuestas y capturas permanecen privados; los resúmenes se versionan sin credenciales ni datos personales.</p><p>Marco vigente: <a href="https://developers.google.com/search/docs/fundamentals/ai-optimization-guide" target="_blank" rel="noopener">Google y funciones generativas</a>, <a href="https://developers.openai.com/api/docs/bots" target="_blank" rel="noopener">OpenAI y rastreadores</a>, <a href="https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/" target="_blank" rel="noopener">Microsoft AI Performance</a>, <a href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode" target="_blank" rel="noopener">Clarity Consent Mode</a> y <a href="https://support.google.com/analytics/answer/7667196?hl=es" target="_blank" rel="noopener">retención de Analytics</a>. La política conserva la transición legislativa chilena del 1/12/2026 y sus fuentes oficiales.</p></details>
'''
    headings = re.findall(r'<h2 id="([^"]+)">([^<]+)</h2>', article)
    toc = ''.join(f'<li><a href="#{key}">{text}</a></li>' for key, text in headings)
    document = f'<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{TITLE}</title><style>{style}</style></head><body><div class="shell"><header><h1>{TITLE}</h1><p class="byline">Preparado para Sollahms · 19 de noviembre de 2026</p></header><div class="body"><aside class="rail"><div class="sticky"><p class="toc-label">Contenido</p><nav class="toc"><ol>{toc}</ol></nav></div></aside><article>{article}</article></div><footer>Preparado con OpenSEO. Datos de búsqueda hasta el 17/11; observación de ChatGPT del 19/11/2026.</footer></div></body></html>'
    assert '`' not in document and '${' not in document and '<script' not in document
    assert len(document.encode()) < 80000
    a.html_output.parent.mkdir(parents=True, exist_ok=True)
    a.html_output.write_text(document)
    markdown = '''# Comparación semanal SEO/GEO y captación — 19/11/2026

Se aplica STRATEGY-v3 y el estudio existente. Objetivo confirmado: solicitudes de asesoría calificadas desde Google, Bing/Microsoft y ChatGPT Search; medir el recorrido hasta contacto sin confundir sus etapas.

## Resultado comprobado

- GSC: 02–08/11 frente a 11–17/11, diez páginas comparables con siete fechas por ventana; dos nuevas aparte. Portada: 0 a 13 impresiones y 0 a 0 clics. No porcentaje sobre cero ni causalidad del release 19/11. Datos por página, no total nativo de segmento.
- Bing: portada cinco impresiones y Contacto una, sin clics, en 11–17/11. Sin filas corporativas previas; no son ceros medidos. Tabla Web distinta del gráfico Web and Chat. AI Performance: cero citas mostradas en informe muestreado de dominio.
- ChatGPT Search: una ejecución real de la pregunta histórica sobre asesoría en Concepción, chat temporal sin personalización y búsqueda activa, 19/11 11:55 Santiago. Sin mención, enlace, cita o recomendación visible. El antecedente del 12/11 es narrado, sin respuesta/fuentes originales; no acredita evolución histórica certificada.

## Orden de trabajo

1. Mantener el estudio y alcance positivo de doce páginas como referencia.
2. Conservar las tres mediciones con fechas, filtros, versiones y límites.
3. Configurar GA4 y Clarity propios y preparar código/consentimiento/política en candidato privado.
4. Medir CTA, uso de herramientas, inicio de formulario y acuse válido; separar recepción, calificación y venta reales.
5. Publicar solo el candidato concreto aprobado, registrar T0 y usar señales comparables para cada siguiente cambio gradual.

GA4 y Clarity no reconstruyen navegación anterior a su instalación. Antes de aprobar/publicar la integración no hay datos internos nuevos del sitio atribuibles a este trabajo. El frontend no demuestra entrega al buzón ni lead calificado.

## Estado del candidato de medición

Las cuentas propias están configuradas; el candidato no se ha publicado. El [ensayo corregido](../../../measurement-20261119/sdk-correction-receipt.json) acredita PASS del artefacto exacto, módulo 15388b73, con SDK reales en caché: una vista de página con direcciones limitadas, cookies de GA4 Secure, SameSite=Lax y 60 días, y ninguna marca sintética en el contenido Clarity interceptado. Los 60 días no describen las cookies de Clarity. Cero beacons y contactos enviados. El fallo inicial se conserva como historia.

Quedan tres ajustes de privacidad en [borrador GTM sin publicar](../../../measurement-20261119/gtm-privacy-draft-receipt.json). Después de publicar el borrador concreto aprobado, obtener un SDK nuevo y repetir la prueba interceptada antes de preparar la publicación del sitio. Este prerrequisito futuro no invalida el PASS actual; comprueba la nueva configuración remota. Los controles del panel y las pruebas con mocks no sustituyen estos ensayos.

## Candidato privado comprobado

[PR #39](https://github.com/lasopho/sollahms-web/pull/39), fuente `f914590010cf0b4ac930c41a59b648da3be1ab31`. Preview `dpl_HS99vSe1dgeQrqzyXLYtiNoEtCvz`, READY y protegida: [abrir candidato](https://project-wrapp-7ukmzmy6h-lsandoval2-8260s-projects.vercel.app).

- Inventario remoto: 1727/1727 UID SHA1 iguales al inventario local sellado; 57 archivos de siete funciones y configuración coincidentes. [Recibo remoto](../../../measurement-20261119/preview-remote-integrity.json).
- HTTP de la tarea principal: 14/14 páginas corporativas, robots y sitemap; 4/4 recursos nuevos. Anónimo redirige a autenticación. No se enviaron formularios ni beacons reales.
- SDK real en caché: PASS del módulo exacto 15388b73, con el fallo inicial conservado como antecedente. La futura publicación del borrador GTM exige SDK nuevo y nueva comprobación interceptada antes de preparar la publicación del sitio.
- Producción: ambos dominios siguen en `dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH`, fuente df78d77f y ajustes del proyecto sin cambios. [Comprobación de producción](../../../measurement-20261119/production-after-preview.json).

## Evidencia

- [Google por página](google-comparison.json).
- [Bing y Microsoft](bing-comparison.json).
- [ChatGPT Search](chatgpt-observation.json).
- [Preparación y controles de medición](../../../measurement-20261119/README.md).

Los originales de cuentas, respuestas y capturas permanecen privados. Catálogo, fichas, Centro documental y perfiles externos no se optimizan ni reciben crédito del segmento.
'''
    (out / 'report.md').write_text(markdown)
    print(json.dumps({'title': TITLE, 'htmlBytes': len(document.encode()), 'googlePages': len(google['rows']), 'bingReportedCorporatePages': len(bing['weeks'][1]['corporateRows']), 'chatGPTCurrentObservations': 1}))


if __name__ == '__main__':
    main()
