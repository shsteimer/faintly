const dp = new DOMParser();

/**
 * resolve the template to render
 *
 * @param {object} context the rendering context
 * @returns {Promise<Element>} the template element
 */
export default async function resolveTemplate(context) {
  context.template = context.template || {};
  context.template.path = context.template.path || `${context.codeBasePath}/blocks/${context.blockName}/${context.blockName}.html`;

  const templateId = `faintly-template-${context.template.path}#${context.template.name || ''}`.toLowerCase().replace(/[^0-9a-z]/gi, '-');
  let template = document.getElementById(templateId);
  if (!template) {
    const resp = await fetch(context.template.path);
    if (!resp.ok) throw new Error(`Failed to fetch template from ${context.template.path} for block ${context.blockName}.`);

    const markup = await resp.text();

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
