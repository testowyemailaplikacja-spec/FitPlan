(() => {
  "use strict";
  // Continuous, length-preserving planar linkage for the Hip Thrust landmarks.
  // The scene is an anatomical *draft*, not a validated 3-D motion capture.
  const joints=["shoulder","hip","knee","ankle","elbow","hand","neck","head"];
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function twoLink(start,end,upper,lower,aim,allowEndCorrection) {
    const dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy);
    const vector=length>1e-7?[dx/length,dy/length]:[1,0];
    const limited=Math.max(Math.abs(upper-lower)+1e-7,Math.min(upper+lower-1e-7,length));
    if(!allowEndCorrection&&Math.abs(limited-length)>0.05)throw new Error("Unsupported Hip Thrust linkage");
    const safeEnd=allowEndCorrection?[start[0]+vector[0]*limited,start[1]+vector[1]*limited]:end.slice();
    const projection=(upper*upper-lower*lower+limited*limited)/(2*limited);
    const height=Math.sqrt(Math.max(0,upper*upper-projection*projection));
    const center=[start[0]+vector[0]*projection,start[1]+vector[1]*projection];
    const a=[center[0]-vector[1]*height,center[1]+vector[0]*height];
    const b=[center[0]+vector[1]*height,center[1]-vector[0]*height];
    return {middle:dist(a,aim)<=dist(b,aim)?a:b,end:safeEnd};
  }
  function pose(visual,sample) {
    const base=visual.poses[0],a=visual.poses[sample.from],b=visual.poses[sample.to];
    if(!a||!b)return null;
    const t=sample.mix,p={};
    for(const key of joints)p[key]=[a[key][0]+(b[key][0]-a[key][0])*t,a[key][1]+(b[key][1]-a[key][1])*t];
    // Rotate the torso rigidly around a fixed upper-back pivot.
    const radius=dist(base.shoulder,base.hip);
    const from=Math.atan2(a.hip[1]-a.shoulder[1],a.hip[0]-a.shoulder[0]);
    const to=Math.atan2(b.hip[1]-b.shoulder[1],b.hip[0]-b.shoulder[0]);
    const angle=from+(to-from)*t;
    p.shoulder=base.shoulder.slice();p.ankle=base.ankle.slice();
    p.hip=[p.shoulder[0]+radius*Math.cos(angle),p.shoulder[1]+radius*Math.sin(angle)];
    const thigh=dist(base.hip,base.knee),shin=dist(base.knee,base.ankle);
    const leg=twoLink(p.hip,p.ankle,thigh,shin,p.knee,false);p.knee=leg.middle;
    // The hands follow the padded bar above the pelvis; the elbows are solved
    // from fixed arm lengths, so the drawing cannot elongate a forearm.
    const barGrip=[p.hip[0]+(p.hand[0]-p.hip[0]),p.hip[1]-19];
    const arm=twoLink(p.shoulder,barGrip,dist(base.shoulder,base.elbow),
      dist(base.elbow,base.hand),p.elbow,true);
    p.elbow=arm.middle;p.hand=arm.end;
    p.head=base.head.slice();p.neck=base.neck.slice();
    return p;
  }
  Object.defineProperty(window,"FitPlanLandmarkConstraints",{value:Object.freeze({pose,dist})});
})();