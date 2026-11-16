// WIEDORA-CHANGE: WD-20261108-WIE-205-WPL03-INTEGRATION-01 | TASK: WIE-205 | AUTHOR: Codex / GPT-6 (pełna wersja nieustalona)
(() => {
  "use strict";
  const client=window.AppSupabase;
  if(!client||window.__PORTAL_ERROR_MONITOR__)return;
  window.__PORTAL_ERROR_MONITOR__=true;

  const path=location.pathname;
  // WIEDORA-CHANGE: WD-20261106-WIE-160-WPL022-GIELDA-ROUTE-06 | TASK: WIE-160 | AUTHOR: ChatGPT / GPT-6
  // Gielda is an active legacy host route; keep the KWN beta route excluded.
  const match=path.match(/^\/apps\/(prawo|ccna|fitplan|oficerska|psychologia|podroze|notatki|konwerter|gielda)(?:\/|$)/);
  const appId=match?match[1]:(path.startsWith("/konto/")?"account":"portal");
  // WIEDORA-CHANGE: WD-20261031-WIE-157-ERROR-PATH-ROOT-01 | TASK: WIE-157 | AUTHOR: ChatGPT / GPT-6
  // Store the application root, never private subpage identifiers.
  const telemetryPath=match?"/apps/"+match[1]+"/":(appId==="account"?"/konto/":"/");
  const seen=new Map();
  let sentThisMinute=0;
  let windowStart=Date.now();
  // WIEDORA-CHANGE: WD-20261112-WIE-160-WPL019-REPORT-COOLDOWN-01 | TASK: WIE-160 / WPL-019,022 | AUTHOR: Codex / GPT-6 (wersja nieustalona)
  const REPORT_WINDOW_MS=60000;
  const REPORT_COOLDOWN_MS=30000;
  let upstreamCooldownUntil=0;

  // WIEDORA-CHANGE: WD-20261030-WIE-157-REDACTION | TASK: WIE-157 | AUTHOR: Codex / GPT-6
  function redactSerializedCredentials(value){
    const keys=/\b(?:access_token|refresh_token|captcha_token|apikey|api_key|authorization|password|token)\b\\+"\s*:\s*(\\+")/gi;
    let result="",start=0,entry;
    while((entry=keys.exec(value))){
      const quote=entry[1],slashes=quote.length-1;
      result+=value.slice(start,entry.index)+entry[0]+"[redacted]";
      const endings=/(\\+)"/g;endings.lastIndex=keys.lastIndex;
      let ending;
      // At this serialization depth, escaped content quotes have an odd extra escape group.
      while((ending=endings.exec(value))){
        if(ending[1].length>=slashes&&(ending[1].length-slashes)%(2*(slashes+1))===0)break;
      }
      if(!ending)return result;
      result+=quote;start=endings.lastIndex;keys.lastIndex=start;
    }
    return result+value.slice(start);
  }

  function clean(value,max){
    // WIEDORA-CHANGE: WD-20261030-WIE-157-REDACTION | TASK: WIE-157 | AUTHOR: Codex / GPT-6
    return redactSerializedCredentials(String(value??""))
      // WIEDORA-CHANGE: WD-20261111-WIE-157-WPL022-BETA-JWT-SANITIZE-06 | TASK: WIE-157 / WPL-022 | AUTHOR: ChatGPT / GPT-6
      // Compact JWTs may appear in thrown errors without a Bearer prefix.
      // Require a JSON-object-like base64url header; accept valid shorter claim payloads.
      // WIEDORA-CHANGE: WD-20261111-WIE-157-WPL022-JWT-PAYLOAD-07 | TASK: WIE-157 / WPL-022 | AUTHOR: ChatGPT / GPT-6
      // JWT claim sets such as {} encode to e30; requiring an eyJ payload leaks valid tokens.
      .replace(/\beyJ[a-z0-9_-]{8,}\.[a-z0-9_-]{2,}\.[a-z0-9_-]{8,}(?![a-z0-9_-])/gi,"[redacted]")
      .replace(/\b(Bearer|Basic)\s+[a-z0-9._~+\/=-]+/gi,"$1 [redacted]")
      .replace(/(https?:\/\/)[^\s/@]*@/gi,"$1[redacted]@")
      .replace(/(\b(?:access_token|refresh_token|captcha_token|apikey|api_key|authorization|password|token)\b["']?\s*[:=]\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:Basic|Bearer)\s+[^\s,;)}\]]+|[^\s&,;)}\]]+)/gi,"$1[redacted]")
      .replace(/([?&](?:code|token|password|captcha_token)=)[^&\s)]+/gi,"$1[redacted]")
      .replace(/(access_token|refresh_token|apikey|authorization)=?[^\s&]+/gi,"$1=[redacted]")
      .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,"[redacted]")
      // WIEDORA-CHANGE: WD-20261109-WIE-157-WPL022-URL-QUERY-REDACTION-01 | TASK: WIE-157 / WPL-022 | AUTHOR: ChatGPT / GPT-6
      // Any query key or fragment may hold private data, not just 'token' or 'code'.
      // Preserve script paths for diagnosis, but never persist URL query/fragment content.
      .replace(/(https?:\/\/[^\s"'<>?#\\]+)[?#][^\s"'<>]*/gi,"$1?[redacted]")
      // WIEDORA-CHANGE: WD-20261110-WIE-157-WPL022-PRIVATE-PATH-REDACTION-02 | TASK: WIE-157 / WPL-022 | AUTHOR: ChatGPT / GPT-6
      // Canonical telemetryPath cannot stop a message/stack embedding private
      // host deep links. Keep only the public root of known account/app routes.
      // Do not touch the interior of KWN, CCNAlab or legacy applications.
      .replace(/(\/(?:konto|apps\/(?:prawo|ccna|fitplan|oficerska|psychologia|podroze|notatki|notatki-web|ccnalab-beta|konwerter|gielda|wiedora-neutral-pilot)))(?![a-z0-9_-])(?:\/[^\s"'<>?#\\]*)?(?:[?#][^\s"'<>]*)?/gi,"$1/[redacted]")
      // WIEDORA-CHANGE: WD-20261110-WIE-157-WPL022-RELATIVE-QUERY-03 | TASK: WIE-157 / WPL-022 | AUTHOR: ChatGPT / GPT-6
      // Errors may quote a same-origin relative URL, or only "?key=value".
      // Mask all untrusted query pairs and path fragments, not just absolute URLs.
      .replace(/((?:^|[\s"'(=])\/[^\s"'<>?#\\]+)[?#][^\s"'<>\\)\],;]*/gi,"$1?[redacted]")
      .replace(/([?&])[a-z0-9._~%-]{1,128}=[^&\s"'<>\\#]*/gi,"$1[redacted]")
      .slice(0,max);
  }

  // WIEDORA-CHANGE: WD-20261105-WIE-205-POST130-PILOT-04 | TASK: WIE-205 | AUTHOR: Codex / GPT-6 (wersja nieustalona)
  // Existing insert pipeline, with an explicit acknowledgement for host adapters.
  const rejected=status=>Object.freeze({ok:false,status});
  function canSend(now){
    if(now<windowStart){
      windowStart=now;
      sentThisMinute=0;
      seen.clear();
      upstreamCooldownUntil=0;
    }else if(now-windowStart>=REPORT_WINDOW_MS){
      windowStart=now;
      sentThisMinute=0;
    }
    return now>=upstreamCooldownUntil && sentThisMinute<8;
  }

  async function report(message,stack="",source="window",options={}){
    // WIEDORA-CHANGE: WD-20261106-WIE-160-WPL022-PRINCIPAL-RETRY-01 | TASK: WIE-160 / WPL-019,022,032 | AUTHOR: ChatGPT / GPT-6
    // Deduplicate only after Auth, partitioned by the authenticated principal.
    try{
      const signal=options?.signal;
      if(signal?.aborted)return rejected(503);
      if(!canSend(Date.now()))return rejected(429);
      // Untrusted messages/stacks may throw in String(value); keep report() fail-closed.
      const fingerprint=clean(message,500)+"|"+clean(stack,500);
      const {data}=await client.auth.getSession();
      if(signal?.aborted)return rejected(503);
      const user=data?.session?.user;
      if(!user||typeof user.id!=="string"||!user.id)return rejected(401);
      const key=JSON.stringify([user.id,fingerprint]);
      // Authentication is async: several reports may have passed the initial
      // limit/duplicate checks simultaneously. Reserve both synchronously
      // after the await and before issuing any insert.
      const readyAt=Date.now();
      if(!canSend(readyAt))return rejected(429);
      const priorAfterAuth=seen.get(key);
      if(priorAfterAuth!==undefined&&readyAt-priorAfterAuth<REPORT_COOLDOWN_MS)return rejected(429);
      seen.set(key,readyAt);
      sentThisMinute++;
      // Retain only recent fingerprints; long sessions must not grow forever.
      if(seen.size>256){
        for(const [fingerprint,lastTime] of seen){
          if(readyAt-lastTime>=REPORT_COOLDOWN_MS)seen.delete(fingerprint);
        }
      }
      // A failed insert can be retried, but the attempt still consumes the rate budget.
      let acknowledged=false,rateLimited=false;
      try{
        let request=client.from("platform_client_errors").insert({
          user_id:user.id,
          app_id:appId,
          path:telemetryPath,
          source:clean(source,80)||"window",
          message:clean(message,1200)||"Nieznany błąd",
          stack:stack?clean(stack,5000):null
        });
        if(typeof request?.select==='function')request=request.select('id').single();
        if(signal&&typeof request?.abortSignal==='function')request=request.abortSignal(signal);
        const response=await request;
        // Supabase's client response exposes status, with no Retry-After header.
        // Apply the existing duplicate-report interval to all new sends in this tab.
        if(response?.status===429){
          rateLimited=true;
          upstreamCooldownUntil=Date.now()+REPORT_COOLDOWN_MS;
          return rejected(429);
        }
        if(response?.error)return rejected([401,403].includes(response.status)?response.status:503);
        const id=response?.data?.id;
        if(!Number.isInteger(response?.status)||response.status<200||response.status>=300||typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))return rejected(503);
        // WIEDORA-CHANGE: WD-20261106-WIE-160-WPL022-INFLIGHT-PRINCIPAL-07 | TASK: WIE-160 / WPL-015,019,022 | AUTHOR: ChatGPT / GPT-6
        // The backend may have accepted A's report; never show its receipt after switching to B or guest.
        // WIEDORA-CHANGE: WD-20261106-WIE-160-WPL022-PERSISTED-DEDUPE-09 | TASK: WIE-160 / WPL-015,019,022 | AUTHOR: ChatGPT / GPT-6
        // Backend persistence and permission to reveal the receipt are separate.
        // Retain this fingerprint even if logout/account switch hides the stored ID.
        acknowledged=true;
        const latest=await client.auth.getSession();
        if(signal?.aborted)return rejected(503);
        if(latest?.data?.session?.user?.id!==user.id)return rejected(409);
        return Object.freeze({ok:true,status:response.status,id});
      }finally{
        if(!acknowledged && !rateLimited && seen.get(key)===readyAt)seen.delete(key);
      }
    }catch{return rejected(503);}
  }

  window.addEventListener("error",event=>{
    // WIEDORA-CHANGE: WD-20261106-WIE-160-WPL032-UNTRUSTED-CLOCK-08 | TASK: WIE-160 | AUTHOR: ChatGPT / GPT-6
    try {
      const message=event?.message||event?.error?.message||"Błąd JavaScript";
    const script=String(event?.filename||"").split(/[?#]/)[0];
    const stack=event?.error?.stack||(script?script+":"+(Number(event?.lineno)||0)+":"+(Number(event?.colno)||0):"");
    // Zewnętrzne rozszerzenia portfeli wstrzykują skrypt na początku HTML.
    // Nie są częścią Constant App i nie powinny zapełniać monitoringu.
    if(/window\.ethereum\.selectedAddress/.test(message))return;
    // Bez tekstu, stosu i adresu źródła to zwykle błąd skryptu cross-origin.
    // Nie mamy danych pozwalających przypisać go do kodu aplikacji.
    if(message==="Script error."&&!stack&&!event?.filename)return;
      void report(message,stack,"window.error").catch(()=>{});
    } catch { /* Ignore unsafe event properties to prevent recursive reporting. */ }
  });

  window.addEventListener("unhandledrejection",event=>{
    try {
      const reason=event?.reason;
      void report(reason?.message||String(reason||"Nieobsłużony błąd Promise"),reason?.stack||"","unhandledrejection").catch(()=>{});
    } catch { /* Avoid raising a new rejection in the rejection handler. */ }
  });

  window.addEventListener("portal-report-error",event=>{
    try {
      const detail=event.detail||{};
      void report(detail.message||"Błąd aplikacji",detail.stack||"",detail.source||"application").catch(()=>{});
    } catch { /* An unsafe application event cannot break the portal. */ }
  });

  window.PortalErrorMonitor=Object.freeze({report});
  // Jeden loader dla portalu i wszystkich sześciu aplikacji.
  if(typeof document?.createElement==="function" && document.head?.appendChild){
    const bugScript=document.createElement("script");
    bugScript.src="/js/bug-reporter.js?v=20261025-shot-3";
    bugScript.dataset.portalBugLoader="";
    document.head.appendChild(bugScript);
  }
})();
