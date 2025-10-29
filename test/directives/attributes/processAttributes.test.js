/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { processAttributes } from '../../../src/directives.js';
import { initializeSecurity } from '../../../src/render.js';

describe('processAttributes', () => {
  it('resolves expressions in non data-fly-* attributes', async () => {
    const el = document.createElement('div');
    const context = { divClass: 'some-class' };
    context.security = await initializeSecurity(context);
    // eslint-disable-next-line no-template-curly-in-string
    el.setAttribute('class', '${ divClass }');
    await processAttributes(el, context);
    expect(el.getAttribute('class')).to.equal('some-class');
  });

  it('sets attributes from an iterable object', async () => {
    const el = document.createElement('div');
    el.setAttribute('class', 'some-class');
    el.setAttribute('data-fly-attributes', 'divAttrs');
    const context = {
      divAttrs: {
        class: 'some-other-class',
        id: 'some-id',
        'aria-label': 'some-label',
      },
    };
    context.security = await initializeSecurity(context);
    await processAttributes(el, context);
    expect(el.getAttribute('class')).to.equal('some-other-class');
    expect(el.getAttribute('id')).to.equal('some-id');
    expect(el.getAttribute('aria-label')).to.equal('some-label');
  });

  it('removes attributes with undefined values', async () => {
    const el = document.createElement('div');
    el.setAttribute('class', 'some-class');
    el.setAttribute('data-fly-attributes', 'divAttrs');
    const context = {
      divAttrs: {
        class: undefined,
      },
    };
    context.security = await initializeSecurity(context);
    await processAttributes(el, context);
    expect(el.hasAttribute('class')).to.equal(false);
  });

  it('removes attributes directive when complete', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-attributes', '');
    const context = {};
    context.security = await initializeSecurity(context);
    await processAttributes(el, context);
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

      const context = {
        attrs: { allowed: 'value', blocked: 'value' },
        security: customSecurity,
      };
      context.security = await initializeSecurity(context);
      await processAttributes(el, context);

      expect(shouldAllowCalled).to.equal(true);
      expect(el.getAttribute('allowed')).to.equal('value');
      expect(el.hasAttribute('blocked')).to.equal(false);
    });

    it('allows all attributes in unsafe mode with security: false', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        // eslint-disable-next-line no-script-url
        attrs: { onclick: 'alert(1)', href: 'javascript:void(0)' },
        security: false,
      };
      context.security = await initializeSecurity(context);
      await processAttributes(el, context);

      expect(el.getAttribute('onclick')).to.equal('alert(1)');
      // eslint-disable-next-line no-script-url
      expect(el.getAttribute('href')).to.equal('javascript:void(0)');
    });

    it('allows all attributes in unsafe mode with security: "unsafe"', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        // eslint-disable-next-line no-script-url
        attrs: { onclick: 'alert(1)', href: 'javascript:void(0)' },
        security: 'unsafe',
      };
      context.security = await initializeSecurity(context);
      await processAttributes(el, context);

      expect(el.getAttribute('onclick')).to.equal('alert(1)');
      // eslint-disable-next-line no-script-url
      expect(el.getAttribute('href')).to.equal('javascript:void(0)');
    });

    it('loads default security module when no security context provided', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { onclick: 'alert(1)', class: 'safe' },
      };
      context.security = await initializeSecurity(context);
      // Default security should block event handlers
      await processAttributes(el, context);

      expect(el.hasAttribute('onclick')).to.equal(false); // Blocked by default security
      expect(el.getAttribute('class')).to.equal('safe'); // Safe attribute allowed
    });

    it('applies security checks to expression-resolved attributes', async () => {
      const el = document.createElement('a');
      // eslint-disable-next-line no-template-curly-in-string
      el.setAttribute('href', '${ link }');

      const customSecurity = {
        shouldAllowAttribute: (name, value) => value !== 'blocked-value',
        allowIncludePath: () => true,
      };

      const context = {
        link: 'blocked-value',
        security: customSecurity,
      };
      context.security = await initializeSecurity(context);
      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });
  });
});
