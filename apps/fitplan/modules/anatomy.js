(()=>{
"use strict";
const VERSION="20261005-stage12",w=window;
let pending=null,prepared=false,host=null,stopDetails=null;
async function digest(bytes,expected){
 const value=await crypto.subtle.digest("SHA-256",bytes);
 const actual=Array.from(new Uint8Array(value),byte=>byte.toString(16).padStart(2,"0")).join("");
 if(actual!==expected)throw new Error("Anatomy model integrity check failed");
}
async function model(){
 const response=await fetch("./data/anatomy-manifest.json?v="+VERSION,{credentials:"same-origin"});
 if(!response.ok)throw new Error("Anatomy manifest HTTP "+response.status);
 const manifest=await response.json();
 if(manifest.version!==VERSION||manifest.format!=="deflate"||!Number.isSafeInteger(manifest.bytes)||manifest.bytes<1||!Array.isArray(manifest.chunks)||!manifest.chunks.length)throw new Error("Invalid anatomy manifest");
 const chunks=[];
 for(let start=0;start<manifest.chunks.length;start+=3){
  const batch=await Promise.all(manifest.chunks.slice(start,start+3).map(async chunk=>{
   if(!/^assets\/anatomy\/[a-z0-9-]+\.deflate$/.test(chunk.url)||!Number.isSafeInteger(chunk.bytes)||chunk.bytes<1)throw new Error("Invalid anatomy chunk");
   const result=await fetch("./"+chunk.url,{credentials:"same-origin"});
   if(!result.ok)throw new Error("Anatomy model HTTP "+result.status);
   const bytes=new Uint8Array(await result.arrayBuffer());
   if(bytes.byteLength!==chunk.bytes)throw new Error("Incomplete anatomy model chunk");
   await digest(bytes,chunk.sha256);return bytes;
  }));
  chunks.push(...batch);
 }
 if(chunks.reduce((sum,bytes)=>sum+bytes.length,0)!==manifest.bytes)throw new Error("Incomplete anatomy model");
 const bytes=new Uint8Array(manifest.bytes);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 await digest(bytes,manifest.sha256);return bytes;
}
function prepare(){
 if(prepared)return Promise.resolve(w.FitAtlas);
 if(pending)return pending;
 pending=(async()=>{
  const [bytes]=await Promise.all([model(),w.FitPlanLazy.loadScript("./modules/anatomy-runtime.js?v=20261018-layer-2")]);
  w.FitAtlas.setModel(bytes);prepared=true;return w.FitAtlas;
 })().finally(()=>{pending=null;});
 return pending;
}
async function mount(target,context){
 if(!context.isCurrent()||!target?.isConnected)return;
 host=target;
 target.innerHTML='<div class="info-card"><p role="status">Ładowanie modelu 3D…</p></div>';
 try{
  const atlas=await prepare();
  if(context.isCurrent()&&host===target&&target.isConnected){
   atlas.mount(target);
   stopDetails?.();
   stopDetails=w.FitPlanExerciseDetails?.enhanceAtlas(target)||null;
  }
 }catch(error){
  if(!context.isCurrent()||host!==target||!target.isConnected)return;
  console.warn("[fitplan anatomy]",error);
  target.innerHTML='<div class="info-card"><p role="alert">Nie udało się wczytać modelu 3D.</p><button type="button" class="action-button" data-fitplan-action="retry">Spróbuj ponownie</button></div>';
  target.querySelector('[data-fitplan-action="retry"]').addEventListener("click",()=>mount(target,context),{once:true});
 }
}
function dispose(){stopDetails?.();stopDetails=null;w.FitAtlas?.dispose();host?.replaceChildren();host=null;}
Object.defineProperty(w,"FitPlanAnatomy",{value:Object.freeze({version:VERSION,prepare,mount,dispose})});
})();
