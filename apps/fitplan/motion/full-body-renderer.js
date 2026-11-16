(() => {
  "use strict";
  // Dedicated full-body SVG renderer. No clock, animation loop, or photographic asset dependencies.
  const NS="http://www.w3.org/2000/svg";
  const C={head:"head",neck:"neck"};
  const limbs=[
    ["left-thigh","hipL","kneeL",29,"skin"],
    ["left-shin","kneeL","ankleL",23,"skin"],
    ["right-thigh","hipR","kneeR",29,"skin"],
    ["right-shin","kneeR","ankleR",23,"skin"],
    ["torso","midShoulder","midHip",55,"shirt"],
    ["left-arm","shoulderL","elbowL",20,"shirt"],
    ["left-forearm","elbowL","handL",17,"skin"],
    ["right-arm","shoulderR","elbowR",20,"shirt"],
    ["right-forearm","elbowR","handR",17,"skin"],
    ["neck","neck","midShoulder",18,"skin"]
  ];
  function create(host,definition,onState=()=>{}) {
    const doc=host.ownerDocument,visual=definition.visual;
    const svg=doc.createElementNS(NS,"svg");
    svg.classList.add("fitplan-rig-scene","fitplan-fullbody-scene");
    svg.setAttribute("viewBox","0 0 "+visual.width+" "+visual.height);
    svg.setAttribute("preserveAspectRatio","xMidYMid meet");
    svg.setAttribute("aria-hidden","true");
    svg.style.cssText="display:block;position:absolute;inset:0;width:100%;height:100%";
    const templates=window.FitPlanMotionTemplates;
    const node=(tag,attrs={},parent=svg)=>{
      const el=doc.createElementNS(NS,tag);for(const [name,value] of Object.entries(attrs))el.setAttribute(name,String(value));parent.append(el);return el;
    };
    const defs=node("defs");
    const gradient=(id,colors)=>{
      const g=node("linearGradient",{id,x1:"0",y1:"0",x2:"1",y2:"1"},defs);
      colors.forEach(([offset,color])=>node("stop",{offset,"stop-color":color},g));
    };
    gradient("fp-fullbody-skin",[["0%","#e4b498"],["50%","#c58e74"],["100%","#8f5f49"]]);
    gradient("fp-fullbody-shirt",[["0%","#667584"],["45%","#3e4a59"],["100%","#202d3b"]]);
    gradient("fp-fullbody-floor",[["0%","#d7e0e1"],["100%","#c2ccca"]]);
    node("rect",{width:visual.width,height:visual.height,fill:"#c7d0d2"});
    const groundY=({stand:363,seated:357,bench:357,hang:372,floor:352,plank:359,quad:361,side:360})[visual.base]||360;
    node("rect",{x:0,y:groundY,width:800,height:400-groundY,fill:"url(#fp-fullbody-floor)"});
    node("path",{d:"M0 "+groundY+"H800",stroke:"#7c8a8e","stroke-width":2});
    const ground=node("g",{"data-gear":visual.equipment||"none"});
    const staticEquipment=visual.equipment||"none";
    const support=visual.support||visual.equipment||"none";
    const parts=[];
    const armature=node("g",{"data-part":"body"});
    for(const [key,from,to,width,paint] of limbs) {
      const el=node("line",{"data-segment":key,"stroke":"url(#fp-fullbody-"+paint+")","stroke-width":width,"stroke-linecap":"round"},armature);
      parts.push([el,from,to]);
    }
    const pelvis=node("line",{"stroke":"#272f3a","stroke-width":42,"stroke-linecap":"round"},armature);
    const face=node("g",{"data-part":"head"},armature);
    const head=node("ellipse",{rx:22,ry:28,fill:"url(#fp-fullbody-skin)",stroke:"#986950","stroke-width":1.5},face);
    const hair=node("path",{d:"M-22 -8Q-24 -32 -3 -31Q17 -31 22 -11Q5 -20 -4 -14Q-17 -12 -22 -8Z",fill:"#25262a"},face);
    const eye=node("circle",{cx:12,cy:-3,r:2,fill:"#2e2926"},face);
    const feet=[node("ellipse",{rx:18,ry:7,fill:"#343e4a"},armature),node("ellipse",{rx:18,ry:7,fill:"#343e4a"},armature)];
    const hands=[node("ellipse",{rx:13,ry:8,fill:"url(#fp-fullbody-skin)"},armature),node("ellipse",{rx:13,ry:8,fill:"url(#fp-fullbody-skin)"},armature)];
    const propGroup=node("g",{"data-part":"moving-equipment"});
    const weight=node("line",{stroke:"#515c69","stroke-width":9,"stroke-linecap":"round"},propGroup);
    const extraWeight=node("line",{stroke:"#515c69","stroke-width":9,"stroke-linecap":"round"},propGroup);
    const discL=node("circle",{r:12,fill:"#263441",stroke:"#8996a1","stroke-width":3},propGroup);
    const discR=node("circle",{r:12,fill:"#263441",stroke:"#8996a1","stroke-width":3},propGroup);
    const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    let disposed=false,latest=null;
    if(["bench","seated","chest-fly","dip"].includes(support)){
      node("rect",{x:260,y:253,width:250,height:17,rx:8,fill:"#323b46"},ground);
      node("path",{d:"M280 268V352 M490 268V352",stroke:"#64717a","stroke-width":16},ground);
    }
    if(support==="incline-bench"){
      node("path",{d:"M282 170L514 268",stroke:"#323b46","stroke-width":18,"stroke-linecap":"round"},ground);
      node("path",{d:"M350 199V352 M490 258V352",stroke:"#64717a","stroke-width":12},ground);
    }
    if(staticEquipment==="step")node("rect",{x:280,y:323,width:112,height:groundY-323,rx:3,fill:"#566572"},ground);
    if(staticEquipment==="wall"){
      node("rect",{x:224,y:25,width:352,height:groundY-25,fill:"#aebec4",opacity:".38"},ground);
      for(let x=232;x<575;x+=58)node("line",{x1:x,y1:25,x2:x,y2:352,stroke:"#7d929a",opacity:".22"},ground);
    }
    if(support==="dip-bars"){
      node("path",{d:"M363 194V"+groundY+" M437 194V"+groundY,stroke:"#65727d","stroke-width":11},ground);
      node("path",{d:"M332 194H385 M415 194H468",stroke:"#344451","stroke-width":13,"stroke-linecap":"round"},ground);
    }
    if(staticEquipment==="bar"||staticEquipment==="cable")
      node("path",{d:staticEquipment==="bar"?"M250 72H550":"M690 74V352",stroke:"#344351","stroke-width":12,"stroke-linecap":"round"},ground);
    if(staticEquipment==="mat")node("rect",{x:210,y:341,width:455,height:12,rx:6,fill:"#729ba1"},ground);
    if(staticEquipment==="wheel")node("circle",{cx:352,cy:340,r:13,stroke:"#313a48","stroke-width":5,fill:"#97a4ab"},ground);
    if(staticEquipment==="band" && !["lateralBandWalk","monsterWalk"].includes(visual.pattern))
      node("path",{d:"M660 220L730 220",stroke:"#2f9b83","stroke-width":6},ground);
    function coord(el,a,b){el.setAttribute("x1",a[0]);el.setAttribute("y1",a[1]);el.setAttribute("x2",b[0]);el.setAttribute("y2",b[1]);}
    function point(el,xy){el.setAttribute("cx",xy[0]);el.setAttribute("cy",xy[1]);}
    function setPose(pose) {
      if(disposed)return;
      latest=pose;
      const p=window.FitPlanPoseConstraints.pose(visual,pose);
      if(!p)return;
      p.midShoulder=midpoint(p.shoulderL,p.shoulderR);
      p.midHip=midpoint(p.hipL,p.hipR);
      for(const [el,from,to] of parts)coord(el,p[from],p[to]);
      coord(pelvis,p.hipL,p.hipR);
      // The head ellipse is local to face. Do not offset it twice.
      // Head-and-shoulders are connected by a separate neck line; face stays upright in these schematic drafts.
      face.setAttribute("transform","translate("+p.head[0]+" "+p.head[1]+")");
      point(feet[0],p.ankleL);point(feet[1],p.ankleR);
      point(hands[0],p.handL);point(hands[1],p.handR);
      const motionPhase=2*Math.min(pose.progress,1-pose.progress);
      const footTilt=({ankleEversion:27,ankleInversion:-27})[visual.pattern]||0;
      const wristTilt=({wristExtension:-36,wristCurl:36})[visual.pattern]||0;
      feet[0].setAttribute("transform","rotate("+(footTilt*motionPhase)+" "+p.ankleL.join(" ")+")");
      hands[0].setAttribute("transform","rotate("+(wristTilt*motionPhase)+" "+p.handL.join(" ")+")");
      hands[1].setAttribute("transform","rotate("+(wristTilt*motionPhase)+" "+p.handR.join(" ")+")");
      svg.dataset.footTilt=String(footTilt*motionPhase);
      svg.dataset.wristTilt=String(wristTilt*motionPhase);
      const hasWeight=["barbell","dumbbell","singleDumbbell","landmine","cable","band"].includes(staticEquipment);
      propGroup.setAttribute("display",hasWeight?"inline":"none");
      if(hasWeight){
        const left=p.handL,right=p.handR;
        if(staticEquipment==="band" && ["lateralBandWalk","monsterWalk"].includes(visual.pattern)){
          coord(weight,p.ankleL,p.ankleR);
          weight.setAttribute("stroke","#2f9b83");
          weight.setAttribute("stroke-width","6");
          extraWeight.setAttribute("display","none");
          discL.setAttribute("display","none");discR.setAttribute("display","none");
        } else {
        const isDumbbell=staticEquipment==="dumbbell"||staticEquipment==="singleDumbbell";
        extraWeight.setAttribute("display",isDumbbell?"inline":"none");
        if(isDumbbell){
          coord(weight,[left[0]-17,left[1]],[left[0]+17,left[1]]);
          coord(extraWeight,[right[0]-17,right[1]],[right[0]+17,right[1]]);
          point(discL,left);point(discR,right);
          if(staticEquipment==="singleDumbbell"){
            extraWeight.setAttribute("display","none");discR.setAttribute("display","none");
          }
        }else if(staticEquipment==="landmine"){
          extraWeight.setAttribute("display","none");
          const pivot=[260,363];
          coord(weight,pivot,right);weight.setAttribute("stroke-width","10");
          point(discL,right);discL.setAttribute("display","inline");
          discR.setAttribute("display","none");
        }else if(staticEquipment==="cable"||staticEquipment==="band"){
          const anchor=staticEquipment==="cable"?(visual.pattern==="pulldown"?[395,50]:[690,74]):[660,220];
          coord(weight,anchor,midpoint(left,right));
          point(discL,left);point(discR,right);
          discL.setAttribute("display","none");discR.setAttribute("display","none");
        }else{
          discL.setAttribute("display","inline");discR.setAttribute("display","inline");
          coord(weight,[left[0],left[1]-3],[right[0],right[1]-3]);
          point(discL,left);point(discR,right);
        }
        }
      }
      svg.dataset.pose=String(Math.round(pose.progress*100));
      svg.dataset.pattern=visual.pattern;
      svg.dataset.hipY=String(Math.round(p.midHip[1]*10)/10);
    }
    host.style.aspectRatio=visual.width+"/"+visual.height;
    host.append(svg);
    host.dataset.renderer="mechanical-draft";
    onState("smooth");
    return Object.freeze({
      loaded:Promise.resolve(),setPose,dispose(){if(disposed)return;disposed=true;svg.remove();}
    });
  }
  Object.defineProperty(window,"FitPlanFullBodyRenderer",{value:Object.freeze({create})});
})();