// src/faintly.security.js
var DEFAULT_CONFIG = {
  // Attribute security
  blockedAttributePatterns: [/^on/i],
  // Block event handlers (onclick, onload, etc.)
  blockedAttributes: ["srcdoc"],
  // Block dangerous attributes
  // URL attribute security
  urlAttributes: ["href", "src", "action", "formaction", "xlink:href"],
  allowedUrlSchemes: ["http:", "https:", "mailto:", "tel:"],
  // Include path security
  includeBasePath: null
};
function isBlockedAttribute(attrName, blockedAttributePatterns, blockedAttributes) {
  const name = attrName.toLowerCase();
  return blockedAttributes.includes(name) || blockedAttributePatterns.some((pattern) => pattern.test(name));
}
function extractUrlScheme(value) {
  const v = value.trim();
  if (!v) return window.location.protocol;
  const colonIndex = v.indexOf(":");
  const slashIndex = v.indexOf("/");
  if (colonIndex === -1 || slashIndex !== -1 && colonIndex > slashIndex) {
    return window.location.protocol;
  }
  const url = new URL(v, window.location.origin);
  return url.protocol;
}
function isUrlAttribute(attrName, urlAttributes) {
  return urlAttributes.includes(attrName.toLowerCase());
}
function createSecurity(config = {}) {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  const {
    blockedAttributePatterns,
    blockedAttributes,
    urlAttributes,
    allowedUrlSchemes
  } = mergedConfig;
  return {
    shouldAllowAttribute(attrName, value) {
      if (isBlockedAttribute(attrName, blockedAttributePatterns, blockedAttributes)) {
        return false;
      }
      if (isUrlAttribute(attrName, urlAttributes)) {
        const scheme = extractUrlScheme(value);
        return allowedUrlSchemes.includes(scheme);
      }
      return true;
    },
    allowIncludePath() {
      return true;
    }
  };
}
export {
  DEFAULT_CONFIG,
  createSecurity as default
};
