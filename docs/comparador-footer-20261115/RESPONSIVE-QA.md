# QA responsive final — PR #24

15/11/2026, America/Santiago. **APROBADO: candidato técnicamente apto para solicitar autorización de publicación.** No constituye autorización para publicar.

Se reutilizó `dpl_Ec3koFKPBYbYfmKZ9moxfRbnNDqD`, implementación `6eefd61edf3843cff603c1a2053eb204920270a7`. Sin reconstrucción, nuevo deployment, cambios de aplicación, pruebas financieras repetidas, intervención del fallo histórico, merge ni publicación.

## Matriz verificada

Chrome conectado; override de viewport CSS y medición de `innerWidth/innerHeight`. Altura exacta de 1000 px en los cuatro casos. La barra vertical ocupa 15 px: se registran por separado viewport y ancho útil. No son pruebas en dispositivos físicos.

| Viewport real | clientWidth / scrollWidth | Distribución | Resultado |
|---|---|---|---|
| 1440 × 1000 | 1425 / 1425 | Tres columnas iguales, separación 48 px | Aprobado |
| 768 × 1000 | 753 / 753 | Tres columnas proporcionales, separación 48 px | Aprobado |
| 390 × 1000 | 375 / 375 | Una columna, separación entre bloques 32 px | Aprobado |
| 320 × 1000 | 305 / 305 | Una columna, separación entre bloques 32 px | Aprobado |

En cada tamaño: texto legible, columnas y bloques alineados, sin separaciones excesivas, desbordamiento horizontal ni superposición de enlaces. Se inspeccionaron las capturas y los rectángulos DOM. El número aparece una sola vez dentro del pie, debajo del correo con 8 px entre enlaces y destino exacto `https://wa.me/56948502440`.

El clic real abrió `https://api.whatsapp.com/send/?phone=56948502440&text&type=phone_number&app_absent=0` y mostró **Sollahms Inversiones Inmobiliarias**. No se abrió una conversación ni se envió mensaje.

## Comparación corporativa

La página publicada `https://sollahms.cl/trabaja-con-nosotros.html` se comprobó visualmente en los mismos cuatro tamaños. Coinciden estructura, marca, colores, tipografía, espaciados, alineaciones y comportamiento responsive. Las alturas del pie coinciden: 324,5; 338,59; 680,80 y 704,59 px, respectivamente. Diferencias subpíxel de texto inferiores a 1 px no afectan el diseño. El comparador conserva su destino previo de Asset Portafolio `/proyectos.html`; la referencia utiliza `/#portfolio`.

Las ocho capturas incluyen contexto de página y pie completo. El pequeño control flotante de Vercel pertenece a la preview, no al pie, y no tapa sus enlaces. El override temporal del viewport se restableció al terminar.

## Evidencia

Datos medidos y rectángulos de enlaces: [responsive-qa.json](responsive-qa.json).

| Ancho | Candidato | Referencia publicada |
|---|---|---|
| 1440 | [Captura](candidate-1440.jpg) | [Captura](reference-1440.jpg) |
| 768 | [Captura](candidate-768.jpg) | [Captura](reference-768.jpg) |
| 390 | [Captura](candidate-390.jpg) | [Captura](reference-390.jpg) |
| 320 | [Captura](candidate-320.jpg) | [Captura](reference-320.jpg) |

La revisión anterior a 1363 px y sus bloqueos se mantienen como historial. Esta matriz cierra exclusivamente el pendiente responsive. Para cualquier publicación futura, comprobar la producción vigente y preservar cambios posteriores; no promover automáticamente este preview.
