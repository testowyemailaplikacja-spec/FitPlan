(()=>{
"use strict";if(window.FitPlanExerciseEnhancement)return;
const api=Object.freeze({
 version:"20261005-stage12",atlas:()=>window.FitAtlas||null,
 async activate(context){
  if(!window.FitPlanAnatomy)await window.FitPlanLazy.loadScript("./modules/anatomy.js?v=20261018-reports-1");
  if(context.isCurrent())await window.FitPlanAnatomy.mount(context.host,context);
 },
 deactivate(){window.FitPlanAnatomy?.dispose();}
});
Object.defineProperty(window,"FitPlanExerciseEnhancement",{value:api});
window.dispatchEvent(new CustomEvent("fitplan:exercises:enhancement-ready",{detail:{version:api.version}}));
})();
