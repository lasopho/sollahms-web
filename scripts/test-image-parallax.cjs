const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/image-parallax.js'),'utf8');
let passed=0;const check=(a,b)=>{assert.deepEqual(a,b);passed++;};
function environment({width=360,height=220,naturalWidth=960,naturalHeight=587,dpr=1,reduced=false,srcset='',currentSrc='',io=true,transform='none',headerHeight=0}={}) {
 const styles=new Map(), attrs=new Map(), queue=[],listeners={},media={matches:reduced,addEventListener:(t,f)=>listeners.motion=f};
 let top=390,reads=0,broken=false;
 const image={complete:true,naturalWidth,naturalHeight,clientWidth:width,clientHeight:height,currentSrc,
  getAttribute:n=>n==='srcset'?srcset:null,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),addEventListener:(t,f)=>listeners.load=f,
  style:{setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)}};
 const frame={querySelector:()=>image,getBoundingClientRect:()=>{reads++;if(broken)throw Error('geometry');return{top,width,height};}};
 const main={querySelectorAll:()=>[frame],addEventListener:(t,f)=>listeners[t]=f};
 const doc={baseURI:'https://sollahms.cl/',querySelector:q=>q==='header'?{getBoundingClientRect:()=>({height:headerHeight})}:main};
 class IO{constructor(f){listeners.intersect=v=>f([{target:frame,isIntersecting:v}]);}observe(){}}
 const win={innerWidth:1440,innerHeight:1000,devicePixelRatio:dpr,addEventListener:(t,f)=>listeners[t]=f};if(io)win.IntersectionObserver=IO;
 const flush=()=>{let n=0;while(queue.length){assert.ok(++n<4,'no endless animation');queue.shift()();}};
 vm.runInNewContext(source,{window:win,document:doc,IntersectionObserver:IO,matchMedia:q=>q.includes('reduced')?media:{matches:false,addEventListener:()=>{}},requestAnimationFrame:f=>{queue.push(f);return queue.length;},getComputedStyle:()=>({objectFit:'contain',transform}),URL});
 listeners.intersect?.(true);flush();
 return {styles,attrs,queue,win,flush,reads:()=>reads,y:()=>Number((styles.get('--s-image-y')||'0px').slice(0,-2)),
  move:y=>{top=y;listeners.scroll?.();flush();},resize:w=>{win.innerWidth=w;listeners.resize?.();flush();},
  motion:v=>{media.matches=v;listeners.motion?.();flush();},near:v=>{listeners.intersect?.(v);flush();},fail:()=>{broken=true;listeners.scroll?.();flush();}};
}
const e=environment();check(e.y(),0);e.move(200);const down=e.y();assert.ok(down>0);passed++;e.move(390);check(e.y(),0);e.move(580);check(e.y(),-down);
for(const top of [-2000,-300,0,200,390,500,900,3000]) {e.move(top);assert.ok(Math.abs(e.y())<=17.1+.001);passed++;}
check(e.queue.length,0);const idle=e.y();e.flush();check(e.y(),idle);
const reads=e.reads();e.near(false);e.move(200);check(e.reads(),reads);e.near(true);assert.ok(e.reads()>reads);passed++;
e.motion(true);check(e.attrs.size,0);check(e.styles.size,0);e.move(200);check(e.styles.size,0);e.motion(false);check(e.attrs.size,1);
e.resize(390);e.move(-1000);assert.ok(e.y()<=12.7);passed++;
e.fail();check(e.styles.size,0);check(e.attrs.size,0);
check(environment({naturalWidth:300,naturalHeight:183}).attrs.size,0);
const letter=environment({width:360,height:300,naturalHeight:400});check(letter.attrs.size,1);letter.move(-1000);check(letter.y(),36);check(letter.styles.get('--s-image-scale'),'1.00000'); // move within existing letterbox, no new crop
const strong=environment();strong.move(-1000);assert.ok(strong.y()>16);passed++;
const header=environment({headerHeight:80});header.move(430);check(header.y(),0);
check(environment({transform:'matrix(1,0,0,1,0,0)'}).attrs.size,0);
check(environment({reduced:true}).attrs.size,0);check(environment({io:false}).attrs.size,0);
check(environment({naturalWidth:360,naturalHeight:220,srcset:'/hero.webp 960w',currentSrc:'https://sollahms.cl/hero.webp'}).attrs.size,1);
check(environment({naturalWidth:360,naturalHeight:220,dpr:2}).attrs.size,0);
const portrait=environment({width:387,height:230,naturalWidth:750,naturalHeight:1000,dpr:2});
check(portrait.attrs.size,1);check(portrait.styles.get('--s-image-scale'),'1.16000');
const regular=environment({width:387,height:230,naturalWidth:822,naturalHeight:599,dpr:2});
check(regular.styles.get('--s-image-scale'),'1.16000');
check(environment({width:387,height:230,naturalWidth:400,naturalHeight:300,dpr:2}).attrs.size,0);
const list=environment({width:84,height:64,naturalWidth:960,naturalHeight:720,dpr:2});check(list.attrs.size,1);
const narrowMargin=environment({width:387,height:230,naturalWidth:960,naturalHeight:540,dpr:2});narrowMargin.move(-1000);assert.ok(narrowMargin.y()>10);passed++;
console.log(JSON.stringify({passed,checks:'reversibility, bounds/overscan, idle, offscreen work, mobile limit, reduced-motion change, fail-open, low resolution, letterbox, transform isolation, srcset density'}));
