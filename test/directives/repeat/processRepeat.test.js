/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { expect } from '@esm-bundle/chai';
import { exportForTesting } from '../../../src/faintly.js';
import { compareDom } from '../../test-utils.js';

const { processRepeat } = exportForTesting;

describe('processRepeat', () => {
  it('repeats the node over a collection ', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', 'array');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html#custom-alt');

    const repeated = await processRepeat(el, {
      array: [1, 2, 3],
    });
    expect(repeated.length).to.equal(3);
    await compareDom(repeated[0], 'templates/static-block-custom-named-template');
    await compareDom(repeated[1], 'templates/static-block-custom-named-template');
    await compareDom(repeated[2], 'templates/static-block-custom-named-template');
  });
});
