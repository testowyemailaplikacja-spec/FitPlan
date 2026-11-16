// WIEDORA-CHANGE: WD-20261030-WIE-155-FITPLAN-UPDATE-01 | TASK: WIE-155 | AUTHOR: Codex / GPT-6 (full version unknown)
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=process.env.FITPLAN_UPDATE_OUTPUT||fs.mkdtempSync(path.join(os.tmpdir(),'fitplan-offline-update-'));
fs.mkdirSync(output,{recursive:true});
const source=fs.readFileSync(path.join(root,'apps/fitplan/sw.js'),'utf8');
const oldCache='portal-offline-fitplan-fixture-old';
const currentCache='portal-offline-fitplan'+source.match(/APP_ID\+"([^"]+)"/)[1];
let release='old',fault=null,networkAvailable=true;
const faultHits=[];
const server=http.createServer((req,res)=>{
 if(!networkAvailable){req.socket.destroy();return;}
 const url=new URL(req.url,'http://localhost');
 let file=path.join(root,url.pathname);
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/apps/fitplan/modules/start.js'&&fault){
  faultHits.push({release,fault});
  res.writeHead(fault==='http'?503:200,{'Content-Type':'text/html; charset=utf-8'});
  return res.end('<!doctype html><title>Controlled unavailable asset</title>');
 }
 const ext=path.extname(file);
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[ext]||'application/octet-stream');
 if(url.pathname==='/apps/fitplan/sw.js')return res.end(release==='old'?source.replace(/const CACHE_NAME=.*?;/,'const CACHE_NAME="'+oldCache+'";'):source);
 if(ext==='.html'&&url.pathname.startsWith('/apps/fitplan/'))return res.end(fs.readFileSync(file,'utf8').replace('<head>','<head><meta name="offline-test-release" content="'+release+'">'));
 fs.createReadStream(file).pipe(res);
});
async function listen(context){
 await context.addInitScript(()=>{
  window.offlineUpdateEvents=[];
  navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.appId==='fitplan')window.offlineUpdateEvents.push(e.data);});
 });
 await context.route('https://**/*',r=>r.abort('blockedbyclient'));
}
async function message(page,type){
 await page.evaluate(async type=>{
  window.offlineUpdateEvents=[];
  (await navigator.serviceWorker.ready).active.postMessage({type});
 },type);
 const expected=type==='REFRESH_APP'?'REFRESH_DONE':null;
 await page.waitForFunction(expected=>window.offlineUpdateEvents.some(m=>expected?m.type===expected:['CACHE_DONE','CACHE_ERROR'].includes(m.type)),expected,{timeout:60000});
 return page.evaluate(()=>window.offlineUpdateEvents.at(-1));
}
async function packages(page){return page.evaluate(async()=>{
 const out=[];for(const name of await caches.keys())if(name.startsWith('portal-offline-fitplan-')){
  const cache=await caches.open(name);out.push({name,ready:Boolean(await cache.match('/apps/fitplan/offline-ready'))});
 }return out;
});}
async function reopen(context,page,origin,expected){
 // Enforce disconnection at the HTTP server too: the worker has its own network target.
 networkAvailable=false;
 await context.setOffline(true);await page.close();const next=await context.newPage();
 await next.goto(origin+'/apps/fitplan/',{waitUntil:'load'});
 await next.frameLocator('#appFrame').locator('#sectionGrid .section-card').first().waitFor();
 assert.equal(await next.locator('meta[name="offline-test-release"]').getAttribute('content'),expected,'offline shell release');
 assert.equal(await next.frameLocator('#appFrame').locator('meta[name="offline-test-release"]').getAttribute('content'),expected,'offline iframe release');
 assert.equal(await next.evaluate(()=>localStorage.getItem('fitplan.start.exercises.v1')),'["chest-pompki"]','saved plan survives worker upgrade');
 return next;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.PORTAL_BROWSER_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const result={scope:'local HTTP; real service worker/cache and app; synthetic old generation marker; guest; no external backend',scenarios:[]};
 try{
 const context=await browser.newContext({serviceWorkers:'allow'});await listen(context);let page=await context.newPage();
 await page.goto(origin+'/apps/fitplan/');await page.evaluate(()=>navigator.serviceWorker.ready);
 let done=await message(page,'CACHE_APP');assert.equal(done.type,'CACHE_DONE');assert.equal(done.failed,0);
 await page.evaluate(()=>{localStorage.setItem('fitplan.start.exercises.v1','["chest-pompki"]');localStorage.setItem('portal-offline-enabled:fitplan','1');localStorage.setItem('portal-offline-refreshed:fitplan',String(Date.now()));});
 result.scenarios.push({name:'complete old package',result:'PASS'});
 fault='html';
 const runtimeAsset=await page.evaluate(async()=>{
  const url=document.querySelector('script[src*="./modules/start.js"]').src;
  return (await fetch(url,{cache:'no-store'})).text();
 });
 const digest=value=>createHash('sha256').update(value).digest('hex');
 assert.equal(digest(runtimeAsset),digest(fs.readFileSync(path.join(root,'apps/fitplan/modules/start.js'),'utf8')),'runtime HTML response must preserve the previously downloaded script');
 result.scenarios.push({name:'runtime HTML response serves the saved valid script',result:'PASS'});
 release='current';fault='http';
 await page.evaluate(async()=>{
  window.offlineControllerChanges=0;
  navigator.serviceWorker.addEventListener('controllerchange',()=>window.offlineControllerChanges++);
  await (await navigator.serviceWorker.ready).update();
 });
 await page.waitForFunction(async name=>(await caches.keys()).includes(name),currentCache);
 // Activation is observable through the controller; update() alone does not imply claim().
 await page.waitForFunction(()=>window.offlineControllerChanges>0);
 done=await message(page,'REFRESH_APP');assert.ok(done.failed>0,'HTTP failure must reject the update');
 let state=await packages(page);assert.ok(state.some(p=>p.name===oldCache));assert.equal(state.find(p=>p.name===currentCache).ready,false);
 result.scenarios.push({name:'HTTP 503 retains prior package',result:'PASS',message:done});
 page=await reopen(context,page,origin,'old');result.scenarios.push({name:'reopen prior shell and iframe offline after failed upgrade; saved plan retained',result:'PASS'});
 // Keep automatic online refresh on the same failing response, then inspect a deliberate retry.
 fault='html';networkAvailable=true;await context.setOffline(false);
 await page.waitForFunction(()=>window.offlineUpdateEvents.some(m=>m.type==='REFRESH_DONE'),null,{timeout:60000});
 done=await message(page,'REFRESH_APP');
 assert.ok(done.failed>0,'HTTP 200 HTML fallback must not complete a JavaScript download');
 state=await packages(page);assert.ok(state.some(p=>p.name===oldCache),'HTML fallback must retain previous package');
 assert.equal(state.find(p=>p.name===currentCache).ready,false);
 result.scenarios.push({name:'HTTP 200 HTML fallback rejects upgrade',result:'PASS',message:done});
 fault=null;done=await message(page,'REFRESH_APP');assert.equal(done.failed,0);
 state=await packages(page);assert.equal(state.some(p=>p.name===oldCache),false);assert.equal(state.find(p=>p.name===currentCache).ready,true);
 result.scenarios.push({name:'successful retry retires prior package only after completion',result:'PASS',message:done});
 page=await reopen(context,page,origin,'current');result.scenarios.push({name:'reopen new shell and iframe offline; saved plan retained',result:'PASS'});
 await page.screenshot({path:path.join(output,'fitplan-upgraded-offline.png')});await context.close();
 // A first-time download must also report the wrong MIME, without a ready marker.
 fault='html';networkAvailable=true;const fresh=await browser.newContext({serviceWorkers:'allow'});await listen(fresh);const first=await fresh.newPage();
 await first.goto(origin+'/apps/fitplan/');await first.evaluate(()=>navigator.serviceWorker.ready);
 done=await message(first,'CACHE_APP');assert.equal(done.type,'CACHE_ERROR');assert.ok(done.failed>0);
 assert.equal(await first.evaluate(()=>localStorage.getItem('portal-offline-enabled:fitplan')),null);
 assert.ok((await packages(first)).every(p=>!p.ready));assert.equal(await first.locator('.offline-control').isEnabled(),true);
 result.scenarios.push({name:'first invalid download stays retryable and is never marked ready',result:'PASS'});await fresh.close();
 result.status='PASS';
 }catch(error){result.status='FAIL';result.error=error.stack;process.exitCode=1;}
 finally{result.faultHits=faultHits;fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
