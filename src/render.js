import resolveTemplate from './templates.js';
import { processTextExpressions } from './expressions.js';
// eslint-disable-next-line import/no-cycle
import {
  processAttributes,
  processContent,
  processInclude,
  processRepeat,
  processTest,
  processUnwraps,
  resolveUnwrap,
} from './directives.js';

/**
 * recursively renders a dom node, processing all directives
 *
 * @param {Node} node the node to render
 * @param {Object} context the rendering context
 * @returns {Promise<void>} a promise that resolves when the node has been rendered
 */
export async function processNode(node, context) {
  context.currentNode = node;
  let processChildren = [Node.ELEMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].includes(node.nodeType);
  if (node.nodeType === Node.ELEMENT_NODE) {
    const shouldRender = await processTest(node, context);
    if (!shouldRender) return;

    const repeated = await processRepeat(node, context);
    if (repeated) return;

    await processAttributes(node, context);

    // Determine child processing based on content/include directives:
    // 1) If content ran, skip include and still process children
    // 2) If content did not run but include did, skip processing children (already rendered)
    // 3) If neither ran, process children
    const hadContent = await processContent(node, context);
    const hadInclude = hadContent ? false : await processInclude(node, context);
    processChildren = !hadInclude;

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
export async function renderTemplate(template, context) {
  const templateClone = template.cloneNode(true);
  await processNode(templateClone.content, context);

  processUnwraps(templateClone.content);

  return templateClone;
}

/**
 * Initialize security for the rendering context
 * @param {Object} context the rendering context
 * @returns {Promise<Object>} security hooks
 */
export async function initializeSecurity(context) {
  const { security } = context;

  // unsafe mode
  if (security === false || security === 'unsafe') {
    return {
      shouldAllowAttribute: (() => true),
      allowIncludePath: (() => true),
    };
  }

  // default mode
  if (!security) {
    const securityMod = await import('./faintly.security.js');
    if (securityMod && securityMod.default) {
      return securityMod.default();
    }
  }

  // custom mode, ensure needed functions are present, use no-ops for missing ones
  return {
    shouldAllowAttribute: security.shouldAllowAttribute || (() => true),
    allowIncludePath: security.allowIncludePath || (() => true),
  };
}

/**
 * transform the element, replacing it's children with the content from the template
 * @param {Element} el the element
 * @param {Element} template the template element
 * @param {Object} context the rendering context
 */
export async function renderElementWithTemplate(el, template, context) {
  const rendered = await renderTemplate(template, context);
  el.replaceChildren(rendered.content);
}

/**
 * Transform an element using an HTML template
 *
 * @param {Element} el the element to render
 * @param {Object} context the rendering context
 */
export async function renderElement(el, context) {
  context.security = await initializeSecurity(context);

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
