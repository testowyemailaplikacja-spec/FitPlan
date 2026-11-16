(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
const VERSION="20261006-stage15";
const IDS=["kalendarz-treningowy","podsumowanie-wynikow","plan-treningowy","dieta","tabela-cwiczen","lista-cwiczen","start"];
let installedDocument;
function install(){
 const w=frame.contentWindow,doc=frame.contentDocument;if(!w||!doc||installedDocument===doc||!w.FitPlanApp)return;
 installedDocument=doc;
 const controllers=new Map();let active=null,activation=null,ready=Promise.resolve(false);
 const emit=(name,detail)=>w.FitPlanEvents?.emit?w.FitPlanEvents.emit(w,name,detail):w.dispatchEvent(new w.CustomEvent("fitplan:"+name.replace(/[A-Z]/g,m=>"-"+m.toLowerCase()),{detail}));
 function deactivate(id=active){
  const controller=controllers.get(id);if(!controller)return false;
  if(active===id){activation?.abort();activation=null;active=null;}
  try{controller.deactivate?.({reason:"deactivate"});}catch(error){console.warn("[fitplan module deactivate]",id,error);}
  return true;
 }
 function failure(id,host,error){
  if(!host?.isConnected)return;
  const box=doc.createElement("div");box.className="info-card";box.dataset.fitplanModuleError=id;
  box.innerHTML='<p role="alert">Nie udało się uruchomić tego modułu. Pozostałe części FitPlan nadal działają.</p><button type="button" class="action-button" data-fitplan-action="retry-module">Spróbuj ponownie</button>';
  host.replaceChildren(box);
  box.querySelector("[data-fitplan-action=retry-module]")?.addEventListener("click",()=>w.FitPlanApp?.enter(id),{once:true});
  emit("moduleError",{id,message:String(error?.message||error||"Module error")});
 }
 const api=Object.freeze({
  version:VERSION,ids:Object.freeze([...IDS]),
  register(id,controller){
   if(!IDS.includes(id))throw new Error("Unknown FitPlan module: "+id);
   if(!controller||typeof controller!=="object")throw new TypeError("Controller required");
   if(controllers.has(id))throw new Error("Controller already registered: "+id);
   controllers.set(id,Object.freeze({...controller,id}));return controllers.get(id);
  },
  get:id=>controllers.get(id)||null,list:()=>IDS.map(id=>controllers.get(id)).filter(Boolean),
  activate(id,context={}){
   const controller=controllers.get(id);
   if(!controller){
    ready=Promise.resolve(context.ready).then(host=>{failure(id,host||doc.getElementById("tab-note"),new Error("FitPlan module controller unavailable: "+id));return false;});
    return ready;
   }
   deactivate();active=id;const current=new w.AbortController();activation=current;let resolvedHost=null;
   const isCurrent=()=>!current.signal.aborted&&activation===current&&active===id;
   ready=(async()=>{
    const host=await context.ready;resolvedHost=host;if(!isCurrent())return false;
    if(!host?.isConnected)throw new Error("FitPlan module host unavailable: "+id);
    await controller.activate?.({...context,id,host,app:w.FitPlanApp,state:w.FitPlanState,signal:current.signal,isCurrent});
    if(!isCurrent())return false;
    emit("moduleActive",{id});return true;
   })().catch(error=>{
    if(isCurrent()){
     console.warn("[fitplan module]",id,error);
     activation=null;active=null;
     failure(id,resolvedHost||doc.getElementById("tab-note"),error);
    }
    return false;
   });return ready;
  },
  deactivate,get active(){return active;},get ready(){return ready;}
 });
 Object.defineProperty(w,"FitPlanModules",{value:api,writable:false,configurable:false});
 emit("modulesReady",{version:VERSION});
}
frame.addEventListener("load",()=>queueMicrotask(install));
try{if(frame.contentDocument?.readyState==="complete")queueMicrotask(install)}catch{}
})();