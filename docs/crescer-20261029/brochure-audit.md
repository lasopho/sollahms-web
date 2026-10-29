# Auditoría documental Crescer

Se revisaron visualmente las 34 páginas de los dos PDF originales, incluidos todos los dibujos y rótulos de sus 24 láminas de planos. Se extrajo texto como apoyo. No se consultaron precios web ni se modificaron fichas, catálogo o aplicación.

| Proyecto | Planos técnicos | Filas técnicas | Coherentes para filtro | Láminas de color |
|---|---:|---:|---:|---:|
| Edificio Don Tomás | 7 | 16 | 16 | 5 |
| Edificio Don Rafael | 8 | 16 | 15 | 4 |

## Hallazgos que afectan la implementación

1. **Don Rafael, p12 derecha, referencia documental 316–816: conflicto bloqueante.** El dibujo muestra dos recintos separados rotulados DORMITORIO y un BAÑO. El título dice «PLANTA DE ESTUDIO 316 AL 816» y publica 18,56 m² de interior y 5,50 m² de terraza, exactamente las cifras de la planta izquierda. No se puede decidir cuál dato es erróneo. La fila `don-rafael-p12-right` lleva `classificationStatus=conflict`, `filterEligible=false` y `filterAreas={}`. Conservar la lámina con advertencia; no asignar esas superficies a un estudio ni a 2D1B.
2. **Don Rafael, p9 derecha:** título técnico «210 AL 210» y pie «Departamento 210-810». Se preservan ambos. El error de referencia no contradice su dibujo de estudio con un baño ni sus superficies impresas.
3. **Don Tomás:** «TOTAL DEPARTAMENTO» es una métrica propia. No está rotulada útil ni interior. Se conservan DEPARTAMENTO, SHAFT, TOTAL DEPARTAMENTO y TERRAZA por separado. La métrica de filtro propuesta es `departamento` / «Departamento (según plano)». No se suma terraza ni se publica un total calculado.
4. **Don Rafael:** sólo se imprimen «SUP. INTERIOR» y «SUP. TERRAZA». Útil y total permanecen desconocidos.
5. **Nueve láminas de color:** no incluyen código técnico, referencias o superficies para demostrar correspondencia exacta. Se guardan aparte en `illustrativePlans`, sin nuevas variantes numéricas.
6. **Números de referencia:** se guardan para trazabilidad interna de la lámina; no son inventario, unidades disponibles ni prueba de stock. No expandir rangos en unidades.

## Datos generales y características

**Don Tomás — `Crescer - Don Tomás.pdf`, p2:** Calle Teniente Yávar 1733, Conchalí; 8 pisos y 274 departamentos; Studio, 1D1B, 2D1B, 2D2B y 3D2B. Escalera vidriada con vista a patio interior, altura de departamentos de 2,4 m y edificio full eléctrico. El patio interior pertenece al relato del edificio: no acredita patios privados.

Áreas comunes documentadas en p2: quincho, sala multiuso, gimnasio, juegos infantiles, lavandería, bicicleteros y estacionamientos de visitas. P3–4 muestran imágenes referenciales de espacios.

Conectividad p2: entre las estaciones Conchalí y Vivaceta y a pasos de Avenida Independencia. «Tres estaciones del centro de Santiago» carece de estación de destino específica y se conserva sólo como texto del folleto; no permite calcular tiempos/distancias. P17 es mapa contextual con jardines infantiles, escuelas, supermercados, restaurantes, farmacias, hospitales, comercio, bencinera e iglesias.

**Don Rafael — `Crescer - Don Rafael.pdf`, p2:** Domeyko 1950 esq. O. Edwards, Santiago; 9 pisos y 108 departamentos; Studio, 1D1B y 2D1B. La tipología 2D1B está documentada a nivel general, pero no tiene una combinación de modelo y superficie coherente verificada: el dibujo p12 derecha presenta el conflicto señalado.

Áreas comunes p2: terraza, sala multiuso, quincho, gimnasio, lavandería, bicicleteros y estacionamientos de visitas. P4 precisa «Terraza en altura + Quincho en Piso 9»; es un calificador de esos mismos espacios, no dos amenities adicionales. P17 identifica Metro Toesca, escuelas, universidades, institutos, supermercados, restaurantes, farmacias, Parque O’Higgins y Club Hípico; no publica tiempos ni distancias.

**Terminaciones:** ninguno de los PDF aporta especificaciones textuales de materiales o marcas. No convertir muebles, colores, revestimientos o artefactos dibujados en inclusiones comerciales. Full eléctrico y altura sólo se atribuyen a Don Tomás.

**Entrega, recepción final, disponibilidad, región y precios:** no están establecidos por estos PDF. Los datos actuales aportados por el usuario deben mantenerse en la fuente comercial separada. Esta auditoría no incorpora los siete precios ni los valida contra campañas.

## Don Tomás: transcripción técnica

Superficies en m². Valores exactos, sin redondear. En «Estudio», el baño se contó visualmente; las otras tablas imprimen número de dormitorios y baños. Todas las filas tienen evidencia en la página y posición correspondientes del JSON.

| Página | Tipo | Tipología | Departamento | Shaft | Total departamento | Terraza |
|---:|---|---|---:|---:|---:|---:|
| 5 | B4 | 1D1B | 37.83 | -0.44 | 37.39 | 0 |
| 5 | C1 | 2D1B | 42.72 | -0.35 | 42.37 | 0 |
| 5 | B2 | 1D1B | 33.44 | -0.44 | 33.00 | 0 |
| 6 | A8 | Estudio · 1 baño visual | 34.05 | -0.44 | 33.61 | 0 |
| 6 | C3 | 2D2B | 57.64 | -0.44 | 57.20 | 0 |
| 6 | A6 | Estudio · 1 baño visual | 26.09 | -0.44 | 25.65 | 0 |
| 7 | E1 | 3D2B | 64.86 | -0.65 | 64.21 | 0 |
| 7 | C8 | 2D1B | 48.46 | -0.35 | 48.11 | 0 |
| 8 | C6 | 2D2B | 43.99 | -0.44 | 43.55 | 0 |
| 8 | A2 | Estudio · 1 baño visual | 30.37 | -0.44 | 29.93 | 0 |
| 9 | B5 | 1D1B | 33.66 | -0.44 | 33.22 | 1.50 |
| 9 | A25 | Estudio · 1 baño visual | 28.74 | -0.44 | 28.30 | 1.50 |
| 10 | B9 | 1D1B | 31.89 | -0.44 | 31.45 | 1.50 |
| 10 | B3 | 1D1B | 27.73 | -0.57 | 27.16 | 0 |
| 10 | A10 | Estudio · 1 baño visual | 26.01 | -0.44 | 25.57 | 0 |
| 11 | B10 | 1D1B | 33.97 | -0.44 | 33.53 | 0 |

**Aritmética:** las 16 filas cumplen DEPARTAMENTO + SHAFT con su signo = TOTAL DEPARTAMENTO, con diferencia 0,00 m². Este cálculo se usa sólo para QA. Hay 13 terrazas expresamente impresas como 0 y tres de 1,50 m². Ningún cero se reinterpretó como patio/jardín privado. A8 p6 es una planta con dos referencias, no dos modelos.

Pisos impresos: p5 «Piso 0»; p6–7 «Piso 1»; p8 «Piso 2»; p9 «Piso 3»; p10–11 «Pisos 4 al 8». No se usan los números de referencia para inferir más pisos.

Láminas ilustrativas: p12 Estudio / Tipología 1; p13 Estudio / Tipología 2; p14 1 Dormitorio - 1 Baño / Tipología 1; p15 1 Dormitorio - 1 Baño / Tipología 2; p16 2 Dormitorios - 2 Baños / Tipología 1.

## Don Rafael: transcripción técnica

Se muestran referencias sólo para control documental. Los dormitorios de los departamentos y baños se verificaron visualmente en el plano; las plantas de estudio se identifican por su título. No equivaler el área rotulada DORMITORIO dentro de un estudio a un dormitorio independiente.

| Página | Referencia interna del pie | Clasificación | Interior impreso m² | Terraza impresa m² |
|---:|---|---|---:|---:|
| 5 | 201-801 | 1D1B visual | 28.77 | 3.59 |
| 5 | 202-802 | Estudio · 1 baño visual | 19.14 | 5.07 |
| 6 | 203-803 | Estudio · 1 baño visual | 19.14 | 5.02 |
| 6 | 204-804 | Estudio · 1 baño visual | 19.14 | 5.07 |
| 7 | 205-805 | 1D1B visual | 28.52 | 3.46 |
| 7 | 206-806 | 1D1B visual | 30.06 | 3.41 |
| 8 | 207-807 | 1D1B visual | 29.28 | 1.75 |
| 8 | 208-808 | 1D1B visual | 27.74 | 1.78 |
| 9 | 209-809 | Estudio · 1 baño visual | 18.59 | 2.57 |
| 9 | 210-810 | Estudio · 1 baño visual | 18.59 | 2.57 |
| 10 | 211-811 | Estudio · 1 baño visual | 18.30 | 2.57 |
| 10 | 212-812 | 1D1B visual | 27.49 | 1.78 |
| 11 | 313-813 | Estudio · 1 baño visual | 22.03 | 5.27 |
| 11 | 314-814 | Estudio · 1 baño visual | 17.92 | 5.77 |
| 12 | 315-815 | Estudio · 1 baño visual | 18.56 | 5.50 |
| 12 | 316-816 | CONFLICTO: título Estudio / dibujo 2D1B | 18.56 | 5.50 |

La última fila conserva cifras impresas únicamente para auditar el conflicto; **no son superficies verificadas de una variante**. No hay total publicado para comprobar una suma interior + terraza.

Láminas ilustrativas: p13 Estudio / Tipología 1; p14 Estudio / Tipología 2; p15 1 Dormitorio - 1 Baño / Tipología 1; p16 1 Dormitorio - 1 Baño / Tipología 2.

## Advertencias de la fuente y límites

Las p3–16 de ambos folletos declaran que el contenido es referencial, las superficies y medidas son aproximadas/preliminares y pueden modificarse, y las imágenes están amobladas/ambientadas con propósito ilustrativo. Las p1–2 también indican «Imagen referencial». Mantener estos avisos al mostrar las láminas.

No se documenta superficie útil, superficie total con terraza, terreno, patio/jardín privado, fecha de entrega, disponibilidad de unidades ni especificación de terminaciones. Se conserva incertidumbre como `null`, no como cero. La única excepción de cero comprobado es TERRAZA=0 en 13 tablas de Don Tomás.

El archivo JSON contiene cada dato con filename y página, `roomEvidence`, campos numéricos exactos, control aritmético, inventario de las 34 páginas y SHA-256 de ambos PDF. El script reproducible de esta transcripción está en `analysis/crescer-data-qa/build_audit.py`; es una transcripción auditada, no un OCR automático.

## Verificación

Comprobados: SHA-256 de los originales; 34 páginas auditadas; 32 IDs técnicos únicos; 31 modelos elegibles y uno excluido; 16 controles aritméticos de Don Tomás; 13 terrazas cero; nueve láminas ilustrativas aisladas; todas las superficies de Don Rafael contrastadas con su extracción textual y revisión visual.
