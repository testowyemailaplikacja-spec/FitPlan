// WIEDORA-CHANGE: WD-20261031-WIE-161-FITPLAN-COPY-GUARD-06 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

// Scoped to the actual renderers and their HTML shells. Source absence is NOT
// a substitute for checking a deployed page and its service-worker cache.
const surfaces = [
  'apps/fitplan/modules/exercise-list.js',
  'apps/fitplan/modules/results.js',
  'apps/fitplan/index.html',
  'apps/fitplan/legacy.html',
  'apps/fitplan/views/exercise-list.html',
  'apps/fitplan/views/results.html'
];
const removedCopy = [
  'Pozycje są ułożone od najwyższej oceny skuteczności',
  'proceduralny podgląd 3D',
  'autorską animację 2D',
  'BMR i TDEE pochodzą z istniejącego kalkulatora FitPlan'
];
function offenders(files) {
  return files.flatMap(([name, text]) => removedCopy
    .filter(phrase => text.includes(phrase)).map(phrase => name + ' contains: ' + phrase));
}
test('WIE-161: outdated explanatory FitPlan copy does not return to six render/entry files', () => {
  const inputs = surfaces.map(name => [name, fs.readFileSync(path.join(root, name), 'utf8')]);
  assert.deepEqual(offenders(inputs), []);
  assert.match(inputs[0][1], /Rozwiń partię mięśniową albo wyszukaj ćwiczenie/);
});
test('WIE-161 negative: reintroducing each removed fragment is rejected', () => {
  for (const phrase of removedCopy) {
    const bad = [['apps/fitplan/modules/exercise-list.js', phrase]];
    assert.equal(offenders(bad).length, 1, phrase);
  }
});
