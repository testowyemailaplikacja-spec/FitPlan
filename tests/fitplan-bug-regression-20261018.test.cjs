'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('FitPlan workout, exercise list and diet are single-screen tools',()=>{
 const legacy=read('apps/fitplan/legacy.html');
 assert.match(legacy,/moduleTabs"\)\.hidden = \["lista-cwiczen","plan-treningowy","dieta","start","podsumowanie-wynikow"\]/);
 assert.match(legacy,/if\(\["plan-treningowy","lista-cwiczen","dieta","start","podsumowanie-wynikow"\]\.includes\(id\)\)/);
 assert.match(legacy,/if\(section\.id === "tabela-cwiczen"\)/);
 assert.doesNotMatch(legacy,/FitPlan • 1\.7\.0/);
});

test('Kettlebell selection includes all four levels with persistent state',()=>{
 const view=read('apps/fitplan/views/workout-plan.html');
 const controller=read('apps/fitplan/modules/workout-plan.js');
 for(const level of ['poczatkujacy','sredniozaawansowany','zaawansowany','zawodowiec']){
  assert.match(view,new RegExp('data-fpk-kb-level="'+level+'"'));
 }
 assert.match(view,/id="fpkKettlebell"/);
 assert.match(controller,/write\(LEVEL_KEY\(sport\),level\)/);
 assert.match(controller,/fitplan\.plan\.selected\.v1/);
 assert.match(controller,/aria-pressed/);
 assert.match(read('apps/fitplan/styles/core.css'),/\.fpk-levels\[hidden\]/);
});

test('FitPlan calendar counts down the correct current season and keeps fields from overlapping',()=>{
 const model={document:{}};model.top=model;
 vm.runInNewContext(read('apps/fitplan/calendar-enhancement.js'),{window:model,Date});
 const season=model.FitPlanCalendarModel.seasonSummary;
 assert.equal(season(new Date(2026,9,18)).metrics[0].label,'Do końca jesieni');
 assert.equal(season(new Date(2026,9,18)).metrics[0].days,43);
 assert.equal(season(new Date(2026,6,15)).metrics[0].label,'Do końca lata');
 assert.equal(season(new Date(2026,3,15)).metrics[0].label,'Do końca wiosny');
 assert.equal(season(new Date(2026,11,31)).metrics[0].label,'Do końca roku');
 assert.equal(season(new Date(2026,11,31)).metrics[1].label,'Do końca zimy');
 const css=read('apps/fitplan/calendar-enhancement.js');
 assert.match(css,/@media\(max-width:950px\)/);
 assert.match(css,/\.fpc-field\{min-width:0/);
 assert.match(css,/\.fpc-day\.past:not\(\.selected\)/);
});

test('FitPlan removes fixed bug button while preserving the report mechanism',()=>{
 const reporter=read('js/bug-reporter.js');
 assert.match(reporter,/touchTrigger\.hidden=true/);
 assert.match(reporter,/menu\.addEventListener\("click"/);
 assert.match(read('assets/bug-reporter.css'),/\.portal-bug-touch-trigger\[hidden\]/);
});
