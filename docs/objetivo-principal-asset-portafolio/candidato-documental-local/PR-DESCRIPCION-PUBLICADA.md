El catálogo conserva la revisión documental local y corrige la selección de precios publicados por tipología. Por ejemplo, Local de Origen Atacama usa su referencia UF 2.697,78 y admite el rango UF 2.600–2.800; antes tomaba UF 2.534,88 de Estudio. Precio y atributos deben satisfacerse en una misma referencia, sin prestar baños, superficies o tipos entre filas.

La corrección adapta tablas del propietario con fuente y fecha explícitas (20 proyectos, 41 filas), conserva las rutas comerciales modernas y los 131 precios/tipos predeterminados. En proyectos mixtos no asigna Departamento a cotizaciones sin ese respaldo: el diferencial de 48 consultas registra 40 resultados iguales, cuatro altas Local y cuatro exclusiones conservadoras. También corrige cuatro precios Local mostrados. Las fórmulas y módulos financieros permanecen intactos; la tarjeta oculta un cálculo incompatible con la referencia seleccionada.

La fuente documental se habilita sólo en loopback con `revision_documental=1`, antes de cargar archivos fijados por SHA-256. Incluye 16 referencias de 15 proyectos y conserva las 131 identidades. Las 15 referencias Iris mantienen precio nulo; Plaza Las Condes 213/C7 relaciona su precio de lista del propietario del 28/10 con el plano exacto observado el 17/11. No acredita stock ni vigencia comercial. Tarjetas, listado, mapa y vista dividida comparten la proyección; el fallo de fuente muestra respaldo publicado mediante aviso accesible persistente.

Validación por corte, sin sumar subconjuntos:

- Delta de precios: 34/34 pruebas nuevas Node, 70/70 regresiones pertinentes y 14/14 controles Chrome.
- Integración documental anterior: 32/32 carga y motor, 17/17 presentación final, 83/83 regresiones pertinentes y 22/22 Chrome (cuatro vistas y cinco anchos).
- 155 archivos protegidos coincidentes. Datos publicados originales, 131 fichas, siete funciones y módulos financieros intactos.

El servidor estático de QA no ejecuta `/api/uf` ni certifica escenarios financieros. No se ejecutaron builds, generadores o formularios.

Este PR permanece en Draft. No habilita la fuente documental en producción ni autoriza Ready, merge, deployment o publicación. Los deployments automáticos están excluidos en origen y destino. Producción continúa en 9e82122. El objetivo global de información comercial de los 131 proyectos sigue abierto.

[Evidencia del candidato documental original](https://github.com/lasopho/sollahms-web/blob/923ca4bff746625bc1f8af5b8435369dd655f396/docs/objetivo-principal-asset-portafolio/candidato-documental-local/CANDIDATO-INTEGRADO.json). La corrección de precios es el commit cea57c8144d1e388203f0743f8b87fc88b5441ed; su recibo y QA se incorporan al expediente documental independiente.
