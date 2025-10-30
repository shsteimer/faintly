/* eslint-env mocha */
/* eslint-disable no-unused-expressions, no-script-url */

import { expect } from '@esm-bundle/chai';
import { processAttributes, processContent } from '../../src/directives.js';
import { initializeSecurity } from '../../src/render.js';

/**
 * XSS Attack Vector Tests
 *
 * These tests attempt various XSS injection techniques to verify that:
 * 1. The security layer properly blocks malicious content
 * 2. The DOM remains safe after rendering
 * 3. No executable code is present in the final output
 *
 * Tests are organized by attack vector type.
 */

describe('XSS Attack Vectors', () => {
  describe('Event Handler Injection via Attributes', () => {
    it('blocks onclick via data-fly-attributes', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { onclick: 'alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('onclick')).to.equal(false);
      expect(el.onclick).to.equal(null);
    });

    it('blocks onerror via data-fly-attributes', async () => {
      const el = document.createElement('img');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { src: 'x', onerror: 'alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('onerror')).to.equal(false);
      expect(el.onerror).to.equal(null);
    });

    it('blocks onload via data-fly-attributes', async () => {
      const el = document.createElement('body');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { onload: 'alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('onload')).to.equal(false);
      expect(el.onload).to.equal(null);
    });

    it('blocks onmouseover via data-fly-attributes', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { onmouseover: 'alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('onmouseover')).to.equal(false);
      expect(el.onmouseover).to.equal(null);
    });

    it('blocks multiple common event handlers in one element', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: {
          onclick: 'alert("XSS")',
          ondblclick: 'alert("XSS")',
          onmousedown: 'alert("XSS")',
          onmouseup: 'alert("XSS")',
          onkeydown: 'alert("XSS")',
          onkeyup: 'alert("XSS")',
          onfocus: 'alert("XSS")',
          onblur: 'alert("XSS")',
          onchange: 'alert("XSS")',
          onsubmit: 'alert("XSS")',
          onabort: 'alert("XSS")',
          onresize: 'alert("XSS")',
          onscroll: 'alert("XSS")',
          oncontextmenu: 'alert("XSS")',
          // Also include some safe attributes
          class: 'safe',
          id: 'test',
        },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      // All event handlers should be blocked
      expect(el.hasAttribute('onclick')).to.equal(false);
      expect(el.hasAttribute('ondblclick')).to.equal(false);
      expect(el.hasAttribute('onmousedown')).to.equal(false);
      expect(el.hasAttribute('onmouseup')).to.equal(false);
      expect(el.hasAttribute('onkeydown')).to.equal(false);
      expect(el.hasAttribute('onkeyup')).to.equal(false);
      expect(el.hasAttribute('onfocus')).to.equal(false);
      expect(el.hasAttribute('onblur')).to.equal(false);
      expect(el.hasAttribute('onchange')).to.equal(false);
      expect(el.hasAttribute('onsubmit')).to.equal(false);
      expect(el.hasAttribute('onabort')).to.equal(false);
      expect(el.hasAttribute('onresize')).to.equal(false);
      expect(el.hasAttribute('onscroll')).to.equal(false);
      expect(el.hasAttribute('oncontextmenu')).to.equal(false);

      // Safe attributes should be allowed
      expect(el.getAttribute('class')).to.equal('safe');
      expect(el.getAttribute('id')).to.equal('test');
    });
  });

  describe('JavaScript URL Injection', () => {
    it('blocks javascript: URLs in href attributes', async () => {
      const el = document.createElement('a');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { href: 'javascript:alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });

    it('blocks javascript: URLs in src attributes', async () => {
      const el = document.createElement('iframe');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { src: 'javascript:alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('src')).to.equal(false);
    });

    it('blocks javascript: URLs with mixed case', async () => {
      const el = document.createElement('a');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { href: 'JaVaScRiPt:alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });

    it('blocks javascript: URLs with whitespace', async () => {
      const el = document.createElement('a');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { href: '  javascript:alert("XSS")  ' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });
  });

  describe('Data URI Injection', () => {
    it('blocks data: URLs with text/html in href', async () => {
      const el = document.createElement('a');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { href: 'data:text/html,<script>alert("XSS")</script>' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });

    it('blocks data: URLs in iframe src', async () => {
      const el = document.createElement('iframe');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { src: 'data:text/html,<script>alert("XSS")</script>' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('src')).to.equal(false);
    });

    it('blocks data: URLs with base64 encoding', async () => {
      const el = document.createElement('a');
      el.setAttribute('data-fly-attributes', 'attrs');

      // Base64 encoded: <script>alert("XSS")</script>
      const context = {
        attrs: { href: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });
  });

  describe('srcdoc Attribute Injection', () => {
    it('blocks srcdoc attribute on iframe', async () => {
      const el = document.createElement('iframe');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { srcdoc: '<script>alert("XSS")</script>' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('srcdoc')).to.equal(false);
    });

    it('blocks srcdoc with HTML content', async () => {
      const el = document.createElement('iframe');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { srcdoc: '<img src=x onerror=alert("XSS")>' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('srcdoc')).to.equal(false);
    });
  });

  describe('Content Injection via data-fly-content', () => {
    it('safely handles HTML strings with script tags (treats as text)', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-content', 'content');

      const context = {
        content: '<script>alert("XSS")</script>',
      };
      context.security = await initializeSecurity(context);

      await processContent(el, context);

      // Content should be treated as text, not HTML
      expect(el.textContent).to.equal('<script>alert("XSS")</script>');
      expect(el.querySelector('script')).to.equal(null);
    });

    it('safely handles HTML strings with img onerror (treats as text)', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-content', 'content');

      const context = {
        content: '<img src=x onerror=alert("XSS")>',
      };
      context.security = await initializeSecurity(context);

      await processContent(el, context);

      // Content should be treated as text, not HTML
      expect(el.textContent).to.equal('<img src=x onerror=alert("XSS")>');
      expect(el.querySelector('img')).to.equal(null);
    });

    it('safely handles HTML strings with iframe (treats as text)', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-content', 'content');

      const context = {
        content: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      };
      context.security = await initializeSecurity(context);

      await processContent(el, context);

      // Content should be treated as text, not HTML
      expect(el.querySelector('iframe')).to.equal(null);
    });

    it('safely handles HTML strings with anchor javascript: URL (treats as text)', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-content', 'content');

      const context = {
        content: '<a href="javascript:alert(\'XSS\')">Click me</a>',
      };
      context.security = await initializeSecurity(context);

      await processContent(el, context);

      // Content should be treated as text, not HTML
      expect(el.querySelector('a')).to.equal(null);
    });
  });

  describe('Expression Injection', () => {
    it('safely handles script tags in expression values', async () => {
      const el = document.createElement('div');
      // eslint-disable-next-line no-template-curly-in-string
      el.setAttribute('title', '${userInput}');

      const context = {
        userInput: '<script>alert("XSS")</script>',
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      // Expression value should be set as text, not parsed as HTML
      expect(el.getAttribute('title')).to.equal('<script>alert("XSS")</script>');
    });

    it('blocks javascript: URLs via expressions', async () => {
      const el = document.createElement('a');
      // eslint-disable-next-line no-template-curly-in-string
      el.setAttribute('href', '${url}');

      const context = {
        url: 'javascript:alert("XSS")',
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });

    it('blocks event handlers via expressions', async () => {
      const el = document.createElement('div');
      // eslint-disable-next-line no-template-curly-in-string
      el.setAttribute('onclick', '${handler}');

      const context = {
        handler: 'alert("XSS")',
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      // onclick attribute should be blocked
      expect(el.hasAttribute('onclick')).to.equal(false);
    });
  });

  describe('DOM-based XSS via Element Injection', () => {
    it('documents that pre-built DOM elements from context are trusted (not sanitized)', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-content', 'content');

      // Create a simple element (avoid script/img that might cause browser issues in tests)
      const spanEl = document.createElement('span');
      spanEl.textContent = 'Content from DOM element';
      spanEl.setAttribute('data-test', 'value');

      const context = {
        content: spanEl,
      };
      context.security = await initializeSecurity(context);

      await processContent(el, context);

      // Pre-constructed DOM elements are inserted as-is (context is trusted)
      const span = el.querySelector('span');
      expect(span).to.not.equal(null);
      if (span) {
        expect(span.textContent).to.equal('Content from DOM element');
        expect(span.getAttribute('data-test')).to.equal('value');
      }
    });
  });

  describe('Edge Cases and Additional URL Schemes', () => {
    it('blocks vbscript: URLs', async () => {
      const el = document.createElement('a');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { href: 'vbscript:msgbox("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });

    it('blocks file: URLs', async () => {
      const el = document.createElement('a');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { href: 'file:///etc/passwd' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('href')).to.equal(false);
    });

    it('handles empty string event handler values (still blocks)', async () => {
      const el = document.createElement('div');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: {
          onclick: '',
          class: '',
        },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      // Even empty onclick should be blocked
      expect(el.hasAttribute('onclick')).to.equal(false);
      // Empty safe attributes should be allowed
      expect(el.getAttribute('class')).to.equal('');
    });
  });

  describe('Form Action XSS Vectors', () => {
    it('blocks javascript: URLs in formaction', async () => {
      const el = document.createElement('button');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { formaction: 'javascript:alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('formaction')).to.equal(false);
    });

    it('blocks data: URLs in action attribute', async () => {
      const el = document.createElement('form');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { action: 'data:text/html,<script>alert("XSS")</script>' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('action')).to.equal(false);
    });
  });

  describe('SVG-based XSS Vectors', () => {
    it('blocks event handlers on SVG elements', async () => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { onload: 'alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('onload')).to.equal(false);
    });

    it('blocks javascript: in xlink:href', async () => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      el.setAttribute('data-fly-attributes', 'attrs');

      const context = {
        attrs: { 'xlink:href': 'javascript:alert("XSS")' },
      };
      context.security = await initializeSecurity(context);

      await processAttributes(el, context);

      expect(el.hasAttribute('xlink:href')).to.equal(false);
    });
  });
});
