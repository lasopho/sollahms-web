# SOLLAHMS — FASE 4: INCORPORAR RESPUESTAS DEL PROPIETARIO Y CERRAR PENDIENTES DE LEBEN

## OBJETIVO

Continuar la auditoría de Leben, incorporando todas las respuestas comerciales y técnicas proporcionadas por el propietario en las conversaciones anteriores y completando los campos que todavía puedan resolverse con evidencia existente.

Repositorio: lasopho/sollahms-web

Rama: codex/auditoria-leben-20261116

Último commit: bdab9dfb8a04bcce350c056648e33cb030ba5cdb

Trabajar exclusivamente en el checkout independiente y conservar toda la evidencia histórica.

## 1. LECTURA OBLIGATORIA

Leer:

- NEXT-PROMPT.md.
- INFORME-DEPURACION-LEBEN.md.
- INFORME-IRIS-LEBEN.md.
- SOLICITUDES-FINALES-POR-PROYECTO.csv.
- MATRIZ-LEBEN.csv.
- DATOS-PENDIENTES-PROPIETARIO.csv.
- CONTRADICCIONES-IRIS.csv.
- HECHOS-IRIS.csv.
- PENDIENTES-POR-CAMPO.csv.
- Manual operativo completo de Iris.

Consultar el HEAD remoto y conservar los cambios posteriores.

## 2. INCORPORAR LAS RESPUESTAS DEL PROPIETARIO

Las siguientes respuestas deben considerarse antecedentes directos proporcionados por el propietario.

### EDIFICIO LIVING TOWN

- Un dormitorio: UF 3.949.
- Dos dormitorios: UF 4.991,65.
- Tipología 1D/1B.
- Tipología 2D/2B.
- Un solo edificio.
- Departamento.
- Estacionamiento y bodega adicionales.
- Estado comercial: en blanco.

### EDIFICIO MOOD

- Un dormitorio: UF 3.753,20.
- Dos dormitorios: UF 4.678,45.
- Tipología 1D/1B.
- Tipología 2D/2B.
- Departamento.
- Recepción final.
- Estacionamiento y bodega adicionales.

### EDIFICIO SUECIA

- Precio desde: UF 11.358,90.
- Modelo 203.
- Tres dormitorios y tres baños.
- Recepción final.
- Estacionamiento adicional: UF 510.
- Bodega adicional: UF 75.

### CAPITANES

- Precio desde: UF 12.608.
- Unidad 501.
- Tres dormitorios y tres baños.
- Recepción final.
- Estacionamiento y bodega adicionales.

### EDIFICIO BOLD

- Estudio: UF 3.862,50.
- Un dormitorio: UF 4.897,50.
- Dos dormitorios: UF 6.716,25.
- Recepción final.
- Estacionamiento y bodega adicionales.

### EDIFICIO ARGOMEDO

- Precio desde: UF 4.432.
- Dos dormitorios y dos baños.
- Recepción final.
- Estacionamiento y bodega adicionales.

Conservar la dirección que ya tiene Sollahms.

### EDIFICIO INDI

- Local comercial: UF 8.560.
- Un dormitorio: UF 3.544.
- Dos dormitorios: UF 3.944.
- Recepción final.
- Estacionamiento y bodega adicionales.

### EDIFICIO ÍNDIGO

- Dos dormitorios: UF 9.001.
- Tres dormitorios: UF 10.414,90.
- Recepción final.
- Estacionamiento y bodega adicionales.

### INN PUERTO CHICO

- Dos dormitorios: UF 10.500.
- Tres dormitorios: UF 10.016.
- Cuatro dormitorios: UF 21.869.
- Estado: en verde.
- Estacionamiento y bodega adicionales.

Conservar los valores exactamente como fueron proporcionados. No intercambiar precios ni tipologías.

### EDIFICIO NÓRDICO

- Un dormitorio: UF 5.382.
- Tres dormitorios: UF 10.335.
- Estado: en verde.
- Estacionamiento y bodega adicionales.

### OWN

Conservar estado vendido. No solicitar precio ni disponibilidad.

## 3. REGLAS DE PRECIOS

Los precios anteriores son declaraciones comerciales directas del propietario para Sollahms.

Registrarlos como:
- Fuente: propietario.
- Fecha de comunicación: 16/11/2026.
- Estado de vigencia: informado por propietario en esa fecha.
- Condiciones de estacionamiento y bodega: según cada proyecto.

No exigir una conciliación con Yapo para aceptar estos valores.

No reemplazarlos por precios históricos de brochures ni por valores diferentes de Iris.

No presentarlos como garantía de vigencia futura.

Los precios podrán actualizarse posteriormente mediante nuevas instrucciones del propietario.

Los precios históricos deben conservarse como historial, no como valores actuales.

## 4. TIPOLOGÍAS Y BAÑOS

Incorporar las asociaciones expresamente proporcionadas.

No inferir baños de modelos que no tengan respaldo.

Cruzar las respuestas con las unidades y planos de Iris.

Mantener los conflictos que siguen sin resolución:

- Living Town A1: unidad 603/803, 2 baños en DOM frente a 1 en gráfico.
- Mood A/303: 2 dormitorios en DOM frente a 1,5D en gráfico.
- Bold S1/312: Estudio frente a 1D.
- Argomedo C1 frente a C.
- Indi D/A2 y A4/C1.
- INN Puerto Chico: diferencias de baños y dormitorios entre DOM y planos.
- Capitanes A: alcance del plano frente a las unidades enlazadas.

No utilizar la respuesta comercial general para resolver una contradicción de un modelo particular.

## 5. SUPERFICIES

Priorizar la extracción de datos ya existentes en planos y documentos.

Separar:

- Útil.
- Interior.
- Total.
- Terraza.
- Patio o jardín privado.
- Terreno.

No convertir Internos en superficie útil o interior.

No sumar terraza al interior.

No transferir superficies de una unidad a todas las unidades del mismo modelo sin demostrar aplicabilidad.

Los tres PDF de INN que fallaron en la fase anterior no deben volver a exportarse mediante el mismo mecanismo.

Si se dispone de archivos originales proporcionados por el propietario, procesarlos.

## 6. AMENITIES Y TERMINACIONES

Aplicar la política acordada:

- Brochure completo sin mención de una característica: false propuesto para el catálogo.
- Característica mencionada: true.
- Proyecto sin brochure: desconocido hasta contar con respaldo.
- Iris complementa los brochures, pero no sustituye automáticamente el criterio acordado.

No pedir nuevamente piscinas, gimnasios, quinchos y demás amenities que ya estén documentados.

Mantener las propuestas false separadas de la evidencia de ausencia física.

## 7. DIRECCIONES

Conservar exactamente las direcciones registradas en Sollahms.

No modificarlas con datos de Iris.

No volver a solicitar confirmación de direcciones ya entregadas.

Excluirlas del conjunto de preguntas pendientes, salvo instrucción nueva del propietario.

## 8. INTEGRACIÓN DE DATOS

Actualizar las matrices documentales:

- MATRIZ-LEBEN.csv.
- DATOS-CONFIRMADOS.csv.
- DATOS-PARCIALES.csv.
- DATOS-PENDIENTES-PROPIETARIO.csv.
- PENDIENTES-POR-CAMPO.csv.
- CONTRADICCIONES-IRIS.csv.
- RESUMEN-IRIS.json.
- MATRIZ-MAESTRA-131.csv.
- ESTADO-GLOBAL.json.

Mantener todos los identificadores históricos.

Cada respuesta debe tener fuente, fecha, campo, proyecto y alcance.

Diferenciar:
- Confirmado por propietario.
- Confirmado por documento.
- Parcial.
- Histórico.
- Contradictorio.
- Desconocido.
- No aplicable.

## 9. DEPURACIÓN DE PREGUNTAS

Una vez incorporadas las respuestas:

- Eliminar de las solicitudes únicamente los campos efectivamente resueltos.
- No volver a pedir los mismos precios.
- No volver a pedir las tipologías ya confirmadas.
- No solicitar direcciones.
- No volver a preguntar amenities cubiertos por brochures.
- Agrupar la documentación pendiente por proyecto.
- Separar decisiones personales de solicitudes de documentos.

No confundir el número de campos con el número de preguntas.

## 10. ENTREGABLES

Generar:

- INFORME-FASE4-LEBEN.md.
- MATRIZ-LEBEN actualizada.
- PRECIOS-PROPIETARIO-LEBEN.csv.
- TIPOLOGIAS-LEBEN.csv.
- SUPERFICIES-LEBEN.csv.
- PENDIENTES-REALES-LEBEN.csv.
- CONTRADICCIONES-LEBEN.csv.
- Resumen de cobertura de filtros.

El informe debe comparar los 330 pendientes iniciales con el nuevo saldo.

No declarar completado un campo cuando solo exista una respuesta parcial.

## 11. PROTECCIÓN

Trabajo exclusivamente documental.

No modificar producción, fichas HTML, filtros productivos, catálogo, direcciones, formularios, CRM 360, Resend ni funciones serverless.

No ejecutar generadores de la aplicación.

No crear deployments.

No publicar.

No fusionar PR.

No modificar main.

Conservar la exclusión de deployments autorizada para esta rama.

## 12. CONTINUIDAD

Sincronizar la documentación en la rama independiente.

Actualizar NEXT-PROMPT.md y el manual operativo Iris.

Verificar hashes, identidades de los 13 proyectos Leben y las 118 filas restantes de la matriz maestra.

Entregar:
- Informe de conciliación.
- Número de campos completados.
- Número de campos parciales.
- Contradicciones abiertas.
- Preguntas realmente necesarias.
- Documentación todavía faltante.
- Siguiente prompt completo.

No comenzar Euro automáticamente.

## RESULTADO ESPERADO

Incorporar todas las respuestas proporcionadas por el propietario, reducir las solicitudes pendientes y dejar Leben preparada para su cierre documental.

No repetir trabajo, no inventar información y no modificar producción.