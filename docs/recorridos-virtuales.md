# Recorridos virtuales de las fichas Sollahms

> Conteos históricos: las cifras de catálogo de 148/144/137 de este documento corresponden a su etapa de revisión. El [registro vigente de 134 fichas](registro-vigente.md), fijado al commit fuente, define el inventario actual. Se conserva íntegra la evidencia y el alcance original.

La sección y su enlace de navegación se publican únicamente cuando
`data/fichas-proyectos.json` registra al menos un recorrido con identidad de
proyecto acreditada y evidencia de una escena o interfaz utilizable. La política
compartida está en `scripts/virtual_tour_policy.py`; la aplican el generador
general, la plantilla y el actualizador de las cuatro fichas destacadas.

Fotos, planos, archivos multimedia, mapas, URLs inseguras y recorridos de
identidad pendiente no habilitan la sección. Un recorrido alternativo registrado
conserva su enlace cuando el proyecto ya dispone de otro utilizable. No se crean
recorridos ni se modifica la investigación original.

El ajuste parte de `3f7b7e481e632e06d36702f556f6f2bca61bc55b`, en la rama
`codex/recorridos-validos-144`. Se retiran 83 apartados: los 82 proyectos sin
recorridos y el de Irarrázaval, cuya única experiencia conserva una limitación
explícita de asociación. Se eliminan 82 enlaces de navegación y 83 mensajes,
incluida una fila secundaria sin visor de Verne Oficinas. Distrito Centro tenía
un apartado antiguo mezclado con fotografías y superficies; se conserva ese
material. La revisión autorizada posterior conserva 98 enlaces en 61 fichas, incluidos
los 23 Matterport. Se retiró únicamente la alternativa Sentiovr de Vista Bulnes
por certificado TLS vencido y los dos avisos de experiencias pendientes. Las
otras 59 fichas con tours siguen idénticas; Endémico conserva ambos enlaces y
Vista Bulnes conserva su recorrido acreditado. Los 100 registros originales de
investigación siguen intactos.

Las 21 fichas con brochures conservan su enlace a modelos al regenerarse aunque
no tengan recorrido. La ausencia de un apartado no deja contenedores ni reservas
de altura: Ubicación sigue el flujo y los márgenes normales de la ficha.

## Verificación

`tests/test_virtual_tours.py` comprueba las 144 fichas actuales y su futura
renderización, recursos, fuentes financieras y casos negativos. Los 165 medios
privados se verifican por hash cuando están presentes; un checkout público sólo
puede omitir los derivados Ingevec expresamente ignorados por Git. El packager y
la batería privada siguen exigiendo el lote completo antes de desplegar.

`tests/virtual_tour_scope.py` mantiene un control independiente de igualdad de
bytes contra el commit de partida. Las guardas históricas restauran sus fuentes
anteriores solamente después de comprobar la eliminación exacta autorizada;
sus conteos históricos no describen el HTML actual. El validador de fichas
comprueba los enlaces actuales y la publicación condicional.

`tests/qa-virtual-tours.mjs` revisa 144 fichas en escritorio (1440 px), tablet
(768 px) y móvil (390 px), incluyendo anclas, vacíos, desbordamiento, separación
de Ubicación y activación de visores. Aísla los proveedores externos durante la
prueba de distribución; la verificación de escenas externas se registra aparte.
Puede auditar la Preview protegida usando el token OIDC efímero del mismo
proyecto, sólo en solicitudes al origen exacto; nunca imprime ni guarda ese token.

## Preview privada

Se conserva el flujo de `docs/ci-y-previews-privadas.md`: paquete reproducible
completo, preparación y auditoría local, luego Preview manual del proyecto
`project-wrapp`, con Deployment Protection. El gate Git de esta rama se añade
explícitamente para evitar un build automático sin recursos privados; los gates
existentes de main e integración permanecen. La nueva rama se admite
explícitamente en el packager. No se cambian protecciones de plataforma.

El generador de paquete acepta `--branch codex/recorridos-validos-144` para
registrar la rama real. El SHA-256 y el inventario nuevos se guardan junto al
paquete privado y su respaldo, fuera de Git. No se autoriza merge ni Production.
