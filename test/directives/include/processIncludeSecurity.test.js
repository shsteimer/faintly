/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { expect } from '@esm-bundle/chai';
import { processInclude } from '../../../src/directives.js';
import createSecurity from '../../../src/faintly.security.js';

describe('processInclude security restrictions', () => {
  it('allows include within default base (codeBasePath/blocks)', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

    const result = await processInclude(el, {
      codeBasePath: '/test/fixtures',
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
      security: createSecurity(),
    });

    expect(result).to.equal(true);
    // include should have removed the attribute and replaced children
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
    expect(el.childNodes.length).to.be.greaterThan(0);
  });

  it('blocks include outside of allowed base path', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/not-allowed/blocks/elsewhere.html');

    const result = await processInclude(el, {
      codeBasePath: '/test/fixtures',
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
      security: createSecurity(),
    });

    expect(result).to.equal(true);
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
    // Element should remain unchanged (no children added)
    expect(el.childNodes.length).to.equal(0);
  });

  it('honors context.security.includeBasePath override', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

    const result = await processInclude(el, {
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
      security: createSecurity({ includeBasePath: '/test/fixtures/blocks/static-block/' }),
    });

    expect(result).to.equal(true);
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
  });

  it('allows include when base is inferred from current template path', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

    const result = await processInclude(el, {
      // no codeBasePath provided
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
      security: createSecurity(),
    });

    expect(result).to.equal(true);
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
  });

  it('allows include under default includeBasePath = codeBasePath', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

    const result = await processInclude(el, {
      codeBasePath: '/test/fixtures',
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
      security: createSecurity(),
    });

    expect(result).to.equal(true);
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
  });

  // eslint-disable-next-line no-template-curly-in-string
  it('supports includeBasePath template substitution (${codeBasePath})', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

    const result = await processInclude(el, {
      codeBasePath: '/test/fixtures',
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
      // eslint-disable-next-line no-template-curly-in-string
      security: createSecurity({ includeBasePath: '${codeBasePath}/blocks/' }),
    });

    expect(result).to.equal(true);
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
  });

  it('supports includeBasePath as a function and normalizes trailing slash', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-include', '/test/fixtures/blocks/static-block/custom-template.html');

    const result = await processInclude(el, {
      codeBasePath: '/test/fixtures',
      template: { path: '/test/fixtures/blocks/static-block/static-block.html' },
      security: createSecurity({ includeBasePath: (ctx) => `${ctx.codeBasePath}/blocks` }),
    });

    expect(result).to.equal(true);
    expect(el.hasAttribute('data-fly-include')).to.equal(false);
  });

  // Removed tests for ${templatePath} and ${templateDir}; only ${codeBasePath} is supported now
});
