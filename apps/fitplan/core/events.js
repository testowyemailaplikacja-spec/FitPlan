(()=>{
"use strict";
if(window.FitPlanEvents)return;
const names=Object.freeze({
 stateChange:"fitplan:state:change",
 runtimeReady:"fitplan:runtime:ready",
 appReady:"fitplan:app:ready",
 lazyReady:"fitplan:lazy:ready",
 modulesReady:"fitplan:modules:ready",
 moduleActive:"fitplan:module:active",
 moduleError:"fitplan:module:error",
 calendarReady:"fitplan:calendar:ready",
 exercisesReady:"fitplan:exercises:enhancement-ready"
});
const resolve=name=>names[name]||name;
const api=Object.freeze({
 version:"20261006-stage14",
 names,
 emit(target,name,detail){return target.dispatchEvent(new CustomEvent(resolve(name),{detail}));},
 on(target,name,handler,options){target.addEventListener(resolve(name),handler,options);return()=>target.removeEventListener(resolve(name),handler,options);}
});
Object.defineProperty(window,"FitPlanEvents",{value:api,writable:false,configurable:false});
document.documentElement.dataset.fitplanApp="true";
document.body?.setAttribute("data-fitplan-app","true");
})();