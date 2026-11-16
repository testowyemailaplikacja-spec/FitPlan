(() => {
  "use strict";
  // Mechanical drafts: deliberately separate from photographic Push-Up and Hip Thrust rigs.
  const joints=["head","neck","shoulderL","shoulderR","elbowL","elbowR","handL","handR","hipL","hipR","kneeL","kneeR","ankleL","ankleR"];
  const shape=(head,neck,sL,sR,eL,eR,hL,hR,hipL,hipR,kL,kR,aL,aR)=>({
    head,neck,shoulderL:sL,shoulderR:sR,elbowL:eL,elbowR:eR,
    handL:hL,handR:hR,hipL,hipR,kneeL:kL,kneeR:kR,ankleL:aL,ankleR:aR
  });
  const bases=Object.freeze({
    stand:shape([400,76],[400,111],[380,139],[420,139],[365,195],[435,195],[363,239],[437,239],[383,224],[417,224],[378,292],[422,292],[375,356],[425,356]),
    seated:shape([392,89],[392,122],[375,150],[410,150],[361,203],[426,203],[358,245],[429,245],[378,245],[413,245],[485,259],[502,259],[480,350],[514,350]),
    bench:shape([280,218],[305,222],[324,229],[337,245],[346,210],[362,223],[365,175],[385,187],[471,230],[491,243],[558,268],[580,268],[552,350],[586,350]),
    floor:shape([273,309],[302,306],[324,299],[340,287],[360,272],[370,281],[395,253],[411,263],[475,288],[492,275],[566,252],[589,242],[612,345],[640,345]),
    plank:shape([251,259],[282,258],[306,257],[322,257],[333,300],[345,300],[350,350],[365,350],[465,266],[481,266],[551,286],[563,286],[619,352],[639,352]),
    quad:shape([266,229],[300,230],[329,237],[340,248],[333,288],[347,299],[336,352],[351,352],[468,233],[485,246],[476,313],[505,313],[479,354],[514,354]),
    hang:shape([399,153],[400,184],[381,204],[419,204],[378,132],[423,132],[375,65],[425,65],[382,272],[418,272],[380,318],[420,318],[378,365],[423,365]),
    side:shape([252,263],[287,265],[317,267],[327,279],[331,304],[337,307],[350,352],[364,352],[478,274],[488,284],[562,296],[572,306],[642,350],[649,353])
  });
  const patterns={
    heelWalk:{base:"stand",label:"Marsz na piętach",cue:"Utrzymuj kontakt pięty z podłożem; schemat pokazuje tylko etap kroku.",delta:{ankleL:[-24,-10],kneeL:[-16,-3],ankleR:[25,0]}},
    toeRaise:{base:"stand",label:"Zgięcie grzbietowe stopy",cue:"Unieś przodostopie, nie unosząc pięty; ruch palców jest tutaj uproszczony.",delta:{ankleL:[0,-8],ankleR:[0,-8]}},
    depression:{base:"stand",label:"Obniżanie łopatek",cue:"Opuść łopatki bez pochylenia szyi lub nadmiernego napięcia ramion.",delta:{shoulderL:[0,12],shoulderR:[0,12],elbowL:[0,12],elbowR:[0,12],handL:[0,12],handR:[0,12]}},
    forearmRotate:{base:"seated",label:"Rotacja przedramion",cue:"Obracaj przedramię bez poruszania łokciem; orientacja dłoni jest schematyczna.",delta:{handL:[24,-17],handR:[-24,-17]}},
    fingers:{base:"seated",label:"Prostowanie palców",cue:"Szkic nie przedstawia oddzielnych stawów palców; wymaga szczegółowego modelu dłoni.",delta:{handL:[-7,-7],handR:[7,-7]}},
    hollow:{base:"floor",label:"Hollow Body",cue:"Unieś lekko barki i nogi przy stabilnym tułowiu, bez wymuszonego przeprostu.",delta:{head:[13,-16],neck:[10,-11],kneeL:[-10,-24],kneeR:[-10,-24],ankleL:[-60,-45],ankleR:[-60,-45]}},
    scapPush:{base:"plank",label:"Wysunięcie łopatek w podporze",cue:"Wypchnij klatkę od podłoża, nie zginając łokci i nie zapadając biodrami.",delta:{shoulderL:[-5,-9],shoulderR:[-5,-9],neck:[-5,-9],head:[-5,-9]}},
    squat:{base:"stand",label:"Zgięcie i wyprost nóg",cue:"Utrzymuj stabilne stopy, prowadź kolana zgodnie z kierunkiem palców.",delta:{
      head:[0,45],neck:[0,47],shoulderL:[0,48],shoulderR:[0,48],elbowL:[-16,42],elbowR:[16,42],handL:[-12,22],handR:[12,22],hipL:[0,62],hipR:[0,62],kneeL:[-21,8],kneeR:[21,8]}},
    lunge:{base:"stand",label:"Wykrok",cue:"Utrzymuj równowagę, zginając oba kolana i kontrolując położenie bioder.",delta:{
      head:[0,35],neck:[0,33],shoulderL:[0,33],shoulderR:[0,33],hipL:[0,44],hipR:[0,44],kneeL:[-90,9],kneeR:[60,9],ankleL:[-102,0],ankleR:[80,0],elbowL:[-8,29],elbowR:[8,29],handL:[-8,27],handR:[8,27]}},
    hinge:{base:"stand",label:"Zgięcie w biodrach",cue:"Cofnij biodra i pochyl tułów, unikając zaokrąglania pleców.",delta:{
      head:[-105,125],neck:[-102,118],shoulderL:[-93,102],shoulderR:[-93,102],elbowL:[-90,70],elbowR:[-88,70],handL:[-92,75],handR:[-88,75],hipL:[12,0],hipR:[12,0],kneeL:[-4,6],kneeR:[-4,6]}},
    calf:{base:"stand",label:"Wspięcie",cue:"Unieś pięty, zachowując wyprostowaną postawę i stabilną kontrolę.",delta:{
      head:[0,-20],neck:[0,-20],shoulderL:[0,-20],shoulderR:[0,-20],elbowL:[0,-20],elbowR:[0,-20],handL:[0,-20],handR:[0,-20],hipL:[0,-20],hipR:[0,-20],kneeL:[0,-16],kneeR:[0,-16],ankleL:[0,-5],ankleR:[0,-5]}},
    seatedCalf:{base:"seated",label:"Wspięcie w siadzie",cue:"Unoś pięty w pozycji siedzącej, nie szarpiąc kolanami.",delta:{kneeL:[0,-9],kneeR:[0,-9],ankleL:[2,-18],ankleR:[2,-18]}},
    step:{base:"stand",label:"Wejście na stopień",cue:"Przenieś ciężar na nogę wykroczną i spokojnie unieś ciało.",delta:{
      head:[0,-28],neck:[0,-28],shoulderL:[0,-28],shoulderR:[0,-28],hipL:[0,-28],hipR:[0,-28],
      kneeL:[-58,-41],ankleL:[-59,-40],kneeR:[0,0],ankleR:[0,0],elbowL:[-14,-31],elbowR:[14,-31],handL:[-13,-30],handR:[13,-30]}},
    kneeRaise:{base:"stand",label:"Uniesienie kolana",cue:"Unieś jedno kolano, utrzymując miednicę i tułów stabilnie.",delta:{kneeL:[-58,-81],ankleL:[-73,-76],elbowR:[-15,-9],handR:[-17,-15]}},
    walk:{base:"stand",label:"Krok",cue:"Przenoś ciężar w kontrolowany sposób; ten podgląd pokazuje jeden krok.",delta:{kneeL:[-40,-22],ankleL:[-65,-4],kneeR:[36,-6],ankleR:[68,0],elbowL:[28,0],handL:[34,0],elbowR:[-26,0],handR:[-30,0]}},
    sideStep:{base:"stand",label:"Krok w bok",cue:"Przesuwaj stopy w bok, nie tracąc równowagi.",delta:{hipL:[-9,5],hipR:[-9,5],kneeL:[-30,8],kneeR:[28,8],ankleL:[-73,0],ankleR:[50,0]}},
    jump:{base:"stand",label:"Odbicie",cue:"Wybicie i lądowanie kontroluj obunóż, miękko uginając kolana.",delta:Object.fromEntries(joints.map(key=>[key,[0,-47]]))},
    ankle:{base:"seated",label:"Ruch stopy",cue:"Poruszaj stopą powoli w wygodnym zakresie, bez przestawiania kolana.",delta:{ankleL:[-16,-18],ankleR:[14,-18]}},
    abduction:{base:"stand",label:"Odwodzenie biodra",cue:"Odsuń nogę od osi ciała bez przechylania tułowia.",delta:{kneeL:[-45,7],ankleL:[-81,-5]}},
    adduction:{base:"stand",label:"Przywodzenie biodra",cue:"Przemieszczaj nogę do środka, utrzymując stabilny tułów.",delta:{kneeL:[28,4],ankleL:[59,3]}},
    hipRotation:{base:"seated",label:"Rotacja biodra",cue:"Obracaj udo w kontrolowanym zakresie, bez wymuszonego skrętu kolana.",delta:{kneeL:[-32,-23],ankleL:[-55,-15]}},
    clamshell:{base:"side",label:"Otwarcie kolana",cue:"Unoś górne kolano przy nieruchomej miednicy i złączonych stopach.",delta:{kneeR:[-15,-63],hipR:[0,0]}},
    legExtension:{base:"seated",label:"Wyprost kolana",cue:"Wyprostuj kolano w kontrolowanym zakresie, bez szarpnięcia.",delta:{ankleL:[74,-78],ankleR:[77,-82]}},
    legCurl:{base:"stand",label:"Zgięcie kolana",cue:"Zginaj kolano bez przesuwania uda i przechylania tułowia.",delta:{ankleL:[-21,-96],kneeL:[0,0]}},
    push:{base:"bench",label:"Wyciskanie",cue:"Prowadź sztangę w stabilnym torze ponad klatką, kontrolując łopatki i pełen zakres łokci.",startOffset:{elbowL:[8,65],elbowR:[27,62],handL:[0,43],handR:[0,31]},delta:{elbowL:[0,-45],elbowR:[0,-45],handL:[-12,-90],handR:[12,-90]}},
    fly:{base:"bench",label:"Rozpięcie ramion",cue:"Zachowaj lekkie ugięcie łokci i prowadź ramiona szerokim łukiem.",delta:{elbowL:[-50,0],elbowR:[50,0],handL:[-103,28],handR:[103,28]}},
    overhead:{base:"stand",label:"Wyciskanie nad głowę",cue:"Unieś ręce ponad głowę bez nadmiernego wyginania odcinka lędźwiowego.",delta:{elbowL:[-1,-68],elbowR:[1,-68],handL:[-2,-146],handR:[2,-146]}},
    armRaise:{base:"stand",label:"Unoszenie ramion",cue:"Unieś ramiona spokojnie, nie unosząc nadmiernie barków.",delta:{elbowL:[-48,-45],elbowR:[48,-45],handL:[-104,-84],handR:[104,-84]}},
    shoulder:{base:"stand",label:"Kontrola łopatki",cue:"Poruszaj obręczą barkową w niewielkim, kontrolowanym zakresie.",delta:{shoulderL:[-4,-16],shoulderR:[4,-16],elbowL:[-4,-16],elbowR:[4,-16],handL:[-4,-16],handR:[4,-16]}},
    external:{base:"stand",label:"Rotacja ramienia",cue:"Utrzymuj łokcie blisko tułowia, obracaj przedramiona bez skręcania barków.",delta:{elbowL:[-7,0],elbowR:[7,0],handL:[-68,-39],handR:[68,-39]}},
    pull:{base:"stand",label:"Przyciąganie",cue:"Cofaj łokcie i ściągaj łopatki; nie szarp tułowiem.",delta:{elbowL:[-8,-11],elbowR:[8,-11],handL:[25,-38],handR:[-25,-38]}},
    row:{base:"stand",label:"Wiosłowanie",cue:"Utrzymuj stabilny tułów i prowadź łokcie w tył.",delta:{head:[-55,48],neck:[-50,43],shoulderL:[-48,35],shoulderR:[-48,35],hipL:[0,0],hipR:[0,0],elbowL:[-27,32],elbowR:[-25,32],handL:[0,-28],handR:[0,-28]}},
    pullUp:{base:"hang",label:"Podciąganie",cue:"Podnieś ciało pracą ramion i pleców, bez bujania nogami.",delta:{head:[0,-62],neck:[0,-62],shoulderL:[0,-61],shoulderR:[0,-61],elbowL:[-6,-25],elbowR:[6,-25],hipL:[0,-61],hipR:[0,-61],kneeL:[0,-60],kneeR:[0,-60],ankleL:[0,-56],ankleR:[0,-56]}},
    pulldown:{base:"seated",label:"Ściąganie drążka",cue:"Rozpocznij od drążka ponad głową, prowadź łokcie w dół bez szarpania tułowiem.",startOffset:{elbowL:[-20,-85],elbowR:[20,-85],handL:[-27,-164],handR:[27,-164]},delta:{elbowL:[20,29],elbowR:[-20,29],handL:[29,90],handR:[-29,90]}},
    facePull:{base:"stand",label:"Przyciąganie do twarzy",cue:"Prowadź łokcie szeroko, przyciągając dłonie w okolice skroni.",delta:{elbowL:[-43,-41],elbowR:[43,-41],handL:[-30,-98],handR:[30,-98]}},
    curl:{base:"stand",label:"Zginanie łokci",cue:"Utrzymuj ramiona blisko tułowia, pracuj przedramionami.",delta:{handL:[12,-75],handR:[-12,-75]}},
    triceps:{base:"stand",label:"Prostowanie łokci",cue:"Wyprostuj przedramiona, utrzymując łokcie stabilnie przy bokach.",startOffset:{handL:[17,-84],handR:[-17,-84]},delta:{handL:[0,90],handR:[0,90]}},
    dip:{base:"stand",label:"Obniżenie tułowia",cue:"Opuszczaj tułów między poręczami, pozostawiając stopy nad podłożem i dłonie na podporach.",startOffset:Object.fromEntries(joints.map(joint=>[joint,[0,-45]])),delta:{head:[0,36],neck:[0,36],shoulderL:[0,36],shoulderR:[0,36],hipL:[0,36],hipR:[0,36],kneeL:[0,36],kneeR:[0,36],ankleL:[0,36],ankleR:[0,36],elbowL:[-19,6],elbowR:[19,6]}},
    wrist:{base:"seated",label:"Ruch nadgarstka",cue:"Poruszaj dłonią powoli, utrzymując przedramię nieruchomo.",delta:{handL:[0,-24],handR:[0,-24]}},
    plank:{base:"plank",label:"Utrzymanie podporu",cue:"Stabilizuj tułów, nie wykonując zbędnych ruchów biodrami.",delta:{}},
    sidePlank:{base:"side",label:"Utrzymanie deski bocznej",cue:"Utrzymaj linię bark–biodro–stopa i nie opadaj biodrami.",delta:{}},
    copenhagen:{base:"side",label:"Uniesienie bioder bokiem",cue:"Unieś biodra z podparcia na przedramieniu i nodze, zachowując kontrolę.",delta:{hipL:[0,-29],hipR:[0,-29],kneeL:[0,-24],kneeR:[0,-24]}},
    crunch:{base:"floor",label:"Zgięcie tułowia",cue:"Unoś łopatki siłą mięśni brzucha, unikając ciągnięcia szyi.",delta:{head:[49,-52],neck:[39,-48],shoulderL:[35,-42],shoulderR:[35,-42],elbowL:[38,-42],elbowR:[38,-42],handL:[35,-42],handR:[35,-42]}},
    legRaise:{base:"floor",label:"Unoszenie nóg",cue:"Unoś nogi bez odrywania lędźwi i kołysania tułowiem.",delta:{kneeL:[-10,-69],kneeR:[-10,-69],ankleL:[-75,-170],ankleR:[-75,-170]}},
    deadBug:{base:"floor",label:"Naprzemienne opuszczanie kończyn",cue:"Prowadź przeciwległe kończyny w przeciwnych kierunkach, utrzymując tułów nieruchomo.",delta:{handL:[-25,-105],handR:[-25,-105],kneeR:[52,-26],ankleR:[83,-20]}},
    birdDog:{base:"quad",label:"Wyprost przeciwległych kończyn",cue:"Wyciągnij przeciwległą rękę i nogę bez rotacji bioder.",delta:{handL:[-118,-96],elbowL:[-76,-49],kneeR:[41,-16],ankleR:[120,-77]}},
    rollout:{base:"quad",label:"Wysunięcie ramion",cue:"Przesuń dłonie do przodu, utrzymując napięty brzuch i kontrolując odcinek lędźwiowy.",delta:{handL:[-98,0],handR:[-103,0],elbowL:[-65,-13],elbowR:[-65,-13],head:[-50,9],neck:[-51,8],shoulderL:[-50,9],shoulderR:[-50,9]}},
    woodchop:{base:"stand",label:"Skręt i przekątne przyciąganie",cue:"Wykonuj ruch ukośnie z kontrolą bioder i tułowia.",delta:{handL:[80,-88],handR:[80,-88],elbowL:[60,-43],elbowR:[60,-43],shoulderL:[14,-8],shoulderR:[-9,6]}},
    antiRotation:{base:"stand",label:"Stabilizacja antyrotacyjna",cue:"Odsuń dłonie od mostka i utrzymaj stabilną miednicę.",delta:{handL:[-4,-55],handR:[4,-55],elbowL:[0,-20],elbowR:[0,-20]}},
    rotation:{base:"stand",label:"Kontrolowana rotacja",cue:"Skręć tułów w niewielkim zakresie bez wymuszonego ruchu kolan.",delta:{shoulderL:[33,1],shoulderR:[-23,1],elbowL:[30,-4],elbowR:[-24,-4],handL:[25,-10],handR:[-19,-10]}},
    balance:{base:"stand",label:"Równowaga jednonóż",cue:"Utrzymuj środek ciężkości nad stopą podporową.",delta:{kneeL:[-35,-52],ankleL:[-29,-96]}},
    staticHold:{base:"stand",label:"Utrzymanie pozycji",cue:"To ćwiczenie izometryczne; suwak pokazuje fazy utrzymania, a nie sztuczny ruch.",delta:{}},
    breathing:{base:"seated",label:"Oddech przeponowy",cue:"Oddychaj spokojnie, unikając unoszenia barków; schemat nie mierzy objętości oddechu.",delta:{shoulderL:[-2,-3],shoulderR:[2,-3],hipL:[-1,0],hipR:[1,0]}},
    shrug:{base:"stand",label:"Uniesienie barków",cue:"Unieś obręcz barkową, nie pochylając głowy.",delta:{shoulderL:[0,-25],shoulderR:[0,-25],elbowL:[0,-22],elbowR:[0,-22],handL:[0,-22],handR:[0,-22]}},
    backExtension:{base:"bench",label:"Wyprost tułowia",cue:"Prostuj tułów w biodrach, unikając przeprostu odcinka lędźwiowego.",delta:{head:[25,-63],neck:[24,-59],shoulderL:[20,-55],shoulderR:[20,-55],elbowL:[24,-56],elbowR:[24,-56],handL:[24,-56],handR:[24,-56]}},
    hang:{base:"hang",label:"Zwis",cue:"Utrzymuj aktywne barki i stabilny chwyt; ruch nie jest wymagany.",delta:{}}
  };
  // Articulations unavailable to the fourteen-point skeleton are drawn as
  // local equipment/hand rotations; ankles and elbows must not translate.
  patterns.ankleEversion={base:"seated",label:"Ewersja stopy",cue:"Odchyl podeszwę stopy na zewnątrz przy nieruchomym stawie skokowym.",delta:{}};
  patterns.ankleInversion={base:"seated",label:"Inwersja stopy",cue:"Odchyl podeszwę stopy do wewnątrz bez przesuwania kolana.",delta:{}};
  patterns.wristExtension={base:"seated",label:"Wyprost nadgarstka",cue:"Unieś dłoń względem przedramienia, trzymając łokieć nieruchomo.",delta:{}};
  patterns.wristCurl={base:"seated",label:"Zgięcie nadgarstka",cue:"Opuść dłoń względem przedramienia, trzymając łokieć nieruchomo.",delta:{}};
  // Separate frontal-plane band patterns. These are deliberately not a sideways
  // translation of the photographic Push-Up or the landmark Hip Thrust.
  patterns.lateralBandWalk={base:"stand",label:"Chód bokiem z taśmą",
    cue:"Pozostań w lekkim półprzysiadzie; zrób krok jedną nogą, utrzymując napięcie taśmy.",
    delta:{head:[13,10],neck:[13,10],shoulderL:[13,10],shoulderR:[13,10],
      elbowL:[13,10],elbowR:[13,10],handL:[13,10],handR:[13,10],
      hipL:[13,13],hipR:[13,13],kneeL:[2,9],kneeR:[40,9],ankleR:[67,0]}};
  patterns.monsterWalk={base:"stand",label:"Monster Walk",
    cue:"Zachowaj ugięte kolana i napiętą taśmę; krok wykonuj po skosie, bez zapadania kolan.",
    delta:{head:[8,15],neck:[8,15],shoulderL:[8,15],shoulderR:[8,15],
      elbowL:[8,15],elbowR:[8,15],handL:[8,15],handR:[8,15],
      hipL:[8,20],hipR:[8,20],kneeL:[-20,13],kneeR:[35,13],ankleR:[55,-12]}};
  // Keep close variants mechanically distinct, including starting stance.
  patterns.sumoSquat={...patterns.squat,label:"Przysiad sumo",
    startOffset:{ankleL:[-43,0],ankleR:[43,0],kneeL:[-22,0],kneeR:[22,0]},
    delta:{...patterns.squat.delta,kneeL:[-29,8],kneeR:[29,8]}};
  patterns.step.startOffset={head:[0,40],neck:[0,40],shoulderL:[0,40],shoulderR:[0,40],elbowL:[0,40],elbowR:[0,40],handL:[0,40],handR:[0,40],hipL:[0,40],hipR:[0,40],kneeL:[-49,0],kneeR:[49,0]};
  patterns.step.delta={...patterns.step.delta,head:[0,-45],neck:[0,-45],shoulderL:[0,-45],shoulderR:[0,-45],elbowL:[-14,-45],elbowR:[14,-45],handL:[-13,-45],handR:[13,-45],hipL:[0,-45],hipR:[0,-45]};
  patterns.inclinePush={...patterns.push,label:"Wyciskanie hantli na ławce dodatniej",startOffset:{head:[0,-65],neck:[0,-60],shoulderL:[0,-60],shoulderR:[0,-60],elbowL:[4,0],elbowR:[-4,0],handL:[15,24],handR:[7,25]},delta:{elbowL:[-17,-65],elbowR:[-12,-65],handL:[-34,-94],handR:[-24,-92]}};
  patterns.landmine={...patterns.overhead,label:"Wyciskanie sztangi typu landmine",cue:"Prowadź sztangę po łuku z nieruchomego punktu zaczepienia, nie unosząc barków.",delta:{...patterns.overhead.delta,elbowL:[-10,-28],elbowR:[-10,-70],handL:[-14,-40],handR:[23,-112]}};
  patterns.arnold={...patterns.overhead,label:"Wyciskanie Arnolda",
    delta:{...patterns.overhead.delta,elbowL:[-18,-65],elbowR:[18,-65],handL:[-26,-140],handR:[26,-140]}};
  patterns.facePullRotated={...patterns.facePull,label:"Face Pull z rotacją zewnętrzną",
    delta:{...patterns.facePull.delta,handL:[-64,-112],handR:[64,-112]}};
  function build(pattern,{amplitude=1,mirror=false}={}) {
    const source=patterns[pattern];if(!source)throw Error("Unknown FitPlan pattern: "+pattern);
    const start=JSON.parse(JSON.stringify(bases[source.base]));
    for(const [joint,offset] of Object.entries(source.startOffset||{})){
      start[joint]=[start[joint][0]+offset[0],start[joint][1]+offset[1]];
    }
    const finish=JSON.parse(JSON.stringify(start));
    for(const [joint,[x,y]] of Object.entries(source.delta)){
      finish[joint]=[start[joint][0]+x*amplitude,start[joint][1]+y*amplitude];
    }
    if(mirror){
      // Mirror pose around the vertical middle of the artwork, without changing source templates.
      for(const pose of [start,finish])for(const joint of joints)pose[joint][0]=800-pose[joint][0];
    }
    return {poses:[start,finish],label:source.label,cue:source.cue,base:source.base};
  }
  Object.defineProperty(window,"FitPlanMotionTemplates",{value:Object.freeze({build,patterns:Object.freeze(Object.keys(patterns)),joints:Object.freeze(joints)})});
})();
