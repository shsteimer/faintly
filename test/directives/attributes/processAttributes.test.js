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

  describe('security integration', () => {
    it('calls security hooks when context.security is provided with custom hooks', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      let shouldAllowCalled = false;
      const customSecurity = {
        shouldAllowAttribute: (name) => {
          shouldAllowCalled = true;
          return name !== 'blocked';
        },
        allowIncludePath: () => true,
      };

      await processAttributes(el, {
        attrs: { allowed: 'value', blocked: 'value' },
        security: customSecurity,
      });

      expect(shouldAllowCalled).to.equal(true);
      expect(el.getAttribute('allowed')).to.equal('value');
      expect(el.hasAttribute('blocked')).to.equal(false);
    });

    it('allows all attributes in unsafe mode with security: false', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      await processAttributes(el, {
        // eslint-disable-next-line no-script-url
        attrs: { onclick: 'alert(1)', href: 'javascript:void(0)' },
        security: false,
      });

      expect(el.getAttribute('onclick')).to.equal('alert(1)');
      // eslint-disable-next-line no-script-url
      expect(el.getAttribute('href')).to.equal('javascript:void(0)');
    });

    it('allows all attributes in unsafe mode with security: "unsafe"', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      await processAttributes(el, {
        // eslint-disable-next-line no-script-url
        attrs: { onclick: 'alert(1)', href: 'javascript:void(0)' },
        security: 'unsafe',
      });

      expect(el.getAttribute('onclick')).to.equal('alert(1)');
      // eslint-disable-next-line no-script-url
      expect(el.getAttribute('href')).to.equal('javascript:void(0)');
    });

    it.skip('loads default security module when no security context provided - test once real security blocks attributes');

    it('applies security checks to expression-resolved attributes', async () => {
      const el = document.createElement('a');
      // eslint-disable-next-line no-template-curly-in-string
      el.setAttribute('href', '${ link }');

      const customSecurity = {
        shouldAllowAttribute: (name, value) => value !== 'blocked-value',
        allowIncludePath: () => true,
      };

      await processAttributes(el, {
        link: 'blocked-value',
        security: customSecurity,
      });

      expect(el.hasAttribute('href')).to.equal(false);
    });
  });
});
