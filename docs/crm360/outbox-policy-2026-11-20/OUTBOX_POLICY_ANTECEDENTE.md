# Propuesta local: agotamiento al reducir la política de reintentos

Estado: propuesta para revisión, sin aplicar ni publicar. No se ejecutaron SQL, pruebas ni procesos del emisor. No se modificó el snapshot ni GitHub.

Base revisada: Sollahms PR #13, commit `137dc93739a94c911e42193b66ddddc584b83085`. El parche adjunto se dirige a `lib/crm-outbox-postgres.mjs`; modifica exclusivamente la condición de la primera `UPDATE` de `claim()` (línea 17 de esa base).

## Contrajemplo estático

1. Un proceso utiliza `maxAttempts=12`. Una entrega llega a `attempts=8` y no obtiene confirmación válida del CRM.
2. `retry()` con esa política puede devolverla a `pending`, con `lease=NULL`, `lease_until=NULL` y un `available_at` posterior (línea 27).
3. Se reinicia con `maxAttempts=5`, valor admitido por el constructor (línea 4).
4. La primera `UPDATE` de `claim()` solo terminaliza filas `leased` caducadas; no modifica esa fila `pending` (línea 17).
5. La selección siguiente exige `attempts < maxAttempts`; `8 < 5` es falso (línea 18). La fila permanece `pending` sin poder reclamarse mientras siga vigente esa política. Esperar hasta `available_at` no resuelve el bloqueo.

Esta conclusión procede del código y del esquema `sql/crm-outbox.sql:8–15`. No constituye reproducción en PostgreSQL ni evidencia de una fila real afectada.

## Política propuesta

Antes de reclamar una entrega, marcar `failed`, con `error_code='delivery_exhausted'` y sin lease, las filas cuyo contador haya agotado la política actual y estén en uno de estos estados:

- `pending`, incluso si `available_at` todavía es futuro: ya no disponen de intentos autorizados por esa política.
- `leased` con `lease_until <= clock_timestamp()`: el lease ya expiró.

Un lease activo no se modifica. Tampoco se modifican `recorded` ni `failed`. Las filas bajo el límite conservan la selección y el incremento actuales. El cambio no modifica ID, payload, fingerprint, contador, recibo, límite, backoff ni esquema; no crea reenvíos, reprocesos o reaperturas automáticas de fallos.

`failed/delivery_exhausted` expresa que el emisor agotó sus intentos sin conservar una confirmación válida. No demuestra que el CRM no haya registrado el evento: un ACK perdido puede coexistir con recepción duradera. La conciliación posterior debe preservar el ID y el payload originales y utilizar un procedimiento separado y autorizado.

## Alcance y validación pendiente

`unified.diff` contiene solamente esa sustitución de predicado. No se aplicó al código original ni al snapshot. No se preparó ni ejecutó un script de regresión, para evitar introducir un escritor de laboratorio sin destino autorizado.

Tras aprobar y aplicar el parche en un checkout aislado, una regresión nueva y acotada debería utilizar `createPostgresOutbox` con un pool de laboratorio ya existente y autorizado, identidad sin privilegios nuevos y base cuyo nombre real cumpla `^crm360_test_sender_`. La existencia del esquema o un indicador de readiness no autoriza escrituras. Debe verificarse previamente que el pool esté ligado a una conexión dedicada, que las operaciones participen de la misma transacción y que las filas sintéticas se retiren mediante `ROLLBACK`; no se debe crear base, esquema, rol, migración ni credencial para aparentar esas precondiciones.

Casos pendientes, sin repetir suites previas:

- `pending`, `attempts=8`, política actual 5: termina `failed`, sin lease y con `delivery_exhausted`, también con `available_at` futuro. La implementación actual no satisface este resultado.
- `leased` caducado y agotado: conserva el comportamiento terminal existente.
- `leased` activo y agotado: permanece intacto y puede recibir un ACK válido antes de expirar.
- `recorded` o `failed`: permanecen intactos.
- `pending` bajo el límite: respeta `available_at`; cuando corresponde, conserva el incremento y la emisión de lease existentes.

La corrección propuesta no sincroniza configuraciones distintas entre procesos. Una política única y un procedimiento de reinicio/drain de procesos antiguos siguen siendo requisitos del operador. La seguridad de carreras y el resultado PostgreSQL real permanecen pendientes de esa validación específica; este documento no los certifica.
