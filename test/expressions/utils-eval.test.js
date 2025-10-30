/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { resolveExpression } from '../../src/expressions.js';

describe('utils:eval() expression evaluation', () => {
  describe('comparisons', () => {
    it('should evaluate greater than', async () => {
      const context = { count: 10 };
      const result = await resolveExpression('utils:eval(count > 5)', context);
      expect(result).to.equal(true);
    });

    it('should evaluate less than', async () => {
      const context = { count: 3 };
      const result = await resolveExpression('utils:eval(count < 5)', context);
      expect(result).to.equal(true);
    });

    it('should evaluate greater than or equal', async () => {
      const context = { count: 5 };
      const result = await resolveExpression('utils:eval(count >= 5)', context);
      expect(result).to.equal(true);
    });

    it('should evaluate less than or equal', async () => {
      const context = { count: 5 };
      const result = await resolveExpression('utils:eval(count <= 5)', context);
      expect(result).to.equal(true);
    });

    it('should evaluate strict equality', async () => {
      const context = { status: 'active' };
      const result = await resolveExpression('utils:eval(status === "active")', context);
      expect(result).to.equal(true);
    });

    it('should evaluate strict inequality', async () => {
      const context = { status: 'active' };
      const result = await resolveExpression('utils:eval(status !== "disabled")', context);
      expect(result).to.equal(true);
    });
  });

  describe('logical operators', () => {
    it('should evaluate AND operator', async () => {
      const context = { isValid: true, isActive: true };
      const result = await resolveExpression('utils:eval(isValid && isActive)', context);
      expect(result).to.equal(true);
    });

    it('should evaluate OR operator', async () => {
      const context = { isAdmin: false, isModerator: true };
      const result = await resolveExpression('utils:eval(isAdmin || isModerator)', context);
      expect(result).to.equal(true);
    });

    it('should evaluate NOT operator', async () => {
      const context = { isDisabled: false };
      const result = await resolveExpression('utils:eval(!isDisabled)', context);
      expect(result).to.equal(true);
    });

    it('should evaluate complex logical expression', async () => {
      const context = { count: 10, isDisabled: false, isAdmin: true };
      const result = await resolveExpression('utils:eval((count > 5 && !isDisabled) || isAdmin)', context);
      expect(result).to.equal(true);
    });
  });

  describe('ternary operator', () => {
    it('should evaluate ternary with true condition', async () => {
      const context = { showCount: true, count: 5 };
      const result = await resolveExpression('utils:eval(showCount ? count : "N/A")', context);
      expect(result).to.equal(5);
    });

    it('should evaluate ternary with false condition', async () => {
      const context = { showCount: false, count: 5 };
      const result = await resolveExpression('utils:eval(showCount ? count : "N/A")', context);
      expect(result).to.equal('N/A');
    });

    it('should evaluate nested ternary', async () => {
      const context = { status: 'active' };
      const result = await resolveExpression('utils:eval(status === "active" ? "green" : status === "pending" ? "yellow" : "red")', context);
      expect(result).to.equal('green');
    });
  });

  describe('string methods', () => {
    it('should call toUpperCase', async () => {
      const context = { name: 'john' };
      const result = await resolveExpression('utils:eval(name.toUpperCase())', context);
      expect(result).to.equal('JOHN');
    });

    it('should call toLowerCase', async () => {
      const context = { name: 'JOHN' };
      const result = await resolveExpression('utils:eval(name.toLowerCase())', context);
      expect(result).to.equal('john');
    });

    it('should call substring', async () => {
      const context = { text: 'hello world' };
      const result = await resolveExpression('utils:eval(text.substring(0, 5))', context);
      expect(result).to.equal('hello');
    });

    it('should call trim', async () => {
      const context = { text: '  hello  ' };
      const result = await resolveExpression('utils:eval(text.trim())', context);
      expect(result).to.equal('hello');
    });

    it('should concatenate strings', async () => {
      const context = { firstName: 'John', lastName: 'Doe' };
      const result = await resolveExpression('utils:eval(firstName + " " + lastName)', context);
      expect(result).to.equal('John Doe');
    });
  });

  describe('array methods', () => {
    it('should call join', async () => {
      const context = { items: ['apple', 'banana', 'cherry'] };
      const result = await resolveExpression('utils:eval(items.join(", "))', context);
      expect(result).to.equal('apple, banana, cherry');
    });

    it('should access array by index', async () => {
      const context = { items: ['first', 'second', 'third'] };
      const result = await resolveExpression('utils:eval(items[0])', context);
      expect(result).to.equal('first');
    });

    it('should access array length', async () => {
      const context = { items: [1, 2, 3, 4, 5] };
      const result = await resolveExpression('utils:eval(items.length)', context);
      expect(result).to.equal(5);
    });

    it('should call map', async () => {
      const context = { numbers: [1, 2, 3] };
      const result = await resolveExpression('utils:eval(numbers.map(n => n * 2))', context);
      expect(result).to.deep.equal([2, 4, 6]);
    });

    it('should call filter', async () => {
      const context = { numbers: [1, 2, 3, 4, 5] };
      const result = await resolveExpression('utils:eval(numbers.filter(n => n > 3))', context);
      expect(result).to.deep.equal([4, 5]);
    });
  });

  describe('object access', () => {
    it('should access nested property', async () => {
      const context = { user: { profile: { name: 'John' } } };
      const result = await resolveExpression('utils:eval(user.profile.name)', context);
      expect(result).to.equal('John');
    });

    it('should access property with bracket notation', async () => {
      const context = { user: { name: 'John' } };
      const result = await resolveExpression('utils:eval(user["name"])', context);
      expect(result).to.equal('John');
    });

    it('should access dynamic property', async () => {
      const context = { user: { name: 'John' }, key: 'name' };
      const result = await resolveExpression('utils:eval(user[key])', context);
      expect(result).to.equal('John');
    });
  });

  describe('arithmetic operations', () => {
    it('should perform addition', async () => {
      const context = { a: 5, b: 3 };
      const result = await resolveExpression('utils:eval(a + b)', context);
      expect(result).to.equal(8);
    });

    it('should perform subtraction', async () => {
      const context = { a: 5, b: 3 };
      const result = await resolveExpression('utils:eval(a - b)', context);
      expect(result).to.equal(2);
    });

    it('should perform multiplication', async () => {
      const context = { a: 5, b: 3 };
      const result = await resolveExpression('utils:eval(a * b)', context);
      expect(result).to.equal(15);
    });

    it('should perform division', async () => {
      const context = { a: 10, b: 2 };
      const result = await resolveExpression('utils:eval(a / b)', context);
      expect(result).to.equal(5);
    });

    it('should perform modulo', async () => {
      const context = { a: 10, b: 3 };
      const result = await resolveExpression('utils:eval(a % b)', context);
      expect(result).to.equal(1);
    });
  });

  describe('global functions', () => {
    it('should call encodeURIComponent', async () => {
      const context = { url: 'hello world' };
      const result = await resolveExpression('utils:eval(encodeURIComponent(url))', context);
      expect(result).to.equal('hello%20world');
    });

    it('should call parseInt', async () => {
      const context = { str: '42' };
      const result = await resolveExpression('utils:eval(parseInt(str))', context);
      expect(result).to.equal(42);
    });

    it('should call parseFloat', async () => {
      const context = { str: '3.14' };
      const result = await resolveExpression('utils:eval(parseFloat(str))', context);
      expect(result).to.equal(3.14);
    });
  });

  describe('custom helper functions', () => {
    it('should call custom helper function', async () => {
      const context = {
        name: 'John',
        count: 5,
        formatMessage: (n, c) => `Hello ${n}, you have ${c} messages`,
      };
      const result = await resolveExpression('utils:eval(formatMessage(name, count))', context);
      expect(result).to.equal('Hello John, you have 5 messages');
    });

    it('should call custom truncate function', async () => {
      const context = {
        text: 'This is a very long text',
        truncate: (str, len) => (str.length > len ? `${str.slice(0, len)}...` : str),
      };
      const result = await resolveExpression('utils:eval(truncate(text, 10))', context);
      expect(result).to.equal('This is a ...');
    });
  });

  describe('error handling', () => {
    it('should throw error for undefined variable', async () => {
      const context = {};
      try {
        await resolveExpression('utils:eval(undefinedVariable)', context);
        expect.fail('should have thrown error');
      } catch (error) {
        expect(error).to.be.instanceOf(ReferenceError);
      }
    });

    it('should throw error for syntax error', async () => {
      const context = { count: 5 };
      try {
        await resolveExpression('utils:eval(count > )', context);
        expect.fail('should have thrown error');
      } catch (error) {
        expect(error).to.be.instanceOf(SyntaxError);
      }
    });

    it('should throw error for invalid expression', async () => {
      const context = { count: 5 };
      try {
        await resolveExpression('utils:eval(count..invalid)', context);
        expect.fail('should have thrown error');
      } catch (error) {
        expect(error).to.be.instanceOf(SyntaxError);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty expression', async () => {
      const context = {};
      const result = await resolveExpression('utils:eval()', context);
      expect(result).to.be.undefined;
    });

    it('should handle whitespace in expression', async () => {
      const context = { count: 10 };
      const result = await resolveExpression('utils:eval(  count > 5  )', context);
      expect(result).to.equal(true);
    });

    it('should handle null values', async () => {
      const context = { value: null };
      const result = await resolveExpression('utils:eval(value === null)', context);
      expect(result).to.equal(true);
    });

    it('should handle undefined values', async () => {
      const context = { value: undefined };
      const result = await resolveExpression('utils:eval(value === undefined)', context);
      expect(result).to.equal(true);
    });

    it('should handle boolean values', async () => {
      const context = { isTrue: true, isFalse: false };
      const result = await resolveExpression('utils:eval(isTrue && !isFalse)', context);
      expect(result).to.equal(true);
    });
  });

  describe('whitespace handling', () => {
    it('should handle leading whitespace before utils:eval', async () => {
      const context = { count: 10 };
      const result = await resolveExpression('  utils:eval(count > 5)', context);
      expect(result).to.equal(true);
    });

    it('should handle trailing whitespace after closing paren', async () => {
      const context = { count: 10 };
      const result = await resolveExpression('utils:eval(count > 5)  ', context);
      expect(result).to.equal(true);
    });

    it('should handle whitespace on both sides', async () => {
      const context = { count: 10 };
      const result = await resolveExpression('  utils:eval(count > 5)  ', context);
      expect(result).to.equal(true);
    });

    it('should handle tabs and spaces', async () => {
      const context = { count: 10 };
      const result = await resolveExpression('\t  utils:eval(count > 5)  \t', context);
      expect(result).to.equal(true);
    });

    it('should handle expression with many spaces', async () => {
      const context = { a: 5, b: 3, c: 2 };
      const result = await resolveExpression('utils:eval(  a   +   b   *   c  )', context);
      expect(result).to.equal(11); // 5 + (3 * 2) = 11
    });

    it('should handle complex expression with internal whitespace', async () => {
      const context = { count: 10, isDisabled: false, isAdmin: true };
      const result = await resolveExpression('utils:eval( ( count > 5 && ! isDisabled ) || isAdmin )', context);
      expect(result).to.equal(true);
    });

    it('should NOT match if space between utils:eval and opening paren', async () => {
      const context = { count: 10 };
      // Should not match utils:eval() syntax, tries to resolve as property path
      const result = await resolveExpression('utils:eval (count > 5)', context);
      expect(result).to.be.undefined; // Tries to resolve as property path, returns undefined
    });
  });

  describe('complex real-world scenarios', () => {
    it('should handle admin or moderator check', async () => {
      const context = { user: { isAdmin: false, isModerator: true } };
      const result = await resolveExpression('utils:eval(user.isAdmin || user.isModerator)', context);
      expect(result).to.equal(true);
    });

    it('should handle item count with plural formatting', async () => {
      const context = {
        items: [1, 2, 3],
        formatCount: (arr) => `${arr.length} item${arr.length !== 1 ? 's' : ''}`,
      };
      const result = await resolveExpression('utils:eval(formatCount(items))', context);
      expect(result).to.equal('3 items');
    });

    it('should handle conditional CSS class', async () => {
      const context = { isActive: true };
      const result = await resolveExpression('utils:eval(isActive ? "active" : "inactive")', context);
      expect(result).to.equal('active');
    });

    it('should handle status badge logic', async () => {
      const context = { status: 'pending' };
      const result = await resolveExpression('utils:eval(status === "active" ? "green" : status === "pending" ? "yellow" : "red")', context);
      expect(result).to.equal('yellow');
    });
  });
});
