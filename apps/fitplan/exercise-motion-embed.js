(() => {
  'use strict';
  const library=window.FitPlanMotionLibrary;
  function has(name){return Boolean(library?.resolve(name));}
  function mount(host,name='Pompki'){
    const definition=library?.resolve(name);if(!definition)return ()=>{};
    const doc=host.ownerDocument,root=doc.createElement('section');
    root.className='fitplan-motion fitplan-pushup-motion';root.dataset.state='manual';root.dataset.exercise=definition.id;
    root.innerHTML='<div class="fitplan-motion-head"><span class="fitplan-motion-badge">Ruch pod Twoją kontrolą</span><h4></h4><p>Przesuwaj suwak, aby wykonać pełne powtórzenie. Zatrzymaj go w dowolnym miejscu, żeby przyjrzeć się pozycji.</p></div>'+
      '<div class="fitplan-pushup-stage" role="img" aria-label="Pozycja ćwiczenia sterowana suwakiem"></div>'+
      '<div class="fitplan-pushup-controls"><label class="fitplan-motion-range">Przebieg powtórzenia <input type="range" min="0" max="100" step="0.1" value="0" data-push-progress aria-label="Przebieg powtórzenia w procentach"></label><output class="fitplan-motion-output" data-push-output></output></div>'+
      '<div class="fitplan-pushup-timeline" aria-hidden="true"></div>'+
      '<div class="fitplan-pushup-phases" role="list" aria-label="Fazy ćwiczenia"></div>'+
      '<p class="fitplan-motion-cue" data-push-cue></p><p class="fitplan-pushup-status" data-push-status role="status"></p>';
    if(definition.mechanicalDraft){
      root.querySelector('.fitplan-motion-badge').textContent='Szkic mechaniczny 2D';
      root.querySelector('.fitplan-motion-head p').textContent=definition.previewUnavailable
        ? 'Brak działającej wizualizacji ruchu: ćwiczenie wymaga odwzorowania otwierania kolan w trzech wymiarach. Suwak niedostępny do czasu przygotowania właściwej mechaniki.'
        : definition.supportNotModeled
        ? 'Schemat nie zawiera prawidłowego podwyższonego podparcia nogi. Nie stosuj tej wizualizacji jako instruktażu techniki.'
        : definition.terrainNotModeled
        ? 'Trasa wznosząca się nie jest narysowana: model przedstawia tylko krok po płaskim podłożu.'
        : definition.equipmentNotModeled
        ? 'Brak skakanki i toru jej obrotu. Pokazano jedynie orientacyjny podskok, a nie kompletną mechanikę ćwiczenia.'
        : definition.fineJointsNotModeled
        ? 'Szkic nie odwzorowuje osobno palców dłoni ani przodostopia. Ruch kończyn jest tylko orientacyjny.'
        : definition.gripNotModeled
        ? 'Wariant chwytu jest niewidoczny w uproszczonym szkielecie dłoni. Nie wyciągaj z rysunku wniosków o ułożeniu nadgarstka.'
        : definition.requiresDepthVisualization
        ? 'Uproszczony rzut 2D nie przedstawia wiarygodnie rotacji, kierunku dłoni lub kontaktu ze sprzętem. Szkic nie jest instruktażem techniki.'
        : definition.ambiguousExercise
        ? 'Nazwa obejmuje kilka odmiennych wariantów. Pokazano jedynie orientacyjny przykład ruchu; najpierw trzeba wskazać konkretny wariant.'
        : 'Poglądowa podstawa ruchu, wymagająca dopracowania biomechaniki i grafiki. Przesuwaj suwak ręcznie — model nie odtwarza się sam.';
    }
    root.querySelector('h4').textContent=definition.subtitle||definition.title;host.append(root);
    const stage=root.querySelector('.fitplan-pushup-stage'),slider=root.querySelector('[data-push-progress]');
    const output=root.querySelector('[data-push-output]'),cue=root.querySelector('[data-push-cue]'),status=root.querySelector('[data-push-status]');
    const phaseHost=root.querySelector('.fitplan-pushup-phases'),phases=definition.phases;
    phases.forEach((phase,index)=>{const item=doc.createElement('div');item.className='fitplan-pushup-phase';item.dataset.pushPhase=String(index);item.setAttribute('role','listitem');item.textContent=(index+1)+'. '+phase.label;phaseHost.append(item);});
    const markers=root.querySelector('.fitplan-pushup-timeline');
    (definition.markers||[]).forEach(marker=>{const span=doc.createElement('span');span.textContent=Math.round(marker.at*100)+'% · '+marker.label;markers.append(span);});
    let disposed=false;
    const renderer=window.FitPlanPoseRenderer.create(stage,definition,state=>{
      if(disposed)return;
      status.textContent=state==='asset-error'?'Nie udało się wczytać wszystkich danych ruchu. Otwórz ćwiczenie ponownie, aby spróbować jeszcze raz.':state==='frames'?'Podgląd kolejnych pozycji. Płynne przejścia nie są dostępne w tej przeglądarce.':'';
      status.hidden=!status.textContent;
    });
    function update(){
      if(disposed)return;
      const pose=library.sample(definition,Number(slider.value)/100),percent=Math.round(pose.progress*1000)/10;
      root.dataset.progress=String(percent);slider.value=String(percent);slider.style.setProperty('--motion-progress',percent+'%');
      let index=0;phases.forEach((phase,i)=>{if(pose.progress>=phase.at)index=i;});
      const label=pose.progress===1?'Powtórzenie zakończone':phases[index].label;
      output.textContent=percent.toLocaleString('pl-PL')+'% · '+label;
      slider.setAttribute('aria-valuetext',percent.toLocaleString('pl-PL')+' procent — '+label);
      stage.setAttribute('aria-label',definition.title+': '+label+', '+percent+'% powtórzenia');
      cue.textContent=phases[index].cue;
      Array.from(phaseHost.children).forEach((item,i)=>{if(i===index)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
      renderer.setPose(pose);
    }
    if(definition.previewUnavailable){
      slider.disabled=true;
      slider.setAttribute('aria-disabled','true');
      root.dataset.previewUnavailable='true';
      stage.setAttribute('aria-label','Brak działającej wizualizacji tego ćwiczenia');
    }
    slider.addEventListener('input',update);update();
    return ()=>{if(disposed)return;disposed=true;slider.removeEventListener('input',update);renderer.dispose();root.remove();};
  }
  Object.defineProperty(window,'FitPlanExerciseEmbed',{value:Object.freeze({has,mount,kind:'photographic-sequence'})});
})();
