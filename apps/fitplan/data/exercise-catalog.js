(() => {
  "use strict";
  const muscles=Array.from(window.FitPlanMuscles||[]);
  const categories=window.FitPlanData?.categoryMeta||{chest:"Klatka piersiowa",back:"Plecy",shoulders:"Barki",arms:"Ramiona",forearms:"Przedramiona",neck:"Szyja i głowa",abs:"Brzuch",legs:"Nogi",glutes:"Pośladki"};
  const curated={
    "Wyciskanie sztangi na ławce płaskiej":["Wielostawowe wyciskanie poziome. Utrzymaj łopatki stabilnie, stopy oparte i prowadź sztangę nad środkową część klatki piersiowej.",4,6],
    "Pompki":["Wielostawowe ćwiczenie z masą ciała. Utrzymuj tułów w jednej linii i prowadź łokcie w kontrolowanym torze.",2,5],
    "Podciąganie":["Pionowe przyciąganie masy ciała. Rozpocznij ruchem łopatek, zachowaj napięty tułów i unikaj kołysania.",5,6],
    "Martwy ciąg":["Wzorzec hip hinge rozwijający siłę całego tylnego łańcucha. Kręgosłup pozostaje neutralny, a ciężar blisko ciała.",5,6],
    "Przysiady":["Wielostawowy wzorzec przysiadu. Kolana prowadź zgodnie z kierunkiem stóp, a zakres dobierz do kontroli tułowia i bioder.",4,6],
    "Wiosłowanie":["Poziome przyciąganie rozwijające grzbiet. Utrzymuj stabilny tułów i kończ ruch kontrolowanym cofnięciem łopatek.",3,5],
    "Wyciskanie nad głowę":["Pionowe wyciskanie angażujące obręcz barkową i triceps. Utrzymuj żebra nad miednicą i kontroluj tor ciężaru.",4,5],
    "Hip thrust":["Dominujący wyprost biodra. Zakończ ruch pełnym napięciem pośladków bez przeprostu odcinka lędźwiowego.",3,6],
    "Face pull":["Przyciąganie linki lub gumy do twarzy z rotacją zewnętrzną. Akcentuje tylną część barków i kontrolę łopatki.",2,4],
    "Pallof press":["Ćwiczenie antyrotacyjne tułowia. Utrzymuj miednicę i klatkę piersiową nieruchomo podczas odsuwania uchwytu.",2,4],
    "Bird dog":["Ćwiczenie stabilizacji tułowia w podporze. Wydłużaj przeciwległą rękę i nogę bez rotacji miednicy.",2,4],
    "Dead bug":["Ćwiczenie kontroli lędźwiowo-miednicznej. Poruszaj kończynami tylko w zakresie, w którym utrzymujesz żebra i miednicę.",2,4]
  };
  // Angielskie nazwy widoczne w UI, oryginalne polskie klucze zachowane dla atlasu i postępu.
  const englishNames=Object.freeze({"Wyciskanie sztangi na ławce płaskiej":"Barbell Bench Press","Rozpiętki na ławce":"Dumbbell Chest Fly","Pompki":"Push-Up","Wyciskanie hantli na ławce dodatniej":"Incline Dumbbell Bench Press","Ćwiczenia oddechowe":"Breathing Exercises","Stabilizacja łopatki":"Scapular Stabilization","Ćwiczenia kontroli barku":"Shoulder Control Drills","Shrugsy":"Shrugs","Wiosłowanie":"Row","Podciąganie":"Pull-Up","Ściąganie drążka":"Lat Pulldown","Martwy ciąg":"Deadlift","Ćwiczenia antyrotacyjne":"Anti-Rotation Exercises","Izometrie":"Isometric Holds","Wyciskanie nad głowę":"Overhead Press","Unoszenia bokiem":"Lateral Raise","Rotacje zewnętrzne gumą":"Band External Rotation","Face pull z rotacją":"Face Pull with External Rotation","Uginania ze sztangą":"Barbell Biceps Curl","Uginania hantli":"Dumbbell Biceps Curl","Podciąganie podchwytem":"Chin-Up","Prostowania na wyciągu":"Cable Triceps Pushdown","Dipy":"Dips","Wyciskanie wąsko":"Close-Grip Bench Press","Spięcia":"Crunch","Rollouty":"Ab Wheel Rollout","Unoszenia nóg":"Leg Raise","Antyrotacja":"Anti-Rotation Hold","Przysiady":"Squat","Wykroki":"Lunge","Prostowanie nóg":"Leg Extension","Uginania nóg":"Leg Curl","Addukcja z oporem":"Resisted Hip Adduction","Unoszenia kolan":"Knee Raise","Marsze z oporem":"Resisted March","Kontrolowane zgięcie biodra":"Controlled Hip Flexion","Marsz na piętach":"Heel Walk","Wspięcia stojąc":"Standing Calf Raise","Skoki":"Jumps","Marsz pod górę":"Uphill Walk","Wspięcia siedząc":"Seated Calf Raise","Marsz":"Walking","Skakanka":"Jump Rope","Kontrolowane obniżanie łopatek":"Scapular Depression","Ściąganie łopatek":"Scapular Retraction","Kontrolowane unoszenie łopatek":"Scapular Elevation","Uginanie ramion chwytem młotkowym":"Hammer Curl","Uginanie ramion nachwytem":"Reverse Curl","Uginanie młotkowe":"Hammer Curl","Uginanie nachwytem":"Reverse Curl","Uginanie nadgarstków":"Wrist Curl","Spacer farmera":"Farmer's Carry","Zwis na drążku":"Dead Hang","Prostowanie nadgarstków":"Wrist Extension","Prostowanie palców z gumą":"Band Finger Extension","Nawracanie przedramienia z małym oporem":"Resisted Forearm Pronation","Odwracanie przedramienia z małym oporem":"Resisted Forearm Supination","Deska boczna":"Side Plank","Kontrolowane skręty tułowia":"Controlled Trunk Rotation","Spacer z obciążeniem po jednej stronie":"Suitcase Carry","Spokojny oddech przeponowy":"Diaphragmatic Breathing","Odwodzenie nogi":"Hip Abduction","Chód bokiem z gumą":"Lateral Band Walk","Odwodzenie biodra":"Hip Abduction","Chód bokiem":"Side Steps","Kontrolowane unoszenie kolana":"Controlled Knee Raise","Wejścia na stopień":"Step-Up","Nawracanie stopy z gumą":"Band Ankle Eversion","Stanie jednonóż":"Single-Leg Balance","Odwracanie stopy z gumą":"Band Ankle Inversion","Wspięcia na palce":"Calf Raise","Kontrolowana rotacja biodra":"Controlled Hip Rotation","Ćwiczenie muszla":"Clamshell"});
  const compound=/przysiad|martwy|wycisk|podciąg|wiosł|dipy|wykrok|step|thruster|press|squat|carry|carries|spacer farmera/i;
  const technical=/martwy|good morning|olimp|snatch|clean|turkish|pistol|rollout/i;
  const gentle=/oddech|kontrol|izometri|wall slide|marsz|rotac|nawrac|odwrac|prostowanie palców/i;
  const byName=new Map();
  for(const muscle of muscles){
    for(const raw of muscle.ex||[]){
      const name=String(raw||"").trim();if(!name)continue;
      const key=name.toLocaleLowerCase("pl-PL");
      const existing=byName.get(key);
      if(existing){if(!existing.muscles.some(item=>item.id===muscle.id))existing.muscles.push(muscle);continue;}
      byName.set(key,{name,muscles:[muscle],category:muscle.category});
    }
  }
  const items=[...byName.values()].map(record=>{
    const preset=curated[record.name];
    const difficulty=preset?.[1]??(gentle.test(record.name)?1:technical.test(record.name)?5:compound.test(record.name)?4:2);
    const effectiveness=preset?.[2]??Math.max(2,Math.min(6,(compound.test(record.name)?4:3)+(record.muscles.length>1?1:0)));
    const primary=record.muscles.slice(0,1).map(item=>item.name);
    const supporting=record.muscles.slice(1).map(item=>item.name);
    const description=preset?.[0]||`${record.name} to ćwiczenie ukierunkowane głównie na: ${primary.join(", ")}. Wykonuj ruch w kontrolowanym zakresie, bez bólu i z obciążeniem pozwalającym zachować technikę.`;
    return Object.freeze({
      id:record.category+"-"+record.name.toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
      name:record.name,displayName:englishNames[record.name]||record.name,category:record.category,categoryLabel:categories[record.category]||record.category,
      description,primary:Object.freeze(primary),supporting:Object.freeze(supporting),difficulty,effectiveness
    });
  }).sort((a,b)=>b.effectiveness-a.effectiveness||a.difficulty-b.difficulty||a.name.localeCompare(b.name,"pl"));
  const lookup=new Map();
  items.forEach(item=>{lookup.set(item.name.toLocaleLowerCase("pl-PL"),item);const english=item.displayName.toLocaleLowerCase("en-US");if(!lookup.has(english))lookup.set(english,item);});
  const method=Object.freeze({
    difficulty:"Ocena redakcyjna 1–6 uwzględniająca złożoność techniki, stabilizację i typowe wymagania ruchowe.",
    effectiveness:"Ocena redakcyjna 1–6 opisująca użyteczność ćwiczenia w ogólnym planie siłowym; nie jest pomiarem medycznym ani obietnicą wyniku.",
    source:"ACSM 2026 — Resistance Training Prescription; Exercise is Medicine / ACSM — Resistance Training for Health",
    url:"https://acsm.org/resistance-training-guidelines-update-2026/"
  });
  Object.defineProperty(window,"FitPlanExerciseCatalog",{value:Object.freeze({items:Object.freeze(items),method,get:name=>lookup.get(String(name||"").trim().toLocaleLowerCase("pl-PL"))||null})});
})();
