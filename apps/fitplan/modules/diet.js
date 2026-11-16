(()=>{
"use strict";const frame=document.getElementById("appFrame");if(!frame)return;
const esc=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const grams=value=>new Intl.NumberFormat("pl-PL",{maximumFractionDigits:1}).format(value)+" g";
function renderNutrients(product){
 const nutrient=product.nutrients;
 if(!nutrient)return "";
 const macros=[["Białko",nutrient.macros.protein],["Węglowodany",nutrient.macros.carbs],["Tłuszcze",nutrient.macros.fat]].filter(([,amount])=>Number.isFinite(amount)&&amount>0);
 const primary=macros.length?'<div class="fitplan-food-macro-panel"><span class="fitplan-food-nutrient-title">Makroskładniki</span><dl class="fitplan-food-macros">'+macros.map(([name,amount])=>'<div><dt>'+name+'</dt><dd>'+grams(amount)+'</dd></div>').join("")+'</dl></div>':"";
 const sections=[["Witaminy",nutrient.vitamins],["Składniki mineralne",nutrient.minerals],["Związki bioaktywne i przeciwutleniacze",nutrient.bioactives],["Inne wartościowe składniki",nutrient.other]]
   .filter(([,items])=>Array.isArray(items)&&items.length>0);
 const details=sections.length?'<details class="fitplan-food-micro-details"><summary>Witaminy i inne składniki</summary><dl>'+sections.map(([label,items])=>'<div><dt>'+label+'</dt><dd>'+items.map(item=>`<button type="button" class="fitplan-nutrient-chip" data-fitplan-nutrient="${esc(item)}" aria-expanded="false">${esc(item)}</button>`).join(" ")+'</dd></div>').join("")+'</dl></details>':"";
 return primary||details?'<div class="fitplan-food-nutrients">'+primary+details+'</div>':"";
}
function install(){
 const w=frame.contentWindow,r=w?.FitPlanModules;if(!r||r.get("dieta"))return;
 r.register("dieta",Object.freeze({kind:"diet",activate({host,isCurrent}){
  if(!isCurrent())return;const mount=host.querySelector("#fitplanDietMount"),catalog=w.FitPlanFoodCatalog;
  if(!mount)return;
  if(!catalog)throw new Error("Food catalogue unavailable");
  const groups=w.document.createElement("div");groups.className="fitplan-food-groups";
  catalog.categories.forEach((category,index)=>{
   const details=w.document.createElement("details");details.className="fitplan-food-group";details.dataset.foodCategory=category.id;details.open=index===0;
   const items=catalog.products.filter(product=>product.category===category.id);
   details.innerHTML=`<summary><span>${category.label}</span><small>${items.length} produkty</small></summary><div class="fitplan-food-grid">${items.map(product=>`<article class="fitplan-food-card" data-food-product="${product.id}"><img src="${product.image}" alt="${product.name}" loading="lazy" width="480" height="300"><div><h4>${product.name}</h4><p><strong>${product.kcal} kcal/${product.category==="napoje"?"100 ml":"100 g"}</strong><span>IG: ${product.gi==null?"brak danych":product.gi===0?"nie dotyczy / śladowy":product.gi}</span><span>Odżywczość: ${product.nutrition} / 6 <span class="fitplan-rating-stars" role="img" aria-label="Ocena ${product.nutrition} z 6 gwiazdek">${"★".repeat(product.nutrition)}${"☆".repeat(6-product.nutrition)}</span></span></p>${renderNutrients(product)}</div></article>`).join("")}</div>`;
   groups.append(details);
  });
  // WIEDORA-CHANGE: WD-20261101-WIE-161-FITPLAN-DIET-SEARCH-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
  // A live catalogue filter works in place: tabs, diet estimates and recipes stay intact.
  const toolbar=w.document.createElement("div");toolbar.className="fitplan-food-toolbar";
  const searchLabel=w.document.createElement("label");searchLabel.textContent="Szukaj produktu";
  const search=w.document.createElement("input");search.type="search";search.id="fitplanFoodSearch";search.placeholder="Np. jogurt, tofu, ryż";search.autocomplete="off";search.setAttribute("aria-describedby","fitplanFoodSearchStatus");
  searchLabel.append(search);
  const clear=w.document.createElement("button");clear.type="button";clear.className="action-button";clear.textContent="Wyczyść";clear.hidden=true;
  toolbar.append(searchLabel,clear);
  const status=w.document.createElement("p");status.className="fitplan-food-search-status";status.id="fitplanFoodSearchStatus";status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  const empty=w.document.createElement("p");empty.className="fitplan-food-search-empty";empty.textContent="Brak pasujących produktów. Zmień nazwę albo wyczyść wyszukiwanie.";empty.hidden=true;
  const byId=new Map(catalog.products.map(product=>[product.id,product]));
  const groupsToFilter=[...groups.querySelectorAll(".fitplan-food-group")].map(section=>({
    section, label:catalog.categories.find(category=>category.id===section.dataset.foodCategory)?.label||"",
    cards:[...section.querySelectorAll("[data-food-product]")],
    originalOpen:section.open
  }));
  const normalized=value=>String(value||"").toLocaleLowerCase("pl-PL").trim();
  let searching=false;
  function applyFoodSearch(){
    const query=normalized(search.value),tokens=query.split(" ").filter(Boolean);
    if(query&&!searching)for(const group of groupsToFilter)group.originalOpen=group.section.open;
    let visible=0;
    for(const group of groupsToFilter){
      let count=0;
      for(const card of group.cards){
        const product=byId.get(card.dataset.foodProduct);
        const words=normalized((product?.name||"")+" "+group.label);
        const match=tokens.every(token=>words.includes(token));
        card.hidden=!match;if(match)count++;
      }
      group.section.hidden=count===0;
      if(query&&count)group.section.open=true;
      if(!query&&searching)group.section.open=group.originalOpen;
      const total=group.cards.length;
      const categoryCount=group.section.querySelector("summary small");
      if(categoryCount)categoryCount.textContent=query?count+" z "+total+" produktów":total+" produktów";
      visible+=count;
    }
    searching=Boolean(query);
    status.textContent=query?"Znaleziono "+visible+" z "+catalog.products.length+" produktów.":"W katalogu "+catalog.products.length+" produktów w "+groupsToFilter.length+" kategoriach.";
    empty.hidden=visible!==0;
    clear.hidden=!query;
  }
  search.addEventListener("input",applyFoodSearch);
  clear.addEventListener("click",()=>{search.value="";applyFoodSearch();search.focus();});
  groups.prepend(toolbar,status);groups.append(empty);applyFoodSearch();
  const note=w.document.createElement("aside");note.className="fitplan-food-note";note.innerHTML=`<strong>Jak czytać dane</strong><p>Wartości energii i makroskładników są orientacyjne na 100 g produktu lub 100 ml napoju. Pokazywane są tylko składniki z uzupełnioną wartością dodatnią lub udokumentowaną obecnością; brak rubryki nie oznacza potwierdzonego braku substancji. IG zależy m.in. od odmiany, dojrzałości i obróbki; dla mięsa, ryb, jaj, wody i napojów bez cukru nie ma praktycznego zastosowania. Lista witamin i związków aktywnych jest jakościowa, bez wskazywania ilości ani obietnic działania leczniczego. Skład zależy od odmiany, sposobu przygotowania i marki. Odżywczość 1–6 jest redakcyjną oceną gęstości składników, nie poradą medyczną.</p><div>${catalog.sources.map(source=>`<a href="${source.url}" target="_blank" rel="noopener">${source.label}</a>`).join("")}</div>`;
  window.FitPlanDietTools.attach(w,mount,groups,note);
  mount.addEventListener("click",event=>{
    const button=event.target.closest?.("[data-fitplan-nutrient]");
    if(!button||!mount.contains(button))return;
    const dd=button.closest("dd");if(!dd)return;
    const expanded=button.getAttribute("aria-expanded")==="true";
    dd.querySelectorAll("[data-fitplan-nutrient]").forEach(item=>item.setAttribute("aria-expanded","false"));
    dd.querySelector(".fitplan-nutrient-info")?.remove();
    if(expanded)return;
    const description=window.FitPlanNutrientGuide?.describe(button.dataset.fitplanNutrient);
    if(!description)return;
    button.setAttribute("aria-expanded","true");
    const info=w.document.createElement("div");info.className="fitplan-nutrient-info";info.setAttribute("role","status");
    const name=w.document.createElement("strong");name.textContent=button.dataset.fitplanNutrient;
    const p=w.document.createElement("p");p.textContent=description;
    info.append(name,p);dd.append(info);
  });
 },deactivate(){}}));
}
frame.addEventListener("load",()=>queueMicrotask(install));window.addEventListener("fitplan:modules:ready",install);try{queueMicrotask(install)}catch{}
try{if(frame.contentDocument?.readyState==="complete")queueMicrotask(install)}catch{}
})();
