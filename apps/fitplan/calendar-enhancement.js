(function(){
"use strict";
var MONTHS=["styczeń","luty","marzec","kwiecień","maj","czerwiec","lipiec","sierpień","wrzesień","październik","listopad","grudzień"],WEEK=["Pon","Wt","Śr","Czw","Pt","Sob","Niedz"];
var EN_MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"],EN_WEEK=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
function en(){return document.documentElement.lang==="en"}function text(pl,eng){return en()?eng:pl}
function pad(n){return String(n).padStart(2,"0")}function key(y,m,d){return String(y).padStart(4,"0")+"-"+pad(m+1)+"-"+pad(d)}function daysInMonth(y,m){return new Date(Date.UTC(y,m+1,0)).getUTCDate()}
function save(e,d,v){return e[d]={note:String(v&&v.note||"").trim(),time:String(v&&v.time||"")}}function move(e,a,b){if(!e[a]||a===b||e[b])return false;e[b]=e[a];delete e[a];return true}function remove(e,d){if(!e[d])return false;delete e[d];return true}
function seasonSummary(t){
 const y=t.getFullYear(),m=t.getMonth(),now=Date.UTC(y,m,t.getDate()),metrics=[];
 const add=(label,Y,M,D)=>metrics.push({label,days:Math.max(0,Math.round((Date.UTC(Y,M,D)-now)/86400000))});
 if(m>=2&&m<=4){add("Do końca wiosny",y,4,31);add("Do lata",y,5,1);add("Do końca roku",y,11,31);}
 else if(m>=5&&m<=7){add("Do końca lata",y,7,31);add("Do końca roku",y,11,31);add("Do następnego lata",y+1,5,1);}
 else if(m>=8&&m<=10){add("Do końca jesieni",y,10,30);add("Do końca roku",y,11,31);add("Do lata",y+1,5,1);}
 else if(m===11){add("Do końca zimy",y+1,1,daysInMonth(y+1,1));add("Do końca roku",y,11,31);add("Do lata",y+1,5,1);}
 else{add("Do końca zimy",y,1,daysInMonth(y,1));add("Do lata",y,5,1);add("Do końca roku",y,11,31);}
 return {dayOfYear:Math.floor((now-Date.UTC(y,0,1))/86400000)+1,metrics:metrics.sort((a,b)=>a.days-b.days)};
}
window.FitPlanCalendarModel={daysInMonth:daysInMonth,save:save,move:move,remove:remove,key:key,seasonSummary:seasonSummary};if(!window.document||window.top===window)return;
var shared=window.FitPlanState,movingEntry=null;if(!shared)throw new Error("FitPlan state must load before calendar");
function esc(s){return String(s||"").replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function addStyles(){
 if(document.getElementById("fitplan-calendar-style"))return;
 var s=document.createElement("style");s.id="fitplan-calendar-style";
 s.textContent="#fitplanCalendarV2{font-family:inherit;color:var(--text);padding:12px 0;max-width:1180px;min-width:0;margin:0 auto}#fitplanCalendarV2 *{box-sizing:border-box}"+
 ".fpc-top{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap;margin-bottom:16px}.fpc-top h2{margin:0;font-size:clamp(22px,3vw,34px)}.fpc-nav,.fpc-actions{display:flex;gap:8px;flex-wrap:wrap}"+
 ".fpc-btn{border:1px solid var(--line-2);background:var(--panel);color:var(--text);border-radius:10px;padding:10px 14px;font:inherit;cursor:pointer;min-height:44px}.fpc-btn.primary{background:#2563eb;color:#fff;border-color:#2563eb}"+
 ".fpc-season-metrics{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 17px;font-size:12px}.fpc-season-metrics :is(strong,span){padding:8px 10px;border:1px solid var(--portal-line,var(--line-2));border-radius:9px;background:var(--portal-soft,var(--panel-soft));color:var(--portal-ink,var(--text))}"+
 ".fpc-day.past:not(.selected){opacity:1!important;border:2px dashed var(--portal-line,#93a6ba)!important;background:var(--portal-soft,#304656)!important;color:var(--portal-ink,#fff)!important}.fpc-day.past .num{font-weight:900}.fpc-day.past.selected{outline:3px solid var(--portal-link,var(--primary))!important;outline-offset:1px}"+
 "html[data-portal-theme=blue] .fpc-day.past{background:#234761!important;color:#fff!important;border-color:#8eaec8!important}html[data-portal-theme=gray] .fpc-day.past{background:#c3cdd8!important;color:#22354b!important;border-color:#6c8398!important}"+
 ".fpc-week,.fpc-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.fpc-week div{text-align:center;font-weight:700;padding:8px 2px;color:var(--muted)}"+
 ".fpc-day{min-height:105px;border:1px solid var(--line-2);border-radius:12px;background:var(--card);color:var(--text);text-align:left;padding:10px;cursor:pointer;overflow:hidden}.fpc-day.past{background:var(--panel-soft);color:var(--muted)}.fpc-day.today{background:#fef3c7;color:#713f12;box-shadow:inset 0 0 0 2px #f59e0b}.fpc-day.has:not(.past):not(.today){box-shadow:inset 0 0 0 1px var(--primary)}.fpc-day.selected{outline:2px solid var(--primary);outline-offset:1px}"+
 ".fpc-day .num{font-weight:800}.fpc-day .entry{display:block;margin-top:8px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fpc-empty{visibility:hidden}.fpc-move{margin:12px 0;padding:12px 14px;border-radius:10px;background:#fef3c7;color:#78350f;font-weight:700}"+
 ".fpc-editor{margin-top:18px;border:1px solid var(--line-2);border-radius:14px;padding:16px;background:var(--panel);color:var(--text);scroll-margin:20px}.fpc-editor h3{margin:0 0 12px}.fpc-fields{display:grid;grid-template-columns:minmax(0,180px) minmax(0,1fr);gap:12px}.fpc-field{min-width:0;max-width:100%;overflow-wrap:anywhere}.fpc-field label{display:block;font-weight:700;margin-bottom:6px}"+
 ".fpc-field input,.fpc-field textarea{min-width:0;max-width:100%;width:100%;border:1px solid var(--line-2);border-radius:9px;padding:10px 12px;font:inherit;background:var(--card);color:var(--text)}.fpc-field textarea{min-height:92px;resize:vertical}.fpc-actions{margin-top:14px}"+
 ".fpc-btn:focus-visible,.fpc-day:focus-visible,#fitplanCalendarV2 input:focus-visible,#fitplanCalendarV2 textarea:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}"+
 "@media(max-width:950px){.fpc-fields{grid-template-columns:minmax(0,1fr)}.fpc-field input,.fpc-field textarea{max-width:100%}}" +
  "@media(max-width:650px){#fitplanCalendarV2{padding:8px 0}.fpc-week,.fpc-grid{gap:3px}.fpc-day{min-height:68px;padding:6px;border-radius:8px}.fpc-day .entry{font-size:10px;margin-top:4px}.fpc-fields{grid-template-columns:1fr}.fpc-week div{font-size:11px;padding:5px 0}}";
 document.head.appendChild(s);
}
function fmt(k){var p=k.split("-");return p[2]+"."+p[1]+"."+p[0]}function root(){return document.getElementById("fitplanCalendarV2")}
function dirty(){var r=root(),note=r?.querySelector("#fpcNote"),time=r?.querySelector("#fpcTime");return !!note&&(note.value!==note.defaultValue||time.value!==time.defaultValue)}
function canLeave(){return !dirty()||window.confirm(text("Odrzucić niezapisane zmiany notatki?","Discard unsaved changes to the note?"))}
function render(target){
 var r=target||root();if(!r)return;
 var state=shared.snapshot().calendar,first=(new Date(Date.UTC(state.year,state.month,1)).getUTCDay()+6)%7,count=daysInMonth(state.year,state.month),t=new Date(),tk=key(t.getFullYear(),t.getMonth(),t.getDate()),cells="",i,d,k,e;
 for(i=0;i<first;i++)cells+='<div class="fpc-day fpc-empty" aria-hidden="true"></div>';
 for(d=1;d<=count;d++){
  k=key(state.year,state.month,d);e=state.entries[k];
  var label=fmt(k)+(k===tk?text(", dzisiaj",", today"):"")+(e?", "+String(e.time||"")+" "+String(e.note||""):"");
  cells+='<button type="button" class="fpc-day'+(e?" has":"")+(k<tk?" past":"")+(k===tk?" today":"")+(k===state.selected?" selected":"")+'" data-date="'+k+'" aria-label="'+esc(label)+'" aria-pressed="'+(k===state.selected)+'"'+(k===tk?' aria-current="date"':"")+'><span class="num">'+d+'</span>'+(e?'<span class="entry" data-no-translate>'+esc(e.time)+(e.time&&e.note?" · ":"")+esc(e.note)+'</span>':"")+'</button>';
 }
 var summary=seasonSummary(t);
 var seasonHtml='<div class="fpc-season-metrics"><strong>'+text("Dzisiaj: ","Today: ")+summary.dayOfYear+text(". dzień roku",". day of year")+'</strong>'+summary.metrics.map(function(item){return '<span>'+esc(item.label)+': <b>'+item.days+'</b> '+text("dni","days")+'</span>'}).join("")+'</div>';
 var editor="";
 if(state.selected){
  e=state.entries[state.selected]||{};
  editor='<section class="fpc-editor" aria-label="'+text("Edytor wpisu","Entry editor")+'" data-entry="'+esc(JSON.stringify(state.entries[state.selected]??null))+'"><h3>'+fmt(state.selected)+'</h3><div class="fpc-fields"><div class="fpc-field"><label for="fpcTime">'+text("Godzina","Time")+'</label><input id="fpcTime" type="time" value="'+esc(e.time||"")+'"></div><div class="fpc-field"><label for="fpcNote">'+text("Notatka","Note")+'</label><textarea id="fpcNote" data-no-translate placeholder="'+text("Np. trening nóg, cardio, regeneracja…","E.g. leg workout, cardio, recovery…")+'">'+esc(e.note||"")+'</textarea></div></div><div class="fpc-actions"><button type="button" class="fpc-btn primary" data-act="save">'+text("Zapisz","Save")+'</button><button type="button" class="fpc-btn" data-act="discard">'+text("Odrzuć","Discard")+'</button>'+(state.entries[state.selected]?'<button type="button" class="fpc-btn" data-act="move">'+text("Przesuń","Move")+'</button><button type="button" class="fpc-btn" data-act="delete">'+text("Usuń notatkę","Delete note")+'</button>':"")+'</div></section>';
 }
 r.innerHTML='<div class="fpc-top"><h2>'+(en()?EN_MONTHS:MONTHS)[state.month]+" "+state.year+'</h2><div class="fpc-nav"><button type="button" class="fpc-btn" data-act="prev" aria-label="'+text("Poprzedni miesiąc","Previous month")+'">‹</button><button type="button" class="fpc-btn" data-act="today">'+text("Dzisiaj","Today")+'</button><button type="button" class="fpc-btn" data-act="next" aria-label="'+text("Następny miesiąc","Next month")+'">›</button></div></div>'+seasonHtml+(state.moving?'<div class="fpc-move" role="status">'+text("Wybierz pusty dzień dla wpisu z ","Choose an empty day for the entry from ")+fmt(state.moving)+'. <button type="button" class="fpc-btn" data-act="cancelMove">'+text("Anuluj","Cancel")+'</button></div>':"")+'<div class="fpc-week">'+(en()?EN_WEEK:WEEK).map(function(x){return"<div>"+x+"</div>"}).join("")+'</div><div class="fpc-grid">'+cells+"</div>"+editor;
}
function show(host){
 addStyles();host=host||document.getElementById("fitplanCalendarMount")||document.getElementById("tab-note");if(!host?.isConnected)return false;
 var r=root();if(!r){r=document.createElement("div");r.id="fitplanCalendarV2";r.setAttribute("data-no-translate","");r.addEventListener("click",handleClick,true)}
 if(r.parentNode!==host)host.appendChild(r);r.style.display="block";render();return true;
}
function hide(){var r=root();if(r){r.style.display="none";r.replaceChildren()}movingEntry=null;shared.calendar.setView({selected:null,moving:null})}
function refresh(event){
 if(event.detail?.slice!=="calendar"&&event.detail?.slice!=="all")return;
 var r=root();if(!r||r.style.display==="none")return;
 if(dirty()){var next=document.createElement("div");render(next);r.querySelector(".fpc-grid").replaceWith(next.querySelector(".fpc-grid"))}else render();
}
function languageChanged(){
 var r=root();if(!r||r.style.display==="none")return;
 var next=document.createElement("div");render(next);
 for(var selector of [".fpc-top h2",".fpc-week"]){r.querySelector(selector)?.replaceWith(next.querySelector(selector))}
 for(var button of r.querySelectorAll("[data-act]")){
  var replacement=next.querySelector('[data-act="'+button.dataset.act+'"]');if(!replacement)continue;
  button.textContent=replacement.textContent;var label=replacement.getAttribute("aria-label");if(label)button.setAttribute("aria-label",label);
 }
 for(var label of r.querySelectorAll(".fpc-field label")){label.textContent=next.querySelector('label[for="'+label.htmlFor+'"]').textContent}
 var note=r.querySelector("#fpcNote");if(note)note.placeholder=next.querySelector("#fpcNote").placeholder;
 var editor=r.querySelector(".fpc-editor");if(editor)editor.setAttribute("aria-label",next.querySelector(".fpc-editor").getAttribute("aria-label"));
 var banner=r.querySelector(".fpc-move");if(banner)banner.replaceWith(next.querySelector(".fpc-move"));
 for(var cell of r.querySelectorAll("[data-date]")){cell.setAttribute("aria-label",next.querySelector('[data-date="'+cell.dataset.date+'"]').getAttribute("aria-label"))}
}
(window.FitPlanEvents?.on||((target,name,handler)=>target.addEventListener("fitplan:state:change",handler)))(window,"stateChange",refresh);
window.addEventListener("fitplan:preferences",languageChanged);
function focusEditor(){var editor=root()?.querySelector(".fpc-editor");editor?.scrollIntoView?.({block:"nearest",behavior:"auto"});editor?.querySelector("#fpcNote")?.focus({preventScroll:true})}
function handleClick(ev){
 var r=root();if(!r||r.style.display==="none"||!r.contains(ev.target))return;
 var state=shared.snapshot().calendar,day=ev.target.closest("[data-date]");
 try{
  if(day){
   var date=day.dataset.date;
   if(state.moving){
    if(!shared.calendar.move(state.moving,date,movingEntry)){window.showToast?.(text("Wybierz inny, pusty dzień.","Choose another empty day."));return}
    movingEntry=null;shared.calendar.setView({moving:null,selected:date});window.showToast?.(text("Wpis został przesunięty.","Entry moved."));
   }else{if(date===state.selected&&dirty()){focusEditor();return}if(!canLeave())return;shared.calendar.setView({selected:date})}
   render();focusEditor();return;
  }
  var b=ev.target.closest("[data-act]");if(!b)return;var a=b.dataset.act;
  if(["prev","next","today","move"].includes(a)&&!canLeave())return;
  if(a==="prev"||a==="next"){
   var month=state.month+(a==="prev"?-1:1),year=state.year;
   if(month<0){month=11;year--}if(month>11){month=0;year++}
   if(year<1||year>9999)return;
   shared.calendar.setView({month:month,year:year,selected:null});
  }else if(a==="today"){
   var n=new Date();shared.calendar.setView({year:n.getFullYear(),month:n.getMonth(),selected:key(n.getFullYear(),n.getMonth(),n.getDate())});
  }else if(a==="save"&&state.selected){
   var time=r.querySelector("#fpcTime").value,note=r.querySelector("#fpcNote").value;
   if(!time&&!note.trim()){window.showToast?.(text("Wpisz notatkę lub wybierz godzinę.","Enter a note or choose a time."));return}
   shared.calendar.save(state.selected,{time:time,note:note},JSON.parse(r.querySelector(".fpc-editor").dataset.entry));
   window.showToast?.(text("Wpis został zapisany.","Entry saved."));
  }else if(a==="discard"){movingEntry=null;shared.calendar.setView({selected:null,moving:null})}
  else if(a==="move"&&state.selected&&state.entries[state.selected]){movingEntry=JSON.parse(r.querySelector(".fpc-editor").dataset.entry);shared.calendar.setView({moving:state.selected,selected:null})}
  else if(a==="cancelMove"){movingEntry=null;shared.calendar.setView({moving:null})}
  else if(a==="delete"&&state.selected){
   if(!window.confirm(text("Usunąć tę notatkę z kalendarza?","Delete this calendar note?")))return;
   shared.calendar.remove(state.selected,JSON.parse(r.querySelector(".fpc-editor").dataset.entry));shared.calendar.setView({selected:null});window.showToast?.(text("Notatka została usunięta.","Note deleted."));
  }
  render();if(a==="today")focusEditor();
 }catch(error){window.showToast?.(error.message==="Calendar entry changed during editing"?text("Wpis zmienił się w innej karcie. Odrzuć szkic i otwórz go ponownie.","This entry changed in another tab. Discard the draft and reopen it."):text("Nie udało się zapisać danych. Zapisane dane nie zostały zmienione.","Could not save the data. Saved data has not changed."))}
}
window.FitPlanCalendarView=Object.freeze({show:show,hide:hide,canLeave:canLeave});
window.dispatchEvent(new CustomEvent("fitplan:calendar:ready"));
})();
