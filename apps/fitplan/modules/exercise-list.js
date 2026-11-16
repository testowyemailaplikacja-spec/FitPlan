(() => {
  "use strict";
  const frame=document.getElementById("appFrame");
  if(!frame)return;
  let installedDocument=null;
  function install(){
    const w=frame.contentWindow,registry=w?.FitPlanModules,doc=frame.contentDocument;
    if(!registry||!doc||installedDocument===doc||registry.get("lista-cwiczen"))return;
    installedDocument=doc;
    registry.register("lista-cwiczen",{
      kind:"exercise-list",
      activate({host,isCurrent}){
        if(!isCurrent())return;
        const mount=host.querySelector("#fitplanExerciseListMount")||host;
        const catalog=w.FitPlanExerciseRegistry||w.FitPlanExerciseCatalog;
        if(!catalog)throw new Error("Exercise catalogue unavailable");
        const categories={...(w.FitPlanData?.categoryMeta||{}),kettlebell:'Kettlebell'};
        const all=Array.from(catalog.items);
        const shell=doc.createElement("div");shell.className="fitplan-exercise-browser";
        const heading=doc.createElement("h3");heading.textContent="Lista ćwiczeń";
        const description=doc.createElement("p");description.className="muted";
        description.textContent="Rozwiń partię mięśniową albo wyszukaj ćwiczenie.";
        const filters=doc.createElement("div");filters.className="fitplan-exercise-filters";
        const search=doc.createElement("input");search.type="search";search.placeholder="Szukaj ćwiczenia lub mięśnia";
        search.setAttribute("aria-label","Szukaj ćwiczenia lub mięśnia");
        const select=doc.createElement("select");select.setAttribute("aria-label","Filtruj według partii mięśni");
        const option=(value,label)=>{const o=doc.createElement("option");o.value=value;o.textContent=label;select.appendChild(o);};
        option("","Wszystkie partie");
        [...new Set(all.map(x=>x.category))].sort((a,b)=>String(categories[a]||a).localeCompare(String(categories[b]||b),"pl")).forEach(category=>option(category,categories[category]||category));
        filters.append(search,select);
        const count=doc.createElement("p");count.className="muted fitplan-exercise-count";count.setAttribute("role","status");
        const results=doc.createElement("div");results.className="fitplan-exercise-results";
        function render(){
          if(!isCurrent())return;
          const query=search.value.trim().toLocaleLowerCase("pl-PL");
          const category=select.value;
          const visible=all.filter(x=>(!category||x.category===category)&&(!query||[x.displayName,x.name,...(x.primary||[]),...(x.supporting||[]),...(x.muscleProfile?.primary||[]).map(r=>r.name),...(x.muscleProfile?.secondary||[]).map(r=>r.name)].some(s=>s.toLocaleLowerCase("pl-PL").includes(query))));
          results.replaceChildren();
          count.textContent=visible.length+" ćwiczeń";
          if(!visible.length){const empty=doc.createElement("p");empty.textContent="Brak ćwiczeń pasujących do filtra.";results.appendChild(empty);return;}
          const grouped=new Map();
          visible.forEach(x=>{if(!grouped.has(x.category))grouped.set(x.category,[]);grouped.get(x.category).push(x);});
          for(const [key,list] of grouped){
            const section=doc.createElement("details");section.className="fitplan-exercise-group";section.open=results.children.length===0||Boolean(query);
            const title=doc.createElement("summary");title.innerHTML=`<h4>${categories[key]||list[0]?.categoryLabel||key}</h4><small>${list.length} ćwiczeń</small><span class="fitplan-exercise-fold" aria-hidden="true">⌄</span>`;
            const ul=doc.createElement("ul");
            list.forEach(x=>{
              const li=doc.createElement("li"),button=doc.createElement("button");
              button.type="button";button.className="fitplan-exercise-item";button.dataset.fitplanExercise=x.name;
              const draft=w.FitPlanMotionLibrary?.resolve(x.name)?.mechanicalDraft;
              const motionBadge=w.FitPlanExerciseEmbed?.has(x.name)?'<span class="fitplan-motion-list-badge">'+(draft?'Szkic mechaniki 2D':'Animacja ruchu')+'</span>':w.FitPlanExerciseMotion?.has(x.name)?'<span class="fitplan-motion-list-badge">Model 3D</span>':"";
              const profile=x.muscleProfile;
              const main=profile?.primary?.map(m=>m.name+(Number.isFinite(m.share)?" "+m.share+"%":""))||x.primary||[];
              const supporting=profile?.secondary?.map(m=>m.name+(Number.isFinite(m.share)?" "+m.share+"%":""))||x.supporting||[];
              const note=profile?.note||"";
              button.innerHTML=`<span class="fitplan-exercise-item-copy"><strong>${x.displayName}</strong>${motionBadge}${x.displayName!==x.name?`<small>${x.name}</small>`:""}<small>Główne: ${main.join(", ")||"Brak potwierdzonego przypisania"}</small><small>Wspomagające: ${supporting.join(", ")||"Brak potwierdzonego przypisania"}</small><small>${note}</small></span><span class="fitplan-exercise-scores">${Number.isFinite(x.difficulty)?`<span>Trudność <b>${x.difficulty} / 6</b></span><span>Skuteczność <b>${x.effectiveness} / 6</b></span>`:`<span>Poziom kettlebell <b>${x.minLevel} / 4</b></span>`}</span>`;
              button.addEventListener("click",()=>w.FitPlanExerciseDetails?.open(x.id));
              li.append(button);ul.append(li);
            });
            section.append(title,ul);results.appendChild(section);
          }
        }
        search.addEventListener("input",render);select.addEventListener("change",render);
        shell.append(heading,description,filters,count,results);mount.replaceChildren(shell);render();
      }
    });
  }
  frame.addEventListener("load",()=>queueMicrotask(install));
  if(frame.contentDocument?.readyState==="complete")queueMicrotask(install);
})();
