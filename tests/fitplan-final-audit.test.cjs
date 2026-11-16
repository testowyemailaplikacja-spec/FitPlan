const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const ROOT=path.join(__dirname,'../apps/fitplan');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('stage 21 final audit: production shell has no missing local assets and no debug leftovers',()=>{
  const html=read('index.html');
  for(const match of html.matchAll(/(?:src|href)="(\.\.?\/[^"#?]+)(?:\?[^"]*)?"/g)){
    const rel=match[1].replace(/^\.\//,'');
    const target=match[1].startsWith('../')?path.join(ROOT,match[1]):path.join(ROOT,rel);
    assert.equal(fs.existsSync(target),true,'missing local asset '+match[1]);
  }
  for(const file of fs.readdirSync(ROOT,{recursive:true}).filter(x=>/\.(?:js|html|css)$/.test(x)&&x!=='modules/anatomy-runtime.js')){
    const source=read(file);
    assert.doesNotMatch(source,/\b(?:TODO|FIXME|HACK)\b/i,file+' contains unfinished marker');
    assert.doesNotMatch(source,/console\.log\s*\(/,file+' contains console.log');
  }
});

test('stage 21 final audit: all seven views, controllers and offline entries stay aligned',()=>{
  const loader=read('view-loader.js'),registry=read('modules/registry.js'),sw=read('sw.js');
  const expected={
    'kalendarz-treningowy':['calendar.html','calendar.js'],
    'podsumowanie-wynikow':['results.html','results.js'],
    'plan-treningowy':['workout-plan.html','workout-plan.js'],
    'dieta':['diet.html','diet.js'],
    'tabela-cwiczen':['exercises.html','exercises.js'],
    'lista-cwiczen':['exercise-list.html','exercise-list.js'],
    'start':['start.html','start.js']
  };
  for(const [id,[view,controller]] of Object.entries(expected)){
    assert.match(loader,new RegExp('"'+id+'":"'+view+'"'));
    assert.match(registry,new RegExp('"'+id+'"'));
    assert.match(read('views/'+view),new RegExp('data-fitplan-view="'+id+'"'));
    assert.match(read('modules/'+controller),new RegExp('"'+id+'"'));
    assert.ok(sw.includes('./views/'+view),'offline cache missing '+view);
    assert.ok(sw.includes('./modules/'+controller),'offline cache missing '+controller);
  }
});

test('stage 21 final audit: storage compatibility keys remain stable',()=>{
  const storage=read('core/storage.js'),state=read('core/state.js');
  assert.match(storage,/planer-treningowy-progress-v1\.6/);
  assert.match(storage,/fitplan\.calendar\.entries\.v2/);
  assert.doesNotMatch(storage+state,/localStorage\.clear\s*\(/);
});

test('stage 21 final audit: heavy anatomy remains deferred and legacy stays reduced',()=>{
  const sw=read('sw.js'),legacy=read('legacy.html');
  const deferred=sw.slice(sw.indexOf('const DEFERRED_ASSETS'),sw.indexOf('async function notify'));
  assert.match(deferred,/modules\/anatomy\.js/);
  assert.match(deferred,/anatomy-runtime\.js/);
  assert.match(deferred,/anatomy-manifest\.json/);
  assert.equal((deferred.match(/\.deflate/g)||[]).length,18);
  assert.ok(Buffer.byteLength(legacy)<24*1024,'legacy.html regressed above 24 KiB');
  assert.doesNotMatch(legacy,/FitAtlas|70ca6102eb6508e1/);
});
