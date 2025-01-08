/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { exportForTesting } from '../../../src/faintly.js';

const { processTest } = exportForTesting;

describe('processTest', () => {
  describe('data-fly-test', () => {
    it('return true or false based on resolved value', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-test', 'includeDiv');
      const result = await processTest(el, { includeDiv: true });
      expect(result).to.equal(true);

      el.setAttribute('data-fly-test', 'includeDiv');
      const result2 = await processTest(el, { includeDiv: false });
      expect(result2).to.equal(false);
    });

    it('stores result in context for re-use', async () => {
      const context = {
        includeDiv: true,
      };

      const el = document.createElement('div');
      el.setAttribute('data-fly-test.mytest', 'includeDiv');
      const result = await processTest(el, context);
      expect(result).to.equal(true);
      expect(context.mytest).to.equal(true);

      const el2 = document.createElement('div');
      el2.setAttribute('data-fly-test', 'mytest');
      const result2 = await processTest(el2, context);
      expect(result2).to.equal(true);
    });

    it('always returns a boolean', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-test', 'includeDiv');
      const stringResult = await processTest(el.cloneNode(true), { includeDiv: 'any value' });
      expect(stringResult).to.equal(true);

      const emptyStringResult = await processTest(el.cloneNode(true), { includeDiv: '' });
      expect(emptyStringResult).to.equal(false);

      const undefinedResult = await processTest(el.cloneNode(true), { includeDiv: undefined });
      expect(undefinedResult).to.equal(false);

      const intResult = await processTest(el.cloneNode(true), { includeDiv: 42 });
      expect(intResult).to.equal(true);

      const zeroResult = await processTest(el.cloneNode(true), { includeDiv: 0 });
      expect(zeroResult).to.equal(false);
    });

    it('removes test directive when complete', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-test', '');
      await processTest(el);
      expect(el.hasAttribute('data-fly-test')).to.equal(false);
    });
  });

  describe('data-fly-not', () => {
    it('return true or false based on resolved value', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-not', 'includeDiv');
      const result = await processTest(el, { includeDiv: true });
      expect(result).to.equal(false);

      el.setAttribute('data-fly-not', 'includeDiv');
      const result2 = await processTest(el, { includeDiv: false });
      expect(result2).to.equal(true);
    });

    it('stores result in context for re-use', async () => {
      const context = {
        includeDiv: true,
      };

      const el = document.createElement('div');
      el.setAttribute('data-fly-not.mytest', 'includeDiv');
      const result = await processTest(el, context);
      expect(result).to.equal(false);
      expect(context.mytest).to.equal(false);

      const el2 = document.createElement('div');
      el2.setAttribute('data-fly-not', 'mytest');
      const result2 = await processTest(el2, context);
      expect(result2).to.equal(true);
    });

    it('always returns a boolean', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-not', 'includeDiv');
      const stringResult = await processTest(el.cloneNode(true), { includeDiv: 'any value' });
      expect(stringResult).to.equal(false);

      const emptyStringResult = await processTest(el.cloneNode(true), { includeDiv: '' });
      expect(emptyStringResult).to.equal(true);

      const undefinedResult = await processTest(el.cloneNode(true), { includeDiv: undefined });
      expect(undefinedResult).to.equal(true);

      const intResult = await processTest(el.cloneNode(true), { includeDiv: 42 });
      expect(intResult).to.equal(false);

      const zeroResult = await processTest(el.cloneNode(true), { includeDiv: 0 });
      expect(zeroResult).to.equal(true);
    });

    it('removes test directive when complete', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-not', '');
      await processTest(el);
      expect(el.hasAttribute('data-fly-not')).to.equal(false);
    });
  });
});
