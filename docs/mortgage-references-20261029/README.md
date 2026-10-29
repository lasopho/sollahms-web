# Referencias finales de la Guía hipotecaria

Cambio limitado a `/guia-hipotecaria.html` y su CSS. La atribución usa el texto indicado por el propietario y se presenta en una única sección «Fuentes y referencias», después del llamado a explorar/asesoría e inmediatamente antes del footer. Sin logo CMF, banners ni referencias repetidas por módulo.

`scripts/mortgage_guide_references.py` renderiza el bloque desde `data/mortgage-guide-content.json.references` y su registro de fuentes. Para agregar una fuente: registrarla y agregar su ID a `otherSourceIds`, sin modificar módulos. Los `sourceIds` por tema permanecen como trazabilidad interna. Se conserva el enlace al simulador oficial en el bloque final y la fuente SII fechada junto a la UF variable. El texto distingue explícitamente los cálculos propios de Sollahms.

El generador `scripts/build-mortgage-guide.py` conserva los doce módulos, glosario, FAQ, ejemplos, metodología, beneficios fechados, campos y resultados. Sólo se ajusta una frase de atribución en documentación, sin cambiar su contenido técnico. No había citas textuales, gráficos ni material CMF que requirieran atribución individual.

Comprobaciones: una sola sección de referencias al final; cero menciones CMF fuera del bloque; controles/resultados/metodología/cabecera/footer idénticos; todos los demás registros del artefacto idénticos. Se verificaron los nueve enlaces oficiales (CMF Educa y simulador, Banco Central, SII UF y refinanciamiento, MINVU y tres normas BCN).

Paquete: `python scripts/build-mortgage-guide.py` y `python scripts/package-mortgage-references.py`. Baseline `dpl_3V498DSS6puAcpfmzGe9D3Rf17vH`; preserva funciones, rutas, retiro Patio Brasil410, datos, precios, formularios y ramas sin despliegue automático. Ver `validation.json` y evidencia de publicación.
