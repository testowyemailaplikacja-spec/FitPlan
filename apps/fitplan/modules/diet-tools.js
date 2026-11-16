(()=>{"use strict";
function calculateBMI(height,weight){
 if(!(height>0&&weight>0&&height<=250&&weight<=400))return null;
 return weight/(height/100)**2;
}
function calculateCalorieNeeds({height,weight,age,formula,activity}){
 if(!(height>0&&weight>0&&age>=18&&age<=100&&Number.isFinite(Number(activity))&&Number(activity)>=1.2&&Number(activity)<=1.9)||!["male","female"].includes(formula))return null;
 const bmr=10*weight+6.25*height-5*age+(formula==="male"?5:-161);
 return Object.freeze({bmr,tdee:bmr*Number(activity)});
}
function attach(w,mount,groups,note){
 const doc=w.document,tabs=doc.createElement("nav");
 tabs.className="fitplan-diet-tabbar";tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","Narzędzia żywieniowe");
 const defs=[["products","Produkty"],["bmi","Kalkulator BMI"],["calories","Zapotrzebowanie kaloryczne"],["recipes","Przepisy kulinarne"]];
 const panels=defs.map(([id])=>{const section=doc.createElement("section");section.id="fitplan-diet-panel-"+id;section.className="fitplan-diet-panel";section.setAttribute("role","tabpanel");section.setAttribute("aria-labelledby","fitplan-diet-tab-"+id);return section;});
 let buttons=[];
 const show=index=>buttons.forEach((button,i)=>{const active=i===index;button.setAttribute("aria-selected",String(active));button.tabIndex=active?0:-1;panels[i].hidden=!active;});
 buttons=defs.map(([id,label],i)=>{const button=doc.createElement("button");button.id="fitplan-diet-tab-"+id;button.className="fitplan-diet-tab";button.type="button";button.textContent=label;button.setAttribute("role","tab");button.setAttribute("aria-controls",panels[i].id);button.addEventListener("click",()=>show(i));button.addEventListener("keydown",event=>{const next=event.key==="ArrowRight"?(i+1)%defs.length:event.key==="ArrowLeft"?(i+defs.length-1)%defs.length:event.key==="Home"?0:event.key==="End"?defs.length-1:null;if(next!==null){event.preventDefault();show(next);buttons[next].focus();}});tabs.append(button);return button;});
 panels[0].append(groups,note);
 panels[1].innerHTML='<div class="fitplan-calc"><h4>Wskaźnik masy ciała (BMI)</h4><p>Wprowadź wzrost i masę ciała. Obliczenia dotyczą wyłącznie osób dorosłych.</p><form class="fitplan-calc-form" data-diet-calc="bmi"><label>Wzrost (cm)<input name="height" type="number" min="100" max="250" step="0.1" value="175" required></label><label>Masa ciała (kg)<input name="weight" type="number" min="20" max="400" step="0.1" value="70" required></label><button type="submit">Oblicz BMI</button></form><output class="fitplan-calc-result" aria-live="polite" hidden></output><p class="fitplan-calc-disclaimer">BMI nie uwzględnia umięśnienia, ciąży ani stanu zdrowia. Sam wynik nie stanowi diagnozy.</p></div>';
 const bmiForm=panels[1].querySelector("form");
 bmiForm.insertAdjacentHTML("beforeend",'<label>Wariant odniesienia<select name="gender" required><option value="female">Kobieta</option><option value="male">Mężczyzna</option></select></label>');
 panels[1].querySelector(".fitplan-calc-disclaimer").insertAdjacentHTML("beforebegin",'<div class="fitplan-bmi-guide" hidden><h5>Zakresy BMI dla dorosłych</h5><p>Standardowe granice BMI są takie same dla obu płci. Zakresy masy poniżej odnoszą się do podanego wzrostu.</p><div class="fitplan-bmi-spectrum"><span class="fitplan-bmi-needle"></span></div><p class="fitplan-bmi-current" role="status"></p><table class="fitplan-bmi-table"><thead><tr><th>Zakres</th><th>BMI</th><th>Masa dla tego wzrostu</th></tr></thead><tbody></tbody></table></div>');
 panels[2].innerHTML='<div class="fitplan-calc"><h4>Dzienne zapotrzebowanie kaloryczne</h4><p>Szacunkowe BMR (podstawowa przemiana materii) oraz TDEE (całkowity wydatek energii) według wzoru Mifflina–St Jeora dla dorosłych.</p><form class="fitplan-calc-form" data-diet-calc="calories"><label>Wzrost (cm)<input name="height" type="number" min="100" max="250" step="0.1" value="175" required></label><label>Masa ciała (kg)<input name="weight" type="number" min="20" max="400" step="0.1" value="70" required></label><label>Wiek (lata)<input name="age" type="number" min="18" max="100" step="1" value="30" required></label><label>Wariant wzoru BMR<select name="formula" required><option value="female">Kobieta (−161)</option><option value="male">Mężczyzna (+5)</option></select></label><label class="fitplan-calc-wide">Aktywność fizyczna<select name="activity" required><option value="1.2">Siedzący tryb życia (1,2)</option><option value="1.375">Lekka aktywność 1–3 dni w tygodniu (1,375)</option><option value="1.55">Umiarkowana aktywność 3–5 dni (1,55)</option><option value="1.725">Duża aktywność 6–7 dni (1,725)</option><option value="1.9">Bardzo duża aktywność (1,9)</option></select></label><button type="submit">Oblicz zapotrzebowanie</button></form><output class="fitplan-calc-result" aria-live="polite" hidden></output><p class="fitplan-calc-disclaimer">Wynik jest szacunkiem, nie indywidualną dietą ani zaleceniem medycznym. Na wydatek energii wpływają również skład ciała i stan zdrowia.</p></div>';
 const fmt=new Intl.NumberFormat("pl-PL",{maximumFractionDigits:0});
 for(const form of panels.slice(1).map(p=>p.querySelector("form")).filter(Boolean)){
  form.addEventListener("submit",event=>{
   event.preventDefault();
   if(!form.checkValidity()){form.reportValidity?.();return;}
   const height=form.elements.namedItem("height").valueAsNumber,weight=form.elements.namedItem("weight").valueAsNumber;
   if(!Number.isFinite(height)||!Number.isFinite(weight)||height<=0||weight<=0)return;
   const result=form.nextElementSibling;
   if(form.dataset.dietCalc==="bmi"){
    const bmi=calculateBMI(height,weight),category=bmi<18.5?"poniżej zakresu prawidłowego":bmi<25?"w zakresie prawidłowym":bmi<30?"powyżej zakresu prawidłowego":"znacznie powyżej zakresu prawidłowego";
    result.textContent="BMI: "+bmi.toLocaleString("pl-PL",{minimumFractionDigits:1,maximumFractionDigits:1})+" — "+category+".";
    const guide=panels[1].querySelector(".fitplan-bmi-guide");
    const square=(height/100)**2,fmtWeight=num=>num.toLocaleString("pl-PL",{minimumFractionDigits:1,maximumFractionDigits:1});
    const ranges=[
     ["Niedowaga",0,18.5,"poniżej 18,5","poniżej "+fmtWeight(18.5*square)+" kg"],
     ["Zakres prawidłowy",18.5,25,"18,5–24,9",fmtWeight(18.5*square)+"–"+fmtWeight(25*square)+" kg (górna granica nie jest wliczana)"],
     ["Nadwaga",25,30,"25–29,9",fmtWeight(25*square)+"–"+fmtWeight(30*square)+" kg (górna granica nie jest wliczana)"],
     ["Otyłość wg BMI",30,Infinity,"30 i więcej","od "+fmtWeight(30*square)+" kg"]
    ];
    const tbody=guide.querySelector("tbody");tbody.replaceChildren();
    for(const [label,lower,upper,limits,mass] of ranges){
      const row=doc.createElement("tr"),selected=bmi>=lower&&bmi<upper;
      if(selected){row.className="fitplan-bmi-active";row.setAttribute("aria-current","true");}
      for(const value of [(selected?"➜ ":"")+label,limits,mass]){const cell=doc.createElement("td");cell.textContent=value;row.append(cell);}
      tbody.append(row);
    }
    guide.querySelector(".fitplan-bmi-needle").style.left=((Math.max(14,Math.min(40,bmi))-14)/26*100)+"%";
    guide.querySelector(".fitplan-bmi-current").textContent="Wskaźnik: "+bmi.toLocaleString("pl-PL",{maximumFractionDigits:1})+", wariant: "+(form.elements.namedItem("gender").value==="male"?"mężczyzna":"kobieta")+".";
    guide.hidden=false;
   }else{
    const age=form.elements.namedItem("age").valueAsNumber,activity=Number(form.elements.namedItem("activity").value),formula=form.elements.namedItem("formula").value;
    if(!Number.isFinite(age)||!Number.isFinite(activity)||!["female","male"].includes(formula))return;
    const needs=calculateCalorieNeeds({height,weight,age,formula,activity});if(!needs)return;
    result.textContent="BMR: "+fmt.format(needs.bmr)+" kcal/dzień. TDEE: "+fmt.format(needs.tdee)+" kcal/dzień.";
   }
   result.hidden=false;
  });
 }

 const recipes=w.FitPlanRecipeCatalog?.build(w.FitPlanFoodCatalog)||[];
 const recipeSection=panels[3];
 const intro=doc.createElement("p");intro.className="muted";
 intro.textContent="Przepisy na 1 porcję; gramatury odnoszą się do postaci produktu podanej w katalogu. Energia i makroskładniki są szacunkowe.";
 const recipeGrid=doc.createElement("div");recipeGrid.className="fitplan-recipe-grid";
 for(const recipe of recipes){
   const card=doc.createElement("article");card.className="fitplan-recipe-card";
   const h=doc.createElement("h4");h.textContent=recipe.name;
   const small=doc.createElement("p");small.className="muted";small.textContent=recipe.category;
   const ingredients=doc.createElement("ul");
   for(const item of recipe.ingredients){const li=doc.createElement("li");li.textContent=item.name+" — "+item.grams+" g";ingredients.append(li);}
   const steps=doc.createElement("p");steps.textContent=recipe.steps;
   const totals=doc.createElement("p");totals.className="fitplan-recipe-macros";
   totals.textContent=recipe.totals
     ?"1 porcja: "+Math.round(recipe.totals.kcal)+" kcal · B "+recipe.totals.protein.toFixed(1)+" g · W "+recipe.totals.carbs.toFixed(1)+" g · T "+recipe.totals.fat.toFixed(1)+" g"
     :"Brak pełnych danych składników – wartości odżywcze nie są obliczane.";
   card.append(h,small,ingredients,steps,totals);recipeGrid.append(card);
 }
 if(!recipes.length)intro.textContent="Przepisy są chwilowo niedostępne.";
 recipeSection.append(intro,recipeGrid);
 mount.replaceChildren(tabs,...panels);show(0);
}
Object.defineProperty(window,"FitPlanDietTools",{value:Object.freeze({attach,calculateBMI,calculateCalorieNeeds}),configurable:false});
})();
