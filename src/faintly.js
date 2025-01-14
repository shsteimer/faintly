/**
 * resolve the template to render
 *
 * @param {object} context the rendering context
 * @returns {Promise<Element>} the template element
 */
async function resolveTemplate(context) {
  context.template = context.template || {};
  context.template.path = context.template.path || `${context.codeBasePath}/blocks/${context.blockName}/${context.blockName}.html`;

  const templateId = `faintly-template-${context.template.path}#${context.template.name || ''}`.toLowerCase().replace(/[^0-9a-z]/gi, '-');
  let template = document.getElementById(templateId);
  if (!template) {
    const resp = await fetch(context.template.path);
    if (!resp.ok) throw new Error(`Failed to fetch template from ${context.template.path} for block ${context.blockName}.`);

    const markup = await resp.text();

    const dp = new DOMParser();
    const templateDom = dp.parseFromString(markup, 'text/html');

    templateDom.querySelectorAll('template').forEach((t) => {
      const name = t.getAttribute('data-fly-name') || '';
      t.id = `faintly-template-${context.template.path}#${name}`.toLowerCase().replace(/[^0-9a-z]/gi, '-');

      document.body.append(t);
    });
  }

  template = document.getElementById(templateId);
  if (!template) throw new Error(`Failed to find template with id ${templateId}.`);

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

  if (updated) node.textContent = updatedText;
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

  if (!testResult) {
    el.remove();
  }

  return testResult;
}

/**
 * process the unwrap directive, leavving the attribute only if it resolves to true
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 * @returns {Promise<void>}
 */
async function resolveUnwrap(el, context) {
  if (!el.hasAttribute('data-fly-unwrap')) return;

  const unwrapExpression = el.getAttribute('data-fly-unwrap');
  if (unwrapExpression) {
    const unwrapVal = !!(await resolveExpression(unwrapExpression, context));

    if (!unwrapVal) {
      el.removeAttribute('data-fly-unwrap');
    }
  }
}

function processUnwraps(el) {
  el.querySelectorAll('[data-fly-unwrap]').forEach((unwrapEl) => {
    unwrapEl.before(...unwrapEl.childNodes);
    unwrapEl.remove();
  });
}

/**
 * process the content directive
 *
 * @param {Element} el the element to process
 * @param {Object} context the rendering context
 * @returns {Promise<Boolean>} if there was a content directive
 */
async function processContent(el, context) {
  if (!el.hasAttribute('data-fly-content')) return false;

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
 * @returns {Promise<Boolean>} if the node was repeated
 * the net number of nodes added/removed as a result of the repeat directive
 */
async function processRepeat(el, context) {
  const repeatAttrName = el.getAttributeNames().find((attrName) => attrName.startsWith('data-fly-repeat'));
  if (!repeatAttrName) return false;

  const nameParts = repeatAttrName.split('.');
  const contextName = nameParts[1] || 'item';

  const repeatExpression = el.getAttribute(repeatAttrName);
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
 * @returns {Promise<Boolean>} if there was a include directive
 */
async function processInclude(el, context) {
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

  // eslint-disable-next-line no-use-before-define
  await renderElement(el, includeContext);

  return true;
}

/**
 * recursively renders a dom node, processing all directives
 *
 * @param {Node} node the node to render
 * @param {Object} context the rendering context
 * @returns {Promise<void>} a promise that resolves when the node has been rendered
 */
async function processNode(node, context) {
  context.currentNode = node;
  let processChildren = [Node.ELEMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].includes(node.nodeType);
  if (node.nodeType === Node.ELEMENT_NODE) {
    const shouldRender = await processTest(node, context);
    if (!shouldRender) return;

    const repeated = await processRepeat(node, context);
    if (repeated) return;

    await processAttributes(node, context);

    processChildren = (await processContent(node, context))
      || (await processInclude(node, context)) || true;

    await resolveUnwrap(node, context);
  } else if (node.nodeType === Node.TEXT_NODE) {
    await processTextExpressions(node, context);
  }

  const children = !processChildren ? [] : [...node.childNodes];

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    // eslint-disable-next-line no-await-in-loop
    await processNode(child, context);
  }
}

/**
 * Render a template
 * @param {Element} template the template to render
 * @param {Object} context the rendering context
 */
async function renderTemplate(template, context) {
  const templateClone = template.cloneNode(true);
  await processNode(templateClone.content, context);

  processUnwraps(templateClone.content);

  return templateClone;
}

/**
 * transform the element, replacing it's children with the content from the template
 * @param {Element} el the element
 * @param {Element} template the template element
 * @param {Object} context the rendering context
 */
async function renderElementWithTemplate(el, template, context) {
  const rendered = await renderTemplate(template, context);
  el.replaceChildren(rendered.content);
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
  resolveUnwrap,
  processUnwraps,
};
