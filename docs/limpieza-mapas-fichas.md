# Revisión de fichas: enlaces redundantes de Google Maps

> Conteos históricos: las cifras de catálogo de 148/144/137 de este documento corresponden a su etapa de revisión. El [registro vigente de 134 fichas](registro-vigente.md), fijado al commit fuente, define el inventario actual. Se conserva íntegra la evidencia y el alcance original.

Revisión del 12/10/2026 en `codex/limpieza-mapas-fichas`, creada desde
`origin/main` en `bb69615d03230cbab76bdc2678938cc741f80e86`.
Sin merge ni publicación en Production.

El commit fuente `4b001afc5c59bdb053c62c413ebe8f24c02d1016` elimina los enlaces
permanentes de Google Maps de las 137 fichas que los contenían, las 133 notas
genéricas y los 129 avisos `noscript` que hacían referencia al enlace retirado.
Las siete fichas restantes no requieren cambios de HTML. Se conservan las
cuatro aclaraciones específicas sobre el alcance y acceso de alternativas o
etapas relacionadas; no se modifica la dirección de ningún proyecto.

Los generadores estándar, de destacadas y la presentación compartida aplican la
misma limpieza. La migración es idempotente: una segunda ejecución sobre las
144 fichas informa cero cambios. El CSS elimina el margen inferior del mapa
cuando es el último elemento de su contenedor. Los iframes y sus controles
nativos permanecen idénticos a main, con `loading="lazy"`.

La recuperación existente continúa mostrando un único enlace seguro sólo ante
un evento real `error` del iframe. Una carga normal, un evento `load` o el paso
del tiempo no muestran enlaces externos. Se conservan los límites existentes
de los eventos de error de iframes entre orígenes; no se simula detección de
errores mediante temporizadores.

| Comprobación ejecutada | Resultado |
| --- | --- |
| Fichas auditadas / corregidas / sin elementos a retirar | 144 / 137 / 7 |
| Enlaces permanentes / notas genéricas / párrafos vacíos restantes | 0 / 0 / 0 |
| Mapas automáticos / recorridos automáticos | 137 / 97 |
| Excepción externa de Endémico | Conservada exactamente |
| Planos / recursos seleccionados de brochures | 142 / 269, hashes idénticos |
| Precios, direcciones, fotos, formularios y navegación | Comparación exacta contra main aprobada |
| Pruebas Node privadas | 254 PASS: 249 existentes + 5 de recuperación |
| Pruebas Python | 74 PASS, incluidos 7 controles nuevos |
| Validadores de fichas, cartera, finanzas y datos hipotecarios | 4 PASS |
| CI en clon público sin recursos Ingevec | 240 Node + 74 Python PASS; 22 casos privados excluidos explícitamente |
| Regeneración futura estándar y de destacadas | PASS en copia aislada |
| Responsive 1440 / 768 / 390 px | 144 fichas por ancho; 432 vistas aprobadas |
| Recuperación en navegador | 4/4: visor sano sin enlace, error con enlace seguro |
| Google Maps real, B.COME / INN Puerto Chico / Distrito Centro | 9/9 combinaciones de ficha y ancho; controles nativos visibles |
| Google Maps real en la Preview protegida | 9/9 muestras adicionales, controles nativos visibles y cero enlaces permanentes |
| Inventario remoto de Preview | 952/952 archivos con SHA-256 exacto; 151 HTML, incluidas las 144 fichas |
| Funciones remotas consultadas por GET | Contacto y agenda rechazan GET con 405; UF responde 200, sin escrituras |
| Auditoría independiente publicable / Preview | PASS, cero errores y cero mensajes o reservas reales |

Las pruebas responsive aíslan proveedores y fuentes externas para medir el
layout; los controles nativos se comprueban por separado con Google Maps real.
La primera corrida detectó problemas del servidor local y mediciones anteriores
a la disponibilidad del CSS. Se repitieron los 14 casos afectados con espera de
estilos y un servidor estable; el informe conserva ambos resultados y su
procedencia. La revisión final tiene cero errores y cero desbordamientos.

La auditoría de conservación mantiene las congelaciones históricas. El nuevo
verificador acepta exclusivamente la eliminación literal de los nodos
autorizados y las adiciones exactas del margen, la rama admitida del packager y
el gate Git. No se eliminan controles ni se permiten cambios generales.

La Preview se generó manualmente desde el paquete privado completo según
`docs/ci-y-previews-privadas.md` y `docs/operacion-publicacion-sollahms.md`:
965 fuentes, 800 versionadas y 165 privadas. Los recursos Ingevec permanecen
ignorados y fuera de Git. Se verificó el inventario CLI antes de subir el
`source/` preparado; no se desplegó el checkout ni `dist` como prebuilt.

Archivo fuente: SHA-256
`25e4d5daa8f4d0cd2b62da46ac067174610cde9c7eaf05434cdf96ef16604f95`,
138631705 bytes. Los recibos, manifiestos, archivo y capturas se conservan en
almacenamiento privado de la revisión, fuera del directorio desplegable.

[Preview protegida para revisión](https://project-wrapp-mad9v8aja-lsandoval2-8260s-projects.vercel.app/proyectos.html).
Deployment `dpl_9ahATq1mN84Uknm8NcW5jyV778u3`, estado `READY`, build en entorno
`preview`, `noindex` y formularios de revisión. Deployment Protection conserva
`all_except_custom_domains`: una solicitud sin credenciales recibe HTTP 302
hacia la autenticación de Vercel. El acceso de pruebas usa credenciales
temporales sólo en el origen de esta Preview.

Se comprobó que `sollahms.cl` sigue apuntando a
`dpl_8dPAotjhgzTb6Fpbh2tG7Pfj3Pwk`. El gate añade únicamente la nueva rama y
mantiene todos los bloqueos existentes. La aprobación de integración o de
Production sigue pendiente.
