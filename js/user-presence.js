(() => {
  "use strict";

  const client=window.AppSupabase;
  if(!client)return;

  const PATH=location.pathname;
  const match=PATH.match(/^\/apps\/(prawo|ccna|fitplan|oficerska|psychologia|podroze)(?:\/|$)/);
  const area=match?match[1]:(PATH.startsWith("/konto/")?"account":"portal");
  // WIEDORA-CHANGE: WD-20261030-WIE-157-PRESENCE-PATH-MINIMIZE-01 | TASK: WIE-157 | AUTHOR: ChatGPT / GPT-6
  // Presence counts usage per app, not individual lessons, accounts or URL identifiers.
  const telemetryPath=match?"/apps/"+match[1]+"/":(area==="account"?"/konto/":"/");
  const appAreas=new Set(["prawo","ccna","fitplan","oficerska","psychologia","podroze"]);
  const HEARTBEAT_MS=25000;
  const IDLE_MS=120000;

  let userId=null;
  let timer=0;
  let sending=false;
  let pending=false;
  let lastInteraction=Date.now();
  const installedDocs=new WeakSet();

  function markInteraction(){
    lastInteraction=Date.now();
  }

  function installActivityListeners(doc){
    if(!doc||installedDocs.has(doc))return;
    installedDocs.add(doc);
    ["pointerdown","keydown","touchstart","wheel","scroll"].forEach(type=>{
      doc.addEventListener(type,markInteraction,{passive:true,capture:true});
    });
    doc.querySelectorAll?.("iframe").forEach(attachFrame);
    try{
      const observer=new MutationObserver(mutations=>{
        mutations.forEach(m=>m.addedNodes.forEach(node=>{
          if(node?.nodeType!==1)return;
          if(node.tagName==="IFRAME")attachFrame(node);
          node.querySelectorAll?.("iframe").forEach(attachFrame);
        }));
      });
      observer.observe(doc.documentElement,{childList:true,subtree:true});
    }catch{}
  }

  function attachFrame(frame){
    if(!frame)return;
    const install=()=>{
      try{installActivityListeners(frame.contentDocument)}catch{}
    };
    frame.addEventListener("load",install,{passive:true});
    install();
  }

  function shouldCountStudy(){
    return appAreas.has(area)
      && !document.hidden
      && (Date.now()-lastInteraction)<IDLE_MS;
  }

  async function heartbeat(){
    if(!userId||document.hidden)return;
    if(sending){
      pending=true;
      return;
    }
    sending=true;
    try{
      const {error}=await client.rpc("touch_portal_presence",{
        p_area:area,
        p_path:telemetryPath,
        p_active:shouldCountStudy()
      });
      if(error)throw error;
    }catch(error){
      console.warn("[presence]",error);
    }finally{
      sending=false;
      if(pending){
        pending=false;
        setTimeout(heartbeat,250);
      }
    }
  }

  async function resolveSession(){
    try{
      const {data}=await client.auth.getSession();
      userId=data?.session?.user?.id||null;
      if(userId)heartbeat();
    }catch{}
  }

  installActivityListeners(document);
  document.querySelectorAll("iframe").forEach(attachFrame);

  client.auth.onAuthStateChange((event,session)=>{
    userId=session?.user?.id||null;
    if(userId){
      markInteraction();
      setTimeout(heartbeat,0);
    }
  });

  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden){
      markInteraction();
      heartbeat();
    }
  },{passive:true});

  window.addEventListener("focus",()=>heartbeat(),{passive:true});

  resolveSession();
  timer=setInterval(heartbeat,HEARTBEAT_MS);

  window.addEventListener("pagehide",()=>{
    clearInterval(timer);
  },{once:true});
})();
