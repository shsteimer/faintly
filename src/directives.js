import { resolveExpression, resolveExpressions, unwrapExpression } from './expressions.js';
// eslint-disable-next-line import/no-cycle
import { processNode, renderElement } from './render.js';

async function processAttributesDirective(el, context) {
  if (!el.hasAttribute('data-fly-attributes')) return;

  const attrsExpression = unwrapExpression(el.getAttribute('data-fly-attributes'));
  const attrsData = await resolveExpression(attrsExpression, context);

  el.removeAttribute('data-fly-attributes');
  if (attrsData) {
    Object.entries(attrsData).forEach(([k, v]) => {
      const name = String(k);
      if (v === undefined) {
        el.removeAttribute(name);
      } else if (context.security.shouldAllowAttribute(name, v, context)) {
        el.setAttribute(name, v);
      } else {
        el.removeAttribute(name);
      }
    });
  }
}

/**
 * process the attributes directive, as well as any expressions in non `data-fly-*` attributes
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 */
export async function processAttributes(el, context) {
  await processAttributesDirective(el, context);

  const attrPromises = el.getAttributeNames()
    .filter((attrName) => !attrName.startsWith('data-fly-'))
    .map(async (attrName) => {
      const { updated, updatedText } = await resolveExpressions(el.getAttribute(attrName), context);
      if (updated) {
        if (context.security.shouldAllowAttribute(attrName, updatedText, context)) {
          el.setAttribute(attrName, updatedText);
        } else {
          el.removeAttribute(attrName);
        }
      }
    });
  await Promise.all(attrPromises);
}

/**
 * processes the test directive
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 * @returns {Promise<boolean>} indicator if node should be rendered
 */
export async function processTest(el, context) {
  const testAttrName = el.getAttributeNames().find((attrName) => attrName.startsWith('data-fly-test') || attrName.startsWith('data-fly-not'));
  if (!testAttrName) return true;

  const nameParts = testAttrName.split('.');
  const contextName = nameParts[1] || '';

  const testExpression = unwrapExpression(el.getAttribute(testAttrName));
  const testData = await resolveExpression(testExpression, context);

  el.removeAttribute(testAttrName);

  const testResult = testAttrName.startsWith('data-fly-not') ? !testData : !!testData;

  if (contextName) context[contextName.toLowerCase()] = testResult;

  if (!testResult) {
    el.remove();
  }

  return testResult;
}

/**
 * process the content directive
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 * @returns {Promise<Boolean>} if there was a content directive
 */
export async function processContent(el, context) {
  if (!el.hasAttribute('data-fly-content')) return false;

  const contentExpression = unwrapExpression(el.getAttribute('data-fly-content'));
  const content = await resolveExpression(contentExpression, context);

  el.removeAttribute('data-fly-content');

  if (content !== undefined) {
    if (content instanceof Node) {
      el.replaceChildren(content);
    } else if (Array.isArray(content)
        || content instanceof NodeList || content instanceof HTMLCollection) {
      el.replaceChildren(...content);
    } else {
      const textNode = document.createTextNode(content);
      el.replaceChildren(textNode);
    }
  } else {
    el.textContent = '';
  }

  return true;
}

/**
 * processes the repeat directive
 *
 * @param {Element} el the element to potentially be repeated
 * @param {Object} context the rendering context
 * @returns {Promise<Boolean>} if there was a repeat directive
 */
export async function processRepeat(el, context) {
  const repeatAttrName = el.getAttributeNames().find((attrName) => attrName.startsWith('data-fly-repeat'));
  if (!repeatAttrName) return false;

  const nameParts = repeatAttrName.split('.');
  const contextName = nameParts[1] || 'item';

  const repeatExpression = unwrapExpression(el.getAttribute(repeatAttrName));
  const arr = await resolveExpression(repeatExpression, context);
  if (!arr || Object.keys(arr).length === 0) {
    el.remove();
    return true;
  }

  el.removeAttribute(repeatAttrName);
  const repeatedNodes = await Promise.all(Object.entries(arr).map(async ([key, item], i) => {
    const cloned = el.cloneNode(true);

    const repeatContext = { ...context };
    repeatContext[contextName.toLowerCase()] = item;
    repeatContext[`${contextName.toLowerCase()}Index`] = i;
    repeatContext[`${contextName.toLowerCase()}Number`] = i + 1;
    repeatContext[`${contextName.toLowerCase()}Key`] = key;

    // eslint-disable-next-line no-use-before-define
    await processNode(cloned, repeatContext);

    return cloned;
  }));

  let afterEL = el;
  repeatedNodes.forEach((node) => {
    afterEL.after(node);
    afterEL = node;
  });

  el.remove();

  return true;
}

/**
 * process the include directive
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 * @returns {Promise<Boolean>} if there was an include directive
 */
export async function processInclude(el, context) {
  if (!el.hasAttribute('data-fly-include')) return false;

  const includeValue = el.getAttribute('data-fly-include');
  el.removeAttribute('data-fly-include');
  const { updatedText } = await resolveExpressions(includeValue, context);

  let templatePath = context.template ? context.template.path : '';
  let templateName = updatedText;
  if (templateName.startsWith('/')) {
    const [path, name] = templateName.split('#');
    templatePath = path;
    templateName = name;
  }

  const includeContext = {
    ...context,
    template: {
      name: templateName,
      path: templatePath,
    },
  };

  await renderElement(el, includeContext);

  return true;
}

/**
 * process the unwrap directive, leaving the attribute only if it resolves to true
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 * @returns {Promise<void>}
 */
export async function resolveUnwrap(el, context) {
  if (!el.hasAttribute('data-fly-unwrap')) return;

  const unwrapExpr = el.getAttribute('data-fly-unwrap');
  if (unwrapExpr) {
    const unwrapVal = !!(await resolveExpression(unwrapExpression(unwrapExpr), context));

    if (!unwrapVal) {
      el.removeAttribute('data-fly-unwrap');
    }
  }
}

export function processUnwraps(el) {
  el.querySelectorAll('[data-fly-unwrap]').forEach((unwrapEl) => {
    unwrapEl.before(...unwrapEl.childNodes);
    unwrapEl.remove();
  });
}
