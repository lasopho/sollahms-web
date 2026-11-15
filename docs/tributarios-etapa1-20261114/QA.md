# QA y comparación con producción — etapa 1

Fecha: 2026-11-14T22:40:41-03:00.

**Resultado: candidato privado listo para revisión y solicitud de autorización de etapa1; no publicado.** Esta revisión no certifica elegibilidad tributaria de una persona o empresa ni constituye certificación WCAG integral.

## Identificación

- Código: ac93d006d3a676d3ac6ace74c0e0936135de0ccb.
- Preview: https://project-wrapp-qitsekfxp-lsandoval2-8260s-projects.vercel.app/beneficios-tributarios-inmobiliarios.html
- Deployment: dpl_4XSMADVJg6iE752tEKZkGWhSgEzG, READY, staging.
- PR20: borrador independiente. PR19 permanece abierto y borrador.
- Producción verificada antes y al finalizar: dpl_MnEt1RLpezr7atjVvYrehaGcE69D, SHA941051c69d23c1069b68200b019fb020dbf2c722. URL tributaria pública continúa HTTP404.

## Pruebas

| Área | Evidencia / resultado |
|---|---|
| Responsive Chrome | 320/390/768/1440 px, ancho documental305/375/753/1425 respectivamente: sin desbordamiento de página. Tabla comparativa con desplazamiento interno intencional y región accesible. Capturas qa-{ancho}.jpg y hero-1440.jpg. |
| Orientador | 1080 combinaciones: ninguno de los tres pendientes, restitución o crédito histórico aparece como recomendación. Persona inicial:4 temas; empresa/vivienda:7 con aviso de uso privado; empresa/arriendo:7. Mostrar todos restaura12 fichas. |
| Trece fichas | Se abrieron las13 en navegador; cuatro campos de detalle y enlaces de fuente presentes en todas. Restitución independiente del filtro. |
| Accesibilidad focalizada | Labels de selects, radio-group, status aria-live, foco visible, detalles operables con Enter. Menú móvil abre aria-expanded=true y Escape lo cierra=false. IDs únicos52; anclas locales válidas. |
| Consola | Sin errores ni advertencias capturados durante los recorridos. |
| SEO | Title/H1/canonical/OG propios;4 FAQ del JSON-LD coinciden con contenido visible. No fichas excluidas en HTML/motor/FAQ. noindex,nofollow para preview; no T0 público. |
| Enlaces | Destinos internos públicos consultados HTTP200; URL de nueva guía HTTP404 en producción. Preview anónima conduce a login Vercel; sesión autorizada muestra guía. Fuentes: detalle en links-official.json; no confundir respuestas de aplicación BCN con lectura exitosa. |
| Preservación | Ensamblado remoto verifica SHA1 de1653 archivos productivos y cuatro adiciones. Configuración, funciones, sitemap, robots y baseline11 idénticos. No regresión posible por sustitución de esos archivos: se reutilizan sus blobs. No se ejecutaron formularios ni pruebas de integraciones. |

## Hallazgos por severidad

- **Crítico, alcance excluido:** tres pendientes administrativos siguen bloqueando su incorporación. No impiden esta selección independiente porque no están en contenido, motor ni datos estructurados.
- **Alto, corregido:** las existencias no se presentan con una regla única de deducción; se explicita diferencia general/Pro Pyme. Se precisan derechos sobre bienes comunes no depreciables con Oficio3205/2022.
- **Medio, limitación externa:** BCN responde con página de aplicación incompleta a consultas automatizadas en algunos enlaces; dos PDF SII dieron503 en primera consulta. Los textos pertinentes fueron leídos mediante recuperación web oficial y corroborados con otras fuentes oficiales. Se conserva evidencia de reintento; no se garantiza disponibilidad externa permanente.
- **Medio, condición editorial:** Resolución146 es información de procedimiento futuro; formatos/instrucciones de llenado se anuncian para publicación posterior. No aparece en orientador ni se promete elegibilidad, devolución o trámite operativo.
- **Bajo, resuelto:** primer ensamblado privado dpl_CvLuC2ffuiNU2awsmTNaKf6wPTMy falló por exigir size en entradas históricas que carecen de ese metadato. El helper conserva verificación SHA1 de cada archivo y verifica tamaño cuando está informado. Candidato final READY; ningún efecto en producción.

## Publicación posterior

Solicitar autorización expresa para etapa1. Antes de ejecutarla, volver a resolver el dominio productivo y preservar cualquier cambio posterior; preparar candidato de publicación que retire exclusivamente el noindex de esta página si se autoriza indexabilidad. No promover esta preview automáticamente. No modificar sitemap, robots ni enlaces entrantes sin autorización específica. Registrar T0 editorial propio solamente al publicar. La revisión del18/11 puede incorporar únicamente materias documentalmente resueltas en otra preview, nunca publicarlas automáticamente.
