/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { processTextExpressions } from '../../src/expressions.js';

describe('processTextExpressions', () => {
  it('updates text node content', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    const node = document.createTextNode('string: ${ string }, bool: ${ bool }, number: ${ number }, escaped: \\${ string }');
    await processTextExpressions(node, {
      string: 'lorem ipsum...',
      bool: true,
      number: 42,
    });
    // eslint-disable-next-line no-template-curly-in-string
    expect(node.textContent).to.equal('string: lorem ipsum..., bool: true, number: 42, escaped: ${ string }');
  });

  it('does not update text nodes with no expressions', async () => {
    // eslint-disable-next-line no-template-curly-in-string
    const node = document.createTextNode('a normal string');
    await processTextExpressions(node, {});
    // eslint-disable-next-line no-template-curly-in-string
    expect(node.textContent).to.equal('a normal string');
  });
});
