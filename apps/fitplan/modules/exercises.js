(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
function install(){
 const w=frame.contentWindow,r=w?.FitPlanModules;if(!r||r.get("tabela-cwiczen"))return;
 r.register("tabela-cwiczen",{
  kind:"exercise-table",
  async activate(context){
   try{
    await w.FitPlanLazy.loadScript("./modules/exercises-enhancement.js?v=20261018-reports-1");
    if(!context.isCurrent())return;
    w.dispatchEvent(new w.CustomEvent("fitplan:exercises:activate"));
    await w.FitPlanExerciseEnhancement.activate(context);
   }catch(error){
    if(!context.isCurrent()||!context.host?.isConnected)return;
    console.warn("[fitplan exercises]",error);
    context.host.innerHTML='<div class="info-card"><p role="alert">Nie udało się wczytać modelu 3D.</p><button type="button" class="action-button">Spróbuj ponownie</button></div>';
    context.host.querySelector("button").addEventListener("click",()=>w.FitPlanApp.open("tabela-cwiczen"),{once:true});
   }
  },
  deactivate(){w.FitPlanExerciseEnhancement?.deactivate();}
 });
}
frame.addEventListener("load",()=>queueMicrotask(install));try{queueMicrotask(install)}catch{}
})();
