const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/js/scroll-presence.js'),'utf8');
function environment({reduced=false,io=true}={}) {
 const queued=[],listeners={},styles=new Map(),classes=new Set();let rect={top:900,bottom:960,width:300,height:60},selection=null,throwRect=false,observed=[];
 const element={isConnected:true,textContent:'Example',children:[],matches:()=>false,
  classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},style:{setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)},
  closest:s=>s==='.s-scroll-presence'&&classes.has(s.slice(1))?element:null,querySelector:()=>null,
  contains:e=>e===element,getBoundingClientRect:()=>{if(throwRect)throw Error('layout unavailable');return rect;}};
 const body={contains:()=>true};const docElement={contains:()=>true};
 const header={getBoundingClientRect:()=>({top:0,bottom:80,height:80})};
 const main={querySelectorAll:s=>s.startsWith('h1,h2,h3,h4,p')?[element]:[],addEventListener:()=>{}};
 const media={matches:reduced,addEventListener:(t,f)=>listeners.motion=f};
 const doc={body,documentElement:docElement,activeElement:body,querySelector:s=>s==='main'?main:null,querySelectorAll:()=>[header],getElementById:()=>null,addEventListener:(t,f)=>listeners[t]=f};
 class IO {constructor(cb){this.cb=cb;listeners.intersect=()=>cb(observed.map(target=>({target,isIntersecting:true})));} observe(e){observed.push(e);}disconnect(){observed=[];}}
 const win={innerHeight:900,matchMedia:()=>media,requestAnimationFrame:f=>{queued.push(f);return queued.length;},addEventListener:(t,f)=>listeners[t]=f,getSelection:()=>selection};if(io)win.IntersectionObserver=IO;
 vm.runInNewContext(source,{window:win,document:doc,IntersectionObserver:IO,MutationObserver:class{},getComputedStyle:()=>({position:'fixed'}),Set,Map,Number,Array,Math});
 const flush=()=>{let n=0;while(queued.length){assert.ok(n++<6,'No endless animation loop');queued.shift()();}};
 flush();listeners.intersect?.();flush();
 return {styles,classes,doc,body,element,queued,media,flush,opacity:()=>Number(styles.get('--s-presence')??1),move:(top,bottom)=>{rect={top,bottom,width:300,height:bottom-top};listeners.scroll();flush();},motion:v=>{media.matches=v;listeners.motion();flush();listeners.intersect?.();flush();},focus:v=>{doc.activeElement=v;listeners.focusin();flush();},select:v=>{selection=v;listeners.selectionchange();flush();},fail:()=>{throwRect=true;listeners.scroll();flush();}};
}
let count=0;const eq=(a,b)=>{assert.equal(a,b);count++;};const ok=v=>{assert.ok(v);count++;};
const e=environment();eq(e.opacity(),.05); // Body focus must not disable the fade.
e.move(756.5,816.5);eq(e.opacity(),.525);
e.move(613,673);eq(e.opacity(),1);
e.move(350,410);eq(e.opacity(),1);
e.move(28,88);eq(e.opacity(),.05); // Exit is above the fixed 80px menu.
e.move(147,207);eq(e.opacity(),.525);
const positions=[[900,960],[850,910],[756.5,816.5],[613,673],[350,410],[147,207],[28,88]],down=[];
for(const p of positions){e.move(...p);down.push(e.opacity());}
for(let i=positions.length-1;i>=0;i--){e.move(...positions[i]);eq(e.opacity(),down[i]);}
eq(e.queued.length,0);const stopped=e.opacity();e.flush();eq(e.opacity(),stopped);
e.move(756.5,816.5);e.focus(e.element);eq(e.opacity(),1);e.focus(e.body);eq(e.opacity(),.525);
e.select({isCollapsed:false,rangeCount:1,getRangeAt:()=>({intersectsNode:()=>true})});eq(e.opacity(),1);e.select(null);eq(e.opacity(),.525);
e.motion(true);eq(e.classes.size,0);eq(e.styles.size,0);e.move(900,960);eq(e.opacity(),1);
e.motion(false);eq(e.opacity(),.05);ok(e.classes.has('s-scroll-presence'));
e.fail();eq(e.classes.size,0);eq(e.styles.size,0);eq(e.opacity(),1);
const r=environment({reduced:true});eq(r.classes.size,0);eq(r.opacity(),1);
const fallback=environment({io:false});eq(fallback.classes.size,0);eq(fallback.styles.size,0);
console.log(JSON.stringify({passed:count,checks:'entry/center/exit, fixed header, reverse equivalence, idle, keyboard, selection, reduced motion toggle, fail-open, unsupported observer'}));
