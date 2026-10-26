# Direcciones documentadas y cobertura del mapa — 26/10/2026

La ausencia de un marcador no implica ausencia de dirección. Se revisaron 61 PDFs (57 contenidos distintos, 862 páginas disponibles), extrayendo texto y OCR en 81 páginas sin texto útil. La revisión visual se centró en las páginas de identidad y ubicación utilizadas; no se afirma haber inspeccionado visualmente cada página.

- Vista Llacolén B: **Las Heras Poniente 77, Concepción**, PDF pp. 2 y 7. No dice 477. A y B comparten punto de conjunto, pero conservan fichas independientes. El PDF titulado A es copia de B y no acredita la identidad de A; ésta se confirma mediante la página oficial.
- Se recuperan Uruguay 8866 y Ramón Cruz Montt 3291 desde los documentos y registros ya verificados que no habían pasado al catálogo. Calle Eugenia se incorpora como dirección parcial de Mirador La Florida, con numeración pendiente.
- 5 registros nuevos en el mapa: Vista Llacolén A/B, Pintor Cicarelli I/II y Plaza Las Condes. Total 64 de 132; 68 pendientes de coordenadas. El detalle público distingue direcciones disponibles, numeración pendiente y dirección ausente.
- Se rechazan centroides de calle, un resultado interpolado de Ramón Cruz, oficina corporativa de Sento y el enlace ajeno de Parque Panamá. No se transfieren precios, equipamiento ni disponibilidad desde las fuentes usadas para ubicación.
- 4 parejas de PDFs idénticos por SHA-256. Discrepancias conservadas en `brochure-address-audit.json`; no se sustituyen datos vigentes por números históricos o accesos alternativos sin comprobar.

## Preservación

Producción avanzó durante la revisión. Se incorporó íntegramente **895205da75b89908b8fc2c5033ff4852f6018ca6**, incluyendo Trabaja con nosotros y sus funciones. Deployment de rollback: **dpl_C8mXXxqLqMg75K9XYvXLdhAwPotb**. Rama independiente: `codex/catalog-map-brochure-addresses-20261026`; main intacta y despliegues Git desactivados.

Sólo cambian catálogo JSON, registro geográfico, presentación de direcciones pendientes y párrafo de ubicación en tres fichas. Precios, medios, galerías, formularios, calculadora, UF, estilos y efectos permanecen idénticos a producción. Los PDFs originales y sus datos internos no se añaden al paquete público. No se activan servicios ni se envían solicitudes reales.

Para futuras actualizaciones, usar `data/proyectos.json` como catálogo y contrastar los campos documentados con `data/fichas-proyectos.json`; no sobrescribir direcciones verificadas por registros reducidos de tarjetas. Ejecutar las pruebas de direcciones antes de empaquetar. La geocodificación se realiza fuera del sitio y se conserva, sin consultas por visitante.
