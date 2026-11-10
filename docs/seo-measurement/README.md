# Medición SEO y GEO de Sollahms — continuidad vigente

**Política activa:** [active-policy.json](active-policy.json), alcance `corporate-education-v2`.
**Último informe:** [T0 post-publicación — 9/11/2026](runs/2026-11-09-post-publication-t0/report.md).

**Producción vigente:** `dpl_655iVXDar2r8kipVSLhAtGCPYbT4`, publicada y verificada el **09/11/2026 20:11:23 America/Santiago**. [Registro formal](runs/2026-11-09-post-publication-t0/publication.json). No inferir producción desde `main` ni desde los estados de pausa de informes históricos.

**Estado de medición:** cambio publicado y verificado; impacto SEO/GEO todavía no medido. [T0 y ventanas](runs/2026-11-09-post-publication-t0/temporal-plan.json); [recursos pendientes](runs/2026-11-09-post-publication-t0/NEXT-IMPORT.md).

Todas las fichas individuales de proyectos quedan excluidas permanentemente de estrategia, auditorías estratégicas, oportunidades, optimización, prioridades y evaluación de resultados de IA. Se preserva su funcionamiento técnico. Las ocho candidatas de fases 2/3 y sus traspasos/correcciones al Lab dejan de ser tareas activas. No se requiere confirmación de inventario para priorizar SEO/GEO.

## Alcance y prioridades

El inventario publicado conservado permite identificar **11 páginas incluidas**, 131 fichas conocidas excluidas y dos páginas técnicas de error sin objetivos estratégicos. La regla excluye también futuras fichas y sus alias; no se limita a las 131 registradas. Las nuevas URL permanecen pendientes de clasificación y no entran automáticamente al segmento.

- [SCOPE-v2.md](SCOPE-v2.md) y [scope-v2.json](scope-v2.json): páginas, categorías, exclusión permanente y procedencia.
- [STRATEGY-v2.md](STRATEGY-v2.md): identidad, servicios, orientación, educación hipotecaria, inversión, herramientas, entorno urbano, catálogo y contacto.
- [SEGMENTATION-v2.md](SEGMENTATION-v2.md): separación de métricas incluidas y generales del dominio.
- [AI-PROTOCOL-v2.md](AI-PROTOCOL-v2.md), [preguntas v2](ai-prompts-v2.csv) y [plan v2](ai-test-plan-v2.csv): 180 ejecuciones nuevas **planificadas**, ninguna ejecutada por esta corrección.
- [AI-LAB-HANDOFF.md](AI-LAB-HANDOFF.md): solo contenido incluido; prohíbe fichas y sus oportunidades históricas.

## Continuar desde aquí

1. Leer política activa, último informe e historial. Tratar los informes de fases 1–3 como evidencia histórica: sus instrucciones sobre fichas/inventario están revocadas para trabajo futuro.
2. Reutilizar métricas solo con su procedencia, periodo, filtros y alcance explícitos. No repetir el rastreo técnico de 141 URL ni accesos fallidos sin cambio de condiciones.
3. Usar `scripts/seo_measurement.py` para normalizar exportaciones originales sin alterar la evidencia. Un informe sin filtro acreditado sigue siendo general no filtrado.
4. Usar `scripts/seo_scope.py` para segmentación, acreditación de series filtradas y comparaciones del alcance; no etiquetar una comparación global del importador histórico como resultado corporativo exclusivo.
5. Crear un nuevo `runs/FECHA-ID/`, conservar originales privados y añadir una línea al historial. Comparar únicamente periodos con la misma versión de alcance, filtros, país, motor y definición de métricas.
6. Coordinar oportunidades únicamente de URL incluidas con el flujo existente del Lab; no generar paquetes redundantes ni consumir API como efecto de medir.

## Herramientas y evidencia

El importador histórico y sus tests permanecen intactos. Las pruebas nuevas validan **las guardas de segmentación**, no vuelven a auditar el sitio. En las fases previas faltaban exportaciones verificables; esta corrección no inventa ni recopila datos privados nuevos. `null` significa desconocido.

```bash
python scripts/seo_measurement.py import-performance --csv ORIGINAL.csv --manifest MANIFIESTO.json --output docs/seo-measurement/.local/LOTE/raw-normalized.json
python scripts/seo_scope.py segment --input docs/seo-measurement/.local/LOTE/raw-normalized.json --scope docs/seo-measurement/scope-v2.json --output docs/seo-measurement/.local/LOTE/included-pages.json
```

El segundo comando requiere detalle por página (o indexación por URL). No puede convertir una serie diaria global en métricas exclusivas. Consultar la guía de segmentación para `bind-daily`, `compare` y la revisión del filtro nativo.

## Histórico conservado

- Fases 1/2: [evidencia recuperada](runs/2026-11-08-phase2/report.md), importador y 13 pruebas sintéticas registradas.
- Fase 3: [informe](runs/2026-11-08-phase3/report.md), inventario de insumos, validación de conservación y corrección editorial de Uruguay. Esa corrección permanece histórica; tampoco se transfiere al Lab por estar asociada a una ficha excluida.
- `ai-prompts-v1.csv`, `ai-test-plan.csv` y `AI-PROTOCOL.md`: versión anterior, conservada sin sobrescribir; no usar en nuevas ejecuciones.
- Prioridades y contratos de ocho fichas: preservados, con estado activo **excluido del alcance**, no pendientes de stock ni de optimización.

## Privacidad y publicación

El repositorio es público: originales con consultas sensibles, respuestas de cuentas y datos personales permanecen en `.local/` ignorado o almacenamiento privado ya autorizado. Versionar solo resúmenes revisados y evidencia pública. No guardar cookies, tokens o información personal de leads. No existe autorización para publicar, fusionar ramas, cambiar fichas, precios, formularios, cálculos o funcionalidades.
