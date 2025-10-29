/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { processUnwraps, resolveUnwrap } from '../../../src/directives.js';
import { compareDomInline } from '../../test-utils.js';

describe('resolveUnwrap', () => {
  it('unwraps all the unwrap elements', async () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div data-fly-unwrap>
        <span>hello</span>
        <p>some text <strong data-fly-unwrap>not-bold</strong></p>
        <div>
          <div data-fly-unwrap>
            woooo
            <div>one</div>
            <p>two</p>
            <div data-fly-unwrap>three</div>
          </div>
        </div>
      </div>
    `;

    processUnwraps(div);

    await compareDomInline(div, `
      <span>hello</span>
        <p>some text not-bold</p>
        <div>
          woooo
          <div>one</div>
          <p>two</p>
          three
        </div>
    `);
  });
});

describe('resolveUnwrap', () => {
  it('keeps the unwrap directive when it resolves to true', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-unwrap', 'includeDiv');
    await resolveUnwrap(el, { includeDiv: true });
    expect(el.hasAttribute('data-fly-unwrap')).to.equal(true);
  });

  it('removes the unwrap directive when it resolves to false', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-unwrap', 'includeDiv');
    await resolveUnwrap(el, { includeDiv: false });
    expect(el.hasAttribute('data-fly-unwrap')).to.equal(false);
  });

  it('keeps the unwrap directive when it has no expression', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-unwrap', '');
    await resolveUnwrap(el, {});
    expect(el.hasAttribute('data-fly-unwrap')).to.equal(true);
  });

  it('works with non boolean values', async () => {
    const stringEl = document.createElement('div');
    stringEl.setAttribute('data-fly-unwrap', 'includeDiv');
    await resolveUnwrap(stringEl.cloneNode(true), { includeDiv: 'any value' });
    expect(stringEl.hasAttribute('data-fly-unwrap')).to.equal(true);

    await resolveUnwrap(stringEl, { includeDiv: '' });
    expect(stringEl.hasAttribute('data-fly-unwrap')).to.equal(false);

    const undefEl = document.createElement('div');
    undefEl.setAttribute('data-fly-unwrap', 'includeDiv');
    await resolveUnwrap(undefEl, { includeDiv: undefined });
    expect(undefEl.hasAttribute('data-fly-unwrap')).to.equal(false);

    const numEl = document.createElement('div');
    numEl.setAttribute('data-fly-unwrap', 'includeDiv');
    await resolveUnwrap(numEl, { includeDiv: 42 });
    expect(numEl.hasAttribute('data-fly-unwrap')).to.equal(true);

    await resolveUnwrap(numEl, { includeDiv: 0 });
    expect(numEl.hasAttribute('data-fly-unwrap')).to.equal(false);
  });

  it('supports ${} wrapped expressions', async () => {
    const el = document.createElement('div');
    // eslint-disable-next-line no-template-curly-in-string
    el.setAttribute('data-fly-unwrap', '${includeDiv}');
    await resolveUnwrap(el, { includeDiv: true });
    expect(el.hasAttribute('data-fly-unwrap')).to.equal(true);

    const el2 = document.createElement('div');
    // eslint-disable-next-line no-template-curly-in-string
    el2.setAttribute('data-fly-unwrap', '${includeDiv}');
    await resolveUnwrap(el2, { includeDiv: false });
    expect(el2.hasAttribute('data-fly-unwrap')).to.equal(false);
  });

  it('supports ${} wrapped expressions with dot notation', async () => {
    const el = document.createElement('div');
    // eslint-disable-next-line no-template-curly-in-string
    el.setAttribute('data-fly-unwrap', '${user.isAdmin}');
    await resolveUnwrap(el, { user: { isAdmin: true } });
    expect(el.hasAttribute('data-fly-unwrap')).to.equal(true);
  });
});
