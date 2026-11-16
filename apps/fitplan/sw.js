// WIEDORA-CHANGE: WD-20261101-WIE-155-PREFERENCES-CAS-03 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
// WIEDORA-CHANGE: WD-20261101-WIE-005-NATIVE-REGRESSION-11 | TASK: WIE-005 | AUTHOR: Codex / GPT-6
// WIEDORA-CHANGE: WD-20261101-WIE-161-FITPLAN-DIET-SEARCH-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261101-WIE-110-KB-UX-FIX-02 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261030-WIE-157-REDACTION | TASK: WIE-157 | AUTHOR: Codex / GPT-6
const APP_ID="fitplan";
// WIEDORA-CHANGE: WD-20261029-WIE-155-GUEST-OFFLINE | TASK: WIE-155 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261029-WIE-155-SIGNOUT-CODEX1 | TASK: WIE-155 | AUTHOR: Codex / GPT-6
// WIEDORA-CHANGE: WD-20261030-WIE-155-FITPLAN-UPDATE-01 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (full version unknown)
// WIEDORA-CHANGE: WD-20261031-WIE-157-ERROR-PATH-ROOT-01 | TASK: WIE-157 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261031-WIE-110-STARTER-PLANS-01 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
// WIEDORA-CHANGE: WD-20261101-WIE-005-CURRENT-POOL-01 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
// WIEDORA-CHANGE: WD-20261101-WIE-117-PHYSICAL-GOALS-01 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
const CACHE_NAME="portal-offline-"+APP_ID+"-cache-20261101-training-guide-2-stage00-1-preferences-cas-3";
const APP_ROOT="/apps/"+APP_ID+"/";
const INDEX=APP_ROOT+"index.html";
const READY=APP_ROOT+"offline-ready";
const MOTION_MANIFEST="./motion/photographic-manifest.js";
const ASSETS=[
  "/assets/vendor/supabase-2.117.2.js",
  "./",
  "./index.html",
  "./legacy.html",
  "./legacy.html?v=20261027-progress-1",
  "./data/kettlebell-catalog.js?v=20261023-kettlebell-1",
  "./data/training-extensions.js?v=20261101-cali-1",
  "./data/exercise-registry.js?v=20261023-training-curricula-2",
  "./data/training-presets.js?v=20261101-fbw-ux-2",
  "./data/training-progress.js?v=20261101-fbw-audit20-1",
  "./data/training-sets.js?v=20261031-sets-1",
  "./data/training-planner.js?v=20261101-fbw-swap-1",
  // WIEDORA-CHANGE: WD-20261101-WIE-115-CALISTHENICS-01 | TASK: WIE-115 | AUTHOR: ChatGPT / GPT-6
  "./data/calisthenics-coach.js?v=20261101-fbw-swap-1",
  "./modules/calisthenics-paths-ui.js?v=20261101-cali-1",
  "./data/training-load-engine.js?v=20261101-kbc-1",
  "./data/pushup-100.js?v=20261101-kbc-1",
  "./data/kettlebell-fbw-circuit.js?v=20261101-fbw-swap-2",
  "./data/app-data.js?v=20261023-dashboard-1",
  "./core/events.js?v=20261006-stage14",
  "./core/storage.js?v=20261007-user-audit",
  "./core/state.js?v=20261023-dashboard-1",
  "./data/muscles.js?v=20261005-stage12",
  "./data/exercise-catalog.js?v=20261020-bugpack-1",
  "./data/food-catalog.js?v=20261023-food-expanded-1",
  "./data/recipes.js?v=20261023-recipes-1",
  "./exercise-motion.js?v=20261020-motion-1",
  "./motion/library.js?v=20261023-side-step-2",
  MOTION_MANIFEST,
  "./motion/photographic-catalog.js?v=20261023-side-step-2",
  "./motion/landmark-constraints.js?v=20261022-exercise-audit-1",
  "./motion/rig-renderer.js?v=20261022-exercise-audit-1",
  "./motion/full-body-poses.js?v=20261022-motion-reaudit-2",
  "./motion/exercises/catalog-rigs.js?v=20261022-motion-reaudit-3",
  "./motion/pose-constraints.js?v=20261022-motion-reaudit-2",
  "./motion/full-body-renderer.js?v=20261022-motion-reaudit-2",
  "./motion/renderer.js?v=20261023-side-step-2",
  "./exercise-motion-embed.js?v=20261022-motion-reaudit-3",
  "./exercise-details.js?v=20261023-training-curricula-2",
  "./styles-loader.js?v=20261101-training-guide-2",
  "./styles/core.css",
  "./styles/anatomy.css",
  "./styles/start.css",
  "/js/supabase-client.js",
  "/js/platform-data.js?v=20261101-preferences-cas-3",
  "/js/error-monitor.js?v=20261031-errorpath-1",
  "/js/ai-core.js?v=20261002-platform-2",
  "/assets/ai-core.css?v=20261002-1",
  "/js/user-presence.js",
  "/js/progress-storage.js?v=20261024-bugfix-1",
  "/js/avatar-presets.js?v=20261024-bugfix-1",
  "/js/supabase-auth.js?v=20261024-bugfix-1",
  "/js/fitplan-account-media.js?v=20261027-progress-1",
  "../shared/avatar-presets.css?v=20261024-bugfix-1",
  "/apps/shared/avatar-presets.css?v=20261027-progress-1",
  "./progress.js?v=20261006-stage13",
  "./runtime-loader.js?v=20261006-stage13",
  "./app-controller.js?v=20261006-stage15",
  "./view-loader.js?v=20261018-fixes-1",
  "./lazy-loader.js?v=20261005-stage12",
  "./views/exercises.html",
  "./views/exercise-list.html",
  "./views/diet.html",
  "./views/workout-plan.html",
  "./views/start.html",
  "./views/results.html",
  "./views/calendar.html",
  "./modules/registry.js?v=20261018-fixes-1",
  "./modules/calendar.js?v=20261018-season-3",
  "./modules/exercise-list.js?v=20261023-muscle-roles-1",
  "./modules/physical-goals.js?v=20261101-goals-1",
  "./modules/results.js?v=20261101-goals-1",
  "./modules/kettlebell-circuit-ui.js?v=20261101-kbc-ux2",
  "./modules/training-guide.js?v=20261101-training-guide-2",
  "./modules/workout-plan.js?v=20261101-training-guide-2",
  "./modules/start.js?v=20261101-fbw-audit20-1",
  "./modules/nutrient-guide.js?v=20261024-nutrient-fix-1",
  "./modules/diet-tools.js?v=20261024-bugfix-1",
  "./modules/diet.js?v=20261101-fitplan-food1",
  "./modules/exercises.js?v=20261018-reports-1",
  "./router.js?v=20261023-dashboard-1",
  "./preferences.js?v=20261007-user-audit-resume",
  "./calendar-loader.js?v=20261018-season-3",
  "../shared/content-protection.js?v=20261008-hidden-watermark",
  "../shared/account-sync.js?v=20261007-user-audit",
  "../shared/portal-nav.css?v=20261024-bugfix-1",
  "../shared/portal-nav.js?v=20261004-i18n-1",
  "../shared/offline-control.css",
  "../shared/offline-control.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "../shared/guest-access.js?v=20261029-guest-free-2",
  "../shared/i18n-core.js?v=20261004-i18n-1",
  "./styles/portal-layout.css?v=20261007-mobile-dock-2",
  // WIEDORA-CHANGE: WD-20261101-WIE-005-CURRENT-POOL-01 | TASK: WIE-005 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
  "./styles/core.css?v=20261101-training-guide-2",
  "./styles/anatomy.css?v=20261101-training-guide-2",
  "/apps/shared/avatar-presets.css?v=20261101-training-guide-2",
  "./styles/start.css?v=20261101-training-guide-2",
  "./styles/physical-goals.css?v=20261101-training-guide-2",
  "./calendar-enhancement.js?v=20261018-season-3"
];
// Download anatomy only after explicit CACHE_APP / REFRESH_APP, never during install.
const DEFERRED_ASSETS=["./modules/exercises-enhancement.js?v=20261018-reports-1","./modules/anatomy.js?v=20261018-reports-1","./modules/anatomy-runtime.js?v=20261018-layer-2","./data/anatomy-manifest.json?v=20261005-stage12","./assets/anatomy/70ca6102eb6508e1-01.deflate","./assets/anatomy/70ca6102eb6508e1-02.deflate","./assets/anatomy/70ca6102eb6508e1-03.deflate","./assets/anatomy/70ca6102eb6508e1-04.deflate","./assets/anatomy/70ca6102eb6508e1-05.deflate","./assets/anatomy/70ca6102eb6508e1-06.deflate","./assets/anatomy/70ca6102eb6508e1-07.deflate","./assets/anatomy/70ca6102eb6508e1-08.deflate","./assets/anatomy/70ca6102eb6508e1-09.deflate","./assets/anatomy/70ca6102eb6508e1-10.deflate","./assets/anatomy/70ca6102eb6508e1-11.deflate","./assets/anatomy/70ca6102eb6508e1-12.deflate","./assets/anatomy/70ca6102eb6508e1-13.deflate","./assets/anatomy/70ca6102eb6508e1-14.deflate","./assets/anatomy/70ca6102eb6508e1-15.deflate","./assets/anatomy/70ca6102eb6508e1-16.deflate","./assets/anatomy/70ca6102eb6508e1-17.deflate","./assets/anatomy/70ca6102eb6508e1-18.deflate"];

async function notify(client,type,extra={}){
  try{client&&client.postMessage({type,appId:APP_ID,...extra})}catch{}
}
// WIEDORA-CHANGE: WD-20261030-WIE-155-FITPLAN-UPDATE-01 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (full version unknown)
// A SPA fallback must not complete a package or replace a usable cached asset.
function rejectHtmlAsset(response,absolute){
  if(/\.(?:js|css)$/.test(new URL(absolute).pathname)&&/text\/html/i.test(response.headers.get("Content-Type")||"")){
    throw new Error("HTML instead of an application asset: "+absolute);
  }
}
async function fetchAndCache(cache,url){
  const absolute=new URL(url,self.registration.scope).href;
  const response=await fetch(absolute,{cache:"no-store",credentials:"same-origin"});
  if(!response.ok)throw new Error("HTTP "+response.status+" for "+absolute);
  rejectHtmlAsset(response,absolute);
  await cache.put(absolute,response.clone());
}
function parsePhotographicManifest(source){
  const match=String(source).match(/^\s*globalThis\.FitPlanPhotographicManifest\s*=\s*([\s\S]*);\s*$/);
  if(!match)throw new Error("Invalid photographic manifest wrapper");
  const manifest=JSON.parse(match[1]);
  if(manifest?.schemaVersion!==1||!Array.isArray(manifest.actors)||!Array.isArray(manifest.exercises))throw new Error("Invalid photographic manifest data");
  return manifest;
}
async function readPhotographicAssets(cache){
  const absolute=new URL(MOTION_MANIFEST,self.registration.scope).href;
  let response;
  try{
    response=await fetch(absolute,{cache:"no-store",credentials:"same-origin"});
    if(!response.ok)throw new Error("HTTP "+response.status+" for "+absolute);
    await cache.put(absolute,response.clone());
  }catch(error){
    response=await cache.match(absolute);
    if(!response)throw error;
  }
  const manifest=parsePhotographicManifest(await response.text()),assets=new Set();
  const add=value=>{if(value!==undefined){if(typeof value!=="string"||!value.startsWith("./assets/motion/"))throw new Error("Invalid photographic asset path");assets.add(value);}};
  for(const actor of manifest.actors)add(actor.reference);
  for(const exercise of manifest.exercises){
    add(exercise.visual?.atlas);for(const frame of exercise.visual?.frames||[])add(frame);add(exercise.visual?.flow?.url);
  }
  return [...assets];
}
async function previousResponse(request){
  const keys=(await caches.keys()).filter(key=>key.startsWith("portal-offline-"+APP_ID+"-")&&key!==CACHE_NAME).reverse();
  for(const key of keys){
    const previous=await caches.open(key),response=await previous.match(request);
    if(response)return response;
  }
}
async function cacheAll(client,refresh=false){
  const cache=await caches.open(CACHE_NAME);
  let photographicAssets=[],manifestFailed=0;
  try{photographicAssets=await readPhotographicAssets(cache)}catch(error){manifestFailed=1;console.warn("[offline cache]",APP_ID,MOTION_MANIFEST,error);}
  const assets=[...ASSETS,...DEFERRED_ASSETS,...photographicAssets];
  let done=0,failed=manifestFailed;
  for(const url of assets){
    try{
      const immutable=url.includes("assets/anatomy/")&&url.endsWith(".deflate");
      if(refresh||!immutable||!(await cache.match(new URL(url,self.registration.scope).href))) await fetchAndCache(cache,url);
    }catch(error){
      failed++;console.warn("[offline cache]",APP_ID,url,error);
    }
    done++;await notify(client,"CACHE_PROGRESS",{done,total:assets.length,failed});
  }
  if(!failed){
    await cache.put(READY,new Response("1"));
    for(const key of await caches.keys())if(key.startsWith("portal-offline-"+APP_ID+"-")&&key!==CACHE_NAME)await caches.delete(key);
  }
  if(refresh) await notify(client,"REFRESH_DONE",{done,total:assets.length,failed});
  else if(failed) await notify(client,"CACHE_ERROR",{done,total:assets.length,failed});
  else await notify(client,"CACHE_DONE",{done,total:assets.length,failed:0});
}
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    for(const url of ["./","./index.html"]){
      try{await fetchAndCache(cache,url)}catch{}
    }
    self.skipWaiting();
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const current=await caches.open(CACHE_NAME);
    for(const key of keys.filter(k=>k.startsWith("portal-offline-"+APP_ID+"-")&&k!==CACHE_NAME)){
      const previous=await caches.open(key);
      try{
        const requests=await previous.keys();
        for(const request of requests){
          const url=new URL(request.url);
          const immutableAnatomy=url.pathname.startsWith(APP_ROOT+"assets/anatomy/")&&url.pathname.endsWith(".deflate");
          const shell=url.pathname===INDEX||url.pathname===APP_ROOT||url.pathname===APP_ROOT+"legacy.html";
          if((immutableAnatomy||shell)&&!(await current.match(request))){
            const response=await previous.match(request);
            if(response)await current.put(request,response);
          }
        }
        // Retain an older downloaded package until the replacement is complete.
        // Its scripts stay in its own cache and are used only after network failure.
        if(!requests.some(request=>/\.(?:js|css)$/.test(new URL(request.url).pathname)))await caches.delete(key);
      }catch(error){console.warn("[offline migration]",APP_ID,error);}
    }
    await self.clients.claim();
  })());
});
self.addEventListener("message",event=>{
  const type=event.data?.type;
  if(type==="CACHE_APP")event.waitUntil(cacheAll(event.source,false));
  if(type==="REFRESH_APP")event.waitUntil(cacheAll(event.source,true));
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const network=await fetch(req);
        const cache=await caches.open(CACHE_NAME);
        if(network.ok && url.pathname.startsWith(APP_ROOT)){
          const isShell=url.pathname===APP_ROOT||url.pathname===INDEX||!url.pathname.split("/").pop().includes(".");
          cache.put(isShell?INDEX:req,network.clone()).catch(()=>{});
        }
        return network;
      }catch{
        const cache=await caches.open(CACHE_NAME);
        if(!(await cache.match(READY))){
          const previous=(await previousResponse(req))||(await previousResponse(INDEX));
          if(previous)return previous;
        }
        return (await cache.match(req)) || (await cache.match(INDEX)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(req)||await previousResponse(req)||await cache.match(req,{ignoreSearch:true});
    const isCode=/\.(?:html?|js|css)(?:$|\?)/i.test(url.pathname+url.search) ||
      url.pathname.startsWith("/js/") || url.pathname.startsWith("/apps/shared/");

    if(isCode){
      try{
        const network=await fetch(req,{cache:"no-store"});
        // WIEDORA-CHANGE: WD-20261030-WIE-155-FITPLAN-UPDATE-01 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (full version unknown)
        rejectHtmlAsset(network,req.url);
        if(network.ok)cache.put(req,network.clone()).catch(()=>{});
        return network;
      }catch{
        return cached || Response.error();
      }
    }

    if(cached){
      fetch(req).then(r=>{if(r.ok)cache.put(req,r.clone())}).catch(()=>{});
      return cached;
    }
    try{
      const network=await fetch(req);
      if(network.ok)cache.put(req,network.clone()).catch(()=>{});
      return network;
    }catch{
      return cached || Response.error();
    }
  })());
});

