# fix: usar proyecciones públicas mínimas de cotizaciones

El paquete previsto del PR33 fusionado requería cargar dos JSON owner completos. El de Euro conserva un precio histórico excluido y datos de revisión internos que no deben convertirse en un endpoint público. Ese paquete quedó bloqueado y nunca se desplegó.

Los cargadores ahora usan sólo dos proyecciones mínimas fijadas por SHA-256, con allowlists estrictas y sin fallback a originales. Conservan los21 precios Euro,17 Nollagam,cinco categorías sin precio,fechas,IDs y procedencia original. No incorporan historial,notas,capturas o URLs privadas; no agregan precios,stock o evidencia nueva. Los originales permanecen intactos.

Validación específica:

- 49/49 Euro,19/19 consumidorNollagam y23/23 integración,por separado. No sumar42/14previos ni repetir112/83históricos.
- 7/7 Chrome sobre el paquete corregido: ambos endpoints públicos200,cero solicitudes a originales internos,precios/desconocidos coherentes y131 identidades. Sin excepciones ni errores de consola.
- Revisión lectora independiente sin bloqueantes;155 protegidos y21 fuentes intactos. Motor,modelo,UI,mapa,finanzas,131fichas y siete funciones sin cambios.

Paquete local de1.672 archivos preparado por copia/verificación de bytes,sin build o generador. No contiene originales owner,docs,tests,fixtures o mediosIris nuevos. QA estático no ejecuta/api/uf ni certifica escenarios financieros.

Ocho archivos respecto del merge cb359710. La única modificación de vercel.json excluye deployments automáticos de la rama nueva; destino tambiénfalse. Este entregable solicita únicamente primer push y nuevoPRDraft. No autoriza Ready,merge,deployment o publicación; producción continúa9e/Gm75.
