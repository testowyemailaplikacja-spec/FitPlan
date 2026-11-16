(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
function install(){
 const w=frame.contentWindow,r=w?.FitPlanModules;if(!r||r.get("kalendarz-treningowy"))return;
 r.register("kalendarz-treningowy",{
  kind:"calendar",
  async activate({host,isCurrent}){
   if(!w.FitPlanCalendarView)await w.FitPlanLazy.loadScript("./calendar-enhancement.js?v=20261018-season-3");
   if(!isCurrent())return;
   w.FitPlanCalendarView.show(host);
   w.dispatchEvent(new w.CustomEvent("fitplan:calendar:activate"));
  },
  deactivate(){w.FitPlanCalendarView?.hide();}
 });
}
frame.addEventListener("load",()=>queueMicrotask(install));try{queueMicrotask(install)}catch{}
})();
