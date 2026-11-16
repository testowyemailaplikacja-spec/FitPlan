const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');

function startServer() {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    let file = path.join(root, pathname);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      const app = /^\/apps\/(prawo|ccna|oficerska)\//.exec(pathname);
      if (app && !path.extname(pathname)) file = path.join(root, 'apps', app[1], 'index.html');
    }
    if (!fs.existsSync(file)) {res.statusCode=404;return res.end();}
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({server, origin:'http://127.0.0.1:' + server.address().port})));
}
function authFixture(role='user') {
  return `
  const user=${role === 'guest' ? 'null' : JSON.stringify({id:'local-study-fixture',email:'test@example.invalid'})};
  const reports=[{id:'00000000-0000-4000-8000-000000000001',description:'Przykładowe zgłoszenie do sprawdzenia kontrastu',app_id:'account',status:'new',page_url:'/konto/',selector:'#adminReportsList',created_at:'2026-10-10T12:00:00Z'}];
  window.AppSupabase={auth:{getSession:async()=>({data:{session:user?{user}:null}}),getUser:async()=>({data:{user}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
  from(table){const result={data:table==='profiles'?{display_name:'Użytkownik testowy'}:table==='user_roles'?{role:${JSON.stringify(role)}}:table==='bug_reports'?reports:null,error:null};const q={select(){return q},eq(){return q},is(){return q},in(){return q},gte(){return q},lte(){return q},order(){return q},limit(){return q},range(){return q},upsert(){return q},insert(){return q},update(){return q},delete(){return q},maybeSingle:async()=>result,single:async()=>result,then:f=>Promise.resolve(result).then(f)};return q},rpc:async()=>({data:null,error:null})};`;
}
async function isolate(page, origin, role='user') {
  await page.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.fulfill({body:'',contentType:'text/javascript'}));
  await page.route('**/js/supabase-client.js', r => r.fulfill({body:authFixture(role),contentType:'text/javascript'}));
}
module.exports = {startServer,isolate};
