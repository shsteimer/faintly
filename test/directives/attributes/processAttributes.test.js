/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { processAttributes } from '../../../src/directives.js';

describe('processAttributes', () => {
  it('resolves expressions in non data-fly-* attributes', async () => {
    const el = document.createElement('div');
    // eslint-disable-next-line no-template-curly-in-string
    el.setAttribute('class', '${ divClass }');
    await processAttributes(el, { divClass: 'some-class' });
    expect(el.getAttribute('class')).to.equal('some-class');
  });

  it('sets attributes from an iterable object', async () => {
    const el = document.createElement('div');
    el.setAttribute('class', 'some-class');
    el.setAttribute('data-fly-attributes', 'divAttrs');
    await processAttributes(el, {
      divAttrs: {
        class: 'some-other-class',
        id: 'some-id',
        'aria-label': 'some-label',
      },
    });
    expect(el.getAttribute('class')).to.equal('some-other-class');
    expect(el.getAttribute('id')).to.equal('some-id');
    expect(el.getAttribute('aria-label')).to.equal('some-label');
  });

  it('removes attributes with undefined values', async () => {
    const el = document.createElement('div');
    el.setAttribute('class', 'some-class');
    el.setAttribute('data-fly-attributes', 'divAttrs');
    await processAttributes(el, {
      divAttrs: {
        class: undefined,
      },
    });
    expect(el.hasAttribute('class')).to.equal(false);
  });

  it('removes attributes directive when complete', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-attributes', '');
    await processAttributes(el);
    expect(el.hasAttribute('data-fly-attributes')).to.equal(false);
  });
});
