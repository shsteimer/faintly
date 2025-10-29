/* eslint-env mocha */
/* eslint-disable no-unused-expressions, no-template-curly-in-string */

import { expect } from '@esm-bundle/chai';
import { processNode } from '../../src/render.js';

describe('render/content vs include and traversal', () => {
  it('content wins over include; include is not executed', async () => {
    const wrapper = document.createElement('div');
    const el = document.createElement('div');
    // both directives present
    el.setAttribute('data-fly-content', 'contentNode');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/resolvable-expression.html#resolvable');
    wrapper.append(el);

    const injected = document.createElement('div');
    injected.className = 'injected';
    injected.textContent = 'Injected';

    await processNode(wrapper, {
      contentNode: injected,
      shouldResolve: 'SHOULD_NOT_BE_USED',
    });

    const inner = wrapper.querySelector('.injected');
    expect(inner).to.not.be.null;
    expect(inner.textContent).to.equal('Injected');
    // include should not have run; attribute remains
    expect(el.hasAttribute('data-fly-include')).to.equal(true);
  });

  it('children are processed after content injection (expressions resolve)', async () => {
    const wrapper = document.createElement('div');
    const el = document.createElement('div');
    el.setAttribute('data-fly-content', 'contentNode');
    wrapper.append(el);

    const injected = document.createElement('div');
    injected.className = 'expr';
    injected.textContent = '${greet}';

    await processNode(wrapper, {
      contentNode: injected,
      greet: 'hello',
    });

    const expr = wrapper.querySelector('.expr');
    expect(expr).to.not.be.null;
    expect(expr.textContent).to.equal('hello');
  });
});
