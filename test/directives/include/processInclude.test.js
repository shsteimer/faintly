/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { expect } from '@esm-bundle/chai';
import { processInclude } from '../../../src/directives.js';
import { compareDom } from '../../test-utils.js';

describe('processInclude', () => {
  it('returns false when the directive is absent', async () => {
    const el = document.createElement('div');
    el.textContent = 'Some text';
    const result = await processInclude(el);
    expect(result).to.equal(false);
  });

  it('replaces elements from a template by name', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', 'static-alt');
    const result = await processInclude(el, {
      template: {
        path: '/test/fixtures/blocks/static-block/static-block.html',
      },
    });
    expect(result).to.equal(true);
    await compareDom(el, 'templates/static-block-alt');
  });

  it('replaces elements from a template by path', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');
    await processInclude(el, {
      template: {
        path: '/test/fixtures/blocks/static-block/static-block.html',
      },
    });
    await compareDom(el, 'templates/static-block-custom-template');
  });

  it('replaces elements from a template by name and path', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html#custom-alt');
    await processInclude(el, {
      template: {
        path: '/test/fixtures/blocks/static-block/static-block.html',
      },
    });
    await compareDom(el, 'templates/static-block-custom-named-template');
  });

  it('removes include directive when complete', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '');
    await processInclude(el, {
      template: {
        path: '/test/fixtures/blocks/static-block/static-block.html',
      },
    });
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
  });
});
