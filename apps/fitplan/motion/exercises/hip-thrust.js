(() => {
  "use strict";
  const library=window.FitPlanMotionLibrary;
  library.registerExercise({
    id:"hip-thrust",aliases:["Hip thrust","Hip Thrust","Barbell Hip Thrust","Wypychanie bioder na ławce"],
    actorId:"fitplan-athlete-01",category:"glutes",title:"Hip Thrust",
    subtitle:"Hip Thrust — wyprost biodra z barkami na ławce",
    visual:{
      atlas:"./assets/motion/hip-thrust-v1/athlete.webp",width:724,height:362,columns:2,rows:3,
      flow:{url:"./assets/motion/hip-thrust-v1/flow.png",width:362,height:181,columns:4,rows:5,
        pairs:[[0,1],[1,2],[2,3],[3,4],[4,5]]}
    },
    keyframes:[0,1,2,3,4,5,4,3,2,1,0].map((frame,index)=>({at:index/10,frame})),
    markers:[{at:0,label:"Dół"},{at:.5,label:"Pełny wyprost"},{at:1,label:"Dół"}],
    phases:[
      {at:0,label:"Pozycja dolna",cue:"Oprzyj górną część pleców na stabilnej ławce. Ustaw całe stopy płasko, kolana ugięte, brodę lekko przyciągnij."},
      {at:.25,label:"Unoszenie bioder",cue:"Prowadź ruch wyprostem bioder. Napnij brzuch, nie odbijaj od podłogi i nie odchylaj głowy do tyłu."},
      {at:.5,label:"Pełny wyprost",cue:"Unieś biodra do linii z tułowiem i udami. Piszczel jest zbliżona do pionu; napnij pośladki bez przeprostu lędźwi."},
      {at:.75,label:"Kontrolowane opuszczanie",cue:"Powoli opuść biodra, zachowując nieruchome stopy i barki na ławce. Utrzymuj kontrolę miednicy do końca ruchu."}
    ]
  });
})();
