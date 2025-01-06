/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { exportForTesting } from '../../../src/faintly.js';
import { compareDom, compareDomInline } from '../../test-utils.js';

const { processContent } = exportForTesting;

describe('processContent', () => {
  it('replaces elements children with text content', async () => {
    const el = document.createElement('div');
    el.textContent = 'Some text';
    el.setAttribute('data-fly-content', 'content');
    await processContent(el, {
      content: 'Some other text',
    });
    expect(el.textContent).to.equal('Some other text');
  });

  it('replaces elements children with an element', async () => {
    const el = document.createElement('div');
    el.textContent = 'Some text';
    el.setAttribute('data-fly-content', 'content');

    const el2 = document.createElement('div');
    el2.textContent = 'Some other text';
    el2.className = 'other-element';

    await processContent(el, {
      content: el2,
    });

    expect(el.textContent).to.equal('Some other text');
    expect(el.querySelector('.other-element')).to.equal(el2);
  });

  it('replaces elements children from a querySelectorAll collection', async () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="child">Child 1</div>
      <div class="child">Child 2</div>
      <div class="child">Child 3</div>
      <div class="alt-child">Child 4</div>
    `;

    const els = wrapper.querySelectorAll('.child');

    const el = document.createElement('div');
    el.textContent = 'Some text';
    el.setAttribute('data-fly-content', 'content');

    await processContent(el, {
      content: els,
    });

    await compareDom(el, 'directives/content/replaceChildrenFromCollection');
    await compareDomInline(wrapper, '<div class="alt-child">Child 4</div>');
  });

  it('replaces elements children from an array', async () => {
    const els = [];
    for (let i = 0; i < 3; i += 1) {
      const el = document.createElement('div');
      el.textContent = `Child ${i + 1}`;
      el.className = 'child';
      els.push(el);
    }

    const el = document.createElement('div');
    el.textContent = 'Some text';
    el.setAttribute('data-fly-content', 'content');

    await processContent(el, {
      content: els,
    });

    await compareDom(el, 'directives/content/replaceChildrenFromCollection');
  });

  it('replaces elements children from a list of childNodes', async () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `A Text Node
      <div class="child">Child 1</div>
      <div class="child">Child 2</div>
      <div class="child">Child 3</div>
      <div class="alt-child">Child 4</div>
    `;

    const els = wrapper.childNodes;

    const el = document.createElement('div');
    el.textContent = 'Some text';
    el.setAttribute('data-fly-content', 'content');

    await processContent(el, {
      content: els,
    });

    await compareDom(el, 'directives/content/replaceChildrenFromCollectionWithText');
  });

  it('replaces elements children from a list of children', async () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="child">Child 1</div>
      <div class="child">Child 2</div>
      <div class="child">Child 3</div>
    `;

    const els = wrapper.children;

    const el = document.createElement('div');
    el.textContent = 'Some text';
    el.setAttribute('data-fly-content', 'content');

    await processContent(el, {
      content: els,
    });

    await compareDom(el, 'directives/content/replaceChildrenFromCollection');
  });

  it('removes content directive when complete', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-content', '');
    await processContent(el);
    expect(el.hasAttribute('data-fly-content')).to.equal(false);
  });
});
