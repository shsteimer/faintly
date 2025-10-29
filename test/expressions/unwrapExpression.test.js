/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-template-curly-in-string */

import { expect } from '@esm-bundle/chai';
import { unwrapExpression } from '../../src/expressions.js';

describe('unwrapExpression', () => {
  it('unwraps ${} wrapped expressions', () => {
    const result = unwrapExpression('${foo.bar}');
    expect(result).to.equal('foo.bar');
  });

  it('returns bare expressions unchanged', () => {
    const result = unwrapExpression('foo.bar');
    expect(result).to.equal('foo.bar');
  });

  it('handles whitespace inside ${} wrapper', () => {
    const result = unwrapExpression('${  foo.bar  }');
    expect(result).to.equal('foo.bar');
  });

  it('handles whitespace outside ${} wrapper', () => {
    const result = unwrapExpression('  ${foo.bar}  ');
    expect(result).to.equal('foo.bar');
  });

  it('handles whitespace both inside and outside', () => {
    const result = unwrapExpression('  ${  foo.bar  }  ');
    expect(result).to.equal('foo.bar');
  });

  it('returns empty string for empty ${} wrapper', () => {
    const result = unwrapExpression('${}');
    expect(result).to.equal('');
  });

  it('returns empty string for whitespace-only ${} wrapper', () => {
    const result = unwrapExpression('${   }');
    expect(result).to.equal('');
  });

  it('does not unwrap partial ${} patterns', () => {
    // Missing closing brace
    const result1 = unwrapExpression('${foo.bar');
    expect(result1).to.equal('${foo.bar');

    // Missing opening brace
    const result2 = unwrapExpression('foo.bar}');
    expect(result2).to.equal('foo.bar}');

    // Wrong order
    const result3 = unwrapExpression('}foo.bar${');
    expect(result3).to.equal('}foo.bar${');
  });

  it('does not unwrap if ${} is not at start and end', () => {
    // Has content before
    const result1 = unwrapExpression('prefix${foo.bar}');
    expect(result1).to.equal('prefix${foo.bar}');

    // Has content after
    const result2 = unwrapExpression('${foo.bar}suffix');
    expect(result2).to.equal('${foo.bar}suffix');

    // Has content both sides
    const result3 = unwrapExpression('prefix${foo.bar}suffix');
    expect(result3).to.equal('prefix${foo.bar}suffix');
  });

  it('handles simple property names', () => {
    const result = unwrapExpression('${foo}');
    expect(result).to.equal('foo');
  });

  it('handles deeply nested properties', () => {
    const result = unwrapExpression('${foo.bar.baz.qux}');
    expect(result).to.equal('foo.bar.baz.qux');
  });

  it('returns empty string unchanged', () => {
    const result = unwrapExpression('');
    expect(result).to.equal('');
  });

  it('returns whitespace-only string unchanged', () => {
    const result = unwrapExpression('   ');
    expect(result).to.equal('   ');
  });
});
