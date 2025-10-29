/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-template-curly-in-string */

import { expect } from '@esm-bundle/chai';
import { resolveExpression, resolveExpressions } from '../../src/expressions.js';

describe('expressions with operators but without utils:eval()', () => {
  describe('resolveExpression - property path resolution', () => {
    it('should return undefined for comparison operator', async () => {
      const context = { count: 10 };
      const result = await resolveExpression('count > 5', context);
      expect(result).to.be.undefined;
    });

    it('should return undefined for equality operator', async () => {
      const context = { status: 'active' };
      const result = await resolveExpression('status === "active"', context);
      expect(result).to.be.undefined;
    });

    it('should return undefined for logical AND', async () => {
      const context = { isValid: true, isActive: true };
      const result = await resolveExpression('isValid && isActive', context);
      expect(result).to.be.undefined;
    });

    it('should return undefined for logical OR', async () => {
      const context = { isAdmin: false, isModerator: true };
      const result = await resolveExpression('isAdmin || isModerator', context);
      expect(result).to.be.undefined;
    });

    it('should return undefined for ternary operator', async () => {
      const context = { showCount: true, count: 5 };
      const result = await resolveExpression('showCount ? count : "N/A"', context);
      expect(result).to.be.undefined;
    });

    it('should return undefined for array bracket access', async () => {
      const context = { items: ['first', 'second'] };
      const result = await resolveExpression('items[0]', context);
      expect(result).to.be.undefined;
    });

    it('should return undefined for method call with parens', async () => {
      const context = { name: 'john' };
      const result = await resolveExpression('name.toUpperCase()', context);
      expect(result).to.be.undefined;
    });
  });

  describe('resolveExpressions - text content replacement', () => {
    it('comparison without utils:eval returns undefined', async () => {
      const context = { count: 10 };
      const { updated, updatedText } = await resolveExpressions(
        'Result: ${count > 5}',
        context,
      );
      expect(updated).to.be.true;
      expect(updatedText).to.equal('Result: undefined');
    });

    it('ternary without utils:eval returns undefined', async () => {
      const context = { isActive: true };
      const { updated, updatedText } = await resolveExpressions(
        'Status: ${isActive ? "active" : "inactive"}',
        context,
      );
      expect(updated).to.be.true;
      expect(updatedText).to.equal('Status: undefined');
    });

    it('array access without utils:eval returns undefined', async () => {
      const context = { items: ['apple', 'banana'] };
      const { updated, updatedText } = await resolveExpressions(
        'First: ${items[0]}',
        context,
      );
      expect(updated).to.be.true;
      expect(updatedText).to.equal('First: undefined');
    });

    it('method call without utils:eval returns undefined', async () => {
      const context = { name: 'john' };
      const { updated, updatedText } = await resolveExpressions(
        'Name: ${name.toUpperCase()}',
        context,
      );
      expect(updated).to.be.true;
      expect(updatedText).to.equal('Name: undefined');
    });

    it('should handle mixed expressions with undefined for operators', async () => {
      const context = { a: 5, b: 3, result: 8 };
      const { updated, updatedText } = await resolveExpressions(
        'Calc: ${a + b} = ${result}',
        context,
      );
      expect(updated).to.be.true;
      // First expression (a + b) returns undefined, second (result) resolves to 8
      expect(updatedText).to.equal('Calc: undefined = 8');
    });

    it('should work correctly WITH utils:eval wrapper', async () => {
      const context = { count: 10 };
      const { updated, updatedText } = await resolveExpressions(
        'Result: ${utils:eval(count > 5)}',
        context,
      );
      expect(updated).to.be.true;
      expect(updatedText).to.equal('Result: true');
    });
  });

  describe('escaped expressions - consistent behavior', () => {
    it('escaped expression with operators removes backslash consistently', async () => {
      const context = { count: 10 };
      const { updated, updatedText } = await resolveExpressions(
        'Literal: \\${count > 5}',
        context,
      );
      // Matches and escapes consistently - backslash removed
      expect(updated).to.be.true;
      expect(updatedText).to.equal('Literal: ${count > 5}');
    });

    it('escaped simple expression removes backslash', async () => {
      const context = { count: 10 };
      const { updated, updatedText } = await resolveExpressions(
        'Literal: \\${count}',
        context,
      );
      // Escape handling removes backslash
      expect(updated).to.be.true;
      expect(updatedText).to.equal('Literal: ${count}');
    });
  });
});
