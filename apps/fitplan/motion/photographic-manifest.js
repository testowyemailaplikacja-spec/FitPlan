globalThis.FitPlanPhotographicManifest = {
  "schemaVersion":1,
  "referenceExerciseId":"push-up",
  "actors":[{
    "id":"fitplan-athlete-01",
    "name":"FitPlan Athlete",
    "medium":"original-generated-photography",
    "reference":"./assets/motion/push-up-v1/athlete.webp",
    "appearance":"Adult athlete, short dark hair and stubble, graphite T-shirt, black shorts, white ankle socks, grey trainers",
    "camera":"Fixed side view; full body; neutral studio; soft daylight"
  },{"id":"fitplan-athlete-side-step-01","name":"FitPlan Side Step Athlete","medium":"original-generated-photography","reference":"./assets/motion/side-step-v2/athlete.webp","appearance":"Adult athletic woman, high brown ponytail, black sports bra and black leggings, white training shoes","camera":"Fixed front view, full body, neutral grey studio"}],
  "exercises":[{
    "id":"push-up",
    "aliases":["Pompki","Push Up"],
    "actorId":"fitplan-athlete-01",
    "category":"chest",
    "title":"Push-Up",
    "subtitle":"Pompki — pełne powtórzenie",
    "visual":{
      "kind":"photographic-sequence",
      "atlas":"./assets/motion/push-up-v1/athlete.webp",
      "width":724,
      "height":362,
      "columns":2,
      "rows":3,
      "flow":{
        "url":"./assets/motion/push-up-v1/flow.png",
        "width":362,
        "height":181,
        "columns":4,
        "rows":5,
        "pairs":[[0,1],[1,2],[2,3],[3,4],[4,5]]
      }
    },
    "sequence":[0,1,2,3,4,5,4,3,2,1,0],
    "markers":[{"at":0,"label":"Podpór"},{"at":0.5,"label":"Dół"},{"at":1,"label":"Podpór"}],
    "phases":[
      {"at":0,"label":"Pozycja startowa","cue":"Oprzyj dłonie pod barkami. Napnij brzuch i pośladki; utrzymuj głowę w przedłużeniu tułowia."},
      {"at":0.25,"label":"Kontrolowane zejście","cue":"Uginaj łokcie, prowadząc je w stronę bioder. Klatka piersiowa i biodra opuszczają się razem."},
      {"at":0.5,"label":"Dół ruchu","cue":"Klatka pozostaje tuż nad podłożem. Dłonie i palce stóp są stabilne, a środek ciała napięty."},
      {"at":0.75,"label":"Powrót do podporu","cue":"Odepchnij podłoże i wyprostuj ramiona. Unieś całe ciało równocześnie, bez wyprzedzania ruchu biodrami."}
    ],
    "review":{
      "status":"reviewed",
      "fixedSupports":["left-hand","right-hand","left-foot","right-foot"],
      "checks":["identity","camera","supports","joint-path","endpoints","continuity"]
    }
  },{
    "id":"hip-thrust",
    "aliases":["Hip thrust","Hip Thrust","Barbell Hip Thrust","Wypychanie bioder na ławce"],
    "actorId":"fitplan-athlete-01",
    "category":"glutes",
    "title":"Hip Thrust",
    "subtitle":"Hip Thrust — wyprost biodra z barkami na ławce",
    "visual":{
      "kind":"photographic-sequence",
      "atlas":"./assets/motion/hip-thrust-v1/athlete.webp",
      "width":724,
      "height":362,
      "columns":2,
      "rows":3,
      "flow":{
        "url":"./assets/motion/hip-thrust-v1/flow.png",
        "width":362,
        "height":181,
        "columns":4,
        "rows":5,
        "pairs":[[0,1],[1,2],[2,3],[3,4],[4,5]]
      }
    },
    "sequence":[0,1,2,3,4,5,4,3,2,1,0],
    "markers":[{"at":0,"label":"Dół"},{"at":0.5,"label":"Pełny wyprost"},{"at":1,"label":"Dół"}],
    "phases":[
      {"at":0,"label":"Pozycja dolna","cue":"Oprzyj górną część pleców na stabilnej ławce. Ustaw całe stopy płasko, kolana ugięte, brodę lekko przyciągnij."},
      {"at":0.25,"label":"Unoszenie bioder","cue":"Prowadź ruch wyprostem bioder. Napnij brzuch, nie odbijaj od podłogi i nie odchylaj głowy do tyłu."},
      {"at":0.5,"label":"Pełny wyprost","cue":"Unieś biodra do linii z tułowiem i udami. Piszczel jest zbliżona do pionu; napnij pośladki bez przeprostu lędźwi."},
      {"at":0.75,"label":"Kontrolowane opuszczanie","cue":"Powoli opuść biodra, zachowując nieruchome stopy i barki na ławce. Utrzymuj kontrolę miednicy do końca ruchu."}
    ],
    "review":{
      "status":"reviewed",
      "fixedSupports":["upper-back","left-foot","right-foot"],
      "checks":["identity","camera","supports","joint-path","endpoints","continuity"]
    }
  },{"id":"side-step","aliases":["Chód bokiem","Side Steps","Side Step"],"actorId":"fitplan-athlete-side-step-01","category":"legs","title":"Side Steps","subtitle":"Side Step — krok w bok i kontrolowany powrót","visual":{"kind":"photographic-sequence","atlas":"./assets/motion/side-step-v2/athlete.webp","width":512,"height":512,"columns":3,"rows":2,"flow":{"url":"./assets/motion/side-step-v2/flow.png","width":256,"height":256,"columns":4,"rows":5,"pairs":[[0,1],[1,2],[2,3],[3,4],[4,5]]}},"sequence":[0,1,2,3,4,5,4,3,2,1,0],"markers":[{"at":0,"label":"Pozycja startowa"},{"at":0.25,"label":"Krok w bok"},{"at":0.5,"label":"Szeroka pozycja"},{"at":1,"label":"Powrót"}],"phases":[{"at":0,"label":"Pozycja startowa","cue":"Stań stabilnie z nogami mniej więcej na szerokość bioder. Utrzymaj tułów pionowo i lekko ugnij kolana."},{"at":0.25,"label":"Odstawienie nogi","cue":"Odstaw jedną stopę na bok i przenieś na nią część ciężaru. Stopy kieruj do przodu, a kolana prowadź zgodnie z ich ustawieniem."},{"at":0.5,"label":"Szeroka pozycja","cue":"Utrzymaj kontrolowane ugięcie kolan i stabilny tułów. Nie zapadaj kolan do środka ani nie pochylaj gwałtownie pleców."},{"at":0.75,"label":"Powrót nogi wykonującej krok","cue":"Przenieś ciężar z powrotem na nogę podporową i wróć nogą wykonującą krok do pozycji początkowej."}],"review":{"status":"reviewed","fixedSupports":["ground-contact"],"checks":["identity","camera","supports","joint-path","endpoints","continuity"]}}]
};
