const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function load(){
 const window={};
 for(const file of ['muscles.js','exercise-catalog.js','kettlebell-catalog.js','training-extensions.js','exercise-registry.js']){
  vm.runInNewContext(fs.readFileSync('apps/fitplan/data/'+file,'utf8'),{window});
 }
 return window;
}
test('one canonical index covers legacy and kettlebell exercise IDs without duplicate names',()=>{
 const w=load(),reg=w.FitPlanExerciseRegistry;
 assert.equal(w.FitPlanExerciseCatalog.items.length,98);
 assert.equal(w.FitPlanKettlebellCatalog.items.length,31);
 assert.equal(reg.items.length,287);
 assert.equal(new Set(Array.from(reg.items,x=>x.id)).size,reg.items.length);
 const names=Array.from(reg.items,x=>x.displayName.toLowerCase().replaceAll("'",""));
 assert.equal(new Set(names).size,reg.items.length);
 for(const old of [...w.FitPlanExerciseCatalog.items,...w.FitPlanKettlebellCatalog.items]){
  assert.ok(reg.get(old.id),'old ID missing: '+old.id);
 }
 assert.equal(reg.get('kb-suitcase-carry').id,reg.get('Suitcase Carry').id);
 assert.equal(reg.get('kb-farmer-carry').id,reg.get("Farmer's Carry").id);
});

test('muscle profiles distinguish prime movers from helpers without calling percentages EMG',()=>{
 const w=load(),reg=w.FitPlanExerciseRegistry;
 const profiles=Array.from(reg.items,x=>x.muscleProfile);
 const modelled=profiles.filter(p=>p.status==='illustrative');
 assert.ok(modelled.length>=110);
 for(const [i,p] of profiles.entries()){
  assert.ok(['illustrative','variant','unreviewed','qualitative'].includes(p.status),reg.items[i].displayName);
  if(p.status==='illustrative'){
   const shares=[...p.primary,...p.secondary].map(x=>x.share);
   assert.equal(shares.reduce((sum,n)=>sum+n,0),100,reg.items[i].displayName);
   assert.ok(p.primary.length>0&&p.secondary.length>0);
   assert.match(p.note,/NIE są pomiarem EMG/);
  }else if(p.status==='qualitative'){
   assert.ok(p.primary.length>0);
   assert.ok([...p.primary,...p.secondary].every(x=>x.share===null));
  }else{
   assert.equal(p.primary.length+p.secondary.length,0);
  }
 }
 const bench=reg.get('Barbell Bench Press').muscleProfile;
 assert.ok(bench.primary.some(x=>x.name.includes('mostkowo-żebrowa')));
 assert.ok(bench.primary.some(x=>x.name.includes('obojczykowa')));
 assert.ok(bench.secondary.some(x=>x.name.includes('Trójgłowy')));
 assert.ok(bench.secondary.some(x=>x.name.includes('Naramienny')));
 const generic=reg.get('Isometric Holds').muscleProfile;
 assert.equal(generic.status,'variant');
});

test('back focus is split using roles from the same registry for kettlebell',()=>{
 const w=load(),reg=w.FitPlanExerciseRegistry;
 const {primary,secondary}=reg.byArea('back',{equipment:'kettlebell'});
 assert.ok(primary.length>0);
 assert.ok(secondary.length>0);
 assert.ok(primary.every(x=>x.muscleProfile.primary.some(m=>m.area==='back')));
 assert.ok(secondary.every(x=>!x.muscleProfile.primary.some(m=>m.area==='back')&&x.muscleProfile.secondary.some(m=>m.area==='back')));
 assert.equal(new Set([...primary,...secondary].map(x=>x.id)).size,primary.length+secondary.length);
});

test('index, offline cache and display modules share the registry',()=>{
 const read=p=>fs.readFileSync('apps/fitplan/'+p,'utf8');
 const legacy=read('legacy.html'),sw=read('sw.js'),module=read('modules/exercise-list.js'),details=read('exercise-details.js'),start=read('modules/start.js');
 assert.match(legacy,/data\/exercise-registry\.js\?v=20261023-training-curricula-2/);
 assert.match(sw,/data\/exercise-registry\.js\?v=20261023-training-curricula-2/);
 assert.match(module,/FitPlanExerciseRegistry/);
 assert.match(details,/FitPlanExerciseRegistry/);
 assert.match(start,/FitPlanExerciseRegistry/);
});
