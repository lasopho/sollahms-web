// Explicitly reverse only the six address-source additions and the reviewed Ecuador corner.
export function beforeOfficialAddressReview(projects){
 return projects.map(project=>{const p=structuredClone(project);delete p.addressVerification;
 if(p.slug==='edificio-ecuador')for(const key of ['direccion','mapQuery','descripcionLarga'])
  if(typeof p[key]==='string')p[key]=p[key].replaceAll('Coronel Godoy 0157, esquina Av. Ecuador','Coronel Godoy 0157');
 return p;});
}
