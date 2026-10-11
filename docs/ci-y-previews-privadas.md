# CI Git y Previews privadas de Sollahms

La fuente Git pública no contiene los 165 derivados privados de Ingevec. El
packager debe seguir rechazando un build comercial incompleto; un checkout Git
no sustituye el paquete privado reproducible.

## Despliegues

`vercel.json` deshabilita únicamente los eventos de deployment Git de `main` y
`codex/integracion-financiera-sollahms`. Las otras ramas conservan el comportamiento
por defecto. No añadir un patrón permisivo que coincida con las ramas bloqueadas:
según la [configuración oficial](https://vercel.com/docs/project-configuration/git-configuration),
una coincidencia `true` habilita el deployment.

Las Previews se crean manualmente desde las 964 fuentes aprobadas, incluidos los
165 derivados, con el procedimiento de paquete y preparación existente. Usar
target Preview, conservar Deployment Protection y registrar commit, SHA-256,
inventario y deployment real. No publicar el archivo privado en GitHub Actions,
artefactos de GitHub ni el repositorio. Production requiere la autorización
separada de FASE B.

No asumir que la omisión de un deployment produzca un status Vercel exitoso.
Observar statuses, check-runs, el SHA de merge de prueba y los deployments del
commit nuevo. Un status histórico fallido permanece como evidencia histórica;
no escribir estados manuales para reemplazarlo. GitHub evalúa los checks del
[commit aplicable](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).

## CI independiente con fuentes públicas

`.github/workflows/git-checkout-regression.yml` ejecuta el job propio
**Git checkout regression** en pushes de integración y PR contra main. Usa sólo
`contents: read`, actions oficiales fijadas a SHA completo y dependencias de
fixtures fijadas por versión/hash. No obtiene secretos ni llama a Vercel, no
despliega y no envía consultas o reservas reales.

`python scripts/run-git-ci.py` ejecuta 235 casos Node (227 originales aptos para
Git más ocho controles), los 50 tests Python con fixtures sintéticos y el
validador hipotecario. La clasificación positiva en `tests/git-ci-selection.json`
enumera 22 casos que necesitan el release privado: **no se ejecutan ni se
declaran aprobados en este CI**. Nuevos archivos/casos sin clasificar o conteos
distintos detienen el runner.

Los controles verifican gates, headers, catálogo aprobado, manifiestos,
privacidad y rutas; ejecutan el packager sin medios o con un lote parcial y
exigen su error específico, sin generar `dist`. No se modifica el packager ni se
rebaja el rechazo de builds incompletos.

`tests/git-checkout-controls.mjs` pertenece exclusivamente al checkout Git.
No incluirlo en el glob de release: su comprobación de ausencia de los medios
privados corresponde a ese entorno.

## Controles privados antes de integrar o publicar

El CI Git no reemplaza las 249 pruebas Node completas, los 50 tests Python, los
cuatro validadores, la comparación por hash de 269 recursos/142 planos y las
auditorías del paquete completo y Preview protegida. Ejecutarlos sin la selección
Git, usando el procedimiento de operación. Conservar la igualdad del build
publicable respecto de su Preview y el deployment anterior de `sollahms.cl`.

Antes de cada integración, releer las reglas efectivas de main y los checks
requeridos. No cambiar protecciones ni ignorar reglas obligatorias. El CI nuevo
es una comprobación real; su instalación no lo convierte automáticamente en un
check requerido por GitHub. Si las reglas cambian, verificar su compatibilidad
con el flujo privado antes de continuar.

Los resultados remotos, SHA del paquete y prueba de omisión/manual Preview se
registran después de observarlos, en comprobantes privados de la revisión; este
documento no declara resultados futuros ni autoriza merge o publicación.
