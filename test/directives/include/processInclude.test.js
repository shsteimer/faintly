/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { expect } from '@esm-bundle/chai';
import { processInclude } from '../../../src/directives.js';
import { initializeSecurity } from '../../../src/render.js';
import { compareDom } from '../../test-utils.js';

describe('processInclude', () => {
  it('returns false when the directive is absent', async () => {
    const el = document.createElement('div');
    el.textContent = 'Some text';
    const context = {};
    context.security = await initializeSecurity(context);
    const result = await processInclude(el, context);
    expect(result).to.equal(false);
  });

  it('replaces elements from a template by name', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', 'static-alt');
    const context = {
      template: {
        path: '/test/fixtures/blocks/static-block/static-block.html',
      },
    };
    context.security = await initializeSecurity(context);
    const result = await processInclude(el, context);
    expect(result).to.equal(true);
    await compareDom(el, 'templates/static-block-alt');
  });

  it('replaces elements from a template by path', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');
    const context = {
      template: {
        path: '/test/fixtures/blocks/static-block/static-block.html',
      },
    };
    context.security = await initializeSecurity(context);
    await processInclude(el, context);
    await compareDom(el, 'templates/static-block-custom-template');
  });

  it('replaces elements from a template by name and path', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html#custom-alt');
    const context = {
      template: {
        path: '/test/fixtures/blocks/static-block/static-block.html',
      },
    };
    context.security = await initializeSecurity(context);
    await processInclude(el, context);
    await compareDom(el, 'templates/static-block-custom-named-template');
  });

  it('removes include directive when complete', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '');
    const context = {
      template: {
        path: '/test/fixtures/blocks/static-block/static-block.html',
      },
    };
    context.security = await initializeSecurity(context);
    await processInclude(el, context);
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
  });

  describe('security integration', () => {
    it('calls allowIncludePath hook when security context is provided', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

      let allowIncludePathCalled = false;
      const customSecurity = {
        shouldAllowAttribute: () => true,
        allowIncludePath: (path) => {
          allowIncludePathCalled = true;
          return path.startsWith('/test/fixtures');
        },
      };

      const context = {
        template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
        security: customSecurity,
      };
      context.security = await initializeSecurity(context);
      await processInclude(el, context);

      expect(allowIncludePathCalled).to.equal(true);
      expect(el.hasAttribute('data-fly-include')).to.equal(false);
    });

    it('blocks include when allowIncludePath returns false', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-include', '/blocked/path/template.html');

      const customSecurity = {
        shouldAllowAttribute: () => true,
        allowIncludePath: () => false,
      };

      const context = {
        template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
        security: customSecurity,
      };
      context.security = await initializeSecurity(context);
      let exceptionThrown = false;
      try {
        await processInclude(el, context);
      } catch (e) {
        exceptionThrown = e;
      }

      expect(exceptionThrown).to.be.an.instanceOf(Error);
      expect(exceptionThrown.message).to.equal('Template fetch blocked by security policy: /blocked/path/template.html');
    });

    it('allows includes in unsafe mode with security: false', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

      const context = {
        template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
        security: false,
      };
      context.security = await initializeSecurity(context);
      await processInclude(el, context);

      expect(el.hasAttribute('data-fly-include')).to.equal(false);
      expect(el.childNodes.length).to.be.greaterThan(0);
    });

    it('allows includes in unsafe mode with security: "unsafe"', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

      const context = {
        template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
        security: 'unsafe',
      };
      context.security = await initializeSecurity(context);
      await processInclude(el, context);

      expect(el.hasAttribute('data-fly-include')).to.equal(false);
      expect(el.childNodes.length).to.be.greaterThan(0);
    });

    it('loads default security module and allows same-origin paths', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

      const context = {
        template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
      };
      context.security = await initializeSecurity(context);
      // Default security allows all same-origin paths
      await processInclude(el, context);

      expect(el.hasAttribute('data-fly-include')).to.equal(false);
      expect(el.childNodes.length).to.be.greaterThan(0);
    });
  });
});
