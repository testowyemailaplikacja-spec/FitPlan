(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
const VERSION="20261005-stage12";
function install(){
 const w=frame.contentWindow,doc=frame.contentDocument;
 // Chrome can reuse the initial about:blank Window; its script requests are discarded on navigation.
 if(!w||!doc?.getElementById("homePage")||w.FitPlanLazy)return;
 // Script execution is scoped to this iframe document, independent of the HTTP cache.
 const loaded=new Set(),pending=new Map();
 const checks=new Map([
  ["./calendar-enhancement.js",()=>typeof w.FitPlanCalendarView?.show==="function"&&typeof w.FitPlanCalendarView?.hide==="function"],
  ["./modules/exercises-enhancement.js",()=>typeof w.FitPlanExerciseEnhancement?.activate==="function"&&typeof w.FitPlanExerciseEnhancement?.deactivate==="function"],
  ["./modules/anatomy.js",()=>typeof w.FitPlanAnatomy?.mount==="function"&&typeof w.FitPlanAnatomy?.dispose==="function"],
  ["./modules/anatomy-runtime.js",()=>typeof w.FitAtlas?.setModel==="function"&&typeof w.FitAtlas?.mount==="function"&&typeof w.FitAtlas?.dispose==="function"]
 ].map(([src,check])=>[new w.URL(src,doc.baseURI).pathname,check]));
 function loadScript(src){
  if(w.document!==doc)return Promise.reject(new Error("FitPlan lazy document changed"));
  const check=checks.get(new w.URL(src,doc.baseURI).pathname)||(()=>true);
  if(loaded.has(src)&&check())return Promise.resolve();
  loaded.delete(src);
  if(pending.has(src))return pending.get(src);
  const work=new Promise((resolve,reject)=>{
   const script=doc.createElement("script");script.src=src;script.async=true;
   const fail=()=>{pending.delete(src);script.remove();reject(new Error("FitPlan lazy asset failed: "+src));};
   script.onload=()=>{if(!check()){fail();return;}loaded.add(src);pending.delete(src);resolve();};
   script.onerror=fail;
   doc.head.appendChild(script);
  });pending.set(src,work);return work;
 }
 Object.defineProperty(w,"FitPlanLazy",{value:Object.freeze({version:VERSION,loadScript,isLoaded:src=>loaded.has(src)})});
 w.dispatchEvent(new w.CustomEvent("fitplan:lazy:ready",{detail:{version:VERSION}}));
}
frame.addEventListener("load",install);try{if(frame.contentDocument?.readyState==="complete")install()}catch{}
})();
