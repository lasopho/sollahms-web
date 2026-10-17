# CI Git y Previews privadas de Sollahms

La fuente Git pública no contiene todos los medios privados de las carteras,
incluidos los 165 derivados de Ingevec. El
packager debe seguir rechazando un build comercial incompleto; un checkout Git
no sustituye el paquete privado reproducible.

## Despliegues

`vercel.json` deshabilita los eventos de deployment Git de las once ramas
enumeradas en `git.deploymentEnabled`, incluidas `main` y
`codex/integracion-financiera-sollahms`. Las ramas no enumeradas conservan el
comportamiento por defecto. No añadir un patrón permisivo que coincida con las ramas bloqueadas:
según la [configuración oficial](https://vercel.com/docs/project-configuration/git-configuration),
una coincidencia `true` habilita el deployment.

Las Previews se crean manualmente desde el inventario privado aprobado para
el commit y la cartera concretos, con el procedimiento de paquete y preparación
correspondiente. Las 964 fuentes del lanzamiento anterior son una referencia
histórica, no el inventario del árbol actual. Usar
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

`python scripts/run-git-ci.py` conserva los 330 casos Node y 137 tests Python
de la línea base auditada y añade los casos clasificados por cada corrección.
Los conteos vigentes se fijan explícitamente en `tests/git-ci-selection.json`;
el runner exige ejecutarlos todos junto al validador hipotecario. La clasificación positiva
enumera 26 casos que necesitan el release privado: **no se ejecutan ni se
declaran aprobados en este CI**. Nuevos archivos/casos sin clasificar o conteos
distintos detienen el runner.

En Codex Cloud, `--cloud-stdio` activa el transporte de subprocess mediante
archivos temporales y ejecuta cada archivo Node en su propio proceso. Conserva
las mismas assertions, selección y cantidades; no recupera recursos privados.
La preparación y los límites del entorno se describen en
[Desarrollo en Codex Cloud](cloud-development.md).

Los controles verifican gates, headers, catálogo aprobado, manifiestos,
privacidad y rutas; ejecutan el packager sin medios o con un lote parcial y
exigen su error específico, sin generar `dist`. No se modifica el packager ni se
rebaja el rechazo de builds incompletos.

`tests/git-checkout-controls.mjs` pertenece exclusivamente al checkout Git.
No incluirlo en el glob de release: su comprobación de ausencia de los medios
privados corresponde a ese entorno.

## Controles privados antes de integrar o publicar

El CI Git no reemplaza la validación de release, incluidos los 26 casos Node
privados, los cuatro validadores, la comparación por hash del inventario
aprobado y las auditorías del paquete completo y Preview protegida. Ejecutarlos sin la selección
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
