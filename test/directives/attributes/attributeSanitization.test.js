/* eslint-env mocha */
/* eslint-disable no-unused-expressions, no-script-url, no-template-curly-in-string */

import { expect } from '@esm-bundle/chai';
import { processAttributes } from '../../../src/directives.js';
import createSecurity from '../../../src/faintly.security.js';

describe('attribute sanitization', () => {
  it('defaults to safe policy when no security is provided', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-attributes', 'attrs');
    await processAttributes(el, {
      attrs: { onclick: 'alert(1)' },
    });
    expect(el.hasAttribute('onclick')).to.equal(false);
  });

  it('allows unsafe mode when explicitly disabled', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-attributes', 'attrs');
    await processAttributes(el, {
      attrs: { onclick: 'alert(1)' },
      security: 'unsafe',
    });
    expect(el.getAttribute('onclick')).to.equal('alert(1)');
  });
  it('blocks event handler attributes from data-fly-attributes', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-attributes', 'attrs');
    await processAttributes(el, {
      attrs: { onclick: 'alert(1)', onLoad: 'doSomething()' },
      security: createSecurity(),
    });

    expect(el.hasAttribute('onclick')).to.equal(false);
    expect(el.hasAttribute('onload')).to.equal(false);
  });

  it('blocks srcdoc attribute', async () => {
    const el = document.createElement('iframe');
    el.setAttribute('data-fly-attributes', 'attrs');
    await processAttributes(el, {
      attrs: { srcdoc: '<script>alert(1)</script>' },
      security: createSecurity(),
    });

    expect(el.hasAttribute('srcdoc')).to.equal(false);
  });

  it('blocks javascript: in URL attributes (resolved expressions)', async () => {
    const a = document.createElement('a');
    // eslint-disable-next-line no-template-curly-in-string
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: 'javascript:alert(1)', security: createSecurity() });
    expect(a.hasAttribute('href')).to.equal(false);
  });

  it('allows http/https/mailto/tel and relative URLs', async () => {
    const a = document.createElement('a');
    a.setAttribute('href', 'about:blank'); // will be sanitized out later
    // eslint-disable-next-line no-template-curly-in-string
    a.setAttribute('href', '${ link }');

    await processAttributes(a, { link: 'https://example.com', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('https://example.com');

    // http
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: 'http://example.com', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('http://example.com');

    // mailto
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: 'mailto:test@example.com', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('mailto:test@example.com');

    // tel
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: 'tel:+123456789', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('tel:+123456789');

    // relative
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: '/path', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('/path');

    // fragment
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: '#hash', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('#hash');

    // query-only
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: '?q=1', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('?q=1');

    // dot-relative
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: './file', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('./file');

    // parent-relative
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: '../up', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('../up');
  });

  it('applies URL checks to data-fly-attributes', async () => {
    const img = document.createElement('img');
    img.setAttribute('data-fly-attributes', 'attrs');
    await processAttributes(img, { attrs: { src: 'javascript:alert(1)' }, security: createSecurity() });
    expect(img.hasAttribute('src')).to.equal(false);

    img.setAttribute('data-fly-attributes', 'attrs');
    await processAttributes(img, { attrs: { src: 'https://example.com/x.png' }, security: createSecurity() });
    expect(img.getAttribute('src')).to.equal('https://example.com/x.png');
  });

  it('respects context.security.allowedUrlSchemes overrides', async () => {
    const img = document.createElement('img');
    img.setAttribute('data-fly-attributes', 'attrs');
    const dataGif = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
    await processAttributes(img, {
      attrs: { src: dataGif },
      security: createSecurity({ allowedUrlSchemes: new Set(['http:', 'https:', 'mailto:', 'tel:', '', 'data:']) }),
    });
    expect(img.getAttribute('src')).to.equal(dataGif);
  });

  it('removes disallowed about: URL', async () => {
    const a = document.createElement('a');
    // eslint-disable-next-line no-template-curly-in-string
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: 'about:blank', security: createSecurity() });
    expect(a.hasAttribute('href')).to.equal(false);
  });

  it('blocks xlink:href on SVG when using javascript:', async () => {
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    // eslint-disable-next-line no-template-curly-in-string
    use.setAttribute('xlink:href', '${ link }');
    await processAttributes(use, { link: 'javascript:alert(1)', security: createSecurity() });
    expect(use.hasAttribute('xlink:href')).to.equal(false);
  });

  it('allows blocking additional attributes via context.security.blockedAttributes', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-attributes', 'attrs');
    await processAttributes(el, {
      attrs: { style: 'color:red' },
      security: createSecurity({ blockedAttributes: new Set(['style']) }),
    });
    expect(el.hasAttribute('style')).to.equal(false);
  });

  it('treats colon after slash as relative (no scheme)', async () => {
    const a = document.createElement('a');
    // eslint-disable-next-line no-template-curly-in-string
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: '/a:b', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('/a:b');
  });

  it('falls back to no-scheme for non-scheme strings containing colon', async () => {
    const a = document.createElement('a');
    // eslint-disable-next-line no-template-curly-in-string
    a.setAttribute('href', '${ link }');
    await processAttributes(a, { link: 'foo/bar:baz', security: createSecurity() });
    expect(a.getAttribute('href')).to.equal('foo/bar:baz');
  });

  it('respects blockedAttributePattern override', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-attributes', 'attrs');
    await processAttributes(el, {
      attrs: { 'data-test': 'x', title: 'ok' },
      security: createSecurity({ blockedAttributePattern: /^data-/i }),
    });
    expect(el.hasAttribute('data-test')).to.equal(false);
    expect(el.getAttribute('title')).to.equal('ok');
  });
});
