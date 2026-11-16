Harness preparado para Contacto Production y su verificación pública posterior. La fase aislada terminó 5/5 PASS sobre dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w; su paquete está en isolated/. La fase pública espera confirmación de promoción del mismo ID. La autorización expresa de publicación corresponde a la instrucción vigente del usuario comunicada por root; las restricciones Preview anteriores se conservan en la evidencia histórica.

El runner independiente `scripts/contacto-release-qa.mjs` admite `--phase isolated` y `--phase public`. Cada fase usa evidencia, perfil y caché nuevos. Production aislado usa el CLI autenticado desde un directorio sin vincular, con el ID explícito, CSP preservada y watchdog de 60 segundos. La fase pública usa HTTPS directo desde un perfil nuevo, sin transportar cabeceras de autenticación ni respuestas de Production aislado. Los métodos distintos de GET/HEAD, las rutas API y los proveedores externos se bloquean en ambas fases. El Toolbar conocido se clasifica por origen y ruta exactos.

Antes de ejecutar, root debe completar `.vercel/contacto-production-release-20261116/browser/target-isolated.json` con el ID nuevo, su origen HTTPS vercel.app y `productionReadyConfirmedByRoot: true`. El runner rechaza CUt, ByUhr y 9zz. Para la fase pública debe completar `target-public.json` con el mismo ID promovido, el origen canónico exacto Sollahms y `promotionConfirmedByRoot: true`. La fase pública exige resultados aislados PASS de ese mismo ID. Los archivos target no deben contener tokens o credenciales.

Comandos desde el checkout independiente:

```sh
node docs/contacto-baseline-20261116/production-release-20261116/browser/scripts/contacto-release-qa.mjs --phase isolated
node docs/contacto-baseline-20261116/production-release-20261116/browser/scripts/contacto-release-qa.mjs --phase public
```

Cada fase verifica 1440, 1024, 768, 390 y 320 px, con página completa, pie y selector vacíos capturados antes de interacciones. Comprueba composición de header/footer, overflow, cuatro campos requeridos, prompt completo e indicador nativo, WhatsApp por href sin abrirlo, menú móvil con Escape, selección por letra «d», Tab a SUMMARY y consentimiento, restauración del foco, reportValidity vacío, RUT sintético inválido/válido y consentimiento mediante clic real con el RUT válido y desenfocado. Limpia el RUT al final. No pulsa Enter ni submit, no invoca form.submit y no repite diagnósticos históricos ni los 524 controles de Recorridos.

El contador DOM de submit se registra incluso si una aserción falla; una guarda de captura impide su propagación accidental y el transporte bloquea cualquier solicitud unsafe. La fuente Contacto debe ser exacta: SHA256 02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1, 18.655 bytes; solo se admite ausencia de sufijo o el sufijo Toolbar ya certificado de exactamente 163 bytes y SHA256 8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc. El inventario lógico debe seguir siendo de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0.

Los resultados se guardan bajo `isolated/` y `public/`, con checkpoints por ancho. Los perfiles, cachés, PID y fases quedan bajo `.vercel/contacto-production-release-20261116/browser/<fase>/`. Los grupos CLI propios se terminan por watchdog; el resultado no puede pasar si el cierre del navegador o la eliminación del perfil fallan. No se modifica la aplicación ni el índice Git.
