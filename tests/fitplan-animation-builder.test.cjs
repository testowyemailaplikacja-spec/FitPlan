'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FITPLAN = path.join(ROOT, 'apps', 'fitplan');

function read(relative) {
  return fs.readFileSync(path.join(FITPLAN, relative), 'utf8');
}

function loadPhotographicCatalog() {
  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  for (const file of [
    'motion/library.js',
    'motion/photographic-manifest.js',
    'motion/photographic-catalog.js'
  ]) {
    vm.runInNewContext(read(file), sandbox, { filename: file });
  }
  return sandbox;
}

test('one photographic manifest registers the current photo exercises without exercise-specific loaders', () => {
  const app = loadPhotographicCatalog();
  const manifest = app.FitPlanPhotographicManifest;
  const library = app.FitPlanMotionLibrary;

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.referenceExerciseId, 'push-up');
  assert.deepEqual(Array.from(manifest.actors, actor => actor.id), ['fitplan-athlete-01','fitplan-athlete-side-step-01']);
  const ids = Array.from(manifest.exercises, item => item.id);
  assert.ok(ids.includes('push-up'));
  assert.ok(ids.includes('hip-thrust'));
  assert.ok(ids.length >= 2);

  const push = library.resolve('Pompki');
  const hip = library.resolve('Hip thrust');
  assert.equal(push.visual.kind, 'photographic-sequence');
  assert.equal(hip.visual.kind, 'photographic-sequence');
  assert.deepEqual(Array.from(push.keyframes, key => key.frame), [0,1,2,3,4,5,4,3,2,1,0]);
  assert.deepEqual(Array.from(hip.keyframes, key => key.frame), [0,1,2,3,4,5,4,3,2,1,0]);
  assert.notEqual(push.visual.atlas, hip.visual.atlas);

  const legacy = read('legacy.html');
  assert.match(legacy, /motion\/photographic-manifest\.js/);
  assert.match(legacy, /motion\/photographic-catalog\.js/);
  assert.doesNotMatch(legacy, /motion\/exercises\/(?:push-up|hip-thrust)\.js/);
  assert.ok(
    legacy.indexOf('motion/photographic-manifest.js') < legacy.indexOf('motion/photographic-catalog.js'),
    'manifest must load before the generic registrar'
  );
});

test('the same catalog contract accepts a frame-only exercise for crossfade delivery', () => {
  const app = loadPhotographicCatalog();
  const catalog = app.FitPlanPhotographicCatalog;
  const fixture = {
    schemaVersion: 1,
    actors: [],
    exercises: [{
      id: 'fixture-squat',
      aliases: ['Fixture Squat'],
      actorId: 'fitplan-athlete-01',
      category: 'legs',
      title: 'Fixture Squat',
      subtitle: 'Fixture Squat — pełne powtórzenie',
      visual: {
        kind: 'photographic-sequence',
        width: 640,
        height: 360,
        frames: [
          './assets/motion/fixture-squat-v1/frame-01.webp',
          './assets/motion/fixture-squat-v1/frame-02.webp',
          './assets/motion/fixture-squat-v1/frame-03.webp'
        ]
      },
      sequence: [0, 1, 2, 1, 0],
      markers: [{ at: 0, label: 'Góra' }, { at: .5, label: 'Dół' }, { at: 1, label: 'Góra' }],
      phases: [
        { at: 0, label: 'Start', cue: 'Ustaw stabilnie całe stopy i zachowaj neutralną pozycję tułowia.' },
        { at: .5, label: 'Dół', cue: 'Kontroluj kolana oraz biodra w najniższej pozycji ruchu.' }
      ],
      review: {
        status: 'reviewed',
        fixedSupports: ['left-foot', 'right-foot'],
        checks: ['identity', 'camera', 'supports', 'joint-path', 'endpoints', 'continuity']
      }
    }]
  };

  const registered = catalog.register(fixture);
  assert.deepEqual(Array.from(registered), ['fixture-squat']);
  const movement = app.FitPlanMotionLibrary.resolve('Fixture Squat');
  assert.equal(movement.visual.frames.length, 3);
  assert.equal(movement.visual.flow, undefined);
  assert.equal(app.FitPlanMotionLibrary.sample(movement, .25).mix, 0);
  assert.equal(app.FitPlanMotionLibrary.sample(movement, .375).mix, .5);
});

test('a new photographic entry replaces only its matching mechanical draft', () => {
  const sandbox = { console };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  for (const file of [
    'data/app-data.js',
    'data/muscles.js',
    'data/exercise-catalog.js',
    'exercise-motion.js',
    'motion/library.js',
    'motion/photographic-manifest.js',
    'motion/photographic-catalog.js'
  ]) vm.runInNewContext(read(file), sandbox, { filename: file });

  const originalDedicated = sandbox.FitPlanExerciseCatalog.items.filter(item => sandbox.FitPlanMotionLibrary.resolve(item.name) || sandbox.FitPlanExerciseMotion.has(item.name)).length;
  const candidate = sandbox.FitPlanExerciseCatalog.items.find(item =>
    !sandbox.FitPlanMotionLibrary.resolve(item.name) && !sandbox.FitPlanExerciseMotion.has(item.name)
  );
  assert.ok(candidate, 'the fixture needs one catalog exercise without a dedicated provider');
  sandbox.FitPlanPhotographicCatalog.register({
    schemaVersion: 1,
    actors: [],
    exercises: [{
      id: 'fixture-' + candidate.id,
      aliases: [candidate.name],
      actorId: 'fitplan-athlete-01',
      category: candidate.category,
      title: 'Fixture Motion',
      subtitle: 'Fixture Motion — pełne powtórzenie',
      visual: {
        kind: 'photographic-sequence',
        width: 640,
        height: 360,
        frames: ['./assets/motion/fixture-squat-v1/frame-01.webp', './assets/motion/fixture-squat-v1/frame-02.webp']
      },
      sequence: [0, 1, 0],
      markers: [{ at: 0, label: 'Góra' }, { at: .5, label: 'Dół' }, { at: 1, label: 'Góra' }],
      phases: [{ at: 0, label: 'Start', cue: 'Ustaw stabilnie stopy.' }],
      review: {
        status: 'reviewed',
        fixedSupports: ['left-foot', 'right-foot'],
        checks: ['identity', 'camera', 'supports', 'joint-path', 'endpoints', 'continuity']
      }
    }]
  });
  for (const file of ['motion/full-body-poses.js', 'motion/exercises/catalog-rigs.js']) {
    vm.runInNewContext(read(file), sandbox, { filename: file });
  }

  const dedicated = sandbox.FitPlanMotionLibrary.resolve(candidate.name);
  assert.equal(dedicated.id, 'fixture-' + candidate.id);
  assert.notEqual(dedicated.mechanicalDraft, true);
  assert.equal(sandbox.FitPlanMotionCoverage.draftCount + sandbox.FitPlanMotionCoverage.existingCount, sandbox.FitPlanMotionCoverage.total);
  assert.equal(sandbox.FitPlanMotionCoverage.existingCount, originalDedicated + 1);
});

test('renderer crossfades frame files when optical flow is unavailable', async () => {
  const dom = new JSDOM('<div id="stage"></div>', { url: 'https://fitplan.test/apps/fitplan/' });
  const { window } = dom;
  class LoadedImage {
    set src(value) {
      this._src = value;
      this.naturalWidth = 640;
      this.naturalHeight = 360;
      queueMicrotask(() => this.onload?.());
    }
    get src() { return this._src; }
  }
  window.Image = LoadedImage;
  window.HTMLCanvasElement.prototype.getContext = () => null;
  vm.runInNewContext(read('motion/renderer.js'), { window, console }, { filename: 'renderer.js' });

  const definition = {
    visual: {
      kind: 'photographic-sequence',
      width: 640,
      height: 360,
      frames: ['./one.webp', './two.webp']
    }
  };
  const stage = window.document.getElementById('stage');
  const states = [];
  const renderer = window.FitPlanPoseRenderer.create(stage, definition, state => states.push(state));
  renderer.setPose({ from: 0, to: 1, mix: .4, progress: .4 });
  await renderer.loaded;

  const posters = stage.querySelectorAll('.fitplan-motion-poster');
  assert.equal(posters.length, 2);
  assert.match(posters[0].style.backgroundImage, /one\.webp/);
  assert.match(posters[1].style.backgroundImage, /two\.webp/);
  assert.equal(posters[1].style.opacity, '0.4');
  assert.equal(stage.dataset.renderer, 'crossfade');
  assert.ok(states.includes('crossfade'));
  renderer.dispose();
  assert.equal(stage.children.length, 0);
  dom.window.close();
});

test('offline package discovers photographic assets from the manifest instead of hardcoded exercises', () => {
  const worker = read('sw.js');
  assert.match(worker, /photographic-manifest\.js/);
  assert.match(worker, /readPhotographicAssets/);
  assert.doesNotMatch(worker, /assets\/motion\/push-up-v1\/athlete\.webp/);
  assert.doesNotMatch(worker, /assets\/motion\/hip-thrust-v1\/athlete\.webp/);
});

test('repository validator accepts the installed manifest and rejects an unsafe duplicate', () => {
  const validator = path.join(ROOT, 'scripts', 'fitplan', 'validate-motion-manifest.mjs');
  const valid = spawnSync(process.execPath, [validator], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(valid.status, 0, valid.stderr || valid.stdout);
  assert.match(valid.stdout, /photographic exercises/);

  const source = read('motion/photographic-manifest.js');
  const invalid = source.replace('"aliases":["Hip thrust"', '"aliases":["Pompki"');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fitplan-manifest-'));
  const file = path.join(temp, 'manifest.js');
  fs.writeFileSync(file, invalid);
  const rejected = spawnSync(process.execPath, [validator, file], { cwd: ROOT, encoding: 'utf8' });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr + rejected.stdout, /duplicate alias/i);
});

test('entry generator scaffolds a six-frame round trip without editing the live manifest', () => {
  const generator = path.join(ROOT, 'scripts', 'fitplan', 'create-motion-entry.mjs');
  const before = fs.readFileSync(path.join(FITPLAN, 'motion', 'photographic-manifest.js'), 'utf8');
  const result = spawnSync(process.execPath, [generator,
    '--id', 'squat',
    '--catalog-name', 'Przysiady',
    '--category', 'legs',
    '--title', 'Squat',
    '--width', '1024',
    '--height', '576'
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const entry = JSON.parse(result.stdout);
  assert.equal(entry.id, 'squat');
  assert.deepEqual(entry.aliases, ['Przysiady', 'Squat']);
  assert.deepEqual(entry.sequence, [0,1,2,3,4,5,4,3,2,1,0]);
  assert.equal(entry.visual.frames.length, 6);
  assert.equal(entry.visual.frames[0], './assets/motion/squat-v1/frame-01.webp');
  assert.equal(entry.visual.width, 1024);
  assert.equal(entry.visual.height, 576);
  assert.equal(entry.review.status, 'draft');
  assert.ok(entry.phases.every(phase => phase.cue.startsWith('TODO:')));
  assert.equal(fs.readFileSync(path.join(FITPLAN, 'motion', 'photographic-manifest.js'), 'utf8'), before);

  const rejected = spawnSync(process.execPath, [generator,
    '--id', '../unsafe', '--catalog-name', 'Przysiady', '--category', 'legs', '--title', 'Squat'
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /kebab-case/i);
});

