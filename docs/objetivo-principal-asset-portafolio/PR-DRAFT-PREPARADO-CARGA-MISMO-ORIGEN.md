# fix: cargar cotizaciones con sesión del mismo origen

En deployments protegidos por Vercel Authentication, las dos solicitudes de cotizaciones del propio dominio usaban `credentials:omit`. Ambas recibían302 y fallaban con `redirect:error`; una consulta por Don Pepe,2D y UF3500–3600 devolvía0 proyectos aunque existe la referencia UF3562. El deployment de revisión conserva ese defecto y quedó bloqueado para promoción; producción sigue en9e.

Los dos cargadores pasan a `credentials:same-origin`. El navegador puede usar su sesión normal sólo dentro del origen propio. Se conservan las rutas públicas fijas, `redirect:error`, timeouts, pinsSHA256, allowlists y rechazo sin fallback a originales. No se leen cookies o tokens, se añaden headers de credenciales ni se modifican SSO o variables.

Validación del delta:

- Dos pruebas nuevas fallaban contra los cargadores anteriores; diez pruebas específicas de carga pasan con la corrección.
- Revisión independiente aprobada para integración local, sin bloqueantes. No se repitieron suites generales ni Chrome; falta comprobar esta corrección en un nuevo deployment protegido autorizado.
- 155 archivos protegidos,21 fuentes originales y las dos proyecciones públicas intactos. Se conservan los21 precios Euro y17 Nollagam, las categorías desconocidas y todos los límites comerciales.
- Cinco archivos: dos cargadores, sus dos tests y la exclusión automática de deployments de la nueva rama. La base también excluye deployments.

La observación Metro proviene de código/datos idénticos entre9e y36ef; no entra en este delta. No se certifican escenarios financieros ni disponibilidad/stock.

Entregable para PR Draft. Ready, merge, deployment nuevo y publicación requieren autorizaciones independientes. El permiso de un único deploymentB7 ya fue utilizado; no se reutiliza ni se promueve ese deployment.
