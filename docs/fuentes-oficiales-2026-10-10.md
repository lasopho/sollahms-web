# Revisión de fuentes oficiales — 10 de octubre de 2026

Rama exclusiva: `codex/integracion-financiera-sollahms`. Base: `a279744`. No merge ni despliegue Production. Se complementan seis fichas existentes; el catálogo conserva sus 148 proyectos.

| Fuente entregada | Resultado | Pendientes conservados |
| --- | --- | --- |
| [Mapocho 3521](https://euroinmobiliaria.cl/proyectos/mapocho-3521) | Se reconfirman Euro, Rivas Vicuña 1131, Quinta Normal, desde UF 2.994, entrega inmediata y modelos vigentes 2–3 dormitorios. Se agregan salón infantil, patio exterior y dos imágenes de dormitorio/piscina; se mantienen portada y cuatro imágenes existentes. Edificio A recibe un apartado separado del conjunto con seis imágenes y mapa de referencia. | La fuente y su brochure no identifican Edificio A. Sus datos específicos no se reemplazan por los del conjunto. El antiguo recorrido enlazado responde 404; no se integra como funcional. |
| [Froilán Roa 5731](https://euroinmobiliaria.cl/proyectos/froilan-roa-5731) | Se publica información general de Euro, Froilán Roa 5731, La Florida, desde UF 3.049, cuatro modelos de 1–2 dormitorios, entrega estimada segundo semestre de 2027 y equipamiento. Ambas fichas reciben apartados separados del conjunto, cuatro imágenes compartidas y mapa general. | No se identifican Torre Norte ni Torre Sur. Precios, acceso, superficies, imágenes y entrega propios de cada torre siguen pendientes. No se encontró un visor oficial en esta fuente. |
| [Verne Oficinas](https://norte-verde.cl/proyecto/verne-oficinas/) | Se agrega un apartado comercial separado: Norte Verde, Av. Videla 810, Coquimbo, desde UF 1.550 para Oficina 202; oficinas de 1–3 privados; modelo 1 privado/1 baño de 23,19 m² útiles y totales; entrega inmediata. Cuatro imágenes y mapa de oficinas. | Se conserva Edificio Verne residencial: la nueva oferta comercial no acredita su stock ni su precio. Rango 21–57,96 m² sin definición útil/total. El brochure relacionado indica Videla 812; no se traslada ninguna dirección al residencial. Los enlaces de tour apuntan a secciones inexistentes y no permiten verificar un recorrido. |
| [Irarrázaval / contexto](https://norte-verde.cl/360/edificio_irarrazabal/contexto/) | Se conserva una sola integración del visor oficial y el mapa existente de Irarrázaval 1970. El título de la ficha del visor pasa a «Visor 360 oficial — contexto por confirmar». Entrada y orientación por teclado verificadas en iframe, escritorio y móvil. | La URL/título identifica Irarrázaval 1970, pero su escena interna se llama «Albora» y fue generada en 2021. La correspondencia geográfica sigue pendiente. No se importan fotos ni coordenadas del panorama, ni se renuevan precios o fechas comerciales mediante esta fuente. |

## Criterios y alcance de los datos

Los cuatro apartados `officialContext` tienen fuente, fecha, alcance y advertencia propios. La información del conjunto y de oficinas no se incorpora como oferta de la etapa o del producto residencial, ni modifica su clasificación financiera. Los cinco objetos públicos de etapas, Verne e Irarrázaval permanecen idénticos a la base. Mapocho mantiene precio, dirección, tipologías, entrega y portada; sólo cambian los dos equipamientos y la fecha/fuente reconfirmada.

Diez archivos oficiales nuevos se conservan en su resolución y bytes originales. Cada URL, fuente, dimensión y SHA-256 queda registrado en `data/fuentes-imagenes.json`. Los 521 archivos de assets existentes conservan su hash; también se verifican los 509 originales de la rama de fichas. No se sustituye una imagen existente. Se distingue el material relacionado y las representaciones de una fotografía específica de torre o unidad.

La galería residencial y el precio principal de Verne siguen pendientes. El apartado de oficinas ofrece el material nuevo sin presentar UF 1.550 como precio de departamentos. Los datos del conjunto se muestran con ese alcance en las tres fichas de subdivisiones. Los mapas consultan direcciones publicadas; no se inventan coordenadas y el marcador lo determina Google Maps.

## Verificación

- Suite Node: 164 pruebas aprobadas, incluidas 10 nuevas de alcance/procedencia, precio, integración financiera y preservación. Doce solicitudes API sintéticas con precios contextuales son rechazadas sin contactar proveedores.
- Auditoría estructural: 148 fichas, 3.157 enlaces internos, 137 mapas propios, cuatro mapas de referencia separados y 154 URLs únicas de sitemap.
- Integridad: 142 HTML y objetos ajenos al lote intactos; nombres, rutas, menús y tres acciones contextuales de las seis fichas conservados. Las cuatro destacadas no cambian.
- Navegador local: doce revisiones, seis fichas × escritorio 1280×900 y móvil 390×844; todas las imágenes cargan y no hay desbordamiento horizontal. Los seis mapas funcionan en ambas dimensiones. El visor de Irarrázaval permite entrar y cambiar orientación con ArrowRight en ambos tamaños.
- Catálogo: búsqueda «Froilán», orden ascendente por precio y navegación a Torre Norte; búsqueda «Verne» después de evaluación financiera. Consultar proyecto y Agendar Asesoría mantienen la identidad correcta. Sin enviar mensajes ni reservar.
- Capacidad: escenario sintético renta CLP 3.000.000, ahorro CLP 20.000.000, aporte CLP 500.000, horizonte 12 meses, pie 20%, plazo 25 años, tasa efectiva 4,5%: A 78 / B 29 / C 0 / D 8 / E 33. Verne conserva E, sin precio de oficinas en el simulador. Ahorro CLP y comparador en UF permanecen intactos.
- Build Preview: 155 HTML, sólo dos JSON públicos, noindex. Los registros de investigación, pruebas y documentos QA no se publican.

Evidencia en `docs/qa/fuentes-oficiales-2026-10-10/`: revisión de fuentes con hash de HTML, doce comprobaciones de navegador y capturas del visor. El hash de la captura de Irarrázaval también está en su registro de investigación.

Los antiguos controles de comparación contra ramas anteriores presuponen fichas inmutables y no representan este lote autorizado. La nueva prueba `official-contexts.test.mjs` compara contra `a279744`, exige exactamente las seis fichas y diez recursos permitidos y mantiene protección estricta de las demás páginas, assets, APIs, registros de contacto, motores financieros y sitemap.

## Repetición del lote

```sh
python3 scripts/build-project-details.py --slugs mapocho-3521,mapocho-3521-edificio-a,froilan-roa-5731-torre-norte,froilan-roa-5731-torre-sur,edificio-verne,irarrazaval --review-date 2026-10-10 --branch codex/integracion-financiera-sollahms
python3 tests/validate-project-details.py
node --test tests/*.test.mjs tests/booking-project-context.mjs tests/form-regression.mjs tests/rut*.mjs tests/integration-*.mjs
VERCEL_ENV=preview VERCEL_GIT_COMMIT_REF=codex/integracion-financiera-sollahms node scripts/package-vercel.mjs
```

Las verificaciones comerciales y de identidad siguen pendientes donde la fuente no acredita el dato. La funcionalidad del visor se distingue de la identidad del panorama. Se necesita revisión del usuario antes de cualquier integración a main.
