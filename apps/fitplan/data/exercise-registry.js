(()=>{
"use strict";
/* Canonical read model for ALL FitPlan exercises. Existing atlas IDs are preserved. */
const basic=Array.from(window.FitPlanExerciseCatalog?.items||[]);
const kb=Array.from(window.FitPlanKettlebellCatalog?.items||[]);
const extensions=Array.from(window.FitPlanTrainingExtensions?.items||[]);
if(!basic.length||!kb.length)throw new Error("Exercise sources unavailable");
const SOURCES=Object.freeze([
 {title:"Interpretacja sygnału EMG",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC5758546/"},
 {title:"Aktywacja mięśni przy wyciskaniu",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/"},
 {title:"Przegląd badań kettlebell",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6719359/"},
 {title:"Warianty chwytu w wyciskaniu",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC10203828/"}
]);
const M={
 pecS:["Piersiowy większy – część mostkowo-żebrowa","chest"],
 pecC:["Piersiowy większy – część obojczykowa","chest"],
 pecMinor:["Piersiowy mniejszy","chest"],
 tri:["Trójgłowy ramienia (triceps)","arms"],
 delA:["Naramienny – część przednia","shoulders"],
 delM:["Naramienny – część środkowa","shoulders"],
 delP:["Naramienny – część tylna","shoulders"],
 lat:["Najszerszy grzbietu","back"],
 trap:["Czworoboczny grzbietu","back"],
 rhomb:["Równoległoboczne","back"],
 erect:["Prostowniki grzbietu","back"],
 multi:["Wielodzielne","back"],
 bic:["Dwugłowy ramienia (biceps)","arms"],
 brach:["Ramienny i ramienno-promieniowy","arms"],
 grip:["Zginacze palców i nadgarstka","grip"],
 ext:["Prostowniki przedramienia","grip"],
 glute:["Pośladkowy wielki","glutes"],
 gluteM:["Pośladkowy średni i mały","glutes"],
 quad:["Czworogłowy uda","legs"],
 hams:["Kulszowo-goleniowe","legs"],
 adduct:["Przywodziciele uda","legs"],
 calf:["Łydka (brzuchaty i płaszczkowaty)","legs"],
 hip:["Zginacze biodra","legs"],
 abs:["Prosty brzucha","abs"],
 obliq:["Skośne brzucha","abs"],
 trans:["Poprzeczny brzucha","abs"],
 shoulder:["Stożek rotatorów","shoulders"],
 serr:["Zębaty przedni","chest"],
 diaphragm:["Przepona","chest"],
 ankle:["Mięśnie podudzia i stawu skokowego","legs"]
};
const R=(primary,secondary=[])=>({primary,secondary});
// The distribution is a transparent EDITORIAL training-focus model, never EMG or % physical load.
const rules=[
[/bench press|wyciskanie sztangi na ławce płaskiej/i,R([["pecS",34],["pecC",22]],[["tri",24],["delA",20]])],
[/incline|ławce dodatniej/i,R([["pecC",40],["pecS",17]],[["delA",27],["tri",16]])],
[/chest fly|rozpiętki/i,R([["pecS",45],["pecC",30]],[["delA",15],["serr",10]])],
[/floor press|squeeze press/i,R([["pecS",41],["pecC",17]],[["tri",26],["delA",16]])],
[/push.?up|pompki/i,R([["pecS",35],["pecC",18]],[["tri",25],["delA",12],["serr",10]])],
[/dips|dipy/i,R([["tri",38],["pecS",30]],[["delA",22],["serr",10]])],
[/clean|snatch|jerk/i,R([["glute",29],["quad",19],["delA",14]],[["erect",14],["trap",12],["grip",12]])],
[/swing/i,R([["glute",42],["hams",27]],[["erect",16],["abs",8],["grip",7]])],
[/thruster/i,R([["quad",32],["glute",20],["delA",19]],[["tri",16],["abs",13]])],
[/deadlift|martwy ciąg|rdl|romanian|hip hinge|good morning/i,R([["glute",32],["hams",30]],[["erect",26],["grip",12]])],
[/goblet squat|front rack squat|squat|przysiad/i,R([["quad",43],["glute",30]],[["adduct",13],["abs",14]])],
[/lunge|wykrok|split squat|step.up|stopień/i,R([["quad",37],["glute",32]],[["gluteM",17],["calf",14]])],
[/hip thrust|glute bridge/i,R([["glute",66],["hams",13]],[["quad",11],["abs",10]])],
[/hip abduction|odwodzenie|side step|side steps|band walk|monster walk|clamshell/i,R([["gluteM",70]],[["glute",20],["abs",10]])],
[/leg curl|uginania nóg/i,R([["hams",78]],[["glute",12],["calf",10]])],
[/leg extension|prostowanie nóg/i,R([["quad",85]],[["hip",15]])],
[/calf raise|wspięcia/i,R([["calf",85]],[["ankle",15]])],
[/heel walk|dorsiflexion|nawracanie stopy|odwracanie stopy/i,R([["ankle",82]],[["calf",18]])],
[/addukcja|copenhagen/i,R([["adduct",70]],[["abs",20],["gluteM",10]])],
[/pull.up|podciąganie|lat pulldown|ściąganie drążka|chin.up/i,R([["lat",48],["bic",18]],[["trap",14],["rhomb",12],["grip",8]])],
[/renegade row/i,R([["lat",41],["rhomb",21]],[["abs",18],["obliq",12],["bic",8]])],
[/row|wiosłowanie/i,R([["lat",36],["rhomb",25]],[["trap",16],["delP",13],["bic",10]])],
[/face pull/i,R([["delP",33],["trap",24],["shoulder",20]],[["rhomb",15],["bic",8]])],
[/shrug|unoszenie łopatek/i,R([["trap",77]],[["grip",13],["shoulder",10]])],
[/łopatek|scapular|y.raise|wall slides/i,R([["trap",38],["serr",32]],[["rhomb",20],["shoulder",10]])],
[/push press/i,R([["delA",35],["delM",20]],[["quad",20],["glute",9],["tri",11],["serr",5]])],
[/strict press|overhead press|arnold press|wyciskanie nad głowę|bottoms.up.press|push press|landmine press/i,R([["delA",40],["delM",24]],[["tri",19],["serr",17]])],
[/halo|lateral raise|unoszenia bokiem/i,R([["delM",56],["delA",17]],[["trap",16],["shoulder",11]])],
[/rotacje zewnętrzne|external rotation/i,R([["shoulder",80]],[["delP",20]])],
[/biceps curl|uginania hantli|uginania ze sztangą|curl|uginanie ramion|uginanie młotkowe|uginanie nachwytem/i,R([["bic",58],["brach",27]],[["grip",15]])],
[/triceps|prostowania na wyciągu|wyciskanie wąsko/i,R([["tri",72]],[["delA",15],["pecS",13]])],
[/wrist extension|prostowanie nadgarstków|prostowanie palców/i,R([["ext",80]],[["grip",20]])],
[/wrist curl|uginanie nadgarstków|nawracanie przedramienia|odwracanie przedramienia/i,R([["grip",80]],[["ext",20]])],
[/farmer|suitcase|carry|carries|spacer|march/i,R([["grip",38],["obliq",22]],[["trap",16],["erect",14],["glute",10]])],
[/windmill|turkish get.up/i,R([["obliq",30],["gluteM",22],["shoulder",20]],[["abs",15],["grip",13]])],
[/pallof|anti.rotation|antyrot|side plank|deska boczna|woodchopper|skret|skręt/i,R([["obliq",45],["trans",30]],[["abs",15],["gluteM",10]])],
[/dead bug|bird dog|bracing|hollow|rollout|plank/i,R([["trans",40],["abs",28]],[["obliq",20],["multi",12]])],
[/crunch|spięcia|unoszenia nóg/i,R([["abs",65],["obliq",20]],[["hip",15]])],
[/leg raise|knee raise|kolana|zgięcie biodra/i,R([["hip",48],["abs",32]],[["obliq",20]])],
[/back extension/i,R([["erect",62],["glute",23]],[["hams",15]])],
[/breath|oddech|przepona/i,R([["diaphragm",70]],[["abs",15],["trans",15]])],
[/controlled hip rotation|kontrolowana rotacja biodra/i,R([["gluteM",41],["glute",24]],[["hip",20],["abs",15]])],
[/single.leg balance|stanie jednonóż/i,R([["gluteM",40],["ankle",30]],[["trans",20],["calf",10]])],
[/dead hang|zwis na drążku/i,R([["grip",55],["shoulder",20]],[["lat",15],["trap",10]])],
[/walking|marsz|skok|jump rope|skakanka/i,R([["calf",39],["quad",31]],[["glute",20],["abs",10]])]
];
const tooBroad=/^(?:carries|single-leg work|izometrie|isometric holds|ćwiczenia kontroli barku|shoulder control drills|ćwiczenia antyrotacyjne|anti-rotation exercises|stabilizacja łopatki|scapular stabilization|bracing)$/i;
function profile(item){
 if(Array.isArray(item.areas)&&Array.isArray(item.supportAreas)){
  const names={full:"Całe ciało",chest:"Mięśnie piersiowe",shoulders:"Naramienne i stabilizatory łopatki",back:"Mięśnie grzbietu",arms:"Zginacze i prostowniki ramion",abs:"Mięśnie brzucha i stabilizatory tułowia",legs:"Mięśnie ud i podudzi",glutes:"Mięśnie pośladkowe",grip:"Mięśnie chwytu i przedramienia",hip:"Zginacze biodra",calf:"Mięśnie łydki",ankle:"Stabilizatory stawu skokowego",quad:"Mięśnie czworogłowe"};
  const convert=list=>Object.freeze(list.map(area=>Object.freeze({area:["hip","calf","ankle","quad"].includes(area)?"legs":area,name:names[area]||area,share:null})));
  return Object.freeze({status:"qualitative",primary:convert(item.areas),secondary:convert(item.supportAreas),note:"Opis jakościowy: brak wiarygodnych procentów obciążenia dla tej techniki. Przy trudnych elementach wskazany trener i odpowiednie zabezpieczenie."});
 }
 const label=String(item.displayName||item.name||"");
 if(tooBroad.test(label))return Object.freeze({status:"variant",primary:Object.freeze([]),secondary:Object.freeze([]),note:"Nazwa obejmuje wiele wariantów ruchu; nie ma jednego rzetelnego rozkładu udziału mięśni."});
 const row=rules.find(([re])=>re.test(label)||re.test(item.name||""));
 if(!row)return Object.freeze({status:"unreviewed",primary:Object.freeze([]),secondary:Object.freeze([]),note:"Przypisanie procentowe wymaga doprecyzowania wariantu ćwiczenia."});
 const transform=list=>Object.freeze(list.map(([id,share])=>Object.freeze({name:M[id][0],area:M[id][1],share})));
 return Object.freeze({status:"illustrative",primary:transform(row[1].primary),secondary:transform(row[1].secondary),
 note:"Procenty przedstawiają orientacyjne proporcje akcentu treningowego według modelu redakcyjnego. NIE są pomiarem EMG, procentem siły ani gwarancją rozwoju mięśni."});
}
const byId=new Map(),byName=new Map(),aliases=new Map(),all=[];
const norm=v=>String(v||"").toLocaleLowerCase("en-US").replace(/[’']/g,"").replace(/\bfarmers\b/g,"farmer").replace(/\s+/g," ").trim();
function register(item){
 const key=norm(item.displayName||item.name);
 const shared=byName.get(key);
 if(shared){
   aliases.set(item.id,shared.id);
   return;
 }
 const normalized=Object.freeze({...item,equipment:item.category==="kettlebell"?"kettlebell":item.category==="extended"?"extended":"general",muscleProfile:profile(item)});
 all.push(normalized);byId.set(normalized.id,normalized);
 byName.set(key,normalized);
 if(!byName.has(norm(item.name)))byName.set(norm(item.name),normalized);
}
basic.forEach(register);kb.forEach(register);extensions.forEach(register);
const kbIds=new Set(kb.map(x=>x.id));
function get(value){
 if(value&&typeof value==="object"&&value.id)value=value.id;
 const id=String(value||"");
 return byId.get(id)||byId.get(aliases.get(id))||byName.get(norm(id))||null;
}
function byArea(area,opts={}){
 const equipment=opts.equipment||"all";
 const source=equipment==="kettlebell"?kb.map(item=>get(item.id)).filter(Boolean):[...all];
 const unique=[...new Map(source.map(x=>[x.id,x])).values()];
 const primary=[],secondary=[];
 for(const item of unique){
  const roles=item.muscleProfile;
  if(area==="full"||area==="custom"){primary.push(item);continue;}
  const direct=roles.primary.some(x=>x.area===area);
  const support=roles.secondary.some(x=>x.area===area);
  if(direct)primary.push(item);
  else if(support)secondary.push(item);
 }
 return {primary,secondary};
}
window.FitPlanExerciseRegistry=Object.freeze({
 items:Object.freeze(all),get,byArea,profile:profile,SOURCES,aliases,canonicalId:id=>get(id)?.id||null,
 note:"Wartości procentowe są ORIENTACYJNYM modelem akcentu treningowego, nie zmierzoną aktywacją mięśni."
});
})();