# Procedimiento de publicación para aprobación posterior

Estado de esta revisión: no ejecutado. [Candidato e inventario](candidate.json), [SHA1 remotos](preview-remote-integrity.json), [referencia productiva](production-final-recheck.json).

1. Verificar el HEAD de `codex/seo-geo-corporativo-20261119`, PR37 y equivalencia del runtime con `e1f75f0c95c1d0cba78c2c8c35737835ce395d28`. Los commits siguientes de esta revisión contienen solo documentación. Releer ambos alias, producción y configuración real. El candidato preserva `dpl_8MyM5t9vQukSLaBkNRq4sTzGsSPV` y su fuente `0a0b7c70c7de8f5db8b122ae8a4d6664773180ba`. Si hay otra publicación posterior, recuperarla y reaplicar únicamente los tres HTML y la adición de sitemap, verificando que no se pierde ningún cambio posterior. Resolver cualquier solapamiento sobre el contenido autorizado antes de publicar.
2. Revalidar SHA-256 del inventario `c4b1a07527291aa020ebef549aa32f0bb2f2858f9f55312482584f333b14319b` y todos los archivos del artefacto privado `candidate-current`, o generar otro inventario verificado si fue necesaria una conciliación. Preservar las 152 fichas, catálogo/mapa, Centro documental, siete funciones y configuración. El comparador se toma del artefacto productivo exacto, no del HTML Git antiguo. Mantener los controles comerciales, reserva no certificada y ausencia de envíos reales en pruebas.
3. Usar el circuito prebuilt vigente, comprobado en la publicación del mapa: crear **Production sin asignar dominios**, comprobar el candidato remoto y después promover el mismo ID. La preview no se promueve directamente. El historial operacional de octubre es antecedente; sus conteos y packager no sustituyen este Build Output API completo.

```sh
/Users/luissandoval/.npm-global/bin/vercel deploy \
  /Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-seo-geo-private/candidate-current \
  --prebuilt --environment production --skip-domain \
  --project prj_URomRRU0MAy4etGKP5gWv3Qv4DGH \
  --scope team_A9VNIW2f2K1IJpd2pGdvDmEN --json --non-interactive
```

Registrar la respuesta y el ID real. No agregar `--archive=tgz`: en este circuito el transporte sin archivo permite verificar el árbol completo de UID. La versión exacta de CLI verificada fue65.16.0; releer ayuda si cambia.

4. Antes de promover: comprobar READY, entorno Production, protección del dominio inmutable, siete Functions,1.723UID contra inventario y los cuatro cambios autorizados; probar HTTP/HTML con autenticación existente y casos locales simulados. Las pruebas no deben enviar contactos, CRM o reservas. Confirmar que los dominios siguen sirviendo el deployment anterior. Registrar un camino autorizado de reversión al deployment capturado inmediatamente antes de publicar; los permisos se revalidan, no se presuponen de un informe antiguo.
5. Promover **el mismo ID de Production validado** mediante `vercel promote ID_REAL --scope team_A9VNIW2f2K1IJpd2pGdvDmEN --json --non-interactive`. Verificar alias y bytes públicos, canonicals, sitemap, ausencia de noindex en producción y ajustes de plataforma. Conservar `main` y reglas automáticas existentes, `autoAssignCustomDomains:false`, SSO, DNS y variables. Si la plataforma no puede mantener esas condiciones, detener esa mutación y documentar la razón. No desplegar el checkout incompleto ni usar el main de octubre como base.
6. Registrar el instante real T0 en America/Santiago y comprobar las cuatro URL públicas de [measurement-plan.json](measurement-plan.json). La publicación no prueba indexación ni posicionamiento. Solicitudes de indexación, si proceden y hay acceso, solo para páginas corporativas públicas; nunca previews ni Centro documental.

La autorización futura de publicación corresponde al candidato concreto y a la conservación de cambios posteriores. No habilita alteraciones comerciales, de precio, formularios, integraciones o controles de acceso.
