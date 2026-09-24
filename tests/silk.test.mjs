import assert from 'node:assert';
import { createSilk, initSilk } from '../assets/silk.js';

assert.equal(typeof createSilk, 'function');
assert.equal(typeof initSilk, 'function');
assert.equal(createSilk(null), null);
assert.deepEqual(initSilk(), []);
console.log('silk: 1/1 import/fallback check passed');
