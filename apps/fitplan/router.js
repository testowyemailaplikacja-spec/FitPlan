(() => {
"use strict";
const BASE="/apps/fitplan";
const TITLE="FitPlan — planer treningowy";
const DEFAULT_DESC="Plan treningowy, atlas mięśni, ćwiczenia, kalendarz, dieta i kontrola postępów treningowych.";
const frame=document.getElementById("appFrame");
let restoring=false,navigationDepth=0;
let installedDocument;
const clean=s=>String(s||"").replace(/^\/+|\/+$/g,"");
const path=s=>{const t=clean(s);return t?BASE+"/"+t+"/":BASE+"/";};
function preview(){const h=location.hostname;return h.endsWith(".netlify.app") && h !== "constant-app.netlify.app";}
function seo(name=TITLE,description=DEFAULT_DESC,canonicalPath=path(""),indexable=true){
 document.title=name===TITLE?TITLE:name+" | "+TITLE;
 let d=document.querySelector('meta[name="description"]'); if(d)d.content=description;
 let r=document.querySelector('meta[name="robots"]'); if(r)r.content=(indexable&&!preview())?"index,follow,max-image-preview:large":"noindex,follow";
 let c=document.querySelector('link[rel="canonical"]'); if(c)c.href="https://constant-app.netlify.app"+canonicalPath;
 let ot=document.querySelector('meta[property="og:title"]'); if(ot)ot.content=document.title;
 let od=document.querySelector('meta[property="og:description"]'); if(od)od.content=description;
 let ou=document.querySelector('meta[property="og:url"]'); if(ou)ou.content="https://constant-app.netlify.app"+canonicalPath;
}
function nav(to,options={}){if(restoring)return;const u=new URL(to,location.origin);if(options.query)Object.entries(options.query).forEach(([k,v])=>v&&u.searchParams.set(k,v));const next=u.pathname+u.search;if(next!==location.pathname+location.search)history.pushState({appRouter:true},"",next);seo(options.title||TITLE,options.description||DEFAULT_DESC,options.canonical||u.pathname,options.indexable!==false);}
function wrap(w,name,after){
 const orig=w[name];if(typeof orig!=="function"||orig.__portalWrapped)return;
 function fn(...args){
  const nested=navigationDepth>0;
  navigationDepth++;let result;
  try{result=orig.apply(this,args);}finally{navigationDepth--;}
  if(!nested){
   // A guest guard may refuse the underlying call. Only a successful open owns lifecycle.
   if(result===false || (name==="openSection"&&w.FitPlanData&&result!==true))return result;
   if(name==="switchTab"&&result===false)return result;
   if(name!=="switchTab")w.FitPlanApp?.leave();
   after(...args);
  }
  return result;
 }
 fn.__portalWrapped=true;fn.__orig=orig;w[name]=fn;
}

const sectionId=w=>w.FitPlanState?.snapshot().navigation.sectionId||"";
function install(){
 const w=frame.contentWindow;
 if(typeof w?.openSection!=="function"||installedDocument===w.document)return;
 installedDocument=w.document;
 wrap(w,"goHome",()=>{nav(path(""),{title:TITLE});});
 wrap(w,"openSection",id=>{
  if(w.FitPlanData&&!w.FitPlanData.modules.some(module=>module.id===id))return;
  const current=sectionId(w);w.FitPlanApp?.enter(current);
  nav(path("modul/"+encodeURIComponent(current)),{title:"FitPlan — "+current.replace(/-/g," ")});
 });
 wrap(w,"switchTab",tab=>{const current=sectionId(w);if(!current)return;nav(path("modul/"+encodeURIComponent(current)),{title:"FitPlan — "+current.replace(/-/g," "),query:tab&&tab!=="note"?{widok:tab}:null,indexable:tab==="note"});});
 // The legacy back button holds its original handler. Observe its actual view change.
 const home=w.document.getElementById("homePage"),module=w.document.getElementById("modulePage");
 if(home)new MutationObserver(()=>{
   if(restoring||!home.isConnected||installedDocument!==w.document)return;
   if(!home.hidden&&module?.hidden){w.FitPlanApp?.leave();nav(path(""),{title:TITLE});}
 }).observe(home,{attributes:true,attributeFilter:["hidden"]});
 Object.defineProperty(w,"FitPlanRouter",{value:Object.freeze({
  openSection:id=>w.openSection(id),goHome:()=>w.goHome(),switchTab:tab=>w.switchTab(tab)
 })});
 restore();
}
function restore(){
 const w=frame.contentWindow;if(!w)return;const seg=location.pathname.slice(BASE.length).split("/").filter(Boolean).map(value=>{try{return decodeURIComponent(value)}catch{return value}});restoring=true;
 try{
   if(seg[0]==="modul"&&seg[1]){
    const requested=seg[1],opened=w.openSection?.(requested);
    if(w.FitPlanData&&opened!==true){if(opened!==false)w.goHome?.();restoreCurrent(w);return;}
    const tab=new URL(location.href).searchParams.get("widok");
    const singleView=["dieta","plan-treningowy","lista-cwiczen","start","podsumowanie-wynikow"].includes(requested);
    if(singleView && tab){
      // Stare linki z ?widok=questions/exam wracają do jedynego aktywnego widoku.
      history.replaceState({appRouter:true},"",path("modul/"+encodeURIComponent(requested)));
    } else if(tab)w.switchTab?.(tab);
    seo("FitPlan — "+requested.replace(/-/g," "),DEFAULT_DESC,path("modul/"+encodeURIComponent(requested)),!tab||singleView);
   }
   else{if(w.goHome?.()===false)restoreCurrent(w);else seo();}
 }finally{restoring=false;}
}
function restoreCurrent(w){
 const current=w.FitPlanState?.snapshot().navigation;
 const id=current?.sectionId,tab=current?.tab;
 const target=path(id?"modul/"+encodeURIComponent(id):"")+(id&&tab&&tab!=="note"?"?widok="+encodeURIComponent(tab):"");
 history.replaceState({appRouter:true},"",target);
 seo(id?"FitPlan — "+id.replace(/-/g," "):TITLE,DEFAULT_DESC,path(id?"modul/"+encodeURIComponent(id):""),!id||tab==="note");
}
frame.addEventListener("load",()=>queueMicrotask(install));
if(frame.contentDocument?.readyState==="complete")queueMicrotask(install);
window.addEventListener("popstate",restore);
seo();
})();
