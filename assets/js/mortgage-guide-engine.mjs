/** Educational, constant-rate amortization in UF. No bank offers or eligibility. */
import {annualToMonthlyRate} from './mortgage-engine.mjs';
export class GuideInputError extends RangeError {
  constructor(field,message){super(message);this.field=field;this.name='GuideInputError';}
}
export function parseGuideNumber(value,field,{optional=false,decimals=4}={}){
  if(typeof value!=='string'||value.length>24)throw new GuideInputError(field,'Ingresa un número válido.');
  const text=value.trim();if(optional&&text==='')return null;
  if(!new RegExp('^\\d+(?:[.,]\\d{1,'+decimals+'})?$').test(text))throw new GuideInputError(field,'Usa números sin separadores de miles; puedes usar coma o punto decimal.');
  const number=Number(text.replace(',','.'));if(!Number.isFinite(number))throw new GuideInputError(field,'Ingresa un número finito.');return number;
}
function bounded(value,field,min,max,integer=false){
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value)))throw new GuideInputError(field,`Ingresa ${integer?'un número entero':'un valor'} entre ${min} y ${max}.`);
}
export function calculateGuide(input){
  const {propertyUf,downMode,downValue,annualRatePercent,rateConvention,years,insuranceUf=null,monthlyFeesUf=null,upfrontFeesUf=null}=input;
  bounded(propertyUf,'propertyUf',100,1_000_000);bounded(years,'years',1,40,true);bounded(annualRatePercent,'annualRatePercent',0,25);
  if(!['percent','uf','financing'].includes(downMode))throw new GuideInputError('downMode','Selecciona cómo ingresar el pie o financiamiento.');
  bounded(downValue,'downValue',0,downMode==='uf'?propertyUf:100);
  if(!['nominal','effective'].includes(rateConvention))throw new GuideInputError('rateConvention','Selecciona una convención de tasa válida.');
  for(const [name,value,max] of [['insuranceUf',insuranceUf,1000],['monthlyFeesUf',monthlyFeesUf,1000],['upfrontFeesUf',upfrontFeesUf,100000]])if(value!==null)bounded(value,name,0,max);
  const downPaymentUf=downMode==='uf'?downValue:propertyUf*(downMode==='financing'?100-downValue:downValue)/100;
  const principalUf=propertyUf-downPaymentUf,months=years*12,monthlyRate=annualToMonthlyRate(annualRatePercent,rateConvention);
  const monthlyBaseUf=principalUf===0?0:monthlyRate===0?principalUf/months:principalUf*monthlyRate/-Math.expm1(-months*Math.log1p(monthlyRate));
  const totalBaseUf=monthlyBaseUf*months,totalInterestUf=Math.max(0,totalBaseUf-principalUf);
  const missingCosts=[['insuranceUf',insuranceUf],['monthlyFeesUf',monthlyFeesUf],['upfrontFeesUf',upfrontFeesUf]].filter(([,v])=>v===null).map(([k])=>k);
  const modeledCostsUf=totalInterestUf+(insuranceUf??0)*months+(monthlyFeesUf??0)*months+(upfrontFeesUf??0);
  const schedule=[];let balance=principalUf,yearInterest=0,yearPrincipal=0;
  for(let month=1;month<=months;month++){
    const interest=balance*monthlyRate,paymentPrincipal=month===months?balance:Math.min(balance,Math.max(0,monthlyBaseUf-interest));
    balance=Math.max(0,balance-paymentPrincipal);yearInterest+=interest;yearPrincipal+=paymentPrincipal;
    if(month%12===0){schedule.push({year:month/12,principalUf:yearPrincipal,interestUf:yearInterest,balanceUf:balance});yearInterest=0;yearPrincipal=0;}
  }
  return {propertyUf,downPaymentUf,downPaymentPercent:downPaymentUf/propertyUf*100,principalUf,financingPercent:principalUf/propertyUf*100,annualRatePercent,rateConvention,years,months,monthlyRate,monthlyBaseUf,insuranceUf,monthlyFeesUf,upfrontFeesUf,monthlyWithInsuranceUf:insuranceUf===null?null:monthlyBaseUf+insuranceUf,monthlyKnownUf:monthlyBaseUf+(insuranceUf??0)+(monthlyFeesUf??0),totalBaseUf,totalInterestUf,modeledCostsUf,totalKnownCreditUf:principalUf+modeledCostsUf,initialKnownUf:downPaymentUf+(upfrontFeesUf??0),missingCosts,schedule};
}
/** Public slug only. Arbitrary URL prices, names and private values are ignored. */
export function guideProjectContext(search,projects){
  if(typeof search!=='string'||search.length>1000||!Array.isArray(projects))return null;
  const q=new URLSearchParams(search);if(q.getAll('proyecto').length!==1)return null;
  const slug=q.get('proyecto');if(!/^[a-z0-9-]{1,100}$/.test(slug))return null;
  const p=projects.find(p=>p.slug===slug);if(!p)return null;
  const price=typeof p.precioDesdeUF==='number'&&Number.isFinite(p.precioDesdeUF)&&p.precioDesdeUF>=100&&p.precioDesdeUF<=1_000_000?p.precioDesdeUF:null;
  return {slug:p.slug,name:String(p.nombre),developer:String(p.inmobiliaria),propertyUf:price};
}
