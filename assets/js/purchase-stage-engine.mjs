/** Educational orientation, not a score, bank decision or investment forecast. */
export const modes=['blanco','verde','inmediata'];
export const labels={blanco:'Compra en blanco',verde:'Compra en verde',inmediata:'Entrega inmediata'};
export const choices={timing:['pronto','esperar','flexible'],down:['disponible','cuotas','revisar'],priority:['precio','avance','terminada','equilibrio'],purpose:['vivir','invertir']};
export function orient(answers){
  if(!answers||Object.entries(choices).some(([k,v])=>!v.includes(answers[k])))return null;
  const {timing,down,priority,purpose}=answers;let selected=[],reasons=[],warnings=[];
  if(timing==='pronto'){
    selected=['inmediata'];reasons.push('Necesitas la propiedad pronto. Revisar viviendas terminadas permite contrastar su estado y un plazo concreto de entrega.');
    if(priority==='precio')warnings.push('Priorizar un precio inicial atractivo no elimina los tiempos de construcción. Compara el costo total de las alternativas terminadas.');
    if(down!=='disponible')warnings.push('Hay una condición pendiente: necesitas la vivienda pronto y todavía debes organizar o revisar el pie. Esta orientación no confirma que puedas comprar ahora; verifica el aporte, los gastos y las condiciones de pago antes de reservar.');
  }else if(priority==='terminada'){
    selected=['inmediata'];reasons.push('Conocer la vivienda terminada es tu prioridad. Entrega inmediata permite revisar directamente espacios y terminaciones.');
    if(down==='cuotas')warnings.push('El pie en cuotas no está asegurado en entrega inmediata. Pregunta si existe una alternativa documentada, su costo y su compatibilidad con el crédito; si no, necesitarás más tiempo para reunirlo.');
  }else if(priority==='avance'){
    selected=['verde'];reasons.push('Puedes esperar y prefieres observar avance físico. Un proyecto en construcción puede acomodarse a esa combinación.');
  }else if(priority==='precio'){
    selected=timing==='flexible'?['blanco']:['blanco','verde'];reasons.push(timing==='flexible'?'Tu plazo es flexible y quieres comparar condiciones de lanzamiento. Comprar en blanco es una alternativa para estudiar; no implica un menor precio garantizado.':'Puedes esperar, pero no has definido cuánto. Conviene contrastar proyectos en blanco y en verde con fechas y costos concretos.');
  }else{
    selected=down==='cuotas'?['blanco','verde']:[...modes];reasons.push(down==='cuotas'?'Puedes esperar y buscas distribuir el pie. En blanco y en verde pueden ofrecer un calendario de cuotas, sujeto a lo pactado.':'Tus respuestas permiten comparar más de una modalidad. La fecha contractual, el costo total y la unidad concreta ayudarán a distinguirlas.');
  }
  if(timing!=='pronto')warnings.push('“Puedo esperar” no define un plazo de obra. Contrasta la fecha contractual con tu fecha límite y contempla un margen ante atrasos.');
  if(down==='revisar'&&timing!=='pronto')warnings.push('Antes de comprometerte, calcula el pie y los gastos disponibles. Esta herramienta no evalúa tu capacidad de pago.');
  const context=purpose==='vivir'?'Para vivir: revisa la fecha de mudanza, la continuidad de tu vivienda actual y los gastos que podrían superponerse si hay atrasos.':'Para invertir: compara gastos comunes, contribuciones cuando correspondan, mantención, financiamiento y períodos sin arrendatario. Ninguna etapa asegura arriendo, rentabilidad ni plusvalía.';
  return {modes:selected,reasons,warnings,context,conditional:timing==='pronto'&&down!=='disponible'};
}
export function catalogUrl(selected){const clean=[...new Set(selected)].filter(x=>modes.includes(x));if(!clean.length)return '/proyectos.html';const p=new URLSearchParams();clean.forEach(x=>p.append('modalidad',x));return '/proyectos.html?'+p.toString();}
