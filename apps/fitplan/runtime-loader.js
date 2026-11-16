(()=>{
"use strict";
const frame=document.getElementById("appFrame");
if(!frame)return;
const VERSION="20261006-stage13";
function install(){
 const w=frame.contentWindow,doc=frame.contentDocument;
 if(!w||!doc||w.FitPlanRuntime)return;
 const required=["openSection","goHome","switchTab"];
 const missing=required.filter(name=>typeof w[name]!=="function");
 if(missing.length){console.warn("[fitplan runtime] missing legacy contracts:",missing.join(", "));return;}
 // Capture the legacy functions before router.js wraps the public globals.
 // Internal controllers can therefore use stable originals, while router.js
 // remains the only extension allowed to replace/wrap w.openSection/goHome/switchTab.
 const legacy=Object.freeze({
  openSection:w.openSection.bind(w),
  goHome:w.goHome.bind(w),
  switchTab:w.switchTab.bind(w)
 });
 const runtime=Object.freeze({
  version:VERSION,
  openSection:(...args)=>legacy.openSection(...args),
  goHome:(...args)=>legacy.goHome(...args),
  switchTab:(...args)=>legacy.switchTab(...args),
  get atlas(){return w.FitAtlas||null;},
  get state(){return w.FitPlanState||null;},
  get data(){return w.FitPlanData||null;}
 });
 Object.defineProperty(w,"FitPlanRuntime",{value:runtime,writable:false,configurable:false});
 doc.documentElement.dataset.fitplanRuntime=VERSION;
 w.dispatchEvent(new w.CustomEvent("fitplan:runtime:ready",{detail:{version:VERSION}}));
}
frame.addEventListener("load",install);
try{if(frame.contentDocument?.readyState==="complete")install()}catch{}
})();
