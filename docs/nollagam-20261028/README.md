# Siete fichas Nollagam completas

Se enriquecen únicamente Liverpool, Barrio Zenteno, Alto Goycolea, Santa María, Eleuterio Ramírez y Costanera Coquimbo A/B sobre la producción b81f421, que conserva el retiro de Patio Brasil (131 proyectos públicos).

| Proyecto | Valores desde por tipología (UF) | Variantes | Planos | Fotos nuevas |
|---|---|---:|---:|---:|
| Liverpool | 2D 4.151; 3D 4.457 | 23 | 9 | 7 |
| Barrio Zenteno | 1D 2.784; 2D 3.202; 3D 3.508 | 20 | 19 | 6 |
| Alto Goycolea | Estudio 2.264; 1D 2.601; 2D 2.886 | 7 | 7 | 7 |
| Santa María | 1D 3.090; 2D 3.355; 3D 4.029 | 12 | 12 | 6 |
| Eleuterio Ramírez | 2D 3.825; 3D 4.400 | 15 | 12 | 7 |
| Costanera Coquimbo A | 2D 4.210; 3D 5.070 | 18 | 6 | 4 |
| Costanera Coquimbo B | 2D 3.880; 3D 5.460 | 18 | 5 | 5 |

Los 103 folios de siete brochures se revisaron completos. Se conservan las superficies exactas (útil/interior, terrazas, total y jardines separados), numeración documental y pisos. Los 70 planos completos se sirven en WebP sin pérdida con miniaturas separadas. Las 42 fotografías/renders nuevos se incorporan junto a las imágenes válidas existentes; ocho duplicados visuales detectados se excluyeron. Las portadas muestran fachadas y cada edificio conserva sus propios archivos.

Los precios del propietario se muestran por tipología y el mínimo alimenta catálogo/filtros/ficha. Cinco tipologías documentadas sin precio muestran Consultar valor. Las superficies mínimas describen los modelos y no vinculan el precio a una unidad. No se infiere stock de los sellos históricos AGOTADO.

Estado informado de cinco proyectos: En recepción final, entrega inmediata. Costanera A: En blanco, primer semestre de 2027. B: En blanco, primer semestre de 2028. Se conserva la dirección pública verificada de Eleuterio Ramírez 951 (el PDF imprime 947); no se cambian accesos ni mapas. Equipamiento y terminaciones se contrastan individualmente con las fuentes oficiales registradas en data/nollagam-commercial.json.

## Datos pendientes de confirmación

- Stock, unidad correspondiente al precio e inclusiones (estacionamientos/bodegas).
- Liverpool A3 repite numeración 216–816 con superficies distintas; Liverpool D presenta dos diferencias de suma.
- Barrio Zenteno B7 repite 209 con superficies distintas.
- Alto Goycolea A/B/D tienen diferencias de 0,01 m² entre sumas y total impreso.
- Costanera B B1 pisos 5–6 imprime 63,39 m², que no coincide con 56,11 + 8,28 m².

Se mantienen los valores impresos con observaciones visibles; no se corrigen sin evidencia.

## Validación y publicación

- 38 pruebas Node: precios/contexto Nollagam, flujos de solicitud, campos comerciales/RUT, catálogo y retiro de Patio Brasil.
- Auditoría independiente de 113 variantes y 17 precios: coincidencia exacta; sin IDs duplicados o anclas rotas.
- Regeneración idempotente; 124 fichas y registros ajenos idénticos. Header/footer, formulario, mapas/recorridos de las siete fichas preservados. JS de seguridad y efectos compartidos sin cambios.
- Revisión de las siete páginas en navegador; escritorio y vistas de 390/768 px, sin desborde global. Planos completos con ampliación.
- Formulario probado con datos ficticios y transporte interceptado sólo en la carpeta local qa. La vista HTTP local usa una dependencia criptográfica de prueba para el identificador; producción conserva Web Crypto, validaciones e idempotencia originales. Se verificó el payload con edificio B, 3 dormitorios y UF 5.460, y la selección A con UF 4.210. No se enviaron leads reales.
- El paquete congelado verifica SHA-256 de todos sus archivos, conserva funciones/configuración de producción y actualiza sólo siete filas del catálogo interno de contact. La carpeta qa y sus recursos nunca se incluyen en el manifiesto ni el commit.

La evidencia técnica está en preservation.json y regression.txt. La publicación usa la rama codex/nollagam-complete-20261028, sin modificar main ni habilitar despliegues automáticos.
