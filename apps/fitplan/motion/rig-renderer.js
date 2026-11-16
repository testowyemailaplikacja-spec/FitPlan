(() => {
  "use strict";
  // The landmark renderer is shared by supported exercises. It never runs on a clock.
  const ns="http://www.w3.org/2000/svg";
  const joints=["shoulder","hip","knee","ankle","elbow","hand","neck","head"];
  function create(host,definition,onState=()=>{}) {
    const doc=host.ownerDocument,visual=definition.visual;
    const svg=doc.createElementNS(ns,"svg");
    svg.setAttribute("viewBox","0 0 "+visual.width+" "+visual.height);
    svg.setAttribute("preserveAspectRatio","xMidYMid meet");
    svg.setAttribute("aria-hidden","true");
    svg.classList.add("fitplan-rig-scene");
    svg.style.cssText="position:absolute;inset:0;display:block;width:100%;height:100%";
    svg.innerHTML=[
      '<defs>',
      '<linearGradient id="fp-rig-back" x2="0" y2="1"><stop stop-color="#e0e5e8"/><stop offset="1" stop-color="#a5aeb4"/></linearGradient>',
      '<linearGradient id="fp-rig-shirt" x1="0" y1="0" x2="0.5" y2="1"><stop stop-color="#58616e"/><stop offset=".46" stop-color="#303a46"/><stop offset="1" stop-color="#171e28"/></linearGradient>',
      '<linearGradient id="fp-rig-skin" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#e6b99b"/><stop offset=".5" stop-color="#ce9579"/><stop offset="1" stop-color="#94644f"/></linearGradient>',
      '<linearGradient id="fp-rig-pants" x2=".7" y2="1"><stop stop-color="#2b3442"/><stop offset="1" stop-color="#101925"/></linearGradient>',
      '<radialGradient id="fp-rig-weight"><stop stop-color="#505b68"/><stop offset=".65" stop-color="#27323e"/><stop offset="1" stop-color="#121b25"/></radialGradient>',
      '<filter id="fp-rig-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>',
      '</defs>',
      '<rect width="800" height="400" fill="url(#fp-rig-back)"/>',
      '<path d="M0 342H800V400H0Z" fill="#c4c9c9"/>',
      '<path d="M0 342H800" stroke="#8a9297" stroke-width="2"/>',
      '<ellipse cx="468" cy="349" rx="256" ry="15" fill="#49535b" opacity=".23" filter="url(#fp-rig-shadow)"/>',
      '<g data-part="bench">',
      '<path d="M236 199Q237 191 245 191H368Q376 191 377 199V210H236Z" fill="#262e39" stroke="#151d26" stroke-width="4"/>',
      '<path d="M246 193H367" stroke="#87919a" stroke-width="2" opacity=".65"/>',
      '<path d="M257 211H278V344H257Z M347 211H368V344H347Z" fill="#6d7781" stroke="#3e4850" stroke-width="3"/>',
      '<path d="M248 344H292 M337 344H385" stroke="#3c4954" stroke-width="8" stroke-linecap="round"/>',
      '</g>',
      '<g opacity=".4"><line data-part="rear-shin" stroke="#8e6856" stroke-width="25" stroke-linecap="round"/><line data-part="rear-thigh" stroke="#4f3b38" stroke-width="33" stroke-linecap="round"/></g>',
      '<line data-part="shin" stroke="url(#fp-rig-skin)" stroke-width="27" stroke-linecap="round"/>',
      '<line data-part="sock" stroke="#e8e9e7" stroke-width="22" stroke-linecap="round"/>',
      '<line data-part="thigh" stroke="url(#fp-rig-skin)" stroke-width="40" stroke-linecap="round"/>',
      '<line data-part="shorts" stroke="url(#fp-rig-pants)" stroke-width="48" stroke-linecap="round"/>',
      '<line data-part="torso" stroke="url(#fp-rig-shirt)" stroke-width="57" stroke-linecap="round"/>',
      '<line data-part="torso-highlight" stroke="#78828e" stroke-width="4" stroke-linecap="round" opacity=".65"/>',
      '<line data-part="arm-upper" stroke="url(#fp-rig-shirt)" stroke-width="23" stroke-linecap="round"/>',
      '<line data-part="arm-forearm" stroke="url(#fp-rig-skin)" stroke-width="18" stroke-linecap="round"/>',
      '<circle data-part="hand" r="11" fill="url(#fp-rig-skin)" stroke="#976a55" stroke-width="1"/>',
      '<line data-part="neck" stroke="url(#fp-rig-skin)" stroke-width="20" stroke-linecap="round"/>',
      '<g data-part="head-group">',
      '<ellipse cx="272" cy="151" rx="29" ry="24" transform="rotate(-12 272 151)" fill="url(#fp-rig-skin)" stroke="#966851" stroke-width="1"/>',
      '<path d="M245 147 Q246 125 264 125 Q287 121 297 142 Q283 134 272 139 Q257 142 245 151Z" fill="#292928"/>',
      '<path d="M292 156Q298 164 288 173" fill="none" stroke="#785444" stroke-width="3" stroke-linecap="round"/>',
      '<circle cx="291" cy="148" r="2.1" fill="#332722"/>',
      '<path d="M286 166Q281 169 275 166" fill="none" stroke="#825a48" stroke-width="1.5"/>',
      '</g>',
      '<g data-part="shoe">',
      '<path d="M609 323Q621 320 634 330L658 339Q664 348 651 350H601Q594 346 599 333Z" fill="#333c49" stroke="#161e29" stroke-width="3"/>',
      '<path d="M607 346H653" stroke="#e1e5e7" stroke-width="4" stroke-linecap="round"/>',
      '<path d="M604 331L633 330" stroke="#8a98a0" stroke-width="3"/>',
      '</g>',
      '<g data-part="barbell">',
      '<line data-part="bar" stroke="#8b929e" stroke-width="8" stroke-linecap="round"/>',
      '<circle data-part="plate" r="21" fill="url(#fp-rig-weight)" stroke="#151c24" stroke-width="4"/>',
      '<circle data-part="hub" r="5" fill="#b2b8bc" stroke="#313c47" stroke-width="2"/>',
      '</g>'
    ].join("");
    host.style.aspectRatio=visual.width+"/"+visual.height;
    host.append(svg);
    for(const attachment of ["bench","barbell"]){
      if(visual.equipment?.[attachment]===false)svg.querySelector('[data-part="'+attachment+'"]').setAttribute("display","none");
    }
    const part=key=>svg.querySelector('[data-part="'+key+'"]');
    const place=(node,point)=>{node.setAttribute("cx",point[0]);node.setAttribute("cy",point[1]);};
    const line=(node,a,b)=>{node.setAttribute("x1",a[0]);node.setAttribute("y1",a[1]);node.setAttribute("x2",b[0]);node.setAttribute("y2",b[1]);};
    const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    let disposed=false;
    function setPose(pose) {
      if(disposed)return;
      const p=window.FitPlanLandmarkConstraints.pose(visual,pose);
      if(!p)return;
      const move=(key,v,w)=>line(part(key),v,w);
      const offset=(xy,x,y)=>[xy[0]+x,xy[1]+y];
      move("rear-shin",offset(p.knee,-15,3),offset(p.ankle,-17,-3));
      move("rear-thigh",offset(p.hip,-14,4),offset(p.knee,-15,3));
      move("shin",p.knee,p.ankle);
      move("sock",mix(p.knee,p.ankle,.84),p.ankle);
      move("thigh",p.hip,p.knee);
      move("shorts",p.hip,mix(p.hip,p.knee,.43));
      move("torso",p.shoulder,p.hip);
      move("torso-highlight",offset(mix(p.shoulder,p.hip,.12),0,-18),offset(mix(p.shoulder,p.hip,.78),0,-18));
      move("arm-upper",p.shoulder,p.elbow);
      move("arm-forearm",p.elbow,p.hand);
      move("neck",p.shoulder,p.neck);
      part("head-group").setAttribute("transform","translate("+(p.head[0]-272)+" "+(p.head[1]-151)+")");
      part("shoe").setAttribute("transform","translate("+(p.ankle[0]-619)+" "+(p.ankle[1]-333)+")");
      place(part("hand"),p.hand);
      const barY=p.hip[1]-23;
      move("bar",[p.hip[0]-47,barY],[p.hip[0]+57,barY]);
      place(part("plate"),[p.hip[0]+29,barY]);
      place(part("hub"),[p.hip[0]+29,barY]);
      svg.dataset.pose=String(Math.round(pose.progress*100));
      svg.dataset.hipY=String(Math.round(p.hip[1]*10)/10);
      svg.dataset.footY=String(p.ankle[1]);
      svg.dataset.shoulderX=String(p.shoulder[0]);
      svg.dataset.kneeY=String(Math.round(p.knee[1]*10)/10);
      svg.dataset.armLength=String(Math.round(Math.hypot(p.shoulder[0]-p.elbow[0],p.shoulder[1]-p.elbow[1])*10)/10);
    }
    host.dataset.renderer="rig";
    onState("smooth");
    return Object.freeze({
      setPose,loaded:Promise.resolve(),dispose(){if(disposed)return;disposed=true;svg.remove();}
    });
  }
  Object.defineProperty(window,"FitPlanRigRenderer",{value:Object.freeze({create})});
})();