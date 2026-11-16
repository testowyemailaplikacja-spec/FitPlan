'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function motionLibrary() {
  const window = {};
  for (const file of [
    'apps/fitplan/motion/library.js',
    'apps/fitplan/motion/photographic-manifest.js',
    'apps/fitplan/motion/photographic-catalog.js'
  ]) {
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { window, globalThis: window, console }, { filename: file });
  }
  return window.FitPlanMotionLibrary;
}

test('Hip Thrust uses its own six-frame photographic sequence and manual round-trip timeline', () => {
  const library = motionLibrary();
  const hip = library.resolve('Hip thrust');
  const pushUp = library.resolve('Push-Up');

  assert.equal(hip.visual.kind, 'photographic-sequence');
  assert.equal(hip.visual.atlas, './assets/motion/hip-thrust-v1/athlete.webp');
  assert.equal(hip.visual.width, 724);
  assert.equal(hip.visual.height, 362);
  assert.equal(hip.visual.columns, 2);
  assert.equal(hip.visual.rows, 3);
  assert.deepEqual(
    Array.from(hip.keyframes, keyframe => keyframe.frame),
    [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]
  );
  assert.notEqual(hip.visual.atlas, pushUp.visual.atlas);

  assert.equal(hip.visual.flow.url, './assets/motion/hip-thrust-v1/flow.png');
  assert.equal(hip.visual.flow.width, 362);
  assert.equal(hip.visual.flow.height, 181);
  assert.equal(hip.visual.flow.columns, 4);
  assert.equal(hip.visual.flow.rows, 5);
  assert.deepEqual(
    Array.from(hip.visual.flow.pairs, pair => Array.from(pair)),
    [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]
  );

  assert.equal(library.sample(hip, 0).from, 0);
  assert.equal(library.sample(hip, .5).from, 5);
  assert.equal(library.sample(hip, 1).from, 0);
  assert.equal(hip.phases.length, 4);
  assert.match(hip.phases[2].cue, /bez przeprostu lędźwi/i);

  for (const file of [hip.visual.atlas, hip.visual.flow.url]) {
    assert.ok(fs.existsSync('apps/fitplan/' + file.replace(/^\.\//, '')), file + ' exists');
  }
});
