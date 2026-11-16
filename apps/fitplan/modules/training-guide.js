// WIEDORA-CHANGE: WD-20261101-FITPLAN-SYSTEMS-UX-01 | TASK: FitPlan systems UX | AUTHOR: ChatGPT / GPT-6
// Guided discovery is presentation-only. It never starts, edits or records a workout.
(()=>{
"use strict";
const METHODS=Object.freeze([
 {id:"fbw",label:"Całe ciało (FBW)",summary:"Trenujesz główne partie na jednej sesji. W FitPlan są dwa gotowe warianty A/B: dom i siłownia.",tag:"Dobry punkt startowy",goals:["general","strength","muscle"],preferredPlace:"any",levels:["beginner","intermediate","advanced"],priority:9},
 {id:"kalistenika",label:"Kalistenika",summary:"Ćwiczysz głównie masą własnego ciała i rozwijasz umiejętności krok po kroku.",tag:"Masa ciała i progresje",goals:["general","skills","strength"],preferredPlace:"home",levels:["beginner","intermediate","advanced"],priority:8},
 {id:"kettlebell",label:"Kettlebell",summary:"Trening z odważnikiem: wzorce ruchu całego ciała, siła i kondycja. Dostępny także osobny gotowy obwód.",tag:"Potrzebny odważnik",goals:["general","strength","endurance","muscle"],preferredPlace:"any",levels:["beginner","intermediate","advanced"],priority:7},
 {id:"split",label:"Split (podział partii)",summary:"Na różnych sesjach skupiasz się na wybranych partiach, np. nogach lub plecach. Tu samodzielnie układasz zestaw.",tag:"Trening dzielony",goals:["muscle","strength"],preferredPlace:"gym",levels:["intermediate","advanced"],priority:5},
 {id:"push-pull",label:"Push–pull (pchanie / przyciąganie)",summary:"Rozdzielasz ruchy pchania (np. pompki) i przyciągania (np. wiosłowanie) na osobne treningi.",tag:"Dwa typy ruchu",goals:["muscle","strength"],preferredPlace:"gym",levels:["intermediate","advanced"],priority:5},
 {id:"crossfit",label:"CrossFit / trening mieszany",summary:"Łączysz ćwiczenia siłowe i kondycyjne, często w obwodach. Dobierz technikę i intensywność do umiejętności.",tag:"Siła + kondycja",goals:["endurance","strength","general"],preferredPlace:"gym",levels:["intermediate","advanced"],priority:4},
 {id:"sztuki-walki",label:"Przygotowanie do sztuk walki",summary:"Ćwiczenia techniczne i motoryczne: praca nóg, stabilizacja oraz kondycja. Nauka kontaktowa wymaga instruktora.",tag:"Technika i motoryka",goals:["skills","endurance","general"],preferredPlace:"gym",levels:["beginner","intermediate","advanced"],priority:4},
 {id:"100-pompek",label:"100 pompek i więcej",summary:"Konkretny cel: zwiększać maksymalną liczbę poprawnych pompek w jednej serii. Zaczynasz od testu.",tag:"Program oparty na teście",goals:["pushups","skills","strength"],preferredPlace:"home",levels:["beginner","intermediate","advanced"],priority:7},
 {id:"rozciaganie",label:"Rozciąganie i mobilność",summary:"Spokojna praca nad zakresem ruchu i kontrolą pozycji. Nie zastępuje treningu siłowego.",tag:"Mobilność",goals:["mobility","general"],preferredPlace:"home",levels:["beginner","intermediate","advanced"],priority:7},
 {id:"joga",label:"Joga",summary:"Pozycje, oddech i równowaga. Wybierasz obszar praktyki i stopniowo dobierasz ćwiczenia.",tag:"Oddech i kontrola",goals:["mobility","core","skills"],preferredPlace:"home",levels:["beginner","intermediate","advanced"],priority:6},
 {id:"brzuch",label:"Brzuch i stabilizacja",summary:"Ćwiczenia tułowia: zginanie, antyrotacja i stabilizacja. To uzupełnienie treningu całego ciała.",tag:"Core",goals:["core","general"],preferredPlace:"home",levels:["beginner","intermediate","advanced"],priority:6}
]);
function rank(goal,place,experience){
 return METHODS.map(m=>{
  let score=m.priority;
  if(m.goals.includes(goal))score+=12;
  else score-=8;
  // Location is a preference, not verified access to equipment.
  if(place!=="any")score+=m.preferredPlace===place?3:m.preferredPlace==="any"?2:-2;
  if(experience==="beginner")score+=m.levels.includes("beginner")?3:-4;
  else score+=m.levels.includes(experience)?2:-3;
  return {...m,score};
 }).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label,"pl"));
}
function mount({host,doc,selectSport}){
 const get=id=>host.querySelector("#"+id),root=get("fpkGuide");
 if(!root||root.dataset.mounted==="true")return;
 root.dataset.mounted="true";
 const selectors={goal:get("fpkGuideGoal"),place:get("fpkGuidePlace"),experience:get("fpkGuideExperience")};
 const results=get("fpkGuideResults"),count=get("fpkGuideCount");
 if(!results||!count||!Object.values(selectors).every(Boolean))return;
 for(const m of METHODS){
  const button=host.querySelector('.fpk-plan[data-fpk-plan="'+m.id+'"]');
  if(!button)continue;
  const title=button.querySelector("strong"),small=button.querySelector("small");
  if(title)title.textContent=m.label;
  if(small)small.textContent=m.summary;
  const badge=doc.createElement("span");
  badge.className="fpk-plan-badge";badge.textContent=m.tag;
  button.append(badge);
 }
 function draw(){
  const {goal,place,experience}=Object.fromEntries(Object.entries(selectors).map(([k,v])=>[k,v.value]));
  const picks=rank(goal,place,experience).slice(0,3);
  const labels={general:"ogólnej sprawności",strength:"siły",muscle:"budowania mięśni",endurance:"kondycji",skills:"nauki umiejętności",mobility:"mobilności",core:"stabilizacji tułowia",pushups:"większej liczby pompek"};
  count.textContent="Propozycje dla celu: "+(labels[goal]||"wybranego")+". Możesz też porównać wszystkie 11 metod poniżej.";
  results.replaceChildren();
  for(let i=0;i<picks.length;i++){
   const m=picks[i],button=doc.createElement("button");
   button.type="button";button.className="fpk-guide-pick";button.dataset.fpkRecommend=m.id;
   const marker=doc.createElement("span");marker.className="fpk-guide-pick-number";marker.textContent=String(i+1);
   const body=doc.createElement("span");body.className="fpk-guide-pick-body";
   const title=doc.createElement("strong");title.textContent=m.label;
   const description=doc.createElement("small");description.textContent=m.summary;
   const kind=doc.createElement("em");kind.textContent=m.tag;
   body.append(title,description,kind);
   const affordance=doc.createElement("span");affordance.className="fpk-guide-pick-action";affordance.textContent="Wybierz";
   button.append(marker,body,affordance);results.append(button);
  }
 }
 Object.values(selectors).forEach(select=>select.addEventListener("change",draw));
 results.addEventListener("click",event=>{
  const button=event.target.closest("[data-fpk-recommend]");
  if(button&&results.contains(button))selectSport(button.dataset.fpkRecommend);
 });
 get("fpkGuideReset")?.addEventListener("click",()=>{
  selectors.goal.value="general";selectors.place.value="any";selectors.experience.value="beginner";draw();
  selectors.goal.focus();
 });
 draw();
}
window.FitPlanTrainingGuide=Object.freeze({rank,mount});
})();
