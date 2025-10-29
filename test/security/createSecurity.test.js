/* eslint-env mocha */
/* eslint-disable no-unused-expressions, no-script-url */

import { expect } from '@esm-bundle/chai';
import createSecurity from '../../src/faintly.security.js';

describe('createSecurity', () => {
  describe('shouldAllowAttribute - blocked attributes', () => {
    it('blocks event handler attributes by pattern (onclick, onload, etc.)', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('onclick', 'alert(1)')).to.equal(false);
      expect(security.shouldAllowAttribute('onload', 'doSomething()')).to.equal(false);
      expect(security.shouldAllowAttribute('ONCLICK', 'alert(1)')).to.equal(false); // case insensitive
      expect(security.shouldAllowAttribute('OnMouseOver', 'hack()')).to.equal(false);
    });

    it('blocks srcdoc attribute', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('srcdoc', '<script>alert(1)</script>')).to.equal(false);
    });

    it('allows normal attributes', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('class', 'some-class')).to.equal(true);
      expect(security.shouldAllowAttribute('id', 'some-id')).to.equal(true);
      expect(security.shouldAllowAttribute('aria-label', 'description')).to.equal(true);
      expect(security.shouldAllowAttribute('data-test', 'value')).to.equal(true);
    });
  });

  describe('shouldAllowAttribute - URL validation', () => {
    it('blocks javascript: URLs in href', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('href', 'javascript:alert(1)')).to.equal(false);
    });

    it('blocks javascript: URLs in src', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('src', 'javascript:alert(1)')).to.equal(false);
    });

    it('blocks data: URLs by default', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('href', 'data:text/html,<script>alert(1)</script>')).to.equal(false);
    });

    it('allows http: and https: URLs', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('href', 'http://example.com')).to.equal(true);
      expect(security.shouldAllowAttribute('href', 'https://example.com')).to.equal(true);
      expect(security.shouldAllowAttribute('src', 'https://cdn.example.com/image.jpg')).to.equal(true);
    });

    it('allows mailto: and tel: URLs', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('href', 'mailto:test@example.com')).to.equal(true);
      expect(security.shouldAllowAttribute('href', 'tel:+1234567890')).to.equal(true);
    });

    it('always allows relative URLs', () => {
      const security = createSecurity();

      expect(security.shouldAllowAttribute('href', '/path/to/page')).to.equal(true);
      expect(security.shouldAllowAttribute('href', './relative')).to.equal(true);
      expect(security.shouldAllowAttribute('href', '../parent')).to.equal(true);
      expect(security.shouldAllowAttribute('href', '#hash')).to.equal(true);
      expect(security.shouldAllowAttribute('href', '?query=value')).to.equal(true);
    });

    it('does not apply URL validation to non-URL attributes', () => {
      const security = createSecurity();

      // These should be allowed even though they contain "javascript:"
      expect(security.shouldAllowAttribute('title', 'javascript: is dangerous')).to.equal(true);
      expect(security.shouldAllowAttribute('alt', 'data:image/png')).to.equal(true);
    });

    it('handles edge cases in URL scheme extraction', () => {
      const security = createSecurity();

      // Empty or whitespace values
      expect(security.shouldAllowAttribute('href', '')).to.equal(true);
      expect(security.shouldAllowAttribute('href', '   ')).to.equal(true);

      // Colon after slash (not a scheme)
      expect(security.shouldAllowAttribute('href', '/path:with:colons')).to.equal(true);
      expect(security.shouldAllowAttribute('href', 'path/file:name')).to.equal(true);

      // String with colon before slash is parsed as scheme (even if unusual)
      // Should be blocked since 'not:' is not in allowedUrlSchemes
      expect(security.shouldAllowAttribute('href', 'not:a:valid:url')).to.equal(false);
    });
  });

  describe('shouldAllowAttribute - custom configuration', () => {
    it('allows overriding blockedAttributes', () => {
      const security = createSecurity({
        blockedAttributes: ['style', 'class'],
      });

      expect(security.shouldAllowAttribute('style', 'color:red')).to.equal(false);
      expect(security.shouldAllowAttribute('class', 'test')).to.equal(false);
      expect(security.shouldAllowAttribute('srcdoc', 'test')).to.equal(true); // Original default not included
    });

    it('allows overriding blockedAttributePatterns', () => {
      const security = createSecurity({
        blockedAttributePatterns: [/^data-/i],
      });

      expect(security.shouldAllowAttribute('data-test', 'value')).to.equal(false);
      expect(security.shouldAllowAttribute('onclick', 'alert(1)')).to.equal(true); // Original default not included
    });

    it('allows adding to allowedUrlSchemes', () => {
      const dataGif = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
      const security = createSecurity({
        allowedUrlSchemes: ['http:', 'https:', 'mailto:', 'tel:', 'data:'],
      });

      expect(security.shouldAllowAttribute('src', dataGif)).to.equal(true);
    });

    it('allows overriding urlAttributes', () => {
      const security = createSecurity({
        urlAttributes: ['href'], // Only check href, not src
      });

      expect(security.shouldAllowAttribute('href', 'javascript:alert(1)')).to.equal(false);
      expect(security.shouldAllowAttribute('src', 'javascript:alert(1)')).to.equal(true); // Not a URL attribute anymore
    });
  });

  describe('allowIncludePath', () => {
    it('allows all same-origin paths', () => {
      const security = createSecurity();

      expect(security.allowIncludePath('/blocks/card/card.html')).to.equal(true);
      expect(security.allowIncludePath('/scripts/file.js')).to.equal(true);
      expect(security.allowIncludePath('/any/path.html')).to.equal(true);
    });

    it('handles empty or null paths', () => {
      const security = createSecurity();

      expect(security.allowIncludePath('')).to.equal(true);
      expect(security.allowIncludePath(null)).to.equal(true);
    });

    it('blocks cross-origin URLs', () => {
      const security = createSecurity();

      expect(security.allowIncludePath('https://evil.com/blocks/card.html')).to.equal(false);
      expect(security.allowIncludePath('http://evil.com/blocks/card.html')).to.equal(false);
      expect(security.allowIncludePath('//evil.com/blocks/card.html')).to.equal(false);
    });

    it('allows same-origin full URLs', () => {
      const security = createSecurity();

      const sameOriginUrl = `${window.location.origin}/any/path/card.html`;
      expect(security.allowIncludePath(sameOriginUrl)).to.equal(true);
    });
  });
});
