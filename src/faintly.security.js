/**
 * Default security configuration.
 * Users can see and override these defaults by passing custom values to createSecurity().
 */
export const DEFAULT_CONFIG = {
  blockedAttributePatterns: [/^on/i],
  blockedAttributes: ['srcdoc'],
  urlAttributes: ['href', 'src', 'action', 'formaction', 'xlink:href'],
  allowedUrlSchemes: ['http:', 'https:', 'mailto:', 'tel:'],
  includeBasePath: null,
};

/**
 * Check if an attribute name is blocked by pattern or specific name
 * @param {string} attrName The attribute name to check
 * @param {Array<RegExp>} blockedAttributePatterns Regex patterns to test against
 * @param {Array<string>} blockedAttributes Specific attribute names to block
 * @returns {boolean} True if the attribute is blocked
 */
function isBlockedAttribute(attrName, blockedAttributePatterns, blockedAttributes) {
  const name = attrName.toLowerCase();

  return blockedAttributes.includes(name)
    || blockedAttributePatterns.some((pattern) => pattern.test(name));
}

/**
 * Extract URL scheme from a value
 * @param {string} value The URL value to parse
 * @returns {string} The URL scheme (e.g., 'http:', 'javascript:').
 *                   Relative URLs return the current page's protocol.
 */
function extractUrlScheme(value) {
  const v = value.trim();
  if (!v) return window.location.protocol;

  const colonIndex = v.indexOf(':');
  const slashIndex = v.indexOf('/');

  // No colon, or colon after slash = relative URL (use current protocol)
  if (colonIndex === -1 || (slashIndex !== -1 && colonIndex > slashIndex)) {
    return window.location.protocol;
  }

  const url = new URL(v, window.location.origin);
  return url.protocol;
}

/**
 * Check if an attribute is a URL attribute
 * @param {string} attrName The attribute name to check
 * @param {Array<string>} urlAttributes List of attributes that contain URLs
 * @returns {boolean} True if the attribute is a URL attribute
 */
function isUrlAttribute(attrName, urlAttributes) {
  return urlAttributes.includes(attrName.toLowerCase());
}

/**
 * Create a security policy for Faintly.
 * Pass custom configuration to override defaults.
 *
 * @param {Object} [config] Custom security configuration
 * @param {Array<RegExp>} [config.blockedAttributePatterns]
 *   Regex patterns for blocked attribute names
 * @param {Array<string>} [config.blockedAttributes]
 *   Array of specific attribute names to block
 * @param {Array<string>} [config.urlAttributes]
 *   Attributes to check for URL scheme validation
 * @param {Array<string>} [config.allowedUrlSchemes]
 *   Array of allowed URL schemes (e.g., ['http:', 'https:']).
 *   Relative URLs are always allowed.
 * @param {string|Function} [config.includeBasePath]
 *   Base path for allowed includes
 * @returns {Object} Security hooks
 */
export default function createSecurity(config = {}) {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const {
    blockedAttributePatterns,
    blockedAttributes,
    urlAttributes,
    allowedUrlSchemes,
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
      // TODO: Implement include path restriction logic
      return true;
    },
  };
}
