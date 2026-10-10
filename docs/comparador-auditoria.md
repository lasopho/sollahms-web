# Auditoría técnica del comparador hipotecario

Fecha: 9 de octubre de 2026, Chile.

La auditoría de código, datos y API no encontró fallas críticas abiertas en el escenario publicado. La suite completa terminó con **33 pruebas aprobadas, 0 fallas**. El catálogo pasó la validación estricta: 10 instituciones y 3 referencias aplicables al escenario CMF verificado.

## Alcance y evidencia

Se revisaron el motor financiero, el esquema y vigencia del catálogo, el controlador de interfaz, HTML/CSS, la solicitud de asesoría, la función de contacto y la política de privacidad. La investigación financiera se contrastó con el registro [CMF y fuentes oficiales](cmf-fuentes-hipotecarias-2026-10-09.md); esta auditoría no efectuó una nueva captura de las fuentes externas.

Se ejecutaron:

```sh
node --test tests/*.test.mjs
node scripts/validate-mortgage-data.mjs data/hipotecario.json 2026-10-09
```

Se utilizó el Node.js integrado en el entorno Codex. Las pruebas de contacto construyen solicitudes HTTP `Request` reales para el handler y sustituyen únicamente la llamada al proveedor de correo por respuestas controladas. No se enviaron correos externos durante esta auditoría.

## Resultados financieros y de datos

- La anualidad conserva capital, pie, financiamiento y plazo; distingue tasa nominal anual convertible mensualmente de tasa anual efectiva. Las pruebas incluyen amortización iterativa independiente, tasa cero, tasas próximas a cero y escenarios de límite.
- El escenario de propiedad 4.000 UF, pie 25%, crédito 3.000 UF y 20 años reproduce los dividendos financieros publicados: Scotiabank 19,04 UF, Itaú 19,65 UF y Banco de Chile 19,27 UF. Las primas disponibles se mantienen separadas del dividendo financiero.
- Un escenario oficial no se extrapola a otros montos, pie, plazo o ubicación. Los gastos, seguros y CAE de un ejemplo de condiciones con rango se retiran cuando el escenario no coincide.
- Los resultados ordenan tasas por su equivalencia anual efectiva. La CAE se ordena dentro de cada grupo de cobertura; desgravamen/incendio y desgravamen/incendio/sismo no comparten un ranking. Los valores ausentes se conservan como desconocidos, no como cero.
- El costo total contractual no se publica en las tres referencias actuales porque no se verificó una cobertura completa. El conflicto entre tabla y detalle de Banco de Chile permanece sin total ni primas inferidas.
- El validador ahora rechaza un costo declarado completo inferior a la suma de dividendos financieros, incluso cuando supera el capital. La nueva prueba utiliza el contraste CMF independiente de 4,63% y comprueba también el límite exacto de un crédito sin interés ni cargos.
- La UF del 09/10/2026 conserva su valor decimal, fecha y fuente. La conversión a pesos se suspende cuando la fecha deja de ser el día vigente en Chile. La fecha de verificación puede preceder a la fecha del valor publicado por la fuente; una UF futura no se utiliza antes de su día.
- Las referencias requieren fuentes oficiales, convención explícita y fechas independientes de publicación y revisión. Los límites de 7 días desde revisión y 30 días desde publicación son políticas internas de mantenimiento. Una referencia puede retirarse antes de `validUntil` si su publicación excede el límite.

## Solicitudes de asesoría y compatibilidad

El servidor recalcula los montos a partir de datos numéricos y utiliza exclusivamente el catálogo verificado para validar una alternativa seleccionada. Rechaza dividendos calculados enviados por el cliente, bancos sin referencia vigente y cambios de tasa o escenario incompatibles con la selección.

Las pruebas cubren consentimiento obligatorio, teléfono válido, tiempos del formulario, campos inesperados, cuerpos grandes, JSON inválido, origen incompatible y escape del contenido HTML. El resumen enviado incluye contexto financiero, fuentes, fechas, cobertura y consentimiento. No se encontraron credenciales de correo en los archivos públicos examinados.

La respuesta de éxito exige una aceptación confirmada del proveedor. Clave ausente, rechazo, fallo de red o respuesta sin identificador producen un error. La interfaz hipotecaria exige además `body.ok === true`; el error conserva los datos ingresados. El honeypot absorbe solicitudes identificadas como spam sin llamar al proveedor.

Se preservó la compatibilidad del contacto existente: teléfono y asunto opcionales y mensaje con un mínimo de 10 caracteres. El comentario hipotecario permite textos cortos; un comentario vacío usa el mensaje de solicitud predeterminado. La privacidad identifica el contexto hipotecario, Resend y Vercel.

## Hallazgos corregidos durante la revisión

| Hallazgo | Corrección revisada |
|---|---|
| Enlaces institucionales leían campos planos que no existían en el esquema. | Enlaces y fechas usan `institution.source`. |
| La interfaz omitía coberturas distintas al presentar CAE. | Tarjetas identifican coberturas y el orden por CAE muestra grupos separados. |
| Detalle y resumen podían reutilizar gastos del ejemplo en una oferta con rango. | Utilizan los gastos filtrados del escenario comparado. |
| Un comentario opcional corto fallaba en el backend. | Validación hipotecaria específica y prueba de regresión del contacto existente. |
| La tarjeta siempre etiquetaba la tasa como efectiva. | La etiqueta refleja la convención publicada. |
| Ordenar podía retirar una selección vencida sin actualizar inmediatamente su detalle. | El cambio de orden ejecuta la actualización completa. |
| Un total completo podía ser inferior al costo financiero base. | El esquema lo rechaza y la alternativa queda fuera de la comparación. |

## Límites de esta auditoría

La revisión visual y los recorridos de navegador corresponden a la validación separada del responsable de integración; este informe no afirma haber ejecutado pruebas de navegador. Tampoco confirma entrega real a una bandeja de correo, despliegue o funcionamiento del proveedor con credenciales de producción. La aceptación simulada del proveedor valida la integración y sus fallos, no la entrega externa.

La publicación financiera mantiene actualización controlada. Las pruebas no convierten una tasa histórica o una campaña con subsidio en una oferta general ni certifican aprobación bancaria. Cada incorporación posterior debe conservar su evidencia oficial y volver a pasar el validador.
