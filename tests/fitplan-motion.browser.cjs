const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {startServer,isolate}=require('./study-browser-fixture.cjs');
const manifestSource=fs.readFileSync('apps/fitplan/motion/photographic-manifest.js','utf8');
const photographicManifest=JSON.parse(manifestSource.match(/^\s*globalThis\.FitPlanPhotographicManifest\s*=\s*([\s\S]*);\s*$/)[1]);
const output=process.env.PORTAL_REPORT_DIR||'/tmp/fitplan-motion-check';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const {server,origin}=await startServer();
 const browser=await chromium.launch({headless:true,executablePath:process.env.PORTAL_BROWSER_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1000},serviceWorkers:'block'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await isolate(page,origin);
  await page.goto(origin+'/apps/fitplan/');const frame=page.frameLocator('#appFrame');
  await frame.getByRole('heading',{name:'Lista ćwiczeń',exact:true}).click();
  await frame.getByRole('searchbox').fill('Pompki');
  const open=()=>frame.locator('[data-fitplan-exercise="Pompki"]').click();
  await open();const stage=frame.locator('.fitplan-pushup-stage'),slider=frame.locator('[data-push-progress]');
  await stage.locator('canvas:not([hidden])').waitFor();assert.equal(await stage.getAttribute('data-renderer'),'smooth');
  const pixels=()=>stage.locator('canvas').evaluate(el=>el.toDataURL());
  const start=await pixels();await page.waitForTimeout(250);assert.equal(await pixels(),start,'no autonomous motion');
  await slider.focus();await slider.press('ArrowRight');assert.equal(await slider.inputValue(),'0.1');
  await slider.press('End');assert.equal(await slider.inputValue(),'100');
  assert.equal(await pixels(),start,'100% is the real final top pose, not a wrapped slider');
  await slider.press('Home');assert.equal(await slider.inputValue(),'0');
  for(const progress of [5,15,25,35,45,50,75]){
   await slider.fill(String(progress));assert.notEqual(await pixels(),start);
   await stage.screenshot({path:path.join(output,'pose-'+progress+'.png')});
  }
  await slider.fill('37.5');const paused=await pixels();await page.waitForTimeout(250);assert.equal(await pixels(),paused);
  await frame.locator('.fitplan-dialog-close').click();assert.equal(await frame.locator('.fitplan-motion-canvas').count(),0);
  await open();await stage.locator('canvas:not([hidden])').waitFor();assert.equal(await slider.inputValue(),'0');
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:950});await slider.scrollIntoViewIfNeeded();
   assert.equal(await frame.locator('html').evaluate(el=>el.scrollWidth>innerWidth+1),false,'no page overflow at '+width);
   const box=await slider.boundingBox();assert.ok(box.height>=44);assert.ok(box.x>=0&&box.x+box.width<=width);
   await slider.click({position:{x:box.width*.5,y:box.height/2}});assert.ok(Math.abs(Number(await slider.inputValue())-50)<2);
   await page.screenshot({path:path.join(output,'viewport-'+width+'.png')});
  }
  // Asset requests have finished: scrubbing itself must not need the network.
  await page.context().setOffline(true);await slider.fill('12.5');assert.equal(await slider.inputValue(),'12.5');
  assert.equal(await stage.getAttribute('data-renderer'),'smooth');await page.context().setOffline(false);
  // A device without WebGL still has a smooth manual crossfade and a working slider.
  const fallback=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});await isolate(fallback,origin);
  await fallback.addInitScript(()=>{const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl'?null:native.call(this,kind,...args);};});
  await fallback.goto(origin+'/apps/fitplan/');const ff=fallback.frameLocator('#appFrame');
  await ff.getByRole('heading',{name:'Lista ćwiczeń',exact:true}).click();await ff.getByRole('searchbox').fill('Pompki');await ff.locator('[data-fitplan-exercise="Pompki"]').click();
  await ff.locator('[data-renderer="crossfade"]').waitFor();await ff.locator('[data-push-progress]').fill('45');
  assert.equal(await ff.locator('.fitplan-motion-poster-from').isVisible(),true);assert.equal(await ff.locator('.fitplan-motion-poster-to').evaluate(el=>el.style.opacity),'0.5');
  await ff.locator('.fitplan-dialog-close').click();await ff.getByRole('searchbox').fill('Hip thrust');await ff.locator('[data-fitplan-exercise="Hip thrust"]').click();
  await ff.locator('[data-renderer="crossfade"]').waitFor();await ff.locator('[data-push-progress]').fill('45');
  assert.equal(await ff.locator('.fitplan-motion-poster-from').isVisible(),true);assert.equal(await ff.locator('.fitplan-motion-poster-to').evaluate(el=>el.style.opacity),'0.5');
  const touchPage=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
  await isolate(touchPage,origin);await touchPage.goto(origin+'/apps/fitplan/');const tf=touchPage.frameLocator('#appFrame');
  await tf.getByRole('heading',{name:'Lista ćwiczeń',exact:true}).tap();await tf.getByRole('searchbox').fill('Pompki');await tf.locator('[data-fitplan-exercise="Pompki"]').tap();
  await tf.locator('[data-renderer="smooth"]').waitFor();const touchSlider=tf.locator('[data-push-progress]');await touchSlider.scrollIntoViewIfNeeded();
  const tb=await touchSlider.boundingBox(),cdp=await touchPage.context().newCDPSession(touchPage),y=tb.y+tb.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tb.x+14,y}]});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tb.x+14+(tb.width-28)*i/8,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(Number(await touchSlider.inputValue())>95,'touch drag changes pose');
  const touchValue=await touchSlider.inputValue();await touchPage.waitForTimeout(150);assert.equal(await touchSlider.inputValue(),touchValue,'touch release freezes pose');
  await touchPage.screenshot({path:path.join(output,'touch-phone.png')});
  // Independent photographic Hip Thrust: six authored stages, smooth manual scrub and no automatic animation.
  await frame.locator('.fitplan-dialog-close').click();
  await frame.getByRole('searchbox').fill('Hip thrust');
  await frame.locator('[data-fitplan-exercise="Hip thrust"]').click();
  const thrust=frame.locator('[data-exercise="hip-thrust"]'),thrustStage=thrust.locator('.fitplan-pushup-stage');
  const thrustCanvas=thrustStage.locator('canvas:not([hidden])'),thrustSlider=thrust.locator('[data-push-progress]');
  await thrustCanvas.waitFor();
  assert.equal(await thrustStage.getAttribute('data-renderer'),'smooth');
  const thrustPixels=()=>thrustStage.locator('canvas').evaluate(el=>el.toDataURL());
  const thrustStart=await thrustPixels(),staticPose=await thrustPixels();
  await page.waitForTimeout(250);
  assert.equal(await thrustPixels(),staticPose,'hip thrust must remain still');
  await thrustSlider.fill('50');assert.notEqual(await thrustPixels(),thrustStart);
  await thrustCanvas.screenshot({path:path.join(output,'hip-thrust-top.png')});
  await thrustSlider.fill('100');assert.equal(await thrustPixels(),thrustStart,'return ends at the authored bottom pose');
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:950});
   assert.equal(await frame.locator('html').evaluate(el=>el.scrollWidth>innerWidth+1),false,'hip thrust overflow '+width);
   assert.equal(await thrustStage.isVisible(),true);
  }
  await page.context().setOffline(true);await thrustSlider.fill('25');
  assert.equal(await thrustStage.getAttribute('data-renderer'),'smooth');assert.notEqual(await thrustPixels(),thrustStart);
  await page.context().setOffline(false);
  await frame.locator('.fitplan-dialog-close').click();
  assert.equal(await frame.locator('.fitplan-motion-canvas').count(),0);
  // Every later manifest entry gets the same manual photographic contract without a new player.
  const appFrame=page.frames().find(candidate=>candidate.url().includes('/apps/fitplan/legacy.html'));
  assert.ok(appFrame);
  for(const entry of photographicManifest.exercises.filter(item=>!['push-up','hip-thrust'].includes(item.id))){
   const name=await appFrame.evaluate(aliases=>window.FitPlanExerciseCatalog.items.find(item=>aliases.includes(item.name))?.name||'',entry.aliases);
   assert.ok(name,'catalog alias for '+entry.id);
   await frame.getByRole('searchbox').fill(name);
   await frame.locator('[data-fitplan-exercise="'+name+'"]').click();
   const root=frame.locator('.fitplan-motion[data-exercise="'+entry.id+'"]');
   const extraStage=root.locator('.fitplan-pushup-stage'),extraSlider=root.locator('[data-push-progress]');
   const expected=entry.visual.flow?'smooth':'crossfade';
   await root.locator('[data-renderer="'+expected+'"]').waitFor();
   const intermediate=String(50/(entry.sequence.length-1));
   await extraSlider.fill(intermediate);
   assert.equal(await extraSlider.inputValue(),intermediate);
   if(expected==='crossfade'){
    const opacity=Number(await extraStage.locator('.fitplan-motion-poster-to').evaluate(el=>el.style.opacity));
    assert.ok(opacity>0&&opacity<1,'intermediate crossfade '+entry.id);
   }
   const held=await extraSlider.inputValue();await page.waitForTimeout(170);assert.equal(await extraSlider.inputValue(),held,'no autoplay '+entry.id);
   if(entry.id==='side-step' && expected==='smooth'){
    const canvas=extraStage.locator('canvas');
    const pixels=()=>canvas.evaluate(el=>el.toDataURL());
    for(const progress of [0,5,15,25,35,45,50,75,100]){
     await extraSlider.fill(String(progress));
     await canvas.screenshot({path:path.join(output,'side-step-'+progress+'.png')});
    }
    await extraSlider.fill('0');const start=await pixels();
    await extraSlider.fill('100');assert.equal(await pixels(),start,'side step round trip');
    await extraSlider.fill('15');const heldPixels=await pixels();
    await page.waitForTimeout(200);assert.equal(await pixels(),heldPixels,'side step pixels stay still');
    await extraSlider.fill('15.1');assert.notEqual(await pixels(),heldPixels,'sub-frame motion');
    for(const width of [320,390,768,1280]){
     await page.setViewportSize({width,height:950});
     assert.equal(await frame.locator('html').evaluate(el=>el.scrollWidth>innerWidth+1),false,'side step overflow '+width);
     const box=await extraSlider.boundingBox();assert.ok(box.height>=44);
    }
    await page.context().setOffline(true);await extraSlider.fill('35');
    assert.equal(await extraStage.getAttribute('data-renderer'),'smooth');
    await page.context().setOffline(false);
   }

   await extraSlider.fill('0');assert.equal(await extraSlider.inputValue(),'0');
   await extraSlider.fill('50');assert.equal(await extraSlider.inputValue(),'50');
   await extraSlider.fill('100');assert.equal(await extraSlider.inputValue(),'100');
   await frame.locator('.fitplan-dialog-close').click();
  }
  // Dynamically selected mechanical drafts: manual control, responsive layout and stationary isometry.
  const mechanicalExamples=await appFrame.evaluate(()=>{
   const holds=new Set(['staticHold','sidePlank','hang','breathing','hollow','balance']);
   const moving=[],stationary=[];
   for(const item of window.FitPlanExerciseCatalog.items){
    const definition=window.FitPlanMotionLibrary.resolve(item.name);
    if(!definition?.mechanicalDraft||definition.previewUnavailable)continue;
    (holds.has(definition.visual.pattern)?stationary:moving).push(item.name);
   }
   return [...moving.slice(0,3).map(name=>[name,false]),...stationary.slice(0,1).map(name=>[name,true])];
  });
  assert.equal(mechanicalExamples.length,4);
  for(const [name,stationary] of mechanicalExamples){
   await frame.getByRole('searchbox').fill(name);
   await frame.locator('[data-fitplan-exercise="'+name+'"]').click();
   const draft=frame.locator('.fitplan-motion[data-exercise^="mechanical-"]');
   const scene=draft.locator('svg.fitplan-fullbody-scene'),range=draft.locator('[data-push-progress]');
   await scene.waitFor();assert.equal(await draft.locator('.fitplan-pushup-stage').getAttribute('data-renderer'),'mechanical-draft');
   const before=await scene.locator('[data-segment="torso"]').getAttribute('y1');
   await range.fill('50');assert.equal(await scene.getAttribute('data-pose'),'50');
   const after=await scene.locator('[data-segment="torso"]').getAttribute('y1');
   if(stationary)assert.equal(after,before,'isometric hold stays still');
   else assert.notEqual(await scene.getAttribute('data-hip-y'),null);
   await range.fill('75');
   const still=await scene.evaluate(el=>el.outerHTML);
   await page.waitForTimeout(170);assert.equal(await scene.evaluate(el=>el.outerHTML),still,'no autoplay '+name);
   await page.setViewportSize({width:390,height:844});
   assert.equal(await frame.locator('html').evaluate(el=>el.scrollWidth>innerWidth+1),false,'no mobile overflow '+name);
   if(name===mechanicalExamples[0][0])await scene.screenshot({path:path.join(output,'mechanical-sample-phone.png')});
   await frame.locator('.fitplan-dialog-close').click();
  }
  assert.deepEqual(errors,[]);console.log('PASS FitPlan: manifest photographs plus dynamically selected full-body mechanical drafts');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

