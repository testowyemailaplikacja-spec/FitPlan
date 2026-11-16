(() => {
"use strict";
const client=window.AppSupabase;if(!client||window.__PORTAL_AI_INSTALLED__)return;window.__PORTAL_AI_INSTALLED__=true;
const apps={portal:{name:"Centrum aplikacji",quick:["Co mogę zrobić na tej platformie?","Otwórz aplikację podróżniczą"]},prawo:{name:"Prawo",quick:["Wyjaśnij aktualny temat prostymi słowami","Odpytaj mnie z tego materiału"]},ccna:{name:"CCNA",quick:["Wyjaśnij aktualny temat","Pomóż mi z komendami IOS"]},fitplan:{name:"FitPlan",quick:["Pomóż ułożyć dzisiejszy trening","Wyjaśnij pracę wybranego mięśnia"]},oficerska:{name:"Oficerska",quick:["Odpytaj mnie z bieżącego materiału","Pomóż mi zaplanować powtórkę"]},podroze:{name:"Podróże",quick:["Zaplanuj mi trasę na weekend","Pokaż zabytki i naturę","Ustaw podróż samochodem"]},psychologia:{name:"Psychologia",quick:["Chcę umówić konsultację","Jak przygotować się do pierwszej wizyty?"]}};
const paths={prawo:"/apps/prawo/",ccna:"/apps/ccna/",fitplan:"/apps/fitplan/",oficerska:"/apps/oficerska/",psychologia:"/apps/psychologia/",podroze:"/apps/podroze/"};
function appId(){const m=location.pathname.match(/^\/apps\/(prawo|ccna|fitplan|oficerska|psychologia|podroze)(?:\/|$)/);return m?m[1]:"portal"}
const currentApp=appId(),meta=apps[currentApp]||apps.portal;let sessionUser=null,conversationId=null,localHistory=[],sending=false,contextVersion=0,authReadVersion=0;
const style=document.createElement("link");style.rel="stylesheet";style.href="/assets/ai-core.css?v=20261002-ai-fix-1";document.head.appendChild(style);
const root=document.createElement("div");root.className="portal-ai-root";root.innerHTML='<section class="portal-ai-panel" hidden aria-label="Asystent AI"><div class="portal-ai-head"><span class="portal-ai-head-icon">AI</span><div class="portal-ai-head-copy"><strong>Asystent · '+meta.name+'</strong><small>kontekst bieżącej aplikacji</small></div><div class="portal-ai-head-actions"><button type="button" data-ai-new title="Nowa rozmowa">＋</button><button type="button" data-ai-close aria-label="Zamknij">×</button></div></div><div class="portal-ai-historybar"><select data-ai-history aria-label="Historia rozmów"></select><button type="button" data-ai-refresh>Odśwież</button></div><div class="portal-ai-messages" data-ai-messages></div><div><div class="portal-ai-quick" data-ai-quick></div><div class="portal-ai-sensitive" data-ai-sensitive hidden></div><form class="portal-ai-compose" data-ai-form><textarea data-ai-input maxlength="8000" placeholder="Napisz wiadomość…" aria-label="Wiadomość do AI"></textarea><div class="portal-ai-compose-foot"><small>Enter wysyła · Shift+Enter dodaje linię</small><button class="portal-ai-send" type="submit">Wyślij</button></div></form></div></section><button class="portal-ai-launch" type="button" aria-label="Otwórz asystenta AI">AI</button>';document.body.appendChild(root);
const panel=root.querySelector(".portal-ai-panel"),launch=root.querySelector(".portal-ai-launch"),messages=root.querySelector("[data-ai-messages]"),input=root.querySelector("[data-ai-input]"),form=root.querySelector("[data-ai-form]"),historySelect=root.querySelector("[data-ai-history]"),historybar=root.querySelector(".portal-ai-historybar"),sensitive=root.querySelector("[data-ai-sensitive]"),sendButton=root.querySelector(".portal-ai-send");
function scrollBottom(){messages.scrollTop=messages.scrollHeight}function addMessage(role,text,extra=""){const div=document.createElement("div");div.className="portal-ai-msg "+role+(extra?" "+extra:"");if((role==="user"||role==="assistant")&&!extra.includes("pending"))div.dataset.noTranslate="true";div.textContent=String(text??"");messages.appendChild(div);scrollBottom();return div}function empty(){messages.innerHTML='<div class="portal-ai-empty"><strong>W czym mogę pomóc?</strong><span>Rozmowa uwzględnia aplikację, w której aktualnie jesteś.</span></div>'}function clearEmpty(){messages.querySelector(".portal-ai-empty")?.remove()}
function cleanContextText(value,max=4500){return String(value||"").replace(/\s+/g," ").trim().slice(0,max)}
function visibleContextText(doc){
  if(!doc)return "";
  const selectors=[
    "#moduleContent:not([hidden])",
    ".page:not([hidden]) .module-card",
    ".page:not([hidden]) main",
    ".active[data-section]",
    ".section.active",
    ".tab-pane.active",
    "main"
  ];
  for(const selector of selectors){
    try{
      const node=doc.querySelector(selector);
      if(node){
        const text=cleanContextText(node.innerText||node.textContent||"");
        if(text.length>80)return text;
      }
    }catch{}
  }
  return "";
}
function collectContext(){
  let section="",material="",extra="";
  try{
    section=document.querySelector("h1:not([hidden]),h2:not([hidden]),#moduleTitle")?.textContent?.trim()||"";
    material=visibleContextText(document);
    const frame=document.getElementById("appFrame");
    if(frame?.contentDocument){
      const doc=frame.contentDocument;
      section=doc.querySelector("h1:not([hidden]),h2:not([hidden]),.active h2,.active h3")?.textContent?.trim()||section;
      material=visibleContextText(doc)||material;
    }
  }catch{}
  if(currentApp==="podroze"){
    extra="Punkt A: "+(document.querySelector("#routeStart")?.value||"")+"; punkt B: "+(document.querySelector("#routeEnd")?.value||"")+".";
  }else if(["prawo","ccna","fitplan","oficerska"].includes(currentApp)){
    extra=material?("Widoczny materiał: "+cleanContextText(material,5000)):"";
  }
  return{title:document.title,section:cleanContextText(section,500),path:location.pathname,extra};
}
function executeAction(action){if(!action?.type)return;if(action.type==="navigate"){const id=String(action.payload?.appId||"");if(paths[id])location.href=paths[id];return}window.dispatchEvent(new CustomEvent("portal-ai-action",{detail:action}))}
async function getUser(){const {data,error}=await client.auth.getSession();if(error)throw error;return data?.session?.user||null}
function renderLogin(){historybar.hidden=true;sensitive.hidden=true;root.querySelector('[data-ai-quick]').hidden=true;messages.innerHTML='<div class="portal-ai-login"><div><strong>Zaloguj się, aby korzystać z AI</strong><p>Historia i limity AI są przypisane do konta.</p><a href="/?konto=login&return='+encodeURIComponent(location.pathname+location.search)+'">Zaloguj się</a></div></div>';form.hidden=true}
function renderQuick(){const box=root.querySelector("[data-ai-quick]");box.replaceChildren();(meta.quick||[]).forEach(text=>{const b=document.createElement("button");b.type="button";b.textContent=text;b.addEventListener("click",()=>{input.value=text;input.focus()});box.appendChild(b)})}
function resetConversation(){
  contextVersion++;conversationId=null;localHistory=[];sending=false;sendButton.disabled=false;input.value="";
  historySelect.value="";empty();
}
function resetSession(){
  resetConversation();sessionUser=null;historySelect.replaceChildren();historybar.hidden=true;form.hidden=true;
  sensitive.hidden=true;root.querySelector('[data-ai-quick]').hidden=true;
}
async function loadConversations(version=contextVersion){
  if(version!==contextVersion)return;
  if(!sessionUser||currentApp==="psychologia"){historybar.hidden=true;return}
  const userId=sessionUser.id;historybar.hidden=false;
  let result;
  try{result=await client.from("ai_conversations").select("id,title,updated_at").eq("app_id",currentApp).order("updated_at",{ascending:false}).limit(30)}catch{result={error:true}}
  if(version!==contextVersion||sessionUser?.id!==userId)return;
  if(result.error){addMessage("error","Nie udało się pobrać historii rozmów. Możesz nadal napisać wiadomość.");return}
  historySelect.replaceChildren();const fresh=document.createElement("option");fresh.value="";fresh.textContent="Nowa rozmowa";historySelect.appendChild(fresh);
  (result.data||[]).forEach(row=>{const o=document.createElement("option");o.value=row.id;o.dataset.noTranslate="true";o.textContent=row.title;historySelect.appendChild(o)});
  historySelect.value=conversationId||"";
}
async function loadConversation(id){
  if(!sessionUser)return;
  resetConversation();conversationId=id||null;
  historySelect.value=conversationId||"";
  const version=contextVersion,userId=sessionUser.id;
  if(!conversationId)return;
  let result;
  try{result=await client.from("ai_messages").select("role,content").eq("conversation_id",conversationId).order("created_at",{ascending:true}).limit(100)}catch{result={error:true}}
  if(version!==contextVersion||sessionUser?.id!==userId)return;
  messages.replaceChildren();
  if(result.error){addMessage("error","Nie udało się pobrać rozmowy.");return}
  (result.data||[]).forEach(row=>addMessage(row.role,row.content));if(!(result.data||[]).length)empty();
}
function newConversation(){resetConversation();if(!sessionUser){renderLogin();return}input.focus()}
async function functionErrorMessage(error,data){
  let payload=data;
  const response=error?.context;
  if(!payload&&typeof response?.json==="function"){
    try{payload=await (response.clone?.()||response).json()}catch{}
  }
  if(payload?.error==="AI_NOT_CONFIGURED")return "Rozmowy AI nie zostały jeszcze uruchomione na stronie. Administrator musi dokończyć konfigurację usługi.";
  if(response?.status===401||payload?.error==="Authentication required")return "Sesja wygasła. Zaloguj się ponownie, aby korzystać z AI.";
  if(payload?.error==="AI_DAILY_LIMIT")return "Dzienny limit wiadomości AI został osiągnięty. Wróć jutro.";
  if(response?.status===429)return "Limit wiadomości został chwilowo osiągnięty. Spróbuj ponownie za chwilę.";
  if(response?.status>=500)return "Usługa AI jest chwilowo niedostępna. Spróbuj ponownie później.";
  if(typeof payload?.message==="string"&&payload.message.trim())return payload.message;
  return "Nie udało się połączyć z AI. Sprawdź połączenie i spróbuj ponownie.";
}
async function refreshPanel(){
  const readVersion=++authReadVersion;
  let user;
  try{
    user=await getUser();
  }catch{
    if(readVersion!==authReadVersion)return;
    resetSession();messages.replaceChildren();
    addMessage("error","Nie udało się sprawdzić logowania. Sprawdź połączenie i otwórz asystenta ponownie.");return;
  }
  if(readVersion!==authReadVersion)return;
  if(user?.id!==sessionUser?.id)resetSession();
  sessionUser=user;
  if(panel.hidden)return;
  if(!user){renderLogin();return}
  const version=contextVersion;
  form.hidden=false;root.querySelector('[data-ai-quick]').hidden=false;renderQuick();
  sensitive.hidden=currentApp!=="psychologia";
  if(currentApp==="psychologia")sensitive.textContent="Ta rozmowa jest ulotna i nie jest zapisywana w historii konta. AI nie zastępuje psychologa ani pomocy kryzysowej.";
  await loadConversations(version);if(version!==contextVersion)return;
  if(!messages.children.length)empty();input.focus();
}
async function send(text){
  text=String(text||"").trim();if(!text||sending||form.hidden)return;
  sending=true;sendButton.disabled=true;input.value="";clearEmpty();addMessage("user",text);
  const pending=addMessage("assistant","Myślę…","pending");
  const version=contextVersion,userId=sessionUser?.id;
  const psychHistory=currentApp==="psychologia"?localHistory.slice(-10):[];
  try{
    const language=(window.PortalPreferences?.getLanguage?.()||document.documentElement.lang||"pl")==="en"?"en":"pl";
    const {data,error}=await client.functions.invoke("platform-ai",{body:{appId:currentApp,message:text,conversationId,history:psychHistory,persist:currentApp!=="psychologia",language,context:collectContext()}});
    if(version!==contextVersion||sessionUser?.id!==userId)return;
    pending.remove();
    if(error){
      const explanation=await functionErrorMessage(error,data);
      if(version!==contextVersion||sessionUser?.id!==userId)return;
      addMessage("error",explanation);if(!input.value.trim())input.value=text;return;
    }
    const answer=String(data?.message||"Brak odpowiedzi.");addMessage("assistant",answer);
    if(currentApp==="psychologia")localHistory.push({role:"user",content:text},{role:"assistant",content:answer});
    if(data?.conversationId)conversationId=data.conversationId;
    if(data?.warning==="AI_HISTORY_NOT_SAVED")addMessage("error","Odpowiedź została przygotowana, ale nie udało się zapisać jej w historii. Zachowaj potrzebny tekst i sprawdź połączenie.");
    (data?.actions||[]).forEach(executeAction);
    await loadConversations(version);if(version===contextVersion&&conversationId)historySelect.value=conversationId;
  }catch{
    if(version!==contextVersion||sessionUser?.id!==userId)return;
    pending.remove();addMessage("error","Nie udało się połączyć z AI. Sprawdź połączenie i spróbuj ponownie.");
    if(!input.value.trim())input.value=text;
  }finally{if(version===contextVersion){sending=false;sendButton.disabled=false;if(!form.hidden)input.focus()}}
}
launch.addEventListener("click",()=>{panel.hidden=false;refreshPanel()});
root.querySelector("[data-ai-close]").addEventListener("click",()=>panel.hidden=true);
root.querySelector("[data-ai-new]").addEventListener("click",newConversation);
root.querySelector("[data-ai-refresh]").addEventListener("click",()=>loadConversations());
historySelect.addEventListener("change",()=>loadConversation(historySelect.value));
form.addEventListener("submit",e=>{e.preventDefault();send(input.value)});
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
window.addEventListener("portal-auth-change",event=>{
  if(!event.detail?.id||event.detail.id!==sessionUser?.id)resetSession();
  refreshPanel();
});
client.auth.onAuthStateChange?.((_event,session)=>{
  if((session?.user?.id||null)!==(sessionUser?.id||null))resetSession();
  // Supabase holds its auth lock during callbacks; read the session afterwards.
  setTimeout(()=>refreshPanel(),0);
});empty();renderQuick();
})();
