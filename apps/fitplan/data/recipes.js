(()=>{
"use strict";
// Recipe portions refer to the original FitPlan ingredient catalogue; quantities are grams per serving.
// Values are indicative and assume the preparation state stated in ingredient name.
const recipes=[
["Owsianka z borówkami i chia","Śniadanie",["Płatki owsiane",60,"Borówki",100,"Nasiona chia",15,"Napój sojowy bez cukru",180],"Zalej płatki napojem sojowym, gotuj do miękkości. Dodaj borówki i nasiona chia."],
["Owsianka bananowo-orzechowa","Śniadanie",["Płatki owsiane",65,"Banan dojrzały",110,"Orzechy włoskie",20,"Woda",200],"Ugotuj płatki, dodaj banana i posiekane orzechy."],
["Omlet ze szpinakiem i pomidorem","Śniadanie",["Omlet bez dodatków",150,"Szpinak",65,"Pomidor",100],"Przygotuj omlet bez dodatkowego tłuszczu. Podaj ze szpinakiem i pomidorem."],
["Kanapki z jajkiem i pomidorem","Śniadanie",["Chleb żytni pełnoziarnisty",100,"Jajko na twardo",110,"Pomidor",100],"Ułóż pokrojone jajko i pomidor na pieczywie."],
["Kurczak z brązowym ryżem i brokułem","Obiad",["Pierś z kurczaka, pieczona",150,"Ryż brązowy, gotowany",160,"Brokuł",160],"Podaj upieczoną pierś z ugotowanym ryżem i brokułami na parze. Masę waż po obróbce."],
["Indyk z kaszą gryczaną i warzywami","Obiad",["Pierś z indyka, pieczona",160,"Kasza gryczana, gotowana",190,"Papryka czerwona",100,"Cukinia",100],"Podaj pieczonego indyka z kaszą i duszonymi bez dodatku tłuszczu warzywami."],
["Łosoś, komosa i szpinak","Obiad",["Łosoś, pieczony",140,"Komosa ryżowa, gotowana",190,"Szpinak",120],"Upiecz łososia, podaj z ugotowaną komosą i krótko podgrzanym szpinakiem."],
["Dorsz z kaszą jaglaną i warzywami","Obiad",["Dorsz, pieczony",160,"Kasza jaglana, gotowana",190,"Marchew surowa",100,"Brokuł",150],"Upiecz dorsza, podaj z gotowaną kaszą, marchewką i brokułem."],
["Makaron z indykiem i pomidorami","Obiad",["Makaron pełnoziarnisty, gotowany",210,"Pierś z indyka, pieczona",130,"Pomidor",150,"Bazylia świeża",10],"Połącz makaron z kawałkami upieczonego indyka, pomidorami i bazylią."],
["Sałatka z tuńczykiem i ryżem","Kolacja",["Tuńczyk w wodzie, odsączony",120,"Ryż brązowy, gotowany",120,"Pomidor",100,"Papryka czerwona",100],"Wymieszaj odsączonego tuńczyka, ugotowany ryż i warzywa."],
["Sałatka z jajkiem i komosą","Kolacja",["Jajko na twardo",100,"Komosa ryżowa, gotowana",130,"Szpinak",70,"Papryka czerwona",100],"Połącz ugotowaną komosę z jajkiem i warzywami."],
["Deser owocowy z orzechami","Przekąska",["Truskawki",140,"Borówki",90,"Migdały",25],"Wymieszaj umyte owoce i posiekane migdały."]
];
function build(catalog){
 const products=new Map((catalog?.products||[]).map(p=>[p.name,p]));
 return recipes.map(([name,category,raw,steps],i)=>{
  const ingredients=[];const totals={kcal:0,protein:0,carbs:0,fat:0};let complete=true;
  for(let j=0;j<raw.length;j+=2){
   const product=products.get(raw[j]),grams=raw[j+1];
   if(!product||!Number.isFinite(grams)||grams<=0){complete=false;continue;}
   ingredients.push({id:product.id,name:product.name,grams});
   totals.kcal+=product.kcal*grams/100;
   for(const key of ["protein","carbs","fat"]){
    if(Number.isFinite(product.nutrients?.macros?.[key]))totals[key]+=product.nutrients.macros[key]*grams/100;
    else complete=false;
   }
  }
  return Object.freeze({id:"recipe-"+i,name,category,ingredients:Object.freeze(ingredients),steps,
   totals:complete?Object.freeze(Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,Math.round(v*10)/10]))):null});
 });
}
window.FitPlanRecipeCatalog=Object.freeze({build});
})();