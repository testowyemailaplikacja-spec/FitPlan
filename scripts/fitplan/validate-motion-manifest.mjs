#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const defaultManifest = path.join(projectRoot, 'apps', 'fitplan', 'motion', 'photographic-manifest.js');
const manifestPath = path.resolve(process.argv[2] || defaultManifest);
const requiredChecks = ['identity', 'camera', 'supports', 'joint-path', 'endpoints', 'continuity'];
const assetPattern = /^\.\/assets\/motion\/(?!.*(?:^|\/)\.\.?\/)[a-z0-9][a-z0-9._/-]*\.(?:png|webp)$/i;

function fail(message) {
  throw new Error(message);
}

function parseManifest(source) {
  const match = String(source).match(/^\s*globalThis\.FitPlanPhotographicManifest\s*=\s*([\s\S]*);\s*$/);
  if (!match) fail('manifest must be one JSON assignment to globalThis.FitPlanPhotographicManifest');
  let manifest;
  try { manifest = JSON.parse(match[1]); }
  catch (error) { fail(`manifest payload is not JSON: ${error.message}`); }
  return manifest;
}

function natural(value, label) {
  if (!Number.isInteger(value) || value < 1) fail(`${label} must be a positive integer`);
}

function pointList(value, label, { first, last } = {}) {
  if (!Array.isArray(value) || !value.length) fail(`${label} must be a non-empty array`);
  let previous = -1;
  for (const [index, item] of value.entries()) {
    if (!item || !Number.isFinite(item.at) || item.at < 0 || item.at > 1 || item.at < previous) fail(`${label}[${index}].at is invalid`);
    if (!String(item.label || '').trim()) fail(`${label}[${index}].label is required`);
    previous = item.at;
  }
  if (first !== undefined && value[0].at !== first) fail(`${label} must start at ${first}`);
  if (last !== undefined && value.at(-1).at !== last) fail(`${label} must end at ${last}`);
}

function localAsset(value, label, assets) {
  if (typeof value !== 'string' || !assetPattern.test(value) || value.includes('..')) fail(`${label} must be a local motion PNG or WebP asset`);
  assets.add(value);
  return value;
}

function imageSize(file) {
  const data = fs.readFileSync(file);
  if (data.length >= 24 && data.subarray(1, 4).toString('ascii') === 'PNG') {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (data.length >= 30 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP') {
    const chunk = data.subarray(12, 16).toString('ascii');
    if (chunk === 'VP8 ') return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8X') {
      const width = 1 + data[24] + (data[25] << 8) + (data[26] << 16);
      const height = 1 + data[27] + (data[28] << 8) + (data[29] << 16);
      return { width, height };
    }
    if (chunk === 'VP8L') {
      const width = 1 + data[21] + ((data[22] & 0x3f) << 8);
      const height = 1 + ((data[22] & 0xc0) >> 6) + (data[23] << 2) + ((data[24] & 0x0f) << 10);
      return { width, height };
    }
  }
  fail(`unsupported or corrupt image: ${path.relative(projectRoot, file)}`);
}

function checkDimensions(asset, width, height) {
  const file = path.join(projectRoot, 'apps', 'fitplan', asset.replace(/^\.\//, ''));
  if (!fs.existsSync(file)) fail(`missing asset: ${asset}`);
  const actual = imageSize(file);
  if (actual.width !== width || actual.height !== height) fail(`${asset} is ${actual.width}x${actual.height}; expected ${width}x${height}`);
}

function validate(manifest) {
  if (!manifest || manifest.schemaVersion !== 1) fail('schemaVersion must equal 1');
  if (!Array.isArray(manifest.actors) || !manifest.actors.length) fail('actors are required');
  if (!Array.isArray(manifest.exercises) || !manifest.exercises.length) fail('exercises are required');

  const actorIds = new Set(), exerciseIds = new Set(), names = new Set(), assets = new Set();
  for (const actor of manifest.actors) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(actor?.id || '') || actorIds.has(actor.id)) fail('actor IDs must be unique kebab-case values');
    actorIds.add(actor.id);
    localAsset(actor.reference, `actor ${actor.id} reference`, assets);
  }

  for (const exercise of manifest.exercises) {
    const id = exercise?.id;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '') || exerciseIds.has(id)) fail('exercise IDs must be unique kebab-case values');
    exerciseIds.add(id);
    if (!actorIds.has(exercise.actorId)) fail(`${id} references an unknown actor`);
    if (!String(exercise.category || '').trim() || !String(exercise.title || '').trim() || !String(exercise.subtitle || '').trim()) fail(`${id} metadata is incomplete`);
    if (!Array.isArray(exercise.aliases) || !exercise.aliases.length) fail(`${id} aliases are required`);
    const exerciseNames = new Set();
    for (const name of [id, ...exercise.aliases]) {
      const normalized = String(name).trim().toLocaleLowerCase('pl-PL');
      if (!normalized) fail(`${id} has an empty alias`);
      exerciseNames.add(normalized);
    }
    for (const normalized of exerciseNames) {
      if (names.has(normalized)) fail(`duplicate alias: ${normalized}`);
      names.add(normalized);
    }

    const visual = exercise.visual;
    if (visual?.kind !== 'photographic-sequence') fail(`${id} must use photographic-sequence`);
    natural(visual.width, `${id} frame width`); natural(visual.height, `${id} frame height`);
    const hasAtlas = typeof visual.atlas === 'string';
    const hasFrames = Array.isArray(visual.frames);
    if (hasAtlas === hasFrames) fail(`${id} must define exactly one of atlas or frames`);
    let frameCount;
    if (hasAtlas) {
      localAsset(visual.atlas, `${id} atlas`, assets);
      natural(visual.columns, `${id} atlas columns`); natural(visual.rows, `${id} atlas rows`);
      frameCount = visual.columns * visual.rows;
      checkDimensions(visual.atlas, visual.width * visual.columns, visual.height * visual.rows);
    } else {
      if (visual.frames.length < 2) fail(`${id} needs at least two frame files`);
      frameCount = visual.frames.length;
      for (const [index, frame] of visual.frames.entries()) {
        localAsset(frame, `${id} frame ${index + 1}`, assets);
        checkDimensions(frame, visual.width, visual.height);
      }
    }

    if (!Array.isArray(exercise.sequence) || exercise.sequence.length < 2 || exercise.sequence.some(frame => !Number.isInteger(frame) || frame < 0 || frame >= frameCount)) fail(`${id} sequence contains an invalid frame`);
    pointList(exercise.markers, `${id} markers`, { first: 0, last: 1 });
    pointList(exercise.phases, `${id} phases`, { first: 0 });
    if (exercise.phases.some(phase => !String(phase.cue || '').trim())) fail(`${id} phase cues are required`);

    const review = exercise.review;
    if (review?.status !== 'reviewed' || !Array.isArray(review.fixedSupports) || !review.fixedSupports.length) fail(`${id} review and fixed supports are required`);
    if (!requiredChecks.every(check => review.checks?.includes(check))) fail(`${id} review checklist is incomplete`);

    if (visual.flow !== undefined) {
      if (!hasAtlas) fail(`${id} flow requires an atlas`);
      const flow = visual.flow;
      localAsset(flow.url, `${id} flow`, assets);
      natural(flow.width, `${id} flow width`); natural(flow.height, `${id} flow height`);
      if (flow.columns !== 4) fail(`${id} flow must have four columns`);
      natural(flow.rows, `${id} flow rows`);
      if (!Array.isArray(flow.pairs) || flow.pairs.length !== flow.rows) fail(`${id} flow pairs must match rows`);
      const available = new Set();
      for (const pair of flow.pairs) {
        if (!Array.isArray(pair) || pair.length !== 2 || pair.some(frame => !Number.isInteger(frame) || frame < 0 || frame >= frameCount) || pair[0] === pair[1]) fail(`${id} has an invalid flow pair`);
        available.add([...pair].sort((a, b) => a - b).join(':'));
      }
      for (let index = 1; index < exercise.sequence.length; index++) {
        const pair = [exercise.sequence[index - 1], exercise.sequence[index]];
        if (pair[0] !== pair[1] && !available.has(pair.sort((a, b) => a - b).join(':'))) fail(`${id} flow does not cover its complete sequence`);
      }
      checkDimensions(flow.url, flow.width * flow.columns, flow.height * flow.rows);
    }
  }

  if (!exerciseIds.has(manifest.referenceExerciseId)) fail('referenceExerciseId must name a registered exercise');
  for (const asset of assets) {
    const file = path.join(projectRoot, 'apps', 'fitplan', asset.replace(/^\.\//, ''));
    if (!fs.existsSync(file)) fail(`missing asset: ${asset}`);
  }
  return { actors: actorIds.size, exercises: exerciseIds.size, assets: assets.size };
}

try {
  const result = validate(parseManifest(fs.readFileSync(manifestPath, 'utf8')));
  console.log(`PASS: ${result.exercises} photographic exercises, ${result.actors} actor, ${result.assets} local assets`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
}
