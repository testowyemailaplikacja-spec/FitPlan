(() => {
  "use strict";
  const catalog=window.FitPlanExerciseRegistry||window.FitPlanExerciseCatalog;if(!catalog)return;
  const legacyMethod=window.FitPlanExerciseCatalog?.method||{};
  const stars=value=>"★".repeat(value)+"☆".repeat(6-value);
  let motionCleanup=null;
  function stopMotion(){
    if(typeof motionCleanup==="function")motionCleanup();
    motionCleanup=null;
  }
  function closeDialog(dialog){
    stopMotion();
    if(typeof dialog.close==="function"&&dialog.open)dialog.close();
    else dialog.removeAttribute("open");
  }
  function ensureDialog(){
    let dialog=document.getElementById("fitplanExerciseDialog");if(dialog)return dialog;
    dialog=document.createElement("dialog");dialog.id="fitplanExerciseDialog";dialog.className="fitplan-exercise-dialog";
    dialog.innerHTML='<div class="fitplan-exercise-dialog-card"><button type="button" class="fitplan-dialog-close" aria-label="Zamknij szczegóły ćwiczenia">×</button><div data-fitplan-exercise-dialog-content></div></div>';
    document.body.append(dialog);
    dialog.querySelector(".fitplan-dialog-close").addEventListener("click",()=>closeDialog(dialog));
    dialog.addEventListener("click",event=>{if(event.target===dialog)closeDialog(dialog);});
    dialog.addEventListener("close",stopMotion);
    return dialog;
  }
  function open(name){
    const item=catalog.get(name);if(!item)return false;
    const profile=item.muscleProfile;
    const main=profile?.primary?.map(m=>m.name+(Number.isFinite(m.share)?" "+m.share+"%":""))||item.primary||[];
    const support=profile?.secondary?.map(m=>m.name+(Number.isFinite(m.share)?" "+m.share+"%":""))||item.supporting||[];
    const difficulty=Number.isFinite(item.difficulty)?item.difficulty:Math.min(6,(item.minLevel||1)*2);
    const effectiveness=Number.isFinite(item.effectiveness)?item.effectiveness:3;
    stopMotion();
    const dialog=ensureDialog(),content=dialog.querySelector("[data-fitplan-exercise-dialog-content]");
    const motion=window.FitPlanExerciseMotion;
    const embed=window.FitPlanExerciseEmbed;
    const selectedMotion=embed?.has(item.name)?embed:motion;
    const hasMotion=Boolean(selectedMotion?.has(item.name));
    dialog.classList.toggle("fitplan-exercise-dialog-motion",hasMotion);
    content.innerHTML=`<span class="fitplan-rating-kicker">${item.categoryLabel}</span><h3>${item.displayName}</h3>${item.displayName!==item.name?`<p class="muted">${item.name}</p>`:""}<p>${item.description||item.cue||''}</p>${hasMotion?'<div data-fitplan-exercise-motion></div>':""}<dl class="fitplan-exercise-facts"><div><dt>Mięśnie główne</dt><dd>${main.join(", ")||"Nieokreślone dla tego wariantu"}</dd></div><div><dt>Mięśnie wspomagające</dt><dd>${support.join(", ")||"Nieokreślone dla tego wariantu"}</dd></div>${(item.category==="kettlebell"||item.category==="extended")?`<div><dt>${item.category==="kettlebell"?"Minimalny poziom kettlebell":"Minimalny poziom ćwiczenia"}</dt><dd>${item.minLevel} / 4</dd></div>`:`<div><dt>Trudność</dt><dd aria-label="Trudność ${difficulty} z 6">${stars(difficulty)} <small>${difficulty} / 6</small></dd></div><div><dt>Skuteczność</dt><dd aria-label="Skuteczność ${effectiveness} z 6">${stars(effectiveness)} <small>${effectiveness} / 6</small></dd></div>`}</dl><p class="muted fitplan-rating-note">${profile?.note||"Rzeczywisty udział mięśni zależy od techniki, obciążenia i osoby ćwiczącej."}</p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5758546/" target="_blank" rel="noopener">Dlaczego EMG nie określa procentu obciążenia</a> · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/" target="_blank" rel="noopener">Badania wyciskania</a> · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6719359/" target="_blank" rel="noopener">Badania kettlebell</a>`;
    const research=window.FitPlanTrainingExtensions?.sources?.[item.sourceId];
    if(research){
      const info=document.createElement("p");info.className="muted";
      const link=document.createElement("a");link.href=research;link.target="_blank";link.rel="noopener noreferrer";
      link.textContent="Materiały powiązane z tą techniką (nie potwierdzają dokładnych procentów)";
      info.append(link);content.append(info);
    }
    if(hasMotion){
      const mount=content.querySelector("[data-fitplan-exercise-motion]");
      motionCleanup=selectedMotion.mount(mount,item.name);
    }
    if(!dialog.open){
      if(typeof dialog.showModal==="function")dialog.showModal();else dialog.setAttribute("open","");
    }
    return true;
  }
  function enhanceAtlas(host){
    const enhance=()=>{
      host.querySelectorAll(".fp-exercises").forEach(list=>{
        const current=[...list.children],ordered=current.slice().sort((left,right)=>{
          const a=catalog.get(left.querySelector("span:last-child")?.textContent),b=catalog.get(right.querySelector("span:last-child")?.textContent);
          return (b?.effectiveness||0)-(a?.effectiveness||0)||(a?.name||"").localeCompare(b?.name||"","pl");
        });
        if(ordered.some((node,index)=>node!==current[index]))ordered.forEach(node=>list.append(node));
      });
      host.querySelectorAll(".fp-exercise:not([data-fitplan-exercise])").forEach(row=>{
        const name=row.dataset.fitplanExercise||row.querySelector("span:last-child")?.textContent?.trim();if(!catalog.get(name))return;
        row.dataset.fitplanExercise=name;const translated=catalog.get(name)?.displayName;
        const label=row.querySelector("span:last-child");if(label&&translated&&translated!==name)label.textContent=translated;
        row.setAttribute("role","button");row.tabIndex=0;
        row.setAttribute("aria-label","Pokaż szczegóły ćwiczenia "+(translated||name));
        row.addEventListener("click",()=>open(name));
        row.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();open(name);}});
      });
    };
    enhance();const observer=new MutationObserver(enhance);observer.observe(host,{childList:true,subtree:true});return()=>observer.disconnect();
  }
  Object.defineProperty(window,"FitPlanExerciseDetails",{value:Object.freeze({open,enhanceAtlas})});
})();
