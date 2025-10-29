/* eslint-env mocha */
/* eslint-disable no-unused-expressions, no-template-curly-in-string */

import { expect } from '@esm-bundle/chai';
import { processNode, initializeSecurity } from '../../src/render.js';

describe('render/processNode include child processing', () => {
  it('does not reprocess included children expressions (escaped remains literal)', async () => {
    const wrapper = document.createElement('div');
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/escaped-expression.html#escaped');
    wrapper.append(el);

    const context = {
      shouldNotResolve: 'WILL_RESOLVE_IF_BUG_PRESENT',
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
    };
    context.security = await initializeSecurity(context);
    await processNode(wrapper, context);

    const inner = wrapper.querySelector('.inner');
    expect(inner).to.not.be.null;
    expect(inner.textContent).to.equal('${shouldNotResolve}');
  });

  it('resolves expressions inside included template (non-escaped)', async () => {
    const wrapper = document.createElement('div');
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/resolvable-expression.html#resolvable');
    wrapper.append(el);

    const context = {
      shouldResolve: 'OK',
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
    };
    context.security = await initializeSecurity(context);
    await processNode(wrapper, context);

    const inner = wrapper.querySelector('.inner');
    expect(inner).to.not.be.null;
    expect(inner.textContent).to.equal('OK');
  });
});
