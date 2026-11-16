(() => {
  "use strict";
  // 2-D constraint pass for exercise drafts. It preserves drawn segment lengths,
  // not a medically validated path, foot pressure, joint rotation or loading.
  const J=["head","neck","shoulderL","shoulderR","elbowL","elbowR","handL","handR",
    "hipL","hipR","kneeL","kneeR","ankleL","ankleR"];
  const span=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const halfway=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const project=(anchor,aim,len,reference)=>{
    let dx=aim[0]-anchor[0],dy=aim[1]-anchor[1],d=Math.hypot(dx,dy);
    if(d<1e-7){dx=reference[0]-anchor[0];dy=reference[1]-anchor[1];d=Math.hypot(dx,dy);}
    if(d<1e-7)return [anchor[0]+len,anchor[1]];
    return [anchor[0]+len*dx/d,anchor[1]+len*dy/d];
  };
  function solveChain(start,aimMiddle,aimEnd,upper,lower,preferredSide) {
    const margin=1e-7;
    let end=aimEnd.slice();
    const dx=end[0]-start[0],dy=end[1]-start[1],raw=Math.hypot(dx,dy);
    const direction=raw>margin?[dx/raw,dy/raw]:[1,0];
    const max=upper+lower,min=Math.abs(upper-lower);
    const d=Math.min(Math.max(raw,min+margin),max-margin);
    if(Math.abs(d-raw)>margin)end=[start[0]+direction[0]*d,start[1]+direction[1]*d];
    const along=(upper*upper-lower*lower+d*d)/(2*d);
    const height=Math.sqrt(Math.max(0,upper*upper-along*along));
    const foot=[start[0]+direction[0]*along,start[1]+direction[1]*along];
    const a=[foot[0]-direction[1]*height,foot[1]+direction[0]*height];
    const b=[foot[0]+direction[1]*height,foot[1]-direction[0]*height];
    // Preserve the original bending direction. Picking the closest intersection
    // independently each frame makes knees/elbows flip instantaneously mid-scrub.
    const middle=preferredSide>=0?a:b;
    return {middle,end};
  }
  function bendSide(p,joint,middle,end){
    const a=[p[end][0]-p[joint][0],p[end][1]-p[joint][1]];
    const b=[p[middle][0]-p[joint][0],p[middle][1]-p[joint][1]];
    return a[0]*b[1]-a[1]*b[0];
  }
  function pose(visual,sample){
    const source=visual.poses[0],a=visual.poses[sample.from],b=visual.poses[sample.to];
    if(!source||!a||!b)return null;
    const out={};
    for(const k of J)out[k]=[
      a[k][0]+(b[k][0]-a[k][0])*sample.mix,
      a[k][1]+(b[k][1]-a[k][1])*sample.mix
    ];
    if(sample.from===0&&sample.to===0&&sample.mix===0)return out;
    // Keep pelvis as the root, preserving both side-specific shoulder-to-hip lengths.
    for(const side of ["L","R"]){
      const hip="hip"+side,shoulder="shoulder"+side;
      out[shoulder]=project(out[hip],out[shoulder],span(source[hip],source[shoulder]),source[shoulder]);
    }
    const anchor=halfway(out.shoulderL,out.shoulderR);
    const baseAnchor=halfway(source.shoulderL,source.shoulderR);
    out.neck=project(anchor,out.neck,span(baseAnchor,source.neck),source.neck);
    out.head=project(out.neck,out.head,span(source.neck,source.head),source.head);
    for(const side of ["L","R"]){
      const hip="hip"+side,knee="knee"+side,ankle="ankle"+side;
      const lower=solveChain(out[hip],out[knee],out[ankle],span(source[hip],source[knee]),span(source[knee],source[ankle]),bendSide(source,hip,knee,ankle));
      out[knee]=lower.middle;out[ankle]=lower.end;
      const shoulder="shoulder"+side,elbow="elbow"+side,hand="hand"+side;
      if(visual.pattern==="landmine" && side==="R"){
        // The bar rotates around a fixed floor pivot and must not telescope.
        const pivot=[260,363],barLength=span(source.handR,pivot);
        out.handR=project(pivot,out.handR,barLength,source.handR);
      }
      const upper=solveChain(out[shoulder],out[elbow],out[hand],span(source[shoulder],source[elbow]),span(source[elbow],source[hand]),bendSide(source,shoulder,elbow,hand));
      out[elbow]=upper.middle;out[hand]=upper.end;
    }
    return out;
  }
  Object.defineProperty(window,"FitPlanPoseConstraints",{value:Object.freeze({pose,span})});
})();