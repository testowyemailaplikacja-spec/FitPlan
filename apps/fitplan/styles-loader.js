(()=>{
  const frame=document.getElementById("appFrame");
  if(!frame)return;
  // WIEDORA-CHANGE: WD-20261031-WIE-117-TRAINING-HISTORY-03 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
  // WIEDORA-CHANGE: WD-20261031-WIE-185-SETS-ENGINE-07 | TASK: WIE-185 | AUTHOR: ChatGPT / GPT-6
  // WIEDORA-CHANGE: WD-20261101-WIE-161-FITPLAN-DIET-SEARCH-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
  // WIEDORA-CHANGE: WD-20261101-WIE-110-KB-UX-FIX-02 | TASK: WIE-110 | AUTHOR: ChatGPT / GPT-6
  const VERSION="20261101-training-guide-2";
  // WIEDORA-CHANGE: WD-20261101-WIE-117-PHYSICAL-GOALS-01 | TASK: WIE-117 | AUTHOR: ChatGPT / GPT-6
  const STYLES=["./styles/core.css","./styles/anatomy.css","./styles/start.css","./styles/physical-goals.css","/apps/shared/avatar-presets.css"];
  function install(){
    const doc=frame.contentDocument;
    if(!doc?.head)return;
    for(const href of STYLES){
      const absolute=new URL(href,frame.contentWindow.location.href).href;
      if(doc.querySelector('link[data-fitplan-style="'+href+'"]'))continue;
      const link=doc.createElement("link");
      link.rel="stylesheet";link.href=absolute+"?v="+VERSION;link.dataset.fitplanStyle=href;
      doc.head.appendChild(link);
    }
  }
  frame.addEventListener("load",install);
  try{if(frame.contentDocument?.readyState==="complete")install()}catch{}
})();
