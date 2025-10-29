/* eslint-env mocha */
/* eslint-disable no-unused-expressions, no-template-curly-in-string */

import { expect } from '@esm-bundle/chai';
import { processNode } from '../../src/render.js';

describe('render/default traversal without content/include', () => {
  it('resolves text expressions in children by default', async () => {
    const wrapper = document.createElement('div');
    const el = document.createElement('div');
    const child = document.createElement('span');
    child.className = 'expr';
    child.textContent = '${value}';
    el.append(child);
    wrapper.append(el);

    await processNode(wrapper, { value: 'ok' });

    const expr = wrapper.querySelector('.expr');
    expect(expr).to.not.be.null;
    expect(expr.textContent).to.equal('ok');
  });
});
