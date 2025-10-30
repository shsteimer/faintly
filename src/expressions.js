/**
 * Evaluates a JavaScript expression in the given context.
 * Uses Function constructor - requires 'unsafe-eval' CSP policy.
 * @param {string} expr - The JavaScript expression to evaluate
 * @param {object} context - The context object providing variables
 * @returns {*} The result of evaluating the expression
 */
function evaluate(expr, context) {
  // eslint-disable-next-line no-new-func
  const fn = new Function('ctx', `with(ctx) { return ${expr}; }`);
  return fn(context);
}

/**
 * Strips ${} wrapper from expression if present for HTL compatibility
 * @param {string} expression the expression that may be wrapped
 * @returns {string} the unwrapped expression
 */
export function unwrapExpression(expression) {
  const trimmed = expression.trim();
  if (trimmed.startsWith('${') && trimmed.endsWith('}')) {
    return trimmed.slice(2, -1).trim();
  }
  return expression;
}

/**
 * resolves and returns data from the rendering context
 *
 * @param {string} expression the name of the data
 * @param {Object} context the rendering context
 * @returns {Promise<any>} the data that was resolved
 */
export async function resolveExpression(expression, context) {
  const trimmedExpression = expression.trim();
  if (trimmedExpression.startsWith('utils:eval(') && trimmedExpression.endsWith(')')) {
    const expr = trimmedExpression.slice(11, -1); // Extract expression from utils:eval(...)
    return evaluate(expr, context);
  }

  let resolved = context;
  let previousResolvedValue;

  const parts = trimmedExpression.split('.');
  for (let i = 0; i < parts.length; i += 1) {
    if (typeof resolved === 'undefined') break;

    const part = parts[i];
    previousResolvedValue = resolved;
    resolved = resolved[part];

    if (typeof resolved === 'function') {
      const functionParams = [{ ...context }];
      // eslint-disable-next-line no-await-in-loop
      resolved = await resolved.apply(previousResolvedValue, functionParams);
    }
  }

  return resolved;
}

/**
 * resolves expressions in a string
 *
 * @param {string} str the string that may contain expressions
 * @param {Object} context the rendering context
 */
export async function resolveExpressions(str, context) {
  const regexp = /(\\)?\${([^}]+)}/gi;

  const promises = [];
  str.replaceAll(regexp, (match, escapeChar, expression) => {
    const replacementPromise = escapeChar
      ? Promise.resolve(match.slice(1))
      : resolveExpression(expression.trim(), context);
    promises.push(replacementPromise);
    return match;
  });

  if (promises.length > 0) {
    const promiseResults = await Promise.all(promises);
    const updatedText = str.replaceAll(regexp, () => {
      const result = promiseResults.shift();
      return result;
    });

    return { updated: true, updatedText };
  }

  return { updated: false, updatedText: str };
}

/**
 * process text expressions within a text node, updating the node's textContent
 *
 * @param {Node} node the text node
 * @param {Object} context the rendering context
 */
export async function processTextExpressions(node, context) {
  const { updated, updatedText } = await resolveExpressions(node.textContent, context);

  if (updated) node.textContent = updatedText;
}
