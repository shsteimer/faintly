/* eslint-disable no-template-curly-in-string */
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { resolveExpressions } from '../../src/expressions.js';

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

  it('does not misalign when an escaped expression is followed by a different unescaped expression', async () => {
    const { updated, updatedText } = await resolveExpressions('X \\${ keep } and ${ value }', {
      keep: 'K',
      value: 'V',
    });
    expect(updated).to.equal(true);
    // The escaped placeholder should remain literal, and the following different expression
    // should resolve to its own value, not the value of the escaped placeholder.
    expect(updatedText).to.equal('X ${ keep } and V');
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
