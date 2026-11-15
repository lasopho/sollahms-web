/** Educational topics, never an eligibility decision. No persistence/network. */
export function relevantTopics({buyer,goal,condition,mortgage,count,dfl}) {
  const ids = new Set(['contribuciones']);
  const business = buyer === 'empresa';
  const rental = goal === 'arriendo' || goal === 'patrimonio';
  const housing = goal !== 'empresa';
  if (business) {
    ['activo','depreciacion','gastos','iva','empresa-venta'].forEach(x=>ids.add(x));
    if (goal === 'vivienda' || goal === 'patrimonio') ids.add('uso-personal');
  } else {
    ids.add('venta');
    if(housing && mortgage !== 'no') ids.add('intereses');
    if(housing && dfl !== 'no') ids.add('dfl');
    if(goal === 'vivienda') ids.add('mayores2027');
    if(goal === 'empresa') ['activo','gastos','iva'].forEach(x=>ids.add(x));
  }
  if(rental) ids.add('arriendo');
  // Total holdings do not establish DFL2 acquisition order: never exclude solely on count.
  if(rental && dfl !== 'no') ids.add('dfl2027');
  if(housing && condition !== 'usada') ids.add('iva2026');
  const notes = ['Son temas para revisar, no beneficios concedidos.'];
  if(condition === 'unknown' || mortgage === 'unknown' || dfl === 'unknown') notes.push('Hay datos por definir: se incluyen reglas condicionadas para que puedas verificarlas.');
  if(!business && ['2','3'].includes(count) && dfl !== 'no') notes.push('El número total de viviendas no permite decidir cuáles son las dos DFL2 más antiguas; revisa calidad, fechas y participaciones.');
  if(business && goal === 'vivienda') notes.push('Atención: comprar con la sociedad para vivienda personal requiere revisar el uso privado y el artículo 21.');
  if(!business && goal === 'empresa') notes.push('El uso empresarial exige distinguir patrimonio personal y empresa individual; los beneficios habitacionales no se aplican a una oficina.');
  return {ids:[...ids],message:notes.join(' ')};
}
