/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { resolveExpression } from '../../src/expressions.js';

describe('resolveExpression', () => {
  it('resolves object expressions from the rendering context', async () => {
    const result = await resolveExpression('a.b.c', {
      a: {
        b: {
          c: 'some value',
        },
      },
    });
    expect(result).to.equal('some value');
  });

  it('calls functions from the rendering context', async () => {
    let called = false;
    const result = await resolveExpression('a.b.d', {
      a: {
        b: {
          c: 'some value',
          d: (context) => {
            called = true;
            return context.a.b.c;
          },
        },
      },
    });
    expect(called).to.equal(true);
    expect(result).to.equal('some value');
  });

  it('calls async functions from the rendering context', async () => {
    let called = false;
    const result = await resolveExpression('a.b.d', {
      a: {
        b: {
          d: async () => {
            called = true;
            return new Promise((res) => {
              res('async value');
            });
          },
        },
      },
    });
    expect(called).to.equal(true);
    expect(result).to.equal('async value');
  });

  it('deeply resolves object when returned from functions', async () => {
    let called = false;
    const result = await resolveExpression('a.b.d.e', {
      a: {
        b: {
          d: async () => {
            called = true;
            return new Promise((res) => {
              res({
                e: {
                  f: 'deep async value',
                },
              });
            });
          },
        },
      },
    });
    expect(called).to.equal(true);
    expect(result.f).to.equal('deep async value');
  });

  it('avoids NPE in case of invalid expression', async () => {
    const result = await resolveExpression('a.b.c.d.e', {
      a: {
        b: {},
      },
    });
    expect(result).to.equal(undefined);
  });
});
