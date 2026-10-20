# Recuperación aislada del PR #7 — 20 de octubre de 2026

Base actual: `86e200ec191b38af355061e21bc0fc1e549cce3b`. PR #7: `ed5b4cb2ad4d0a4b2887f8ba5522a379c0026841`.
Divergencia comprobada: 50 commits exclusivos de main y 6 exclusivos de #7. Los PR #9, #10 y #11 constan integrados en el historial actual.

## Resultado de la comparación

- Los 15 registros Ecasa de `data/proyectos.json` y los 15 de `data/fichas-proyectos.json` son estructuralmente idénticos entre main y #7. No se vuelven a aplicar.
- Las selecciones documentales `brochures-ecasa`, `ecasa-manual-quality`, `ecasa-official-originals`, y los componentes `ecasa-stages` ya coinciden. Las redirecciones, datos comerciales y consolidación de etapas permanecen como están en main.
- De los 221 archivos de la comparación histórica: 30 ya son idénticos; 92 son recursos recuperados ausentes; 1 es el manifiesto de portadas ausente; 98 difieren y se conservan en su versión actual. La clasificación y los identificadores de cada blob están en `data/ecasa-pr7-recovery.json`. Las diferencias de esos 98 archivos no se consideran automáticamente defectos: incluyen código de publicación antiguo, documentos históricos, pruebas y cambios posteriores. No se importan los preparadores congelados del candidato de 133 proyectos sobre el catálogo actual de 134.

## Recursos recuperados

92 WebP originales del árbol de #7: 74 planos y 18 imágenes. Incluyen 5 portadas de propietario, 2 imágenes oficiales y 85 recursos de ecasa-preview (74 planos y 11 imágenes). Cada archivo se compara byte a byte con el blob de #7, se decodifica y se registra con SHA-256, tamaño y dimensiones. No se transforman ni recomprimen.

Portadas: Aires La Florida 2, Conecta Huechuraba, Bezanilla, Espacio Victoria y Urban La Florida. Se recupera exactamente `data/ecasa-owner-cover.json`.

## Límite de esta recuperación

El manifiesto original limita las portadas a preview protegida. Los cinco PNG originales que documenta no están en #7 ni en main; tampoco se recupera el paquete privado completo. Por ello se recuperan los derivados y su evidencia sin activar las portadas en el empaquetador ni modificar los encabezados o el CSS actual. La activación visual y su QA requieren esos originales y una preview protegida. No se modifica la autorización de publicación. Tampoco se presenta este checkout como un paquete de despliegue completo.

## Preservación y validación

No cambian los HTML, JS, Python de producción, registros comerciales ni empaquetador. La única configuración modificada agrega `codex/ecasa-recovery-20261020: false` a los bloqueos de despliegue, conservando `main: false` y los bloqueos existentes.

Prueba específica: `python -m unittest discover -s tests -p ecasa_pr7_recovery.py -v` (3 casos; 92 archivos comprobados).
CI público: `python scripts/run-git-ci.py --output /tmp/ecasa-recovery-ci`.
Los 26 casos privados de publicación siguen pendientes. No se ejecutan envíos reales, merge ni despliegues. No hay QA visual de una versión desplegada en esta recuperación de recursos.
