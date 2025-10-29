// src/faintly.security.js
var DEFAULT_SECURITY = {
  blockedAttributePattern: /^on/i,
  blockedAttributes: /* @__PURE__ */ new Set(["srcdoc"]),
  allowedUrlSchemes: /* @__PURE__ */ new Set(["http:", "https:", "mailto:", "tel:", ""]),
  includeBasePath: void 0
};
function createSecurity(options = {}) {
  const blockedAttributePattern = options.blockedAttributePattern || DEFAULT_SECURITY.blockedAttributePattern;
  const blockedAttributes = new Set(DEFAULT_SECURITY.blockedAttributes);
  if (options.blockedAttributes) {
    Array.from(options.blockedAttributes).forEach((a) => blockedAttributes.add(String(a).toLowerCase()));
  }
  const allowedUrlSchemes = new Set(
    options.allowedUrlSchemes ? Array.from(options.allowedUrlSchemes) : Array.from(DEFAULT_SECURITY.allowedUrlSchemes)
  );
  const { includeBasePath } = options;
  function isBlockedAttributeName(attrName) {
    const name = String(attrName || "").toLowerCase();
    return blockedAttributePattern.test(name) || blockedAttributes.has(name);
  }
  function extractUrlScheme(value) {
    const v = String(value || "").trim();
    if (!v) return "";
    if (v.startsWith("#") || v.startsWith("/") || v.startsWith("./") || v.startsWith("../") || v.startsWith("?")) return "";
    const idx = v.indexOf(":");
    if (idx > -1 && idx < v.indexOf("/") || idx > -1 && v.indexOf("/") === -1) {
      return `${v.slice(0, idx + 1).toLowerCase()}`;
    }
    return "";
  }
  function isUrlAttribute(attrName) {
    const urlAttrs = /* @__PURE__ */ new Set([
      "href",
      "src",
      "action",
      "formaction",
      "xlink:href"
    ]);
    return urlAttrs.has(String(attrName || "").toLowerCase());
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
    let basePrefix = includeBasePath;
    if (!basePrefix) {
      if (context.codeBasePath) {
        basePrefix = `${context.codeBasePath}/blocks/`;
      } else {
        const current = context.template && context.template.path || "";
        const marker = "/blocks/";
        const idx = current.indexOf(marker);
        basePrefix = idx >= 0 ? current.slice(0, idx + marker.length) : "/";
      }
    }
    const includeUrl = new URL(templatePath, window.location.origin);
    const sameOrigin = includeUrl.origin === window.location.origin;
    const withinBase = includeUrl.pathname.startsWith(basePrefix || "/");
    return sameOrigin && withinBase;
  }
  return {
    blockedAttributePattern,
    blockedAttributes,
    allowedUrlSchemes,
    includeBasePath,
    shouldAllowAttribute,
    allowIncludePath
  };
}
export {
  DEFAULT_SECURITY,
  createSecurity as default
};
