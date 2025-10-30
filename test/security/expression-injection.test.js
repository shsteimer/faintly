/* eslint-env mocha */
/* eslint-disable no-unused-expressions, no-template-curly-in-string */

import { expect } from '@esm-bundle/chai';
import { processNode, initializeSecurity } from '../../src/render.js';

/**
 * Expression Injection Tests
 *
 * These tests document the risk of user input controlling template/HTML content.
 * If user input becomes part of the HTML (not just context), they can inject
 * expressions including utils:eval() to execute arbitrary code.
 *
 * SECURITY MODEL: Templates/HTML are trusted, context data is sanitized.
 * Developers must NEVER allow user input to become part of templates.
 */

describe('Expression Injection via Template Control', () => {
  describe('Risk: User input in HTML/template strings', () => {
    it('UNSAFE: User input in innerHTML can inject expressions', async () => {
      const el = document.createElement('div');

      // DANGEROUS: User input becomes part of HTML
      const maliciousUserInput = '${utils:eval(typeof window)}';
      el.innerHTML = `<span title="${maliciousUserInput}">Test</span>`;

      const context = {};
      context.security = await initializeSecurity(context);

      await processNode(el, context);

      // Expression was evaluated!
      const span = el.querySelector('span');
      expect(span.getAttribute('title')).to.equal('object');
    });

    it('UNSAFE: User input in text nodes can inject expressions', async () => {
      const el = document.createElement('div');

      // DANGEROUS: User input becomes text content with expression
      const maliciousUserInput = 'Hello ${utils:eval(typeof document)}';
      el.textContent = maliciousUserInput;

      const context = {};
      context.security = await initializeSecurity(context);

      await processNode(el, context);

      // Expression was evaluated in text!
      expect(el.textContent).to.equal('Hello object');
    });

    it('UNSAFE: User input via setAttribute can inject expressions', async () => {
      const el = document.createElement('div');

      // DANGEROUS: User controls attribute value with expression
      const maliciousUserInput = '${utils:eval(2+2)}';
      el.setAttribute('data-value', maliciousUserInput);

      const context = {};
      context.security = await initializeSecurity(context);

      await processNode(el, context);

      // Expression was evaluated!
      expect(el.getAttribute('data-value')).to.equal('4');
    });
  });

  describe('SAFE: User input in context only', () => {
    it('SAFE: User input in context does not create expressions', async () => {
      const el = document.createElement('div');
      // Template controls the expression syntax
      // eslint-disable-next-line no-template-curly-in-string
      el.setAttribute('title', '${userInput}');

      // User input contains what looks like an expression, but it's just data
      const context = {
        userInput: '${utils:eval(typeof window)}',
      };
      context.security = await initializeSecurity(context);

      await processNode(el, context);

      // NOT evaluated - treated as literal string from context
      expect(el.getAttribute('title')).to.equal('${utils:eval(typeof window)}');
    });
  });

  describe('Attack vector documentation', () => {
    it('documents that utils:eval can be injected via template control', async () => {
      // This test documents the attack - DO NOT allow user input in templates!
      const el = document.createElement('div');

      // Simulate attacker controlling part of template
      const attackPayload = '${utils:eval(window.location.href)}';
      el.innerHTML = `<div data-url="${attackPayload}"></div>`;

      const context = {};
      context.security = await initializeSecurity(context);

      await processNode(el, context);

      // Attack succeeded - utils:eval was executed
      const innerDiv = el.querySelector('div');
      expect(innerDiv.getAttribute('data-url')).to.include('http');
    });

    it('documents that regular expressions can also be injected', async () => {
      const el = document.createElement('div');

      // Attacker injects expression to access context
      const attackPayload = '${secretData}';
      el.innerHTML = `<div title="${attackPayload}">Leaked</div>`;

      const context = {
        secretData: 'API_KEY_12345',
      };
      context.security = await initializeSecurity(context);

      await processNode(el, context);

      // Attacker successfully read secret from context
      const innerDiv = el.querySelector('div');
      expect(innerDiv.getAttribute('title')).to.equal('API_KEY_12345');
    });
  });
});
