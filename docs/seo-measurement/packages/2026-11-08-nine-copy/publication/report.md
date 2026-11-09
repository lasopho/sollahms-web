# Publicación autorizada — bloqueo antes de crear el candidato

**Estado:** bloqueado. La autorización del propietario para el artefacto exacto fue recibida y permanece vigente si la base no cambia. No se requiere otra autorización para esa misma versión. Fecha y hora de esta comprobación en America/Santiago: véase [preflight.json](preflight.json).

## Comprobaciones realizadas

- Artefacto presente: **211687360 bytes**, SHA-256 **`17f4496b411f779029494de4c6757c30cca41f8547992333f1e76523444c035d`**, exactamente los autorizados.
- Extraído, sin reconstruirlo, en `/workspace/work/publish-nine-copy-20261108/publish-9597b21.local/artifact/`. Sus **1648 archivos** coinciden íntegramente con el inventario del candidato validado. Adjunto, extracción y fuentes privadas permanecen fuera de GitHub.
- Equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`, proyecto `project-wrapp` / `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH` confirmados por lectura.
- Consultados individualmente los alias `sollahms.cl` y `www.sollahms.cl`: ambos siguen en **`dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ`**, la base y destino de reversión autorizados. [Evidencia sanitizada](production-base.json).
- Instalada **Vercel CLI 65.11.0** en el área privada, con versión fijada y scripts de instalación desactivados. `--version`, `deploy --help` y `curl --help` terminaron con código 0; se confirmaron `--prebuilt`, `--prod`, `--skip-domain` y `--project`. No se modificaron dependencias del repositorio ni configuración del sitio.
- `vercel whoami --non-interactive`, usando la configuración privada de ejecución, terminó con código 1 y **`Logged out`**. El entorno no tiene una credencial de ejecución Vercel configurada; su política tampoco permite `api.vercel.com` ni el hostname futuro del candidato. La conexión del conector no suministra una sesión de terminal.

## Capacidad exacta que falta

Falta un **canal de ejecución autenticado que permita publicar el prebuilt como producción sin asignar los dominios y después leer el candidato protegido**.

Se verificó el flujo oficial: `vercel deploy --prebuilt --prod --skip-domain`. El último flag envía `autoAssignCustomDomains:false` en el cuerpo de creación. El conector disponible no expone ese campo; la lectura del proyecto tampoco devuelve el valor del ajuste de asignación automática. `live:false` es otro campo y no permite inferir ese comportamiento. Crear producción sin el control confirmado podría mover los dominios antes del QA, incumpliendo la autorización.

Las herramientas del conector para abrir un despliegue protegido pueden crear enlaces de excepción de acceso. No se usaron como sustituto de una sesión existente porque el propietario exige conservar las protecciones y secretos. No se creó un despliegue que después no pudiera comprobarse de forma compatible.

Fuentes comprobadas: [CLI deploy y Skip Domain](https://vercel.com/docs/cli/deploy#skip-domain), [implementación oficial del flag](https://github.com/vercel/vercel/blob/main/packages/cli/src/commands/deploy/index.ts#L1797-L1826), [campo independiente del proyecto](https://github.com/vercel/terraform-provider-vercel/blob/main/client/project.go#L206). No se ensayaron parámetros no expuestos ni se cambió el ajuste del proyecto.

## Acción mínima para continuar

Habilitar **en el entorno de ejecución**, mediante su configuración segura, una sesión/credencial Vercel con acceso a este equipo y proyecto, y salida HTTPS a `api.vercel.com`; cuando exista el candidato, acceso a su hostname y lectura autorizada de sus páginas sin crear nuevas excepciones de protección. Esto no requiere cambiar variables, secretos, protecciones, DNS ni servicios del proyecto Sollahms. No enviar credenciales por el chat.

La CLI y la extracción exacta ya están preparadas. Una vez disponible ese canal, comprobar otra vez la base y ejecutar desde la extracción privada el despliegue **prebuilt / production / skip-domain**, esperar READY y realizar el QA remoto del candidato. Solo después, reconfirmar ambos alias y asignar individualmente **únicamente** `sollahms.cl` y `www.sollahms.cl` al mismo ID comprobado. Evitar una promoción general que pueda mover otros alias del proyecto.

Si el canal se habilita en otro equipo, deberá recibir el mismo artefacto privado, comprobar tamaño y SHA-256 y extraerlo allí; no usar el checkout, reconstruirlo ni subirlo a GitHub. La autorización ya recibida se aplica a la misma huella y a los mismos límites.

## Cierre de esta intervención

**Despliegue nuevo: ninguno. Cargas a Vercel: ninguna. Activaciones: ninguna. Reversiones: ninguna.** Producción sigue en la base. Se mantienen desactivados los despliegues automáticos, sin fusión a `main` y sin cambios de configuración o contenido.

El QA local de la versión anterior está documentado en [completion/report.md](../completion/report.md); no se presenta como una prueba remota nueva. La verificación del candidato protegido y las comprobaciones posteriores a la activación quedan pendientes del canal indicado. No se certificaron correos, CRM, reservas ni otros servicios externos y no se enviaron contactos reales.
