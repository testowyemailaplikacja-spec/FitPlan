(() => {
  "use strict";
  const raw = [
    ["fit-01","Sprinter","🏃"],["fit-02","Siłacz","🏋️"],["fit-03","Rowerzysta","🚴"],["fit-04","Bokser","🥊"],
    ["fit-05","Pływak","🏊"],["fit-06","Gimnastyczka","🤸"],["fit-07","Koszykarz","⛹️"],["fit-08","Piłkarz","⚽"],
    ["fit-09","Wspinacz","🧗"],["fit-10","Jogin","🧘"],["fit-11","Tenisista","🎾"],["fit-12","Wioślarz","🚣"],
    ["fit-13","Narciarz","⛷️"],["fit-14","Łyżwiarz","⛸️"],["fit-15","Zapaśnik","🤼"],["fit-16","Medalista","🏅"]
  ];
  const items=Object.freeze(raw.map(([id,label,glyph])=>Object.freeze({id,label,glyph})));
  const byId=new Map(items.map(item=>[item.id,item]));
  const presetId=value=>String(value||"").startsWith("preset:")?String(value).slice(7):"";
  const initials=value=>String(value||"U").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"U";
  function render(container,value,name="U"){
    if(!container)return null;
    const doc=container.ownerDocument||document,id=presetId(value),preset=byId.get(id);
    container.replaceChildren();
    if(preset){
      const node=doc.createElement("span");node.className="portal-preset-avatar portal-preset-avatar-"+id;
      node.dataset.avatarPreset=id;node.setAttribute("role","img");node.setAttribute("aria-label",String(name||preset.label));
      const glyph=doc.createElement("span");glyph.className="portal-preset-avatar-glyph";glyph.textContent=preset.glyph;
      node.append(glyph);container.append(node);return node;
    }
    if(value){
      const img=doc.createElement("img");img.src=String(value);img.alt="Avatar użytkownika "+String(name||"").trim();container.append(img);return img;
    }
    const text=doc.createElement("span");text.textContent=initials(name);container.append(text);return text;
  }
  window.PortalAvatarPresets=Object.freeze({items,presetId,isPreset:value=>byId.has(presetId(value)),render,initials});
})();
