# Verificación pública después de promoción

**608/608 PASS**, cero fallos, sobre `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`, el mismo Production probado y promovido sin reconstrucción.

El [reporte completo](public-verification-results.json) y su [resumen](public-verification-summary.json) conservan 4 portadas, las 131 fichas desde HTTP/HTTPS de apex y www (524 casos), 38 recursos representativos, 14 comprobaciones seguras de las siete funciones, 12 controles de internos sin fuente y 16 variantes de retiro de Patio Brasil, todas con HTTP 410.

Hubo 1.184 transacciones contando redirects: 912 HTTPS validadas y 576 redirects 308; cero fallos TLS. El destino canónico fue `https://sollahms.cl`. Los 592 contenidos estáticos comprobados coincidieron exactamente con los bytes certificados; no se necesitó aceptar el sufijo opcional conocido de Vercel.

Los GET/HEAD de las funciones comprobaron rechazos de método y el modo de reservas `request-only` preservado: los cuatro HTTP 503 esperados no representan un fallo de plataforma. La ruta interna `/api/contact.mjs` devolvió el JSON 405 del handler, sin servir fuente. No se verificó entrega comercial mediante solicitudes reales.

No se enviaron formularios. No hubo autenticación, cookies, mutaciones, correos ni cuerpos/cabeceras raw guardados. Las URLs del reporte omiten queries y fragments. El [proceso quedó cerrado](process-close-verification.json).

La [señal de promoción](promotion-confirmed.json) documenta el ID exacto y la comprobación de aliases realizada por el padre. El [script](verify_public.py) solo usa GET/HEAD públicos y exige esa señal vigente antes de crear procesos o usar red. La comprobación de aliases API queda separada de este runner. Para una reproducción expresamente autorizada, actualizar primero la señal tras revalidar los aliases; no reutilizar una señal vencida:

```sh
python3 verify_public.py --expected-production-id dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5 --promotion-signal promotion-confirmed.json --concurrency 3
```

No se ejecutó más red al empaquetar. [Manifest SHA256](manifest-sha256.json) y [SHA256SUMS](SHA256SUMS) cubren los seis archivos del paquete, excluyendo ambos manifiestos de la autorreferencia.

```sh
shasum -a 256 -c SHA256SUMS
```
