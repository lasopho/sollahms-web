import {relevantTopics} from './beneficios-tributarios-engine.mjs';
const controls = document.querySelector('#tax-controls');
if (controls) {
  const cards = [...document.querySelectorAll('[data-tax-card]')];
  const result = document.querySelector('#tax-result');
  const current = () => ({buyer:document.querySelector('[name=buyer]:checked').value,...Object.fromEntries(['goal','condition','mortgage','count','dfl'].map(id=>[id,document.getElementById(id).value]))});
  let filtered = false;
  const apply = () => {
    const {ids,message} = relevantTopics(current());
    cards.forEach(card=>card.hidden=!ids.includes(card.id));
    result.textContent = `${ids.length} temas potencialmente relevantes. ${message}`;
    filtered = true;
  };
  document.querySelector('#show-topics').addEventListener('click',apply);
  controls.addEventListener('change',()=>{if(filtered) apply();});
  document.querySelector('#show-all').addEventListener('click',()=>{
    cards.forEach(card=>card.hidden=false); filtered=false;
    result.textContent='Todos los temas educativos. Incluye beneficios históricos y futuros, identificados por su vigencia.';
  });
  const reveal = id => {const card=cards.find(x=>x.id===id);if(card){card.hidden=false;card.querySelector('details').open=true;}};
  document.querySelectorAll('[data-reveal]').forEach(link=>link.addEventListener('click',()=>reveal(link.dataset.reveal)));
  window.addEventListener('hashchange',()=>reveal(location.hash.slice(1)));
  reveal(location.hash.slice(1));
}
