'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', 'apps', 'fitplan');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function createLibrary() {
  const window = {};
  for (const file of ['motion/library.js', 'motion/photographic-manifest.js', 'motion/photographic-catalog.js']) {
    vm.runInNewContext(read(file), { window, globalThis: window, console }, { filename: file });
  }
  return window;
}

test('Side Steps resolves the existing Chód bokiem exercise and never changes band walking', () => {
  const app = createLibrary();
  const lib = app.FitPlanMotionLibrary;
  const side = lib.resolve('Chód bokiem');
  assert.ok(side);
  assert.equal(side.id, 'side-step');
  assert.equal(side.category, 'legs');
  assert.equal(lib.resolve('Side Step'), side);
  assert.equal(lib.resolve('Side Steps'), side);
  assert.equal(lib.resolve('Chód bokiem z gumą'), null, 'band walk retains its separate draft provider');
  assert.equal(side.mechanicalDraft, undefined);
  assert.equal(side.visual.kind, 'photographic-sequence');
  assert.deepEqual(Array.from(side.visual.flow.pairs, pair => Array.from(pair)), [[0,1],[1,2],[2,3],[3,4],[4,5]]);
  assert.ok(fs.existsSync(path.join(root,side.visual.flow.url)));
  assert.equal(side.visual.flow.width,256);
  assert.equal(side.visual.flow.height,256);
});

test('manual Side Step round trip always stays in authored neighbouring frames', () => {
  const lib = createLibrary().FitPlanMotionLibrary;
  const side = lib.resolve('Chód bokiem');
  assert.deepEqual(Array.from(side.keyframes, key => key.frame), [0,1,2,3,4,5,4,3,2,1,0]);
  for (let i = 0; i <= 100; i += 1) {
    const p = lib.sample(side, i / 100);
    assert.ok(p.from >= 0 && p.from <= 5);
    assert.ok(p.to >= 0 && p.to <= 5);
    assert.ok(Math.abs(p.from-p.to) <= 1);
    assert.ok(p.mix >= 0 && p.mix <= 1);
  }
  assert.equal(lib.sample(side,0).from, 0);
  assert.equal(lib.sample(side,.5).from, 5);
  assert.equal(lib.sample(side,1).from, 0);
  assert.equal(lib.sample(side,1).progress, 1);
});

test('Side Step generated WebP atlas has the expected dimensions and complete six-pose grid', () => {
  const side = createLibrary().FitPlanMotionLibrary.resolve('Chód bokiem');
  const image = fs.readFileSync(path.join(root, side.visual.atlas.replace(/^\.\//, '')));
  assert.equal(image.toString('ascii', 0, 4), 'RIFF');
  assert.equal(image.toString('ascii', 8, 12), 'WEBP');
  assert.equal(side.visual.columns,3);
  assert.equal(side.visual.rows,2);
  const chunk=image.toString('ascii',12,16);
  let width,height;
  if (chunk==='VP8X') {
    width=1+image[24]+(image[25]<<8)+(image[26]<<16);
    height=1+image[27]+(image[28]<<8)+(image[29]<<16);
  } else if (chunk==='VP8 ') {
    width=image.readUInt16LE(26)&0x3fff;
    height=image.readUInt16LE(28)&0x3fff;
  } else throw new Error('Unsupported WebP header: '+chunk);
  assert.equal(width,1536);
  assert.equal(height,1024);
});

test('FitPlan offline manifest loader discovers Side Step without static asset duplication', () => {
  const sw = read('sw.js');
  const index = read('index.html');
  assert.match(sw, /readPhotographicAssets/);
  assert.doesNotMatch(sw, /assets\/motion\/side-step-v1\/athlete\.webp/);
  const version=index.match(/legacy\.html\?v=([^\"]+)/)?.[1];
  assert.ok(version,'iframe must carry a cache-busting version');
  assert.ok(sw.includes('./legacy.html?v='+version),'offline manifest must cache the active iframe');
});
