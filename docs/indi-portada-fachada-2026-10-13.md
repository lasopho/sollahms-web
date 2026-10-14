# Portada de Edificio Indi: revisión técnica

Revisión del 13/10/2026. Se evaluó el render referencial de fachada disponible en el brochure de Indi antes de seleccionarlo como portada. La fotografía oficial de la casona permanece en la galería y como portada del fallback público. Esta tanda sólo autoriza una Preview protegida.

## Original y calidad

El recurso corresponde al objeto `/X2` de la página física 2 de `Leben - Edif Indi.pdf`, documento SHA-256 `19dd0607687d870baad169e238e0df414fa896f3de85d58cd45a23b55900ad26`. Tiene 2.113 × 1.335 píxeles nativos (2,82 MP), proporción 1,5828:1. Es un render y se identifica como referencial; no es una fotografía de la obra terminada.

La revisión a tamaño completo y los recortes de un píxel de imagen por píxel de pantalla muestran ventanas, barandas y acceso reconocibles, sin desenfoque global ni pixelación que impida el uso previsto. El ala derecha tiene un fundido ilustrativo intencional. Las métricas de gradientes y bordes se conservaron como apoyo: dependen de la escena y no constituyen por sí solas una certificación de nitidez.

El stream original es JPEG con submuestreo 4:2:0, color `/DeviceRGB`, sin Decode, perfil ICC ni transformación Adobe. El PDF declara Quality 60; las tablas de cuantización coinciden con ese nivel. La compresión del original no se puede revertir aumentando el parámetro de calidad. Poppler extrajo exactamente los mismos bytes y píxeles RGB del stream.

## Selección y optimización

Se eligió conservar el JPEG original de 334.121 bytes, SHA-256 `ed7357ef2e13b6b6953f0b91c5e644ddd4f1bb350b235f465786cd1fa20ccfac`. No se redimensiona, se afila, se amplía ni se vuelve a comprimir. El derivado anterior de esta fachada era WebP de 1.800 × 1.137 y 485.666 bytes: el JPEG nativo aporta más resolución y reduce ese peso un 31,20 %. La fotografía anterior de la casona pesa 163.026 bytes y tiene 1.200 × 675; la comparación de ahorro no se refiere a esa fotografía diferente.

Los WebP nativos ensayados a calidad 85, 88 y 90 pesan 391.576, 442.032 y 485.000 bytes, respectivamente. Además de ser mayores que el JPEG original, incorporan pérdida adicional. La versión WebP sin pérdida ocupa 2.087.562 bytes. No se seleccionaron. PSNR y SSIM describen fidelidad frente al JPEG decodificado; no recuperan ni acreditan detalle anterior a la compresión original.

El materializador exige el PDF acreditado, objeto de imagen, hashes, dimensiones nativas, color y ausencia de recorte antes de copiar el stream exacto. El nuevo recurso sigue dentro del lote privado de 43 medios Leben.

## Catálogo y ficha

El catálogo y el hero de Indi usan el mismo recurso seleccionado exclusivamente en el build Preview. La ficha conserva la fachada completa con `contain` y coloca el título sobre el verde de Sollahms. La tarjeta recibe un encuadre específico; las demás fichas mantienen sus estilos. La fotografía de la casona permanece en la galería oficial.

Las 137 filas comerciales, los 15 Ecasa, precios, dirección, mapas, recorrido, contacto, agenda y comparador no cambian. El fallback público conserva la portada anterior. El gate real de Vercel continúa rechazando Production para este paquete privado. No se realiza merge ni promoción.

La revisión final registra las cajas efectivas, recorte, densidad de pantalla, decodificación y ampliación en escritorio, tablet y móvil a DPR 1 y 2. La densidad se mide sobre la imagen contenida, no sobre sus bandas laterales. Los recibos y capturas quedan en el paquete privado de entrega.
