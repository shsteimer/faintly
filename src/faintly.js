/**
 * resolve the template to render
 *
 * @param {object} context the rendering context
 * @returns {Promise<Element>} the template element
 */
async function resolveTemplate(context) {
  context.template = context.template || {};
  context.template.path = context.template.path || `${context.codeBasePath}/blocks/${context.blockName}/${context.blockName}.html`;

  const resp = await fetch(context.template.path);
  if (!resp.ok) {
    throw new Error(`Failed to fetch template from ${context.template.path} for block ${context.blockName}.`);
  }

  const markup = await resp.text();

  const dp = new DOMParser();
  const templateDom = dp.parseFromString(markup, 'text/html');

  let template;
  if (context.template.name) {
    template = templateDom.querySelector(`template[data-fly-name="${context.template.name}"]`);
  } else {
    template = templateDom.querySelector('template');
  }

  return template;
}

/**
 * resolves and returns data from the rendering context
 *
 * @param {string} expression the name of the data
 * @param {Object} context the rendering context
 * @returns {Promise<any>} the data that was resolved
 */
async function resolveExpression(expression, context) {
  let resolved = context;
  let prevResolved;

  const parts = expression.split('.');
  for (let i = 0; i < parts.length; i += 1) {
    if (typeof resolved === 'undefined') break;

    const part = parts[i];
    prevResolved = resolved;
    resolved = resolved[part];

    if (typeof resolved === 'function') {
      const functionParams = [{ ...context }];
      // eslint-disable-next-line no-await-in-loop
      resolved = await resolved.apply(prevResolved, functionParams);
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
async function resolveExpressions(str, context) {
  const regexp = /(\\)?\${([a-z0-9\\.\s]+)}/dgi;

  const promises = [];
  str.replaceAll(regexp, (match, escapeChar, expression) => {
    if (escapeChar) {
      promises.push(Promise.resolve(match.slice(1)));
    }

    promises.push(resolveExpression(expression.trim(), context));

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
async function processTextExpressions(node, context) {
  const { updated, updatedText } = await resolveExpressions(node.textContent, context);

  if (updated) {
    node.textContent = updatedText;
  }
}

async function processAttributesDirective(el, context) {
  if (!el.hasAttribute('data-fly-attributes')) return;

  const attrsExpression = el.getAttribute('data-fly-attributes');
  const attrsData = await resolveExpression(attrsExpression, context);

  el.removeAttribute('data-fly-attributes');
  if (attrsData) {
    Object.entries(attrsData).forEach(([k, v]) => {
      if (v === undefined) {
        el.removeAttribute(k);
      } else {
        el.setAttribute(k, v);
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
async function processAttributes(el, context) {
  processAttributesDirective(el, context);

  const attrPromises = el.getAttributeNames()
    .filter((attrName) => !attrName.startsWith('data-fly-'))
    .map(async (attrName) => {
      const { updated, updatedText } = await resolveExpressions(el.getAttribute(attrName), context);
      if (updated) el.setAttribute(attrName, updatedText);
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
async function processTest(el, context) {
  const testAttrName = el.getAttributeNames().find((attrName) => attrName.startsWith('data-fly-test') || attrName.startsWith('data-fly-not'));
  if (!testAttrName) return true;

  const nameParts = testAttrName.split('.');
  const contextName = nameParts[1] || '';

  const testExpression = el.getAttribute(testAttrName);
  const testData = await resolveExpression(testExpression, context);

  el.removeAttribute(testAttrName);

  const testResult = testAttrName.startsWith('data-fly-not') ? !testData : !!testData;

  if (contextName) context[contextName.toLowerCase()] = testResult;

  return testResult;
}

/**
 * process the unwrap directive
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 * @returns {Promise<boolean>} if the element should be unwrapped
 */
async function processUnwrap(el, context) {
  if (!el.hasAttribute('data-fly-unwrap')) return false;

  const unwrapExpression = el.getAttribute('data-fly-unwrap');
  el.removeAttribute('data-fly-unwrap');
  if (unwrapExpression) {
    const unwrapVal = await resolveExpression(unwrapExpression, context);

    return !!unwrapVal;
  }

  return true;
}

/**
 * process the content directive
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 */
async function processContent(el, context) {
  if (!el.hasAttribute('data-fly-content')) return;

  const contentExpression = el.getAttribute('data-fly-content');
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
  }
}

/**
 * processes the repeat directive
 *
 * @param {Element} el the element to potentially be repeated
 * @param {Object} context the rendering context
 * @returns {Promise<undefined|Array<Element>>} undefined if the node is not repeated,
 * or an array of the repeated elements
 */
async function processRepeat(el, context) {
  const repeatAttrName = el.getAttributeNames().find((attrName) => attrName.startsWith('data-fly-repeat'));
  if (!repeatAttrName) return undefined;

  const nameParts = repeatAttrName.split('.');
  const contextName = nameParts[1] || 'item';

  const repeatExpression = el.getAttribute(repeatAttrName);
  const arr = await resolveExpression(repeatExpression, context);
  if (!arr) return [];

  const promises = Object.entries(arr).map(async ([key, item], i) => {
    const cloned = el.cloneNode(true);
    cloned.removeAttribute(repeatAttrName);

    const repeatContext = { ...context };
    repeatContext[contextName.toLowerCase()] = item;
    repeatContext[`${contextName.toLowerCase()}Index`] = i;
    repeatContext[`${contextName.toLowerCase()}Number`] = i + 1;
    repeatContext[`${contextName.toLowerCase()}Key`] = key;

    // eslint-disable-next-line no-use-before-define
    const rendered = await renderNode(cloned, repeatContext);
    return rendered;
  });

  const repeated = await Promise.all(promises);

  const flattened = repeated.flat();

  return flattened;
}

/**
 * process the include directive
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 */
async function processInclude(el, context) {
  if (!el.hasAttribute('data-fly-include')) return;

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

  const template = await resolveTemplate(includeContext);
  // eslint-disable-next-line no-use-before-define
  await renderElementWithTemplate(el, template, includeContext);
}

/**
 * recursively renders a dom node, processing all directives
 *
 * @param {Node} node the node to render
 * @param {Object} context the rendering context
 * @returns {Promise<Array<Node>>} the set of rendered nodes as a result of rendering the given node
 */
async function renderNode(node, context) {
  context.currentNode = node;
  let unwrap = false;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const shouldRender = await processTest(node, context);
    if (!shouldRender) return [];

    const repeated = await processRepeat(node, context);
    if (repeated) return repeated;

    await processAttributes(node, context);

    await processContent(node, context);
    await processInclude(node, context);

    unwrap = await processUnwrap(node, context);
  } else if (node.nodeType === Node.TEXT_NODE) {
    await processTextExpressions(node, context);
  }

  const cloned = node.cloneNode(false);
  for (let i = 0; i < node.childNodes.length; i += 1) {
    const child = node.childNodes[i];
    // eslint-disable-next-line no-await-in-loop
    const renderedChildren = await renderNode(child, context);
    cloned.append(...renderedChildren);
  }

  return unwrap ? [...cloned.childNodes] : [cloned];
}

/**
 * Render a template
 * @param {Element} template the template to render
 * @param {Object} context the rendering context
 */
async function renderTemplate(template, context) {
  const fragment = await renderNode(template.content, context);

  return fragment[0];
}

/**
 * transform the element, replacing it's children with the content from the template
 * @param {Element} el the element
 * @param {Element} template the template element
 * @param {Object} context the rendering context
 */
async function renderElementWithTemplate(el, template, context) {
  const rendered = await renderTemplate(template, context);
  el.replaceChildren(rendered);
}

/**
 * Transform an element using an HTML template
 *
 * @param {Element} block the block element
 * @param {Object} context the rendering context
 */
export async function renderElement(el, context) {
  const template = await resolveTemplate(context);

  await renderElementWithTemplate(el, template, context);
}

/**
 * Transform a block using an HTML template
 *
 * @param {Element} block the block element
 * @param {Object} context the rendering context
 */
export async function renderBlock(block, context = {}) {
  context.block = block;
  context.blockName = block.dataset.blockName;
  context.codeBasePath = context.codeBasePath || (window.hlx ? window.hlx.codeBasePath : '');

  await renderElement(block, context);
}

export const exportForTesting = {
  resolveTemplate,
  resolveExpression,
  resolveExpressions,
  processTextExpressions,
  processAttributes,
  processTest,
  processContent,
  processInclude,
  processRepeat,
  processUnwrap,
};
