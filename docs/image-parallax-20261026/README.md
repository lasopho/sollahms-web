# Parallax de imágenes — 2026-10-26

Base publicada: de088c4acc3451413fe053b5176ebc3f14aaef9b / dpl_HmkkoKEyVS7Qe37LHSeNWNLB7F4Q. Fuentes y comprobantes recuperados desde c8918adcc06284f1668a76e859dc53dba41e7505. Rama codex/image-parallax-20261026; main y despliegues automáticos desactivados.

Referencia observada en Chrome real: vistamonsenor.tricapitals.com, sección El proyecto. La foto del comedor se desplaza dentro del marco: scrollY 1109, translateY -39.7295px; scrollY 1329, -31.8694px; regreso a 1109 restaura -39.7295px. Se adopta solamente este comportamiento, sin copiar imágenes o estilos.

132 fichas activas y tres fotos de portada; 750 ubicaciones fotográficas candidatas. La portada actual no tiene fotografía principal. Logos, planos, mapas, formularios e imágenes ampliadas quedan fuera. Recorrido directo y reversible; máximo 32px escritorio / 16px móvil, reducido automáticamente por la geometría y el presupuesto de píxeles. Sobreencuadre fijo máximo 6%, sin zoom animado. Si falta margen seguro, hay transformación preexistente o resolución insuficiente, la imagen queda estática.

Los degradados, sus capas, transparencias y el desvanecimiento conservan los archivos originales. La nueva capa recorta solo el movimiento interior de cada imagen. No se añaden opacidades. Movimiento reducido y colores forzados desactivan el efecto; sin JavaScript las fotografías siguen disponibles.

El empaquetado reutiliza el artefacto de producción por hash, incluidas todas las funciones, rutas, catálogo, mapa, ubicaciones y medios. Solo sustituye el HTML necesario para los marcos y enlaces de recursos, y añade CSS/JS compartidos. El generador B incluye el helper idempotente. El rollback oficial apunta al deployment base READY. No se envían formularios ni correos.

Publicado y comprobado: código ce3b3c6e3ac5b6599f430a1dc6825d4f5322265d, deployment dpl_LqKgXFwDTf9Gz3TzcPAHkh66WaJA. La API oficial de creación asignó el dominio al deployment de producción READY después de aprobar los controles del candidato; no fue necesaria una promoción adicional. Las 150 comprobaciones públicas pasan, incluidas las 132 fichas, portada, recursos nuevos, archivos de conservación y ausencia del marco interno de QA. UF pública: 26/10/2026, $41.221,08, fuente SII.

61 comprobaciones automáticas de movimiento/desvanecimiento; preservación exacta de 133 HTML salvo envolturas/enlaces de recursos. Los 1.159 archivos de ejecución conservan 1.024 originales y todas las funciones/rutas. Ver package-checks.json y public-checks.json.

Chrome real: 1920×936 directamente y 1440×900 / 390×844 mediante un marco del mismo origen con dimensiones verificadas, porque la capacidad de cambio de viewport de la extensión no aplicó el tamaño. Ese marco existe únicamente en un preview protegido y devuelve 404 en producción. Se revisaron portada, Cicarelli, Verne, Suecia, Mirador La Florida, Monjitas 690 (vertical) y Reserva Mayor 2 (400×300). Descenso/ascenso, cambio de tamaño, navegación, búsqueda de catálogo, planos estáticos, formularios opacos y ausencia de desbordamiento. Preferencia de movimiento reducido, cambios de preferencia, reposo, presupuesto de píxeles y fallo seguro verificados mediante pruebas de comportamiento. No se afirma una prueba física en iPhone.

Excepciones: las galerías panorámicas con encuadre contain sin margen suficiente quedan estáticas; se comprobó Suecia (1000×600 dentro de 349×262). También se limita o desactiva por resolución/pantalla. No hay nuevas imágenes, precios, ubicaciones ni datos comerciales.

Evidencia pública de reversibilidad: scroll 650 → -1,139px; 870 → +1,830px; 1090 → +3,790px y opacidad 0,366; regreso 870/650 restituye exactamente las posiciones/opacidades. desplazamiento-capturas-reales.gif reúne cinco capturas reales de este recorrido; no es grabación continua.

El deployment anterior dpl_HmkkoKEyVS7Qe37LHSeNWNLB7F4Q permanece READY y puede restaurarse mediante request_rollback en el mismo proyecto/equipo. main intacta, rama desactivada para Git deploy, live=false y protección all_except_custom_domains conservada. Sin errores/fatales en la ventana de logs consultada. No se enviaron formularios ni correos.
