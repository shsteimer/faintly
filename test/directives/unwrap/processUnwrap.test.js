/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { exportForTesting } from '../../../src/faintly.js';

const { processUnwrap } = exportForTesting;

describe('processUnwrap', () => {
  it('return true or false based on resolved value', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-unwrap', 'includeDiv');
    const result = await processUnwrap(el, { includeDiv: true });
    expect(result).to.equal(true);

    el.setAttribute('data-fly-unwrap', 'includeDiv');
    const result2 = await processUnwrap(el, { includeDiv: false });
    expect(result2).to.equal(false);

    el.setAttribute('data-fly-unwrap', '');
    const result3 = await processUnwrap(el, {});
    expect(result3).to.equal(true, 'unwrap with no expression should always be true');
  });

  it('always returns a boolean', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-unwrap', 'includeDiv');
    const stringResult = await processUnwrap(el.cloneNode(true), { includeDiv: 'any value' });
    expect(stringResult).to.equal(true);

    const emptyStringResult = await processUnwrap(el.cloneNode(true), { includeDiv: '' });
    expect(emptyStringResult).to.equal(false);

    const undefinedResult = await processUnwrap(el.cloneNode(true), { includeDiv: undefined });
    expect(undefinedResult).to.equal(false);

    const intResult = await processUnwrap(el.cloneNode(true), { includeDiv: 42 });
    expect(intResult).to.equal(true);

    const zeroResult = await processUnwrap(el.cloneNode(true), { includeDiv: 0 });
    expect(zeroResult).to.equal(false);
  });

  it('removes unwrap directive when complete', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-unwrap', '');
    await processUnwrap(el);
    expect(el.hasAttribute('data-fly-unwrap')).to.equal(false);
  });
});
