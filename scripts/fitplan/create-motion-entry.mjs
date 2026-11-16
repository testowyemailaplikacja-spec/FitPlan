#!/usr/bin/env node

import process from 'node:process';

function stop(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const values = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index], value = process.argv[index + 1];
  if (!flag?.startsWith('--') || value === undefined) stop('arguments must use --name value pairs');
  values.set(flag.slice(2), value);
}

const required = name => {
  const value = String(values.get(name) || '').trim();
  if (!value) stop(`--${name} is required`);
  return value;
};
const integer = (name, fallback, minimum, maximum) => {
  const raw = values.has(name) ? values.get(name) : String(fallback);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) stop(`--${name} must be an integer from ${minimum} to ${maximum}`);
  return value;
};

const id = required('id');
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) stop('--id must be kebab-case');
const catalogName = required('catalog-name');
const category = required('category');
const title = required('title');
const width = integer('width', 1024, 128, 4096);
const height = integer('height', 576, 128, 4096);
const frameCount = integer('frame-count', 6, 2, 12);
const extension = String(values.get('extension') || 'webp').toLowerCase();
if (!['webp', 'png'].includes(extension)) stop('--extension must be webp or png');

const aliases = [catalogName];
if (title.toLocaleLowerCase('pl-PL') !== catalogName.toLocaleLowerCase('pl-PL')) aliases.push(title);
const outward = Array.from({ length: frameCount }, (_, index) => index);
const sequence = [...outward, ...outward.slice(0, -1).reverse()];
const pad = value => String(value).padStart(2, '0');

const entry = {
  id,
  aliases,
  actorId: 'fitplan-athlete-01',
  category,
  title,
  subtitle: `${title} — pełne powtórzenie`,
  visual: {
    kind: 'photographic-sequence',
    width,
    height,
    frames: outward.map((_, index) => `./assets/motion/${id}-v1/frame-${pad(index + 1)}.${extension}`)
  },
  sequence,
  markers: [
    { at: 0, label: 'Start' },
    { at: 0.5, label: 'Pozycja końcowa' },
    { at: 1, label: 'Start' }
  ],
  phases: [
    { at: 0, label: 'Pozycja startowa', cue: 'TODO: opisz ustawienie ciała, sprzętu i punktów podparcia.' },
    { at: 0.25, label: 'Pierwsza faza ruchu', cue: 'TODO: opisz kierunek ruchu i kontrolę najważniejszych stawów.' },
    { at: 0.5, label: 'Pozycja końcowa', cue: 'TODO: opisz prawidłowy zakres oraz błędy, których trzeba unikać.' },
    { at: 0.75, label: 'Kontrolowany powrót', cue: 'TODO: opisz powrót z zachowaniem stabilnych punktów podparcia.' }
  ],
  review: {
    status: 'draft',
    fixedSupports: ['TODO: wpisz nieruchome punkty podparcia'],
    checks: []
  }
};

console.log(JSON.stringify(entry, null, 2));
