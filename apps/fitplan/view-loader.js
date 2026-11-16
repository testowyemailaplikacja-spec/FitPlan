(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
const VERSION="20261005-stage12";
const MAP=Object.freeze({"kalendarz-treningowy":"calendar.html","podsumowanie-wynikow":"results.html","plan-treningowy":"workout-plan.html","dieta":"diet.html","tabela-cwiczen":"exercises.html","lista-cwiczen":"exercise-list.html","start":"start.html"});
const cache=new Map(),pending=new Map();
function load(id){
 if(!MAP[id])return Promise.reject(new Error("Unknown FitPlan view: "+id));
 if(cache.has(id))return Promise.resolve(cache.get(id));
 if(pending.has(id))return pending.get(id);
 const work=(async()=>{
  const response=await fetch("./views/"+MAP[id],{credentials:"same-origin"});
  if(!response.ok)throw new Error("FitPlan view HTTP "+response.status+": "+id);
  const html=await response.text(),template=document.createElement("template");template.innerHTML=html;
  const content=template.content.firstElementChild;
  const mount={"kalendarz-treningowy":"#fitplanCalendarMount","tabela-cwiczen":"#fitplanExercisesMount"}[id];
  if(content?.dataset.fitplanView!==id||(mount&&!content.querySelector(mount)))throw new Error("Invalid FitPlan view: "+id);
  cache.set(id,html);return html;
 })().finally(()=>pending.delete(id));
 pending.set(id,work);return work;
}
function install(){
 const w=frame.contentWindow;if(!w||w.FitPlanViews)return;
 Object.defineProperty(w,"FitPlanViews",{value:Object.freeze({version:VERSION,ids:Object.freeze(Object.keys(MAP)),load,has:id=>MAP[id]!=null})});
 w.dispatchEvent(new w.CustomEvent("fitplan:views:ready",{detail:{version:VERSION}}));
}
frame.addEventListener("load",install);try{if(frame.contentDocument?.readyState==="complete")install()}catch{}
})();
