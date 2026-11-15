// Only derived, closed-schema metrics leave the local lab. Never export raw events.
export function exportData(m){
 const numbers=['from','to','sample','missing','unexpected','changed','pending','unattributable','broken'];const out={synthetic:true,coverage:m.coverage};
 for(const k of numbers)out[k]=m[k]??null;
 out.counts=Object.fromEntries(['guide_view','tax_advisory_click','agenda_view','advisory_form_start','advisory_accepted','advisory_delivered'].map(k=>[k,m.counts[k]]));
 out.clicks=Object.fromEntries(['tax_advisory_header','tax_advisory_main','tax_advisory_footer'].map(k=>[k,m.clicks[k]]));
 out.rates=Object.fromEntries(['ctr','guide_conversion','click_conversion','delivery'].map(k=>[k,{numerator:m.rates[k].numerator,denominator:m.rates[k].denominator,value:m.rates[k].value}]));
 return out;
}
export function tabular(m){const a=exportData(m);return Object.entries(a.rates).map(([metric,r])=>({synthetic:true,from:a.from,to:a.to,metric,...r,sample:a.sample,coverage:a.coverage}));}
export function csv(m){const rows=tabular(m),keys=Object.keys(rows[0]);const cell=x=>'"'+String(x??'NO DISPONIBLE').replaceAll('"','""')+'"';return '\uFEFF'+keys.join(',')+'\r\n'+rows.map(r=>keys.map(k=>cell(r[k])).join(',')).join('\r\n');}
