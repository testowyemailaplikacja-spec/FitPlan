'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {createFitPlan, until} = require('./fitplan-shell-harness.cjs');

test('the training calendar has no manual completed-module control', async t => {
  const app = await createFitPlan(t);
  app.card('kalendarz-treningowy').click();
  await app.settle();
  assert.equal(app.w.document.getElementById('completeSectionBtn'), null);
  assert.ok(app.w.document.getElementById('fitplanCalendarMount'));
  assert.deepEqual(app.errors, []);
});

test('dashboard reconciles active account after an early null ready result', async t => {
  const account = {id: 'owner-1', name: 'Zalogowany użytkownik'};
  const app = await createFitPlan(t, {observeWindow(window) {
    window.PortalAuth = {ready: async () => null, current: () => account};
    window.FitPlanAccountMedia = {list: async () => []};
  }});
  app.card('podsumowanie-wynikow').click();
  await app.settle();
  const name = app.w.document.getElementById('fpdAvatarName');
  await until(() => name.textContent === 'Zalogowany użytkownik');
  assert.equal(name.textContent, 'Zalogowany użytkownik');
  assert.deepEqual(app.errors, []);
});

test('progress center captures dated photos and compares old/new measurements', async t => {
  const photos = [], uploads = [];
  const app = await createFitPlan(t, {
    storage: {'fitplan.dashboard.profile.v1': JSON.stringify({
      weight: 92, height: 185, age: 30, formula: 'male',
      activity: 1.55, cycle: 7, sessions: 3, discipline: 'kalistenika'
    })},
    observeWindow(window) {
      window.FitPlanAccountMedia = {
        list: async () => [...photos],
        upload: async (file, snapshot) => {
          uploads.push({file, snapshot});
          const path = 'owner-1/' + photos.length + '.jpg';
          photos.push({path, url: 'https://example.invalid/' + path, createdAt: snapshot.recordedOn + 'T12:00:00Z', snapshot});
        },
        remove: async path => {
          const index = photos.findIndex(photo => photo.path === path);
          if (index !== -1) photos.splice(index, 1);
        }
      };
    }
  });
  app.card('podsumowanie-wynikow').click();
  await app.settle();
  const d = app.w.document;
  assert.equal(d.querySelectorAll('.fpd-view-slot').length, 3);
  const input = d.getElementById('fpdPhoto');
  async function addPhoto(date, weight) {
    d.getElementById('fpdRecordedOn').value = date;
    d.getElementById('fpdWeight').value = String(weight);
    const file = new app.w.File(['photo'], 'photo.jpg', {type: 'image/jpeg'});
    Object.defineProperty(input, 'files', {configurable: true, value: [file]});
    input.dispatchEvent(new app.w.Event('change', {bubbles: true}));
    await until(() => uploads.length && uploads.at(-1).snapshot.recordedOn === date);
    await until(() => d.querySelectorAll('.fpd-image').length === photos.length);
  }
  await addPhoto('2026-09-27', 92);
  await addPhoto('2026-10-27', 90);
  const older = d.getElementById('fpdCompareOlder');
  const newer = d.getElementById('fpdCompareNewer');
  assert.equal(older.options.length, 2);
  assert.equal(newer.options.length, 2);
  let pickerOpened=false;
  const originalPickerClick=input.click.bind(input);
  input.click=()=>{pickerOpened=true;};
  d.querySelector(".fpd-image button").click();
  assert.equal(pickerOpened,true,"replacing a photo opens the file picker");
  input.click=originalPickerClick;
  older.value = photos[0].path;
  newer.value = photos[1].path;
  newer.dispatchEvent(new app.w.Event('change', {bubbles: true}));
  assert.equal(d.querySelectorAll('.fpd-compare-card').length, 2);
  assert.match(d.getElementById('fpdCompareResult').textContent, /Zmiana wagi: -2,0 kg/);
  assert.ok(uploads[0].file instanceof app.dom.window.File);
  assert.deepEqual(app.errors, []);
});

test('account media stores history in private photo metadata and preserves owner isolation', async () => {
  const source = fs.readFileSync('js/fitplan-account-media.js', 'utf8');
  const owner = {id: 'owner-1'}, photos = new Map(), calls = [];
  const storage = {
    upload: async (path, file, options) => {
      photos.set(path, {file, options});
      calls.push({type: 'upload', path});
      return {error: null};
    },
    list: async id => ({
      error: null,
      data: [...photos.keys()].filter(path => path.startsWith(id + '/')).map(path => ({name: path.slice(id.length + 1), created_at: '2026-10-27T12:00:00Z'}))
    }),
    createSignedUrl: async path => ({error: null, data: {signedUrl: 'https://example.invalid/private/' + path}}),
    info: async path => ({data: {user_metadata: photos.get(path).options.metadata}}),
    remove: async paths => {
      for (const path of paths) {
        calls.push({type: 'remove', path});
        photos.delete(path);
      }
      return {error: null};
    }
  };
  const window = {
    PortalAuth: {ready: async () => owner, current: () => owner},
    crypto: {randomUUID: () => String(photos.size + 1)},
    AppSupabase: {
      auth: {getUser: async () => ({data: {user: owner}})},
      storage: {from: bucket => {assert.equal(bucket, 'fitplan-progress'); return storage;}}
    }
  };
  vm.runInNewContext(source, {window});
  const media = window.FitPlanAccountMedia;
  const file = {type: 'image/png', size: 1200};
  const old = await media.upload(file, {recordedOn: '2026-09-27', view: 'front', weight: 92, height: 185, supplements: 'Kreatyna'});
  let list = await media.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].snapshot.recordedOn, '2026-09-27');
  assert.equal(list[0].snapshot.weight, 92);
  await assert.rejects(() => media.remove('someone-else/photo.png'), /wyłącznie/);
  const next = await media.replace(file, old.path, {recordedOn: '2026-10-27', view: 'front', weight: 90});
  list = await media.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].path, next.path);
  assert.equal(list[0].snapshot.weight, 90);
  assert.equal(calls.filter(call => call.type === 'remove').length, 1);
});
