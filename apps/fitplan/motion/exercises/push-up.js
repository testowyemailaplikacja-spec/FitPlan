(() => {
  "use strict";
  const library = window.FitPlanMotionLibrary;
  library.registerActor({
    id: "fitplan-athlete-01", name: "FitPlan Athlete", medium: "original-generated-photography",
    reference: "./assets/motion/push-up-v1/athlete.webp",
    appearance: "Adult athlete, short dark hair and stubble, graphite T-shirt, black shorts, white ankle socks, grey trainers",
    camera: "Fixed side view; full body; neutral studio; soft daylight"
  });
  library.registerExercise({
    id: "push-up", aliases: ["Pompki", "Push Up"], actorId: "fitplan-athlete-01", category: "chest",
    title: "Push-Up", subtitle: "Pompki — pełne powtórzenie",
    visual: {
      atlas: "./assets/motion/push-up-v1/athlete.webp", width: 724, height: 362, columns: 2, rows: 3,
      flow: { url: "./assets/motion/push-up-v1/flow.png", width: 362, height: 181, columns: 4, rows: 5,
        pairs: [[0,1],[1,2],[2,3],[3,4],[4,5]] }
    },
    keyframes: [0,1,2,3,4,5,4,3,2,1,0].map((frame,index) => ({at:index/10,frame})),
    markers: [{at:0,label:"Podpór"},{at:.5,label:"Dół"},{at:1,label:"Podpór"}],
    phases: [
      {at:0,label:"Pozycja startowa",cue:"Oprzyj dłonie pod barkami. Napnij brzuch i pośladki; utrzymuj głowę w przedłużeniu tułowia."},
      {at:.25,label:"Kontrolowane zejście",cue:"Uginaj łokcie, prowadząc je w stronę bioder. Klatka piersiowa i biodra opuszczają się razem."},
      {at:.5,label:"Dół ruchu",cue:"Klatka pozostaje tuż nad podłożem. Dłonie i palce stóp są stabilne, a środek ciała napięty."},
      {at:.75,label:"Powrót do podporu",cue:"Odepchnij podłoże i wyprostuj ramiona. Unieś całe ciało równocześnie, bez wyprzedzania ruchu biodrami."}
    ]
  });
})();
