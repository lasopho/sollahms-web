/** The financial UI caches the original project scenario by slug. */
export function financialReferenceCompatible(originalProject,selectedOffer){
  return !!originalProject&&!!selectedOffer&&selectedOffer.financialBaselineCompatible!==false
    &&typeof selectedOffer.value==='number'&&Number.isFinite(selectedOffer.value)&&selectedOffer.value>0
    &&selectedOffer.value===originalProject.precioDesdeUF
    &&(selectedOffer.typology??null)===(originalProject.precioDesdeTipologia??null);
}
