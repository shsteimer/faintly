/* eslint-disable no-template-curly-in-string */
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { exportForTesting } from '../../src/faintly.js';

const { resolveExpressions } = exportForTesting;

describe('resolveExpressions', () => {
  it('resolves multiple expressions in a string', async () => {
    const { updated, updatedText } = await resolveExpressions('this is a ${ a.b } with many values, even from functions: ${ a.c }, see', {
      a: {
        b: 'string',
        c: () => 42,
      },
    });
    expect(updated).to.equal(true);
    expect(updatedText).to.equal('this is a string with many values, even from functions: 42, see');
  });

  it('ignores expressions where $ is escaped', async () => {
    const { updated, updatedText } = await resolveExpressions('this is an \\${ escaped } value, this one is not ${ escaped }', {
      escaped: 'something',
    });
    expect(updated).to.equal(true);
    expect(updatedText).to.equal('this is an ${ escaped } value, this one is not something');
  });

  it('doesnt update normal strings', async () => {
    const { updated, updatedText } = await resolveExpressions('this is an normal string', {});
    expect(updated).to.equal(false);
    expect(updatedText).to.equal('this is an normal string');
  });

  it('wokrs at beginning and end of string', async () => {
    const { updated, updatedText } = await resolveExpressions('${ start }, two, ${middle}, four, ${ end }', {
      start: 'one',
      middle: 'three',
      end: 'five',
    });
    expect(updated).to.equal(true);
    expect(updatedText).to.equal('one, two, three, four, five');
  });
});
