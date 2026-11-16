// WIEDORA-CHANGE: WD-20261101-WIE-115-CALISTHENICS-01 | TASK: WIE-115/WIE-110 | AUTHOR: ChatGPT / GPT-6
// Skill-tree view mounted inside the existing FitPlan training-plan module; all DOM output uses textContent.
(()=>{
"use strict";
const engine=window.FitPlanCalisthenicsCoach;
if(!engine)return;
const make=(doc,tag,text,cls)=>{
 const node=doc.createElement(tag);
 if(text!==undefined&&text!==null)node.textContent=String(text);
 if(cls)node.className=cls;
 return node;
};
const add=(parent,...nodes)=>{parent.append(...nodes);return parent;};
const button=(doc,text,cls="action-button")=>{const b=make(doc,"button",text,cls);b.type="button";return b;};
function mount({doc,w,registry,extensions}){
 const all=engine.paths(extensions);
 const dateFmt=s=>{try{return new Date(s).toLocaleDateString("pl-PL",{day:"2-digit",month:"short",year:"numeric"});}catch{return s;}};
 function catalog(node){
   node.replaceChildren();
   const heading=make(doc,"h4","Kalistenika · wybierz umiejętność");
   const intro=make(doc,"p","25 ścieżek podzielonych według ruchu. Od pierwszego powtórzenia do zaawansowanych figur. Plan A/B obejmuje trening całego ciała, ale tempo postępów zależy od techniki i regeneracji.","muted");
   const search=make(doc,"input"),select=make(doc,"select"),controls=make(doc,"div",null,"fpk-cali-controls");
   search.type="search";search.placeholder="Szukaj figury, np. muscle-up";search.setAttribute("aria-label","Szukaj ścieżki kalistenicznej");
   const o=make(doc,"option","Wszystkie rodzaje");o.value="all";select.append(o);
   for(const cat of engine.CATEGORIES){const opt=make(doc,"option",cat.title);opt.value=cat.id;select.append(opt);}
   select.setAttribute("aria-label","Grupa figur");
   add(controls,search,select);
   const count=make(doc,"p",null,"muted"),grid=make(doc,"div",null,"fpk-cali-grid");
   const paint=()=>{
     grid.replaceChildren();
     const q=search.value.trim().toLocaleLowerCase("pl-PL");
     const rows=all.filter(t=>(select.value==="all"||select.value===t.category)&&
       (t.title+" "+t.stages.map(s=>s.title+" "+s.moves.join(" ")).join(" ")).toLocaleLowerCase("pl-PL").includes(q));
     count.textContent=rows.length+" ścieżek · wybierz figurę, by zobaczyć plan i warunki zaliczenia.";
     for(const path of rows){
       const card=button(doc,null,"action-button fpk-cali-card");
       card.dataset.fpkSkill=path.id;
       const saved=safeRead(path.id);
       const valid=engine.validatePath(path,registry);
       const group=engine.CATEGORIES.find(c=>c.id===path.category)?.title||"Kalistenika";
       const eyebrow=make(doc,"span",group+(path.coach?" · trener":"") ,"fpk-cali-eyebrow");
       const title=make(doc,"strong",path.title);
       const desc=make(doc,"small",path.stages.length+" etapów · "+(saved?"Twój etap "+(saved.stageIndex+1):"Rozpocznij od poziomu 1"));
       if(!valid.valid){desc.textContent="Wymaga uzupełnienia rejestru: "+valid.missing.join(", ");card.disabled=true;}
       add(card,eyebrow,title,desc);
       grid.append(card);
     }
     if(!rows.length)grid.append(make(doc,"p","Brak wyników. Wybierz inną grupę albo wyczyść wyszukiwanie.","muted"));
   };
   search.addEventListener("input",paint);select.addEventListener("change",paint);
   add(node,heading,intro,controls,count,grid);
   paint();
 }
 function safeRead(id){try{return engine.read(w.localStorage,id);}catch{return null;}}
 function showTrack(node,path,onBack){
   const state=readOrError();
   function readOrError(){try{return {value:engine.read(w.localStorage,path.id),error:null};}catch(e){return {value:null,error:e.message};}}
   node.replaceChildren();
   const back=button(doc,"← Wszystkie figury");
   back.addEventListener("click",onBack);
   const group=engine.CATEGORIES.find(c=>c.id===path.category)?.title||"Kalistenika";
   const hero=make(doc,"header",null,"fpk-cali-hero");
   const kicker=make(doc,"p",group+" · "+path.stages.length+" etapów","fpk-cali-eyebrow");
   const title=make(doc,"h4",path.title);
   const desc=make(doc,"p","Trenuj całe ciało dwa razy w tygodniu, a główną umiejętność ćwicz na początku sesji. Zapis wyników nie oznacza automatycznej oceny jakości ruchu.");
   add(hero,kicker,title,desc);
   const equipment=make(doc,"p","Sprzęt: "+path.equipment.join(" · "),"fpk-cali-equipment");
   const caution=make(doc,"p",path.coach?
     "Uwaga: figura wymaga asekuracji i doświadczonego instruktora. Program nie zastępuje nauki u trenera; nie wykonuj samodzielnie prób wysokiego ryzyka.":
     "Kontroluj pełen bezbolesny zakres, oddech i ustawienie barków. Przy bólu przerwij. Odpoczywaj 48 h między intensywnymi sesjami.","fpk-cali-notice");
   const status=make(doc,"p","","fpk-cali-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
   add(node,back,hero,equipment,caution,status);
   const check=engine.validatePath(path,registry);
   if(!check.valid){status.textContent="Nie można rozpocząć bez ćwiczeń w rejestrze: "+check.missing.join(", ");return;}
   if(state.error){status.textContent="Ochrona zapisu: "+state.error+". Nie nadpisano danych.";return;}
   let record=state.value;
   const active=record?.stageIndex??0;
   const timeline=make(doc,"section",null,"fpk-cali-steps");
   add(timeline,make(doc,"h5","Mapa etapów"));
   path.stages.forEach((stage,i)=>{
     const s=make(doc,"article",null,"fpk-cali-step");
     if(record&&i<active)s.dataset.state="done";
     if(record&&i===active)s.dataset.state="active";
     add(s,make(doc,"strong",(i+1)+". "+stage.title),
       make(doc,"small",stage.moves.join(" → ")));
     const t=engine.stageTarget(i,stage.moves.at(-1));
     add(s,make(doc,"span",i===0?"Fundamenty":i===path.stages.length-1?"Figura docelowa":"Progresja","fpk-cali-pill"),
       make(doc,"small","Próg orientacyjny: "+t.sets+" × "+t.value+(t.kind==="seconds"?" s":" powt.")+" ostatniego ćwiczenia"));
     timeline.append(s);
   });
   node.append(timeline);
   const external=extensions.sources?.[path.sourceId];
   if(external){const link=make(doc,"a","Zobacz materiały o progresji");link.href=external;link.target="_blank";link.rel="noopener noreferrer";node.append(link);}
   if(path.category==="acro"){
     status.textContent="Akrobatyka: etapy pokazano wyłącznie edukacyjnie. Ze względów bezpieczeństwa sesje i testy wykonywane są z trenerem, bez automatycznego zaliczania przez aplikację.";
     return;
   }
   if(!record){
     const setup=make(doc,"section",null,"fpk-cali-panel");
     add(setup,make(doc,"h5","Rozpocznij program"));
     const label=make(doc,"label","Mój aktualny etap (na podstawie opanowanych umiejętności)");
     const level=make(doc,"select");
     path.stages.forEach((st,i)=>{const o=make(doc,"option",(i+1)+". "+st.title);o.value=String(i);level.append(o);});
     label.append(level);
     const ready=make(doc,"label",null,"fpk-cali-check");
     const assessed=make(doc,"input");assessed.type="checkbox";
     add(ready,assessed,make(doc,"span","Potwierdzam, że potrafię bezpiecznie wykonać wszystkie poprzednie etapy (wymagane przy wejściu wyżej)."));
     const gear=make(doc,"label",null,"fpk-cali-check");
     const gearOk=make(doc,"input");gearOk.type="checkbox";
     add(gear,gearOk,make(doc,"span","Mam wymieniony stabilny sprzęt i warunki do treningu."));
     const coachLabel=make(doc,"label",null,"fpk-cali-check");
     const coachOk=make(doc,"input");coachOk.type="checkbox";
     add(coachLabel,coachOk,make(doc,"span","Zaawansowane próby wykonuję pod nadzorem instruktora i z asekuracją."));
     if(path.coach)setup.append(coachLabel);
     const start=button(doc,"Zapisz ścieżkę i pokaż plan","action-button primary");
     start.addEventListener("click",()=>{
       if(!gearOk.checked){status.textContent="Potwierdź dostęp do bezpiecznego sprzętu.";return;}
       if(path.coach&&!coachOk.checked){status.textContent="Ta ścieżka wymaga potwierdzenia obecności trenera.";return;}
       const index=Number(level.value);
       if(index>0&&!assessed.checked){status.textContent="Wyższy etap wymaga samodzielnego testu poprzednich umiejętności.";return;}
       try{engine.begin(w.localStorage,path,index,assessed.checked,w.Date||Date);showTrack(node,path,onBack);}
       catch(error){status.textContent=error.message;}
     });
     add(setup,label,ready,gear,start);
     add(node,setup,make(doc,"p","Program nie obiecuje osiągnięcia figury w określonym czasie. Poziom startowy wybierasz odpowiedzialnie po wykonaniu testu. Wszystkie dane pozostają lokalnie w tej przeglądarce.","muted"));
     return;
   }
   const stats=engine.stats(record);
   const summary=make(doc,"section",null,"fpk-cali-stats");
   for(const [label,value] of [["Aktywny etap",(active+1)+"/"+path.stages.length],["Zapisane sesje",stats.completed],["Kolejne zaliczenia",stats.streak+"/2"],["Następny trening",stats.nextVariant]]){
     add(summary,add(make(doc,"div"),make(doc,"span",label),make(doc,"strong",value)));
   }
   node.append(summary);
   if(stats.ready){
     if(active<path.stages.length-1){
       const advance=button(doc,"Przejdź do etapu "+(active+2),"action-button primary");
       advance.addEventListener("click",()=>{
         if(!w.confirm("Potwierdź poprawną technikę, brak bólu i gotowość do trudniejszej wersji. Jeśli nie jesteś pewien, zostań przy obecnym etapie."))return;
         try{engine.advance(w.localStorage,path);showTrack(node,path,onBack);}catch(e){status.textContent=e.message;}
       });
       node.append(advance);
     }else node.append(make(doc,"p","Osiągnięto próg ostatniego etapu. To wynik wpisanych serii, a nie niezależna certyfikacja wykonania figury.","fpk-cali-status"));
   }
   const section=make(doc,"section",null,"fpk-cali-panel");
   add(section,make(doc,"h5","Plan FBW · 2 sesje w tygodniu"));
   section.append(make(doc,"p","Powtarzaj A i B naprzemiennie, najlepiej z 48 h przerwy. Kolejny poziom odblokują dopiero dwie kolejne zaliczone sesje z dobrą techniką. Oprócz głównej figury uzupełnij trening o ruchy całego ciała.","muted"));
   let nextPlan;
   for(const variant of ["A","B"]){
     let plan;
     try{plan=engine.buildSession(path,active,registry,variant);}
     catch(error){status.textContent=error.message;return;}
     if(variant===stats.nextVariant)nextPlan=plan;
     const details=make(doc,"details",null,"fpk-cali-session");
     if(variant===stats.nextVariant)details.open=true;
     details.append(make(doc,"summary","Sesja "+variant+" · "+(variant===stats.nextVariant?"następna":"uzupełniająca")));
     const list=make(doc,"ol");
     for(const move of plan.exercises){
       const li=make(doc,"li",null,"fpk-cali-exercise");
       add(li,make(doc,"span",move.name+" · "+move.sets+" serie · przerwa "+move.restSeconds+" s"),
         make(doc,"small",move.role));
       const detail=button(doc,"Technika");
       detail.addEventListener("click",()=>{try{w.FitPlanExerciseDetails?.open(move.id);}catch{}});
       li.append(detail);list.append(li);
     }
     details.append(list);section.append(details);
   }
   // Reuse the existing Start module and independent timer, never create a duplicate timer.
   const launch=button(doc,"Uruchom sesję "+stats.nextVariant+" w Start","action-button");
   launch.addEventListener("click",()=>{
     const target=w.FitPlanStartBridge;
     if(!target?.launch||target.launch(nextPlan.exercises.map(item=>item.id),"Kalistenika · "+path.title+" · "+stats.nextVariant)===false){
       status.textContent="Nie udało się otworzyć treningu w Start. Plan i historia pozostały zapisane.";
     }
   });
   section.append(launch);
   const preview=make(doc,"details");
   preview.append(make(doc,"summary","Plan 4 tygodni (przykładowy rytm)"));
   const weeks=make(doc,"ol");
   for(let week=1;week<=4;week++)weeks.append(make(doc,"li","Tydzień "+week+": "+(week%2===1?"A → B":"A → B")+" · między sesjami ≥48 godzin. Przejdź dalej tylko po spełnieniu kryteriów."));
   preview.append(weeks);section.append(preview);
   node.append(section);
   const form=make(doc,"form",null,"fpk-cali-panel");
   add(form,make(doc,"h5","Zapisz wykonany trening "+stats.nextVariant));
   const target=nextPlan.focus.target;
   add(form,make(doc,"p","Ćwiczenie kontrolne: "+nextPlan.focus.name+" · cel "+target.sets+" × "+target.value+(target.kind==="seconds"?" sekund":" powtórzeń")+". Wpisz prawdziwe wyniki; pozostałe ćwiczenia FBW wykonaj według planu.","muted"));
   const fields=make(doc,"div",null,"fpk-cali-set-grid"),inputs=[];
   for(let i=0;i<3;i++){
     const label=make(doc,"label","Seria "+(i+1)+(target.kind==="seconds"?" (s)":" (powt.)"));
     const input=make(doc,"input");input.type="number";input.min="0";input.max="150";input.step="1";input.required=true;input.inputMode="numeric";
     input.placeholder=String(target.value);label.append(input);fields.append(label);inputs.push(input);
   }
   form.append(fields);
   const accessories=make(doc,"details",null,"fpk-cali-accessories");accessories.open=true;
   accessories.append(make(doc,"summary","Wykonane ćwiczenia FBW · 4 ruchy, po 2 serie"));
   accessories.append(make(doc,"p","Nie uzupełniaj wyników, których nie wykonałaś/eś. Wpisz 0 tylko jeśli faktycznie nie wykonano powtórzenia lub utrzymania.","muted"));
   const accessoryInputs=[];
   for(const move of nextPlan.exercises.slice(1)){
     const entry=make(doc,"div",null,"fpk-cali-accessory");
     entry.append(make(doc,"strong",move.name));
     const group=make(doc,"div",null,"fpk-cali-set-grid");
     const fields=[],kind=engine.stageTarget(0,move.name).kind;
     for(let i=0;i<2;i++){
       const label=make(doc,"label","Seria "+(i+1)+(kind==="seconds"?" · sekundy":" · powtórzenia"));
       const input=make(doc,"input");input.type="number";input.min="0";input.max="150";input.step="1";input.inputMode="numeric";input.required=true;
       label.append(input);group.append(label);fields.push(input);
     }
     entry.append(group);accessories.append(entry);accessoryInputs.push({id:move.id,fields});
   }
   form.append(accessories);
   const formPrefs=make(doc,"div",null,"fpk-cali-controls");
   const feel=make(doc,"label","Samopoczucie");
   const select=make(doc,"select");
   for(const [value,label] of [["normal","Wypoczęcie / gotowość"],["tired","Zmęczenie"],["pain","Ból (nie zapisuj jako zaliczone)"]]){
     const option=make(doc,"option",label);option.value=value;select.append(option);
   }
   feel.append(select);
   const technique=make(doc,"label",null,"fpk-cali-check");
   const good=make(doc,"input");good.type="checkbox";
   add(technique,good,make(doc,"span","Wszystkie zapisane serie wykonano technicznie poprawnie, bez bólu."));
   add(formPrefs,feel,technique);form.append(formPrefs);
   if(path.coach){
     const supervising=make(doc,"label",null,"fpk-cali-check");const ok=make(doc,"input");ok.type="checkbox";
     add(supervising,ok,make(doc,"span","Sesja była nadzorowana przez instruktora z asekuracją."));
     form.append(supervising);
     form.dataset.coach="1";
     form._supervisionCheck=ok;
   }
   const recovery=make(doc,"p",null,"muted"),now=Date.now();
   if(stats.lastAt){
     const due=Date.parse(stats.restUntil);
     recovery.textContent=now<due?"Regeneracja: kolejny zapis po "+new Date(due).toLocaleString("pl-PL")+".":"Ostatni trening: "+dateFmt(stats.lastAt)+". Możesz wykonać kolejną jednostkę, jeśli jesteś wypoczęta/y.";
   }else recovery.textContent="Pierwszą sesję wykonaj po rozgrzewce i sprawdzeniu sprzętu.";
   form.append(recovery);
   const save=button(doc,"Zapisz rzeczywiście wykonane 3 serie","action-button primary");
   save.type="submit";
   if(stats.restUntil&&now<Date.parse(stats.restUntil))save.disabled=true;
   form.append(save);
   form.addEventListener("submit",event=>{
     event.preventDefault();
     if(form._supervisionCheck&&!form._supervisionCheck.checked){status.textContent="Potwierdź nadzór instruktora.";return;}
     if(inputs.some(input=>!input.value.trim())){status.textContent="Uzupełnij trzy serie głównej figury.";return;}
     if(accessoryInputs.some(group=>group.fields.some(input=>!input.value.trim()))){
       status.textContent="Uzupełnij także wykonane serie czterech ćwiczeń FBW.";return;
     }
     if(!w.confirm("Potwierdzasz faktycznie wykonane serie i ocenę techniki?"))return;
     try{
       const result=engine.logSession(w.localStorage,path,registry,{
         actual:inputs.map(input=>Number(input.value)),
         extras:accessoryInputs.map(group=>({id:group.id,actual:group.fields.map(input=>Number(input.value))})),
         technique:good.checked,fatigue:select.value,now:new (w.Date||Date)()
       });
       showTrack(node,path,onBack);
       const dest=node.querySelector(".fpk-cali-status");
       if(dest)dest.textContent=result.record.passed?
         "Zapisano zaliczoną sesję. Następny trening po regeneracji.":
         "Zapisano rzeczywiste wyniki. Próg niezaliczony; zostajesz na tym etapie.";
     }catch(error){status.textContent=error.message;}
   });
   node.append(form);
   if(record.logs.length){
     const history=make(doc,"section",null,"fpk-cali-panel");
     add(history,make(doc,"h5","Historia sesji"));
     const list=make(doc,"ol");
     for(const row of record.logs.slice(-8).reverse()){
       list.append(make(doc,"li",dateFmt(row.at)+" · etap "+(row.stageIndex+1)+" · "+row.variant+
         " · "+row.actual.join("/")+" "+(row.kind==="seconds"?"s":"powt.")+" · "+(row.extras?.length||0)+" ruchy FBW"+
         " · "+(row.passed?"zaliczono":"powtórz po regeneracji")));
     }
     history.append(list);node.append(history);
   }
   const footer=make(doc,"p","Dane treningu są zapisane lokalnie na tym urządzeniu i nie synchronizują się jeszcze z kontem. Skopiuj je przed wyczyszczeniem danych przeglądarki. Progi są orientacyjne, nie diagnozują gotowości stawów i ścięgien.","muted");
   node.append(footer);
   const reset=button(doc,"Usuń lokalny plan tej figury");
   reset.addEventListener("click",()=>{
     if(!w.confirm("Usunąć CAŁĄ lokalną historię tej figury? Tej operacji nie da się cofnąć."))return;
     try{engine.reset(w.localStorage,path);showTrack(node,path,onBack);}catch(error){status.textContent=error.message;}
   });
   node.append(reset);
 }
 return Object.freeze({catalog,showTrack,paths:all});
}
window.FitPlanCalisthenicsPathsUI=Object.freeze({mount});
})();
