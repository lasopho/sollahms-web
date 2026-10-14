# Integración exclusiva de Inmobiliaria León

Base: main `f72bd9ec097e63faabeb7e1d5fa9d8388a54ae83`. Fichas y superficies aprobadas: `881ead9b9c4b77bd76d0f6aa6bb83299d461854c` de `codex/leon-cartera-preview`.

Se integran únicamente Jardines de Ramón Cruz, Parque Don Lautaro, Condominio Uruguay, Gregorio de la Fuente y B.Come. Las tres rutas León retiradas se conservan en `docs/archive/leon/`. Los 136 registros ajenos a León, las 143 páginas ajenas a León y los 919 recursos existentes de main se conservan exactamente; `data/leon-main-baseline.json` y las pruebas lo verifican. No se integran los cambios Ecasa/Leben de la rama original.

Las cinco páginas, sus 36 planos y el registro de superficies conservan el contenido validado: 30 conjuntos completos y 6 pendientes. No se recalculan totales ni se añaden jardines a superficies construidas.

Los cinco PDF originales y el archivo completo de fuentes siguen en los archivos internos locales (`assets/brochures/leon/`, `docs/leon-superficies/` y la entrega durable `docs/qa/leon-superficies-881ead9/`). Se excluyen del repositorio Git público conforme a sus controles existentes. El manifiesto y `data/leon-plan-surfaces.json` conservan páginas, URL, hashes, discrepancias y estados verificables. Los recursos necesarios para la Preview permanecen en el paquete local reproducible.

El build León permanece limitado a Preview protegida. El merge no promueve la Preview ni despliega Production; se mantienen desactivados los despliegues Git de main y ambas ramas León.

Los controles históricos proyectan sólo los sucesores León previamente fijados, después de validar sus valores/hashes. Las demás inmobiliarias mantienen los controles históricos completos. Las nuevas pruebas verifican directamente el árbol de integración y los contextos vigentes.

Se conserva también la integración Norte Verde incorporada a main mientras se publicaba este PR. Sus tres recursos, perfil optativo y protección de despliegue permanecen intactos.

La base final conserva la integración Sento que llegó después de Norte Verde. Sólo León se proyecta para sus controles de conservación.
