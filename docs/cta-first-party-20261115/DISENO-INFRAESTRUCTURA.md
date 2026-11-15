# Diseño de infraestructura — Analytics First-Party Sollahms

**Estado: propuesta documental; no autoriza implementación ni gasto.**
Revisión: 15/11/2026, America/Santiago (UTC−03:00).
Base: `2a59981aa184937300d0b36b948ae3366ca9229d`; [consolidación](CONSOLIDACION-Y-ARQUITECTURA.md).
Laboratorio PR23: código `180f621630f70e34da5207ed924d0cf5f3499dc2`, deployment de referencia `dpl_4HdweiyWVmBtJZbbvbHumXCmCBn6`.

## 1. Decisión recomendada

Módulo Analytics independiente, sin contactos, cartera, oportunidades, tareas comerciales ni envío de correos. Medirá guía → CTA → agenda → inicio → aceptación → entrega verificable.

**Recomiendo C con aislamiento de A:** API propia en Vercel y PostgreSQL administrado exclusivo para Analytics, separado de CRM y de su autenticación operacional. Es una recomendación condicionada a presupuesto, privacidad, custodia y pruebas; no selección ni contratación efectiva de un recurso. B queda como alternativa posterior, solo tras resolver garantías de seguridad y capacidad del PostgreSQL existente.

A y B son decisiones de almacenamiento; C es una topología de ejecución que puede combinarse con ambas. No se presentan como tres productos excluyentes.

## 2. Inventario comprobado y límites

Lecturas de metadatos autorizadas, sin SQL, secretos, cambios de configuración o acceso a datos personales. Las tarifas públicas no acreditan cuotas remanentes de cuenta.

| Recurso | Evidencia obtenida | Propiedad / custodia | Entorno y disponibilidad |
| --- | --- | --- | --- |
| Vercel project-wrapp | API get_project: prj_URomRRU0MAy4etGKP5gWv3Qv4DGH, Node24.x; SSO all_except_custom_domains | Team team_A9VNIW2f2K1IJpd2pGdvDmEN, lsandoval2-8260's projects; custodio operativo y suplente por designar | LatestDeployment READY target production: dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN; no se consultó alias, por tanto no prueba qué sirve el dominio |
| Plan Vercel | get_team no devuelve plan ni saldo | Facturación del team; rol concreto no expuesto | Plan contratado, créditos remanentes y límites de concurrencia NO VERIFICADOS |
| Supabase | list_projects/get_organization: crm360-desarrollo, ref fducthwgrwbbsgbeaucc, ACTIVE_HEALTHY, us-east-1, PostgreSQL17.11.0.011 | Organización Sollahms CRM360, vbtplnfsrizepxavgqnu; titular legal/custodios no certificados | Plan Free confirmado. Capacidad usada, conexiones disponibles y permisos SQL no consultados |
| PostgreSQL CRM | Documento CRM v2 congelado en 68ebc53 | Custodio, respaldo externo, claves y RPO/RTO pendientes en documento | Bloqueo060 de procedimiento seguro; ACTIVE_HEALTHY no demuestra logins, RLS ni disponibilidad para Analytics |
| CRM360/Render | Documento v2: primer despliegue privado no autorizado, acceso Render y cuotas sin verificar | No se asume operador o servicio disponible | No depender de CRM para el módulo |
| Resend | api/advisory.mjs revisado en consolidación: aceptación diferenciada de entrega, canal interno | Cuenta, custodio de webhook, plan y consumo NO VERIFICADOS | Código no prueba configuración actual; no se conectó Resend |
| Atribución | Laboratorio local IndexedDB; rama experimental referenciada por README | Propietario del repositorio lasopho; operación futura Sollahms por formalizar | Código y pruebas sintéticas, no instrumentación productiva certificada |
| Autenticación | Protección Vercel de preview confirmada; diseño Auth/BFF CRM documentado, aceptación pendiente | Administradores del futuro panel por nombrar | Protección preview no sustituye autorización del panel/API productivos |
| Almacenamiento adicional | IndexedDB local confirmado funcionalmente por QA | Navegador del evaluador | No inventariado bucket, base Analytics ni backup externo disponible |

Permisos demostrados: lectura de metadatos Vercel/Supabase, lectura de Git y actualización documental del PR. No se deducen facultades de DDL, administración, secretos o despliegue a partir de esos permisos.

### Facturación observada y discrepancia

Consulta Vercel 01–15/11 UTC excedió límite de respuesta de 4MiB. Se redujo a 14/11 00:00Z–15/11 00:00Z. La respuesta resume 847 registros, pero informa período **13/11 08:00Z–14/11 08:00Z**, distinto del solicitado. Reporta billed USD0,102605971405 y effective USD0,747767261727 para su período, a nivel team, no Analytics. **No usar como gasto del día solicitado, costo mensual, saldo disponible ni factura final.** Muestra y grupos de servicio truncados; resumen declarado completo solo para registros devueltos. Conciliar exportación/semántica temporal antes de presupuesto definitivo. No se pidió credencial ni se activó servicio.

## 3. Alternativas

| Criterio | A: base Analytics independiente | B: PostgreSQL existente aislado | C: API Vercel + base transaccional |
| --- | --- | --- | --- |
| Seguridad / aislamiento | Roles, secretos y recuperación exclusivos; menor alcance de incidente | Esquema y roles no eliminan administrador, recursos y backups compartidos | API reduce exposición; requiere base A o B, secretos solo servidor |
| Durabilidad / concurrencia | Transacciones y unicidad; backup propio verificable | Iguales primitivas, compite con CRM; bloqueo060 pendiente | Funciones sin estado; base y cola durable garantizan persistencia |
| Deduplicación | Índices únicos y huella de contenido | Posible sin usar tablas de contactos | Confirmación tras commit y reintentos idempotentes |
| Recuperación | Restore independiente; costo separado | Restore puede afectar CRM; ensayar destino aislado | Reanudar jobs con leases; memoria de función no es ledger |
| Privacidad / retención | Borrado y roles independientes | Riesgo de unión y borrado parcial en respaldos compartidos | Logs y cuerpos deben filtrarse; first-party no significa sin proveedores |
| Costos | Nuevo compute y respaldo; mínimo previsible | Ahorro marginal posible, no demostrado; costo de capacidad y riesgo | Ejecución por uso más base; no usar almacenamiento efímero |
| Operación | Un recurso adicional, menor acoplamiento | Menos recursos, mayor coordinación y permisos | Dos proveedores/capas; pooling, timeouts y observabilidad |
| Dependencia | SQL portable, Auth/backups pueden ser específicos | Dependencia del ciclo operativo CRM | Dependencia Vercel; contrato HTTP y SQL portable reducen migración |
| Dictamen | Preferida para datos | No habilitar actualmente | Preferida como servicio combinado con A |

No usar Blob, caché, archivo de función ni ledger Map por proceso como sustituto de transacciones. Reutilizar hosting y patrones de validación; no clonar un CRM ni incorporar datos comerciales al panel.

## 4. Contrato técnico propuesto

Contrato productivo `analytics.v1`, distinto del fixture. Ingesta pública acepta únicamente guide_view, tax_advisory_click, agenda_view, advisory_form_start. advisory_accepted y advisory_delivered solo servidor.

Campos cliente: event_id UUID aleatorio, session_id opaco, seq entero, type enumerado, occurred_at UTC, page enum guide/agenda, cta enum header/main/footer/null, instrumentation_version permitida. Servidor añade received_at, environment, trust_source y expires_at. Sin campos adicionales, texto libre, URL/query/referrer bruto, RUT, nombre, correo, teléfono, respuestas tributarias ni fingerprint. synthetic y run del laboratorio no se admiten en contrato real.

Mapa CTA deberá fijarse contra DOM vigente antes de instrumentar; conservar distinción de tres enlaces y no renombrar silenciosamente main/footer.

### API, todavía inexistente

| Ruta propuesta | Acceso | Resultado |
| --- | --- | --- |
| POST /api/analytics/session | Público limitado, mismo origen | Capacidad firmada breve ligada a sesión y entorno; no prueba identidad humana |
| POST /api/analytics/events | Capacidad válida | Lote máximo20 y16KiB reales; resultado individual confirmado/duplicado/rechazado |
| POST /api/analytics/provider-receipts | Firma de proveedor | Recibo mínimo persistido antes de responder; no acceso navegador |
| GET /api/analytics/report | Usuario autorizado | Agregado por período/cohorte |
| GET /api/analytics/export | Rol exportador | JSON/CSV agregado, sin UUID ni correlaciones |

JSON estricto, streaming acotado, esquema cerrado y rechazo de eventos de servidor en endpoint público. 400/413/415 terminales; 401 exige capacidad renovada solo si sesión válida; 429/503 reintentables con Retry-After. Timeout deja resultado desconocido: reenviar mismo ID, no crear otro. Respuesta perdida no implica pérdida del commit.

Origin/CORS/Fetch Metadata como capas, no autenticación contra bots. Capacidad con audiencia, entorno, vencimiento y firma; rate limit atómico compartido y global. Propuesta inicial 60 solicitudes/min por capacidad, lotes acotados, límites diarios por escenario; ajustar en ensayo. IP solo procesamiento transitorio si se aprueba, sin persistencia analítica; revisar logs del hosting. No secretos en cliente ni claves service_role. Consultas parametrizadas, TLS verificado, pool limitado, roles mínimos y revocación de acceso público a esquemas privados.

Panel con login/MFA y autorización de servidor en todas las rutas; roles viewer/exporter/admin, auditoría sin contenido personal. No reutilizar JWT/roles CRM sin un proyecto separado de revisión; cookies de sesión administrativa HttpOnly/Secure/SameSite y CSRF, sin cookies de marketing para visitantes.

### Sesión y atribución

30 minutos de inactividad por eventos pertinentes; no renovar por reenvío de un evento antiguo. SessionStorage por pestaña y Web Locks para colisión; copia obtiene otra identidad sin heredar CTA. Si no puede garantizarse aislamiento, desactivar atribución y marcar cobertura desconocida.

Último clic válido dentro de la sesión antes de enviar; relación sellada por servidor y congelada en aceptación. Sin referrer como única prueba, sin unión entre dispositivos. Propuesta de máximo absoluto24h, con rotación; separada de cola local máxima24h. Expiración no borra el historial antes de su plazo. Reinicio puede perder continuidad; nunca reconstruir por fingerprint.

### Modelo lógico; no DDL ejecutable

| Tabla/esquema | Campos principales | Restricciones |
| --- | --- | --- |
| analytics.sessions | id, created_at, last_activity, expires_at, version | PK id; actualización de actividad monotónica |
| analytics.events | event_id, session_id, seq, type, page, cta, occurred_at, received_at, digest | PK event_id; mismo ID con digest diferente rechazado; FK sesión |
| analytics.unique_steps | session_id, type, cta_normalizado | UNIQUE compuesto para vistas/inicios/clics únicos; evitar ambigüedad NULL |
| analytics.requests | request_ref analítico, contexto congelado, accepted_at, delivered_at, status | PK request_ref; entrega no computable sin aceptación |
| restricted.correlation | request_ref ↔ referencia operacional/proveedor | UNIQUE proveedor+message_id; rol adaptador, nunca panel |
| restricted.receipt_inbox | provider_event_id, digest, tipo, message_ref, received_at, estado | UNIQUE proveedor+event_id; payload personal descartado tras verificar |
| analytics.jobs | id, tipo, due_at, lease_until, attempts, estado | Reclamo transaccional; reintento acotado |
| analytics.daily_aggregates | fecha, versión, CTA, conteos, calidad | UNIQUE dimensiones; recomputación idempotente |
| analytics.deletion_log | lote, fecha, conteos, resultado | Sin identificadores personales |

Entornos físicamente separados en opciónA; nunca confiar solo en bandera environment. Roles ingest, reconciler, reporter, retention y migrator separados; reporter ve agregados. Esquemas no expuestos por Data API; RLS como defensa adicional, no bypass genérico. Correlación tiene sensibilidad aunque sea opaca: seudonimización, no anonimato.

## 5. Cola, conciliación y evidencia de entrega

IndexedDB cliente conserva solo eventos minimizados hasta ACK, máximo24h/500 eventos propuestos; exceso o borrado registra pérdida conocida si es posible y anula afirmación de cobertura. Backoff exponencial con jitter, máximo10 intentos; no bucle de red. La base usa transacciones para evento/clave semántica/job; no se promete exactly-once de transporte, sí efecto idempotente dentro del horizonte de deduplicación.

El adaptador operacional futuro recibe un contexto analítico validado y una request_ref distinta de la clave operacional. No modifica contactos ni duplica envíos. Aceptación requiere respuesta validada con ID del proveedor y relación durable. Caída entre aceptación externa y guardado: estado desconocido y conciliación, no un nuevo envío automático.

Webhooks: firma sobre cuerpo crudo, biblioteca oficial, timestamp, protección replay y secreto por entorno. Descartar PII del payload después de verificar; no registrar cuerpo en logs. Recibos duplicados no incrementan; entregas huérfanas quedan pendientes. Fallos/retrasos/rebotes separados. Idempotencia Resend tiene ventana documentada24h; no asumir protección ilimitada.

Delivered significa llegada al servidor destinatario, no lectura ni cita. El canal actual documentado es correo interno de Sollahms. No habilitar tracking de aperturas/clics. El CRM no es necesario para esta medición.

## 6. Privacidad — matriz para aprobación

Responsable jurídico exacto, custodio titular/suplente y encargados deben designarse; no se atribuyen automáticamente a una cuenta de Git. Base habilitante **pendiente de revisión**, no inferida del consentimiento para responder el formulario.

| Finalidad | Datos | Base propuesta | Retención propuesta | Acceso / proveedor | Eliminación, respaldo y derechos |
| --- | --- | --- | --- | --- | --- |
| Medir recorrido | Sesión, evento, CTA, fechas | Por determinar antes de piloto | Eventos30d; sesión activa30min, máximo24h | Ingest/reconciler; Vercel y PostgreSQL elegido | Purga diaria; tramitar acceso/supresión cuando sea identificable sin recopilar PII adicional innecesaria |
| Atribuir resultado | request_ref y contexto sellado | Evaluar compatibilidad/finalidad específica | Correlación30d máximo, sujeto a conciliación | Solo adaptador; separación de datos comerciales | Borrar vínculos y colas; no exportar correlaciones |
| Seguridad | Códigos de rechazo, contadores y digest mínimo | Evaluación de necesidad/proporcionalidad | Logs7d; tombstones hasta31d | Seguridad y retención | Sin cuerpos ni IP persistente; no recrear evento caducado |
| Informes | Agregados por día y CTA | Revisar riesgo de reidentificación | 90d | Viewer/exporter autorizados | Supresión de grupos menores de5 propuesta; revisión de exportaciones |
| Recuperación | Copias cifradas mínimas | Documentar finalidad y encargados | Backup7d propuesta | Custodio separado | Purga al vencer; reaplicar borrados antes de reabrir restore |
| Administración | Identidad del operador, accesos | Política administrativa separada | Por aprobar | Auth elegido; sin fusionar con visitantes | Revocación/MFA/auditoría; canal de derechos independiente |

No crear fichero paralelo de titulares para Analytics. Definir procedimiento de derechos con verificación proporcional, sin prometer búsqueda cuando no exista vínculo disponible. Registro de solicitud de derechos queda fuera del almacén analítico. Revisar transferencias internacionales (región estadounidense observada), contratos de encargados, información al usuario, oposición y retirada cuando corresponda.

BCN Ley21.719 [S8] debe revisarse junto con el régimen aplicable en la fecha real del piloto; este documento no declara base legal aprobada ni presume que first-party está exento de obligaciones.

## 7. Retención, recuperación y operación

Purga diaria de eventos y correlaciones; agregados90d. Rechazar eventos de más de24h o posteriores al horizonte admitido; tombstone mínimo31d evita resurrección al reintentar. Ajustar plazos con revisión legal y recibos tardíos, no guardar indefinidamente por conveniencia.

RPO objetivo propuesto24h y RTO8h con backups diarios; no garantías medidas. Si se necesita RPO menor, presupuestar PITR antes de aprobar. Backup de base no sustituye custodia de secretos ni recuperación de Auth. Ensayo de restore en destino aislado, revalidar sesiones, purgar caducados y no reenviar operaciones comerciales. Restauración nunca sobre CRM.

Métricas internas: latencia/pérdidas/rechazos, atraso de jobs, recibos huérfanos y último backup/purga. No guardar payload de cliente en observabilidad. Kill switch solo Analytics; nunca pausar globalmente project-wrapp ni interrumpir formularios.

## 8. Costos y capacidad

USD mensuales, sin impuestos ni tipo de cambio. **Escenarios de diseño, no tráfico real ni cotización.** Tarifas consultadas15/11/2026; cuotas públicas y consumo remanente se distinguen.

### Tarifas de referencia verificadas

- Supabase Free: 500MB DB, 5GB egreso, 50.000MAU; pausa por inactividad y límite2 proyectos activos. Pro desdeUSD25/mes, 8GB disco/proyecto, 250GB egreso, 100.000MAU y backups diarios7d [S1]. No se confirma un cupo Free adicional disponible.
- Compute Micro ~USD10/mes, Small15, Medium60; crédito compute10 por organización paga [S2]. Segundo proyecto no hereda otro crédito. Si se eleva la organización CRM, recalcular todos sus proyectos.
- Vercel Pro público20/mes con20 de crédito de uso [S3]. Plan real y crédito libre no certificados. Referencia iad1: CPU0,128/h, memoria0,0106/GB-h; ejemplo oficial invocaciones0,60/millón [S4]. La tabla de esa página muestra N/A para invocaciones Pro pero el texto las cobra: confirmar SKU antes de contratar.
- CDN referencia publicada0,15/GB, origin0,06/GB, solicitudes2/millón; depende de región/Flat Rate CDN [S5]. Para Chile no se presupone esa tarifa final.
- Resend Free3.000emails/mes,100/día; Pro20/mes50.000 y excedente0,90/mil [S6]. Cuenta real no consultada. Analytics no necesita enviar correos nuevos; costos operacionales se separan.
- PITR7d ~USD100/mes adicional [S7], no incluido en propuesta base.

### Modelo reproducible de carga

Eventos E/mes:10.000/100.000/1.000.000. Sesiones estimadas E/4; solicitudes aceptadas hipotéticas1% de sesiones. Son supuestos, no conversiones esperadas. Lotes/reintentos/bootstrap/panel/jobs: N=0,75E+2.000 llamadas/mes. Pico de diseño10×promedio; ensayo deberá medir ráfagas.

Por evento retenido30d: payload600B + índices600B + relaciones/cola/WAL/reserva1.000B =2.200B de planeación; no medición PostgreSQL. Agregados90d≤10MB. Backup conservador siete copias completas de datos+índices (1.200B/E), sin compresión. Tráfico4KB/llamada incluyendo cabeceras/respuesta como hipótesis; revisarlo con prueba.

| Capacidad mensual | Bajo | Medio | Alto |
| --- | ---: | ---: | ---: |
| Eventos E | 10.000 | 100.000 | 1.000.000 |
| Sesiones / solicitudes hipotéticas | 2.500 /25 | 25.000 /250 | 250.000 /2.500 |
| Llamadas N | 9.500 | 77.000 | 752.000 |
| Datos / índices GB | 0,006 /0,006 | 0,06 /0,06 | 0,6 /0,6 |
| DB con reserva + agregados GB | 0,032 | 0,23 | 2,21 |
| Backups7 copias GB | 0,084 | 0,84 | 8,4 |
| Tráfico estimado GB | 0,038 | 0,308 | 3,008 |
| CPU-h (20ms/llamada) | 0,0528 | 0,4278 | 4,1778 |
| Memoria GB-h (1GB×200ms/llamada) | 0,5278 | 4,2778 | 41,7778 |
| Usuarios panel / logins mes | 2 /60 | 5 /150 | 10 /300 |

Usuarios panel son MAU Auth; visitantes NO crean cuentas Auth. La provisión de1GB/200ms es supuesto, no configuración verificada; concurrencia cambia facturación. Exportaciones agregadas pequeñas, sin descarga de eventos. Backups incluidos administrados no se suman al disco activo ni se cobran otra vez por GB; copia independiente necesitaría proveedor/costo por verificar.

### Estimación presupuestaria C+A

Organización Analytics independiente paga hipotética, un proyecto; compute Micro bajo/medio y Medium alto solo como reserva de capacidad, no dimensionamiento certificado. No aumentar CRM.

| USD/mes | Bajo | Medio | Alto |
| --- | ---: | ---: | ---: |
| Supabase base+compute−crédito aproximado | 25 | 25 | 75 |
| Vercel Pro base de planeación | 20 | 20 | 20 |
| CPU+memoria+invocaciones, antes de créditos | 0,0181 | 0,1463 | 1,4288 |
| Red referencia (0,21×GB +2×N/millón) | 0,0270 | 0,2187 | 2,1357 |
| Subtotal conservador sin descontar crédito Vercel | 45,05 | 45,37 | 98,57 |
| Reserva propuesta para incertidumbre/operación | 14,95 | 29,63 | 51,43 |
| **Tope de aprobación propuesto** | **60** | **75** | **150** |

Fórmula compute=N×(0,02/3600×0,128 +0,2/3600×0,0106 +0,60/1.000.000). La reserva no es tarifa. Auth panel y backup diario entran en cuotas hipotéticasPro; no SMS, SAML empresarial, PITR, log drains ni nuevo correo. Copia independiente, build/storage de deployments, autenticación especial y región distinta deben cotizarse dentro del tope o detenerse. No afirmar presupuesto final cubierto hasta resolver esos rubros.

Crédito Vercel20 puede reducir uso, pero no se resta sin conocer consumo de otros proyectos. Si plan existente reutilizable, base20 puede no ser incremental; tampoco se asume. B podría evitar nuevo compute solo con capacidad ociosa comprobada; no se declara costo0. A sin API Vercel requeriría cotizar otro runtime. PITR elevaría subtotal aproximadamente100, requiere nueva aprobación y también comprobar compute mínimo requerido.

Corte propuesto: alertas50/75%, frenar nuevas cohortes al85%, cortar ingesta pública al90% y reservar10% para conciliación/purga. Límites diarios y DB80% de capacidad aprobada. No es garantía de hard cap: cargos tardíos y ataques al borde pueden excederlo. Preservar endpoints comerciales; sin auto-upgrade ni nuevos proyectos. Actualmente gasto autorizado para esta fase: **ninguno**.

## 9. Panel y calidad

Solo agregados: período UTC con presentación America/Santiago, numeradores/denominadores, muestra, CTA, versión, no atribuibles, pérdidas y atraso. Exportación JSON/CSV UTF-8 con esquema estable, null=NO DISPONIBLE y protección contra fórmulas CSV; sin UUID/request_ref.

Conversiones por cohortes comparables; entrega usa solicitudes aceptadas maduras, no sesiones. Fijar ventana de maduración antes del piloto. Cobertura incompleta, denominador0 o discrepancia: NO DISPONIBLE. No extrapolar población observada a todo visitante ni a ventas. Agregación central no prueba recepción de eventos nunca enviados.

## 10. Etapas, aceptación y autorizaciones independientes

| Etapa futura | Criterio mínimo de aceptación | Autorización necesaria |
| --- | --- | --- |
| 1. Recepción centralizada sintética | Contrato cerrado, límites, rechazo PII/server-only, ACK durable; entorno aislado | Desarrollo privado y recurso de prueba identificado; sin público real |
| 2. Almacén y conciliación | Concurrencia/replay/rollback, huérfanos, purga y restore; RPO/RTO medidos | Tablas, roles, secretos custodiados y presupuesto específico |
| 3. Panel privado | Login/MFA, RBAC API/export, calidad y ausencia PII | Identidad y cuentas de operadores; acceso explícito |
| 4. Resend controlado | Firma real, duplicados/desorden, pérdida tras aceptación, canal destinatario verificado | Conexión de pruebas y envíos sintéticos limitada; luego autorización productiva distinta |
| 5. CRM opcional | Justificación, mínimo recibo sin contactos exportados, fallos aislados | Proyecto y contrato CRM separados; puede omitirse |
| 6. Piloto productivo | Privacidad aprobada, presupuesto/corte, comparación producción, rollback y soporte | Publicación y seguimiento real expresos; alcance/fecha/duración definidos |
| 7. Activación general | Revisión piloto, calidad, seguridad, costos y recuperación aprobados | Nueva autorización general, sin ampliación automática |

Complejidad global alta: separar fronteras de confianza y conciliación es más relevante que el volumen inicial. Mantener estimación anterior15–27 jornadas orientativas, no compromiso; no incluye espera de permisos, custodia ni dictamen legal. PR23 no se fusiona como mecanismo de activación. Futuro candidato parte de producción vigente y preserva archivos posteriores.

## 11. Riesgos y decisiones para revisión

Bloqueantes: custodios/roles sin designar, privacidad y presupuesto no aprobados, plan y saldo Vercel incompletos, cuotas remanentes no verificadas, infraestructura CRM con060 pendiente, recibos Resend no probados, backup independiente no confirmado. El riesgo de fraude de cliente se reduce, no desaparece con tokens o CORS.

Decidir: C+A como dirección; región y proveedor; tope inicial60USD/mes o rediseño; RPO24h/RTO8h o PITR; responsable/custodio/suplente; retención30/90d; proveedorAuth y operadores. Estas son decisiones solicitadas para revisión, no una orden de contratar.

Recomendación: aprobar primero el diseño condicionado y, después, una etapa1 sintética con recurso, costos y aislamiento expresamente autorizados. Mantener laboratorio local intacto. QA histórico40/14/7 no repetido; Sheets visual sigue bloqueado y precisión/limitaciones de reinicio conservadas.

## 12. Fuentes y trazabilidad

Consultadas15/11/2026. Valores de cuenta obtenidos mediante operaciones de lectura mencionadas en inventario; sin lectura de secretos ni SQL. La falta de evidencia se declara, no se rellena con estado preparado.

- [Consolidación del laboratorio](CONSOLIDACION-Y-ARQUITECTURA.md), [QA](QA.md), [README](README.md).
- [CRM v2, bloqueos y custodia, referencia68ebc53](https://github.com/lasopho/crm360-inmobiliario/blob/68ebc53/docs/v2-infrastructure-unlock-2026-11-15/README.md).
- [S1 Supabase precios](https://supabase.com/pricing).
- [S2 Supabase compute](https://supabase.com/docs/guides/platform/manage-your-usage/compute).
- [S3 Vercel precios](https://vercel.com/pricing).
- [S4 Vercel Functions](https://vercel.com/docs/functions/usage-and-pricing).
- [S5 Vercel red](https://vercel.com/docs/manage-cdn-usage).
- [S6 Resend precios](https://resend.com/pricing.md).
- [S7 Supabase backups/PITR](https://supabase.com/docs/guides/platform/backups).
- [S8 BCN Ley21.719](https://www.bcn.cl/leychile/navegar?idNorma=1209272).
- [Resend firmas](https://resend.com/docs/webhooks/verify-webhooks-requests), [eventos](https://resend.com/docs/webhooks/event-types), [idempotencia](https://resend.com/docs/dashboard/emails/idempotency-keys).
- [Supabase changelog](https://supabase.com/changelog.md): cambios de CLI/SDK requieren revisión al implementar; no se ejecutó CLI de Supabase.

Solo se añade este documento. Sin tablas, endpoints, credenciales, servicios, envíos, gastos contratados, deployments, seguimiento real, modificaciones de formularios/producción/SEO/GEO/T0 ni fusión.


## 13. Consolidación de continuidad y decisiones de aprobación — 15/11/2026

Esta actualización parte del diseño documental `7dc61b8bd058026d83064e256a290484b2174057`, posterior al SHA de QA `1cfe9fe013c49d7323faa9a4b7565aa875ce2a44` indicado como referencia. Conserva ambos y la consolidación arquitectónica; no vuelve a una rama histórica.

### Estado del QA observado

Se conservan las 40 pruebas Node, 14 IndexedDB y 7 Web Locks anteriores, exportación real, importación/lectura Sheets, duplicación nativa coordinada y recuperación tras reinicio. **No se repitieron.** La ausencia de inflación se limita al recorrido observado. No se declara cobertura universal ni auditoría exhaustiva de almacenamiento.

Sheets visual sigue **PENDIENTE/BLOQUEADA**. La diferencia decimal y las limitaciones causales de la sesión tras reinicio permanecen. **QA general NO cerrado.** El cierre documental de resultados observados no autoriza implementación, publicación ni seguimiento.

### Condiciones de infraestructura que faltan acreditar

Se reutilizan las lecturas del inventario de este mismo día, con su procedencia. No se repitió inventario remoto ni se presentan como consultas nuevas. Proyecto Supabase activo/Free y Vercel existente son recursos identificados, no recursos Analytics autorizados.

| Condición | Evidencia actual | Pendiente verificable |
| --- | --- | --- |
| Recurso exclusivo | No existe recurso Analytics confirmado | Identidad, región, entorno y separación física respecto de CRM |
| Cuotas | Plan público y escenarios documentados | Uso actual, saldo disponible y cargas de otros proyectos |
| Conexiones | Documentación oficial revisada; sin configuración efectiva | max_connections, clientes del pooler, pools por rol y reserva de plataforma |
| Custodia | Sin responsable/suplente formalizados | Responsable de claves, revocación y recuperación; sin compartir secretos en documentos |
| Accesos | Lectura documental/metadata disponible | Matriz efectiva de roles mínimos y autorización de pruebas; no equivale a permiso DDL |
| Backups | Capacidades del plan, no restore del futuro recurso | Destino, cifrado, retención, RPO/RTO y ensayo aislado aprobado |
| Facturación | Discrepancia temporal Vercel conservada | Conciliación de período y plan contratado antes de afirmar costo incremental |
| Resend | Contrato documentado, sin conexión | Canal, recibos, custodio, prueba autorizada y presupuesto |
| CRM360 | Fuera de dependencia Analytics | Ninguna conexión necesaria; un proyecto futuro separado exigiría autorización |

### Límite de conexiones y presión de carga

La [documentación oficial de conexiones](https://supabase.com/docs/guides/database/connection-management), consultada el 15/11/2026, distingue conexiones directas y tamaño de pool; el pool se aplica por rol. Por tanto, separar roles sin sumar sus pools puede agotar PostgreSQL. Los límites efectivos del recurso no se infieren del estado ACTIVE_HEALTHY ni de la tabla de compute.

Diseño propuesto: presupuestar suma de conexiones backend de ingest/reconciler/reporter/retention, más Auth, herramientas administrativas y reserva de plataforma. Mantener ese total por debajo del máximo efectivo verificado, con margen aprobado. Limitar también clientes de pooler e instancias/concurrencia de funciones. No confundir solicitudes por segundo con conexiones simultáneas ni multiplicar el pool máximo por cada función.

Antes de implementar, documentar Cmax, reserva, pools por rol, límite de clientes y pico medido; sin estos valores el dimensionamiento permanece **NO CERTIFICADO**. Evitar consultas abiertas de pg_stat_activity que puedan exponer texto sensible en el contexto del bloqueo060. Solo estadísticas sanitizadas y procedimientos previamente autorizados. No se ejecutó SQL ni se cambió pooling.

Usar transacciones cortas, timeout de adquisición y de consulta, cola acotada y rechazo reintentable al saturarse. Confirmar compatibilidad del driver con el modo de pooling antes de fijarlo. Un esquema propio dentro de la base CRM no cumple la separación exclusiva recomendada: los esquemas analytics/restricted descritos se alojarían en una instancia Analytics separada.

### Invariante: fallo analítico no bloquea solicitud comercial

El envío operacional no espera disponibilidad del receptor analítico. Contexto ausente, expirado, manipulado o receptor caído implica solicitud sin atribución; no rechazo de un formulario comercial válido. Los rechazos operacionales legítimos del formulario se mantienen.

La proyección analítica se prepara fuera del resultado comercial, con cola durable cuando exista y autorización para ello. Si no puede registrarse evidencia, estado analítico desconocido/cobertura incompleta: nunca convertirlo en fallo comercial ni inventar aceptación. Una caída analítica tampoco debe originar otro envío. La implementación futura exige pruebas específicas de esta invariante y cambios operacionales explícitamente aprobados.

### Matriz de autorización expresa

Todas las filas siguientes están **PENDIENTES**. La autorización actual permite únicamente documentación.

| Decisión | Propuesta revisable | Evidencia necesaria para aprobar | Lo que no autoriza aprobar esa fila |
| --- | --- | --- | --- |
| Infraestructura | API Vercel y PostgreSQL exclusivo | Recurso/región/entornos y responsables | Publicación o uso de CRM |
| Almacenamiento | Esquemas separados, transacciones y backup | Capacidad, conexiones, aislamiento y restore | Captura real de visitantes |
| Seguridad | Roles mínimos, MFA, firmas, límites y corte | Modelo de amenazas y plan de aceptación | Acceso general a cuentas o secretos |
| Privacidad | Datos mínimos y finalidad específica | Base habilitante, información, encargados y derechos revisados | Presumir consentimiento del formulario |
| Retención | 30d eventos, 90d agregados; respaldos definidos | Plazos aprobados para todas las copias y borrado verificable | Retención indefinida |
| Resend | Adaptador y webhook autenticado | Canal de prueba, volumen, secretos custodiados y criterio de entrega | Envíos reales o cambio de formularios sin alcance adicional |
| CRM360 | Mantener desconectado | Solo si futura necesidad independiente se justifica | Acceso a contactos por aprobar Analytics |
| Costos | Topes orientativos60/75/150USD por escenario | Cuotas remanentes, facturación conciliada y rubros pendientes | Gastos inmediatos o ampliación automática |
| Publicación | Piloto limitado, después de candidato aprobado | SHA, diff, QA, rollback, duración y seguimiento autorizados | Activación general posterior |

Los escenarios bajo/medio/alto de la sección8 se mantienen como estimaciones, no compromisos de factura. El corte debe actuar exclusivamente sobre Analytics, con reserva para conciliación y borrado; ni saldo bajo ni cola saturada justifican detener formularios o el sitio. Alertas no garantizan un techo absoluto ante retraso de facturación.

### Puerta siguiente

Revisar dirección técnica, custodia, presupuesto y privacidad. Una autorización posterior deberá identificar **etapa, recurso, acciones, datos exclusivamente sintéticos y máximo de gasto**, distinguiendo desarrollo local, creación de recurso, DDL, despliegue privado e integración. No agrupar todas esas acciones bajo «aprobar diseño».

Hasta entonces no iniciar código, servicios, tablas, endpoints, credenciales, conexiones, deployments ni medición. PR23 abierto y en borrador. Esta revisión modifica exclusivamente DISENO-INFRAESTRUCTURA.md; QA.md y sus evidencias se preservan sin cambios.
