# Integración Sento a main

Autorización posterior del usuario: «hacer merge», seguida de «continuar». Preparada exclusivamente desde main `f1e9bf1715cc99d095a367eba9028a9a1ad2b026`; no se incorpora el historial posterior de Ecasa, Leben, Norte Verde o León. La fuente de esta integración está en la copia aislada `/private/tmp/sollahms-sento-merge`.

Se mantienen los 144 proyectos actuales de main: siete Sento actualizados y 137 ajenos. Las 137 filas de cada registro, HTML, contextos y todos los recursos originales de main se comprueban mediante un baseline propio, independiente del baseline134 de la Preview anterior. Las siete fichas y los277 recursos de imagen de Sento mantienen exactamente los hashes de aquella fuente validada:45 planos y125 superficies visibles. No se añaden rutas.

El generador Sento, el genérico y el de fichas destacadas conservan la presentación sin Documentación del proyecto. Los valores desconocidos y las discrepancias de Curicó D2/C2-1, Plaza B5/C2 y Angamos A2/A4/C6 permanecen documentados en `data/sento-plan-audit.json` y el resumen de planos. Los PDF originales se conservan internamente en el paquete validado y quedan ignorados en este repositorio público; el build protegido requiere ese paquete completo.

Las proyecciones históricas se limitan a los siete sucesores validados y a sus recursos con hashes fijos. Se mantienen los asserts, conteos, pins y clasificación de las pruebas antiguas de main. Cualquier precio arbitrario, cambio de otra inmobiliaria, HTML no revisado, superficie calculada, código prestado o URL ajena se rechaza.

Validación de esta base:240/240 Node,74/74 Python y validador hipotecario;8/8 comprobaciones nuevas de integración Sento. Los22 casos privados de release que la clasificación de main ya excluía permanecen fuera del denominador. El primer intento Python detectó una inconsistencia del fixture histórico destacado; se corrigió solamente su insumo para que los registros originales correspondan al HTML original y se repitieron los74 casos. Los recibos están en `docs/qa/sento-merge/`. Las pruebas323/323 y130/130 de la Preview pertenecen a aquella fuente con otras carteras posteriores; no se presentan como el conteo de esta base de main.

`vercel.json` conserva main con despliegue automático desactivado y desactiva también la rama Sento. El build de Production se rechaza antes de crear salida pública. No se ejecutó deploy ni promoción y no se modificó el workspace compartido. El PR y el SHA del merge se registrarán en el recibo final de esta conversación.

## Actualización de main durante la integración

Main avanzó a `61884b03bf2c843e4859cace9883033aec3690db` con el prototipo de encabezados Norte Verde. Sus tres recursos, su empaquetado optativo y sus controles históricos se conservan. El baseline de integración se capturó de nuevo desde ese main real; las137 filas/HTML/contextos ajenos siguen idénticos y la nueva prueba comprueba también los recursos de ese commit. Los cinco conflictos se resolvieron combinando las dos condiciones, sin retirar guardas ni activar despliegues. La validación se repite sobre esta combinación antes de publicar el merge.

La combinación con main618 se verificó nuevamente:240/240 Node,74/74 Python,validador y8/8 Sento. Recibos:`docs/qa/sento-merge/current-main-ci.json` y`sento-current-main.tap`. El conector no autorizó crear un PR (403 Resource not accessible by integration); se utiliza un merge Git normal con la credencial que publicó la rama, sin force-push.
