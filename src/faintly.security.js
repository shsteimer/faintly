/* eslint-disable no-template-curly-in-string */
/**
 * Default security configuration.
 * Adjust these defaults by passing overrides to `createSecurity(options)`.
 */
export const DEFAULT_SECURITY = {
  blockedAttributePatterns: ['^on/i'],
  blockedAttributes: ['srcdoc'],
  allowedUrlSchemes: ['http:', 'https:', 'mailto:', 'tel:', ''],
  includeBasePath: '${codeBasePath}',
};

/**
 * Create a security policy for Faintly. Attach the returned hooks to `context.security`.
 *
 * @param {Object} [options]
 * @param {RegExp} [options.blockedAttributePattern] regex for blocked attribute names
 * @param {Set<string>} [options.blockedAttributes] extra blocked attribute names
 * @param {Set<string>} [options.allowedUrlSchemes] allowed URL schemes for URL attrs
 * @param {string} [options.includeBasePath] base path prefix for allowed includes
 */
export default function createSecurity(options = DEFAULT_SECURITY) {
  const {
    blockedAttributePattern, blockedAttributes, allowedUrlSchemes, includeBasePath,
  } = options;

  function resolveIncludeBase(base, context) {
    if (!base) return '';
    if (typeof base === 'function') return String(base(context) || '');
    let tpl = String(base);
    tpl = tpl.replaceAll('${codeBasePath}', String(context.codeBasePath || ''));
    return tpl;
  }

  function isBlockedAttributeName(attrName) {
    const name = String(attrName || '').toLowerCase();
    return blockedAttributePattern.test(name) || blockedAttributes.has(name);
  }

  function extractUrlScheme(value) {
    const v = String(value || '').trim();
    if (!v) return '';
    if (
      v.startsWith('#') || v.startsWith('/')
      || v.startsWith('./') || v.startsWith('../') || v.startsWith('?')
    ) return '';
    const idx = v.indexOf(':');
    if ((idx > -1 && idx < v.indexOf('/')) || (idx > -1 && (v.indexOf('/') === -1))) {
      return `${v.slice(0, idx + 1).toLowerCase()}`;
    }
    return '';
  }

  function isUrlAttribute(attrName) {
    const urlAttrs = new Set([
      'href', 'src', 'action', 'formaction', 'xlink:href',
    ]);
    return urlAttrs.has(String(attrName || '').toLowerCase());
  }

  function shouldAllowAttribute(attrName, value) {
    if (isBlockedAttributeName(attrName)) return false;
    if (isUrlAttribute(attrName)) {
      const scheme = extractUrlScheme(value);
      return allowedUrlSchemes.has(scheme);
    }
    return true;
  }

  function allowIncludePath(templatePath, context) {
    if (!templatePath) return true;

    let basePrefix = resolveIncludeBase(
      includeBasePath || DEFAULT_SECURITY.includeBasePath,
      context,
    );
    if (!basePrefix) {
      if (context.codeBasePath) {
        basePrefix = String(context.codeBasePath);
      } else {
        const current = (context.template && context.template.path) || '';
        const lastSlash = current.lastIndexOf('/');
        basePrefix = lastSlash >= 0 ? current.slice(0, lastSlash + 1) : '/';
      }
    }

    if (!basePrefix.endsWith('/')) basePrefix = `${basePrefix}/`;

    const includeUrl = new URL(templatePath, window.location.origin);
    const sameOrigin = includeUrl.origin === window.location.origin;
    const withinBase = includeUrl.pathname.startsWith(basePrefix || '/');
    return sameOrigin && withinBase;
  }

  return {
    blockedAttributePattern,
    blockedAttributes,
    allowedUrlSchemes,
    includeBasePath,
    shouldAllowAttribute,
    allowIncludePath,
  };
}
