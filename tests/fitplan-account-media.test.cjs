'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function harness(){
 const calls=[];
 const bucket={
  list:async(folder,options)=>{calls.push(['list',folder,options]);return {data:[{name:'progress.webp',created_at:'2026-10-24T10:00:00Z'}],error:null};},
  createSignedUrl:async(path,ttl)=>{calls.push(['signed',path,ttl]);return {data:{signedUrl:'https://signed.test/'+path},error:null};},
  upload:async(path,file,options)=>{calls.push(['upload',path,file,options]);return {data:{path},error:null};},
  remove:async paths=>{calls.push(['remove',paths]);return {data:paths,error:null};}
 };
 const client={storage:{from:name=>{calls.push(['bucket',name]);return bucket;}}};
 const window={PortalAuth:{ready:async()=>({id:'user-123'}),current:()=>({id:'user-123'}),client},crypto:{randomUUID:()=> 'photo-id'}};
 vm.runInNewContext(fs.readFileSync('js/fitplan-account-media.js','utf8'),{window,Date});
 return {api:window.FitPlanAccountMedia,calls};
}

test('FitPlan progress photos are private account objects with signed display URLs',async()=>{
 const {api,calls}=harness();
 const rows=await api.list();
 assert.equal(rows.length,1);
 assert.equal(rows[0].path,'user-123/progress.webp');
 assert.match(rows[0].url,/^https:\/\/signed\.test\//);
 assert.ok(calls.some(call=>call[0]==='bucket'&&call[1]==='fitplan-progress'));
 assert.ok(calls.some(call=>call[0]==='signed'&&call[2]===3600));
});

test('FitPlan progress photo validation and owner boundaries are enforced client-side',async()=>{
 const {api,calls}=harness();
 await assert.rejects(api.upload({name:'bad.gif',type:'image/gif',size:10}),/JPG, PNG lub WebP/);
 await assert.rejects(api.upload({name:'big.jpg',type:'image/jpeg',size:4*1024*1024+1}),/4 MB/);
 const saved=await api.upload({name:'ok.png',type:'image/png',size:100});
 assert.match(saved.path,/^user-123\/\d+-photo-id\.png$/);
 await assert.rejects(api.remove('other-user/photo.png'),/własnego konta/);
 await api.remove(saved.path);
 assert.ok(calls.some(call=>call[0]==='remove'&&call[1][0]===saved.path));
});

test('the FitPlan dashboard uses account media instead of a device-only photo database',()=>{
 const source=fs.readFileSync('apps/fitplan/modules/results.js','utf8');
 assert.match(source,/FitPlanAccountMedia/);
 assert.doesNotMatch(source,/indexedDB/);
 assert.doesNotMatch(source,/zapisano lokalnie/i);
});

