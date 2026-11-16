(() => {
  "use strict";
  // Each catalog entry is explicitly assigned one mechanic; no category-wide fallback or copied push-up motion.
  const FAMILY={
    squat:"Przysiady",
    sumoSquat:"Sumo squat",
    lunge:"Wykroki",
    hinge:"Martwy ciąg|RDL|Good morning|Hip hinge",
    calf:"Wspięcia na palce|Wspięcia stojąc",
    seatedCalf:"Wspięcia siedząc",
    step:"Wejścia na stopień",
    kneeRaise:"Kontrolowane unoszenie kolana|Kontrolowane zgięcie biodra|Unoszenia kolan",

    heelWalk:"Marsz na piętach",
    sideStep:"Side step|Chód bokiem",
    lateralBandWalk:"Chód bokiem z gumą",
    monsterWalk:"Monster walk",
    jump:"Skakanka|Skoki",
    ankleEversion:"Nawracanie stopy z gumą",
    ankleInversion:"Odwracanie stopy z gumą",
    toeRaise:"Dorsiflexion raises",
    abduction:"Odwodzenie nogi|Odwodzenie biodra",
    adduction:"Addukcja z oporem",
    hipRotation:"Kontrolowana rotacja biodra",
    clamshell:"Ćwiczenie muszla",
    legExtension:"Prostowanie nóg",
    legCurl:"Uginania nóg",
    push:"Wyciskanie wąsko",
    inclinePush:"Wyciskanie hantli na ławce dodatniej",
    fly:"Rozpiętki na ławce",
    overhead:"Wyciskanie nad głowę",
    landmine:"Landmine press",
    arnold:"Arnold press",
    armRaise:"Wall slides|Unoszenia bokiem|Y-raise",
    shoulder:"Ćwiczenia kontroli barku|Stabilizacja łopatki|Ściąganie łopatek",
    depression:"Kontrolowane obniżanie łopatek",
    external:"Rotacje zewnętrzne gumą",
    row:"Wiosłowanie",
    pullUp:"Podciąganie|Podciąganie podchwytem",
    pulldown:"Ściąganie drążka",
    facePull:"Face pull",
    facePullRotated:"Face pull z rotacją",
    curl:"Uginania hantli|Uginania ze sztangą|Uginanie ramion chwytem młotkowym|Uginanie ramion nachwytem|Uginanie młotkowe|Uginanie nachwytem",
    triceps:"Prostowania na wyciągu",
    dip:"Dipy",
    wristExtension:"Prostowanie nadgarstków",
    wristCurl:"Uginanie nadgarstków",
    forearmRotate:"Nawracanie przedramienia z małym oporem|Odwracanie przedramienia z małym oporem",
    fingers:"Prostowanie palców z gumą",
    staticHold:"Bracing|Izometrie",
    walk:"Carries|Marsz|Marsz pod górę|Marsze z oporem|Spacer farmera|Spacer z obciążeniem po jednej stronie",
    sidePlank:"Deska boczna|Side plank",
    copenhagen:"Copenhagen plank",
    crunch:"Spięcia",
    legRaise:"Unoszenia nóg",
    deadBug:"Dead bug",
    birdDog:"Bird dog",
    rollout:"Rollouty",
    woodchop:"Woodchopper",
    antiRotation:"Ćwiczenia antyrotacyjne|Pallof press|Antyrotacja",
    rotation:"Kontrolowane skręty tułowia",
    balance:"Stanie jednonóż|Single-leg work",
    hollow:"Hollow hold",
    breathing:"Ćwiczenia oddechowe|Spokojny oddech przeponowy",
    shrug:"Kontrolowane unoszenie łopatek|Shrugsy",
    backExtension:"Back extension",
    hang:"Zwis na drążku",
    scapPush:"Push-up plus"
  };
  const EQUIPMENT={
    barbell:"Martwy ciąg|RDL|Good morning|Wyciskanie wąsko|Uginania ze sztangą",
    dumbbell:"Wyciskanie hantli na ławce dodatniej|Rozpiętki na ławce|Uginania hantli|Uginanie ramion chwytem młotkowym|Uginanie ramion nachwytem|Uginanie młotkowe|Uginanie nachwytem|Spacer farmera|Carries",
    singleDumbbell:"Spacer z obciążeniem po jednej stronie",
    landmine:"Landmine press",
    band:"Chód bokiem z gumą|Monster walk|Nawracanie stopy z gumą|Odwracanie stopy z gumą|Addukcja z oporem|Rotacje zewnętrzne gumą|Prostowanie palców z gumą|Nawracanie przedramienia z małym oporem|Odwracanie przedramienia z małym oporem",

    step:"Wejścia na stopień",
    wall:"Wall slides",
    cable:"Prostowania na wyciągu|Ściąganie drążka|Face pull|Face pull z rotacją|Woodchopper|Pallof press",
    bar:"Podciąganie|Podciąganie podchwytem|Zwis na drążku",
    mat:"Copenhagen plank|Deska boczna|Side plank|Hollow hold|Dead bug|Bird dog|Rollouty|Spięcia|Unoszenia nóg",
    wheel:"Rollouty"
  };
  const assigned=new Map(),gear=new Map(),duplicates=[];
  for(const [pattern,names] of Object.entries(FAMILY))for(const name of names.split("|")){
    if(assigned.has(name))duplicates.push(name);
    assigned.set(name,pattern);
  }
  for(const [kind,names] of Object.entries(EQUIPMENT))for(const name of names.split("|"))gear.set(name,kind);
  // Warnings for movements impossible to demonstrate accurately with the 14-joint frontal projection.
  const depthRequired=new Set(["Kontrolowana rotacja biodra","Ćwiczenie muszla",
    "Nawracanie przedramienia z małym oporem","Odwracanie przedramienia z małym oporem",
    "Rotacje zewnętrzne gumą","Kontrolowane skręty tułowia","Wall slides","Arnold press","Face pull z rotacją"]);
  const ambiguous=new Set(["Single-leg work","Carries","Wiosłowanie","Izometrie"]);
  const library=window.FitPlanMotionLibrary,templates=window.FitPlanMotionTemplates;
  const catalog=window.FitPlanExerciseCatalog?.items||[];
  const registered=[],unmapped=[],unknown=[];
  for(const item of catalog){
    // Preserve Push-Up, Hip Thrust and Barbell Bench Press with their existing dedicated renderers.
    if(library.resolve(item.name)||window.FitPlanExerciseMotion?.has(item.name))continue;
    const pattern=assigned.get(item.name);
    if(!pattern){unmapped.push(item.name);continue;}
    if(!templates.patterns.includes(pattern)){unknown.push("Unknown template: "+item.name);continue;}
    const movement=templates.build(pattern);
    const isHold=["staticHold","sidePlank","hang","breathing","hollow","balance"].includes(pattern);
    library.registerExercise({
      id:"mechanical-"+item.id,aliases:[item.name],actorId:"fitplan-athlete-01",
      category:item.category,title:item.displayName,subtitle:item.displayName+" — szkic mechaniki 2D",
      mechanicalDraft:true,
      requiresDepthVisualization:depthRequired.has(item.name),
      ambiguousExercise:ambiguous.has(item.name),
      previewUnavailable:item.name==="Ćwiczenie muszla",
      supportNotModeled:item.name==="Copenhagen plank",
      terrainNotModeled:item.name==="Marsz pod górę",
      equipmentNotModeled:item.name==="Skakanka",
      fineJointsNotModeled:["Dorsiflexion raises","Prostowanie palców z gumą"].includes(item.name),
      gripNotModeled:["Podciąganie podchwytem","Uginanie młotkowe","Uginanie nachwytem","Uginanie ramion chwytem młotkowym","Uginanie ramion nachwytem"].includes(item.name),
      visual:{kind:"full-body-rig",pattern,base:movement.base,width:800,height:400,columns:2,rows:1,
        equipment:gear.get(item.name)||"none",support:item.name==="Wyciskanie hantli na ławce dodatniej"?"incline-bench":(pattern==="dip"?"dip-bars":(["bench","seated"].includes(movement.base)?"bench":"none")),poses:movement.poses},
      keyframes:[{at:0,frame:0},{at:.5,frame:1},{at:1,frame:0}],
      markers:[{at:0,label:"Start"},{at:.5,label:isHold?"Utrzymanie":"Faza właściwa"},{at:1,label:"Powrót"}],
      phases:[
        {at:0,label:"Pozycja startowa",cue:"Szkic mechaniki: "+movement.label+". Przygotuj pozycję odpowiednią do wariantu ćwiczenia."},
        {at:.22,label:isHold?"Przyjęcie pozycji":"Rozpoczęcie ruchu",cue:movement.cue},
        {at:.5,label:isHold?"Utrzymanie":"Pozycja docelowa",cue:isHold?movement.cue:"To jest schemat 2D, a nie w pełni zweryfikowany instruktaż techniczny."},
        {at:.75,label:isHold?"Kontrola pozycji":"Powrót",cue:isHold?"Utrzymuj stabilność i naturalny oddech.":"Wróć powoli, bez szarpania ani utraty kontroli."}
      ]
    });
    registered.push(item.name);
  }
  for(const name of assigned.keys())if(!catalog.some(item=>item.name===name))unknown.push("Missing catalog: "+name);
  Object.defineProperty(window,"FitPlanMotionCoverage",{value:Object.freeze({
    total:catalog.length,draftCount:registered.length,
    existingCount:catalog.length-registered.length-unmapped.length,
    patterns:templates.patterns.length,
    unmapped:Object.freeze(unmapped),duplicates:Object.freeze(duplicates),unknown:Object.freeze(unknown)
  })});
  if(unmapped.length||unknown.length||duplicates.length)console.warn("[FitPlan] Mechanical draft coverage incomplete",window.FitPlanMotionCoverage);
})();