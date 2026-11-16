(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
function install(){
 const w=frame.contentWindow;if(!w?.FitPlanLazy)return;
 w.FitPlanLazy.loadScript("./calendar-enhancement.js?v=20261018-season-3").catch(error=>console.warn("[fitplan calendar]",error));
}
frame.addEventListener("load",()=>queueMicrotask(install));
try{if(frame.contentDocument?.readyState==="complete")queueMicrotask(install)}catch{}
})();
