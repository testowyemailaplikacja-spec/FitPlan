(()=>{
"use strict";
const frame=document.getElementById("appFrame");if(!frame)return;
const VERSION="20261006-stage15";
let installedDocument;
function install(){
 const w=frame.contentWindow,doc=frame.contentDocument;
 if(!w||!doc||installedDocument===doc||!w.FitPlanRuntime)return;
 installedDocument=doc;
 const runtime=w.FitPlanRuntime;let generation=0;
 function leave(){generation++;w.FitPlanModules?.deactivate();}
 async function view(id,token){
  const panel=doc.getElementById("tab-note"),fallback=panel?.querySelector("#atlasRoot")||panel;
  try{
   const html=await w.FitPlanViews.load(id);
   if(token!==generation||!panel?.isConnected)return null;
   const template=doc.createElement("template");template.innerHTML=html;
   const content=template.content.firstElementChild;
   if(content?.dataset.fitplanView!==id)throw new Error("Invalid FitPlan view: "+id);
   // Keep progress actions and other tab panels with their existing handlers.
   if(id==="tabela-cwiczen"){
    const atlas=panel.querySelector("#atlasRoot"),mount=content.querySelector("#fitplanExercisesMount");
    if(!atlas||!mount)throw new Error("Missing exercise mount point");
    atlas.replaceWith(content);mount.appendChild(atlas);return atlas;
   }
   const note=panel.firstElementChild;
   if(!note||note.classList.contains("action-row"))throw new Error("Missing note body: "+id);
   note.replaceWith(content);return content.querySelector("#fitplanCalendarMount")||content;
  }catch(error){if(token!==generation)return null;console.warn("[fitplan view]",error);return fallback;}
 }
 const api=Object.freeze({
  version:VERSION,
  home:()=> w.FitPlanRouter?.goHome(),
  open:id=> w.FitPlanRouter?.openSection(id),
  tab:id=> w.FitPlanRouter?.switchTab(id),
  enter(id){const token=++generation;return w.FitPlanModules?.activate(id,{ready:view(id,token)});},
  leave,atlas:()=>runtime.atlas,data:()=>runtime.data
 });
 Object.defineProperty(w,"FitPlanApp",{value:api,writable:false,configurable:false});
 w.dispatchEvent(new w.CustomEvent("fitplan:app:ready",{detail:{version:VERSION}}));
}
frame.addEventListener("load",()=>queueMicrotask(install));
try{if(frame.contentDocument?.readyState==="complete")queueMicrotask(install)}catch{}
})();
