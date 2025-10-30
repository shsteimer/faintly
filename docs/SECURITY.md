# Security

Faintly includes built-in security features to help protect against XSS (Cross-Site Scripting) attacks. This document provides detailed information about the security model, configuration options, and best practices.

## Table of Contents

- [Quick Start](#quick-start)
- [Security Model](#security-model)
- [Default Security](#default-security)
- [Configuration](#configuration)
- [Custom Security Hooks](#custom-security-hooks)
- [Best Practices](#best-practices)
- [Disabling Security (Not Recommended)](#disabling-security-not-recommended)

## Quick Start

Default security is **enabled by default**, without any configuration:

```javascript
import { renderBlock } from './scripts/faintly.js';

export default async function decorate(block) {
  await renderBlock(block); // Security automatically enabled
}
```

The default security module (`dist/faintly.security.js`) is dynamically loaded on first use. Keep reading for what is and is not protected.

### Security Modes

Faintly supports three security modes:

| Mode | Description | Use Case | Documentation |
|------|-------------|----------|---------------|
| **Default** (Recommended) | Built-in XSS protection with sensible defaults | Most applications | [Default Security](#default-security) |
| **Custom** | Override defaults or provide custom security hooks | Fine-grained control or specific requirements | [Configuration](#configuration), [Custom Security Hooks](#custom-security-hooks) |
| **Unsafe** (Not Recommended) | Security disabled | Fully trusted environments only | [Disabling Security](#disabling-security-not-recommended) |

## Security Model

Faintly's security model is built on clear **trust boundaries**:

### What Gets Sanitized ✅

Security checks are applied to:
- **Attribute names and values** set via `data-fly-attributes`
- **URL schemes** in href, src, action, formaction, and xlink:href attributes
- **Expression values** after resolution (e.g., `${userInput}`)
- **Template include paths** (same-origin enforcement)

### What Is Trusted (By Design) ⚠️

The following are considered **trusted** and NOT sanitized:
- **Context objects** you provide to `renderBlock()`
- **DOM elements** passed through context
- **Templates** from your same-origin server
- **JavaScript functions** in your context

> [!WARNING]
> **The rendering context is fully trusted.** If you add user-supplied data (URL parameters, form inputs, cookies, etc.) to the context, you must validate and sanitize it first. Untrusted data in the context can bypass security protections.

### String Content Handling

HTML strings are always treated as plain text and set via `textContent`, not `innerHTML`. This prevents XSS from string injection.

```javascript
// Strings via data-fly-content are treated as PLAIN TEXT (safe)
context.content = '<script>alert("XSS")</script>';
// Result: displays the literal text, script does NOT execute

// DOM elements via data-fly-content are inserted AS-IS (trusted)
const script = document.createElement('script');
script.textContent = 'alert("XSS")';
context.content = script;
// Result: script element is inserted (though inline scripts won't execute via DOM manipulation)
```

## Default Security

The default security configuration provides:

### 1. Blocked Attributes

**Event Handlers** - All attributes matching `/^on/i` pattern:
- `onclick`, `onerror`, `onload`, `onmouseover`, `onmouseout`
- `onkeydown`, `onkeyup`, `onkeypress`, `onfocus`, `onblur`
- `onsubmit`, `onchange`, `onresize`, `onscroll`
- And all other `on*` event handlers (case-insensitive)

**Dangerous Attributes**:
- `srcdoc` - Can execute arbitrary HTML/scripts in iframes

### 2. URL Scheme Validation

URLs in the following attributes are validated:
- `href`, `src`, `action`, `formaction`, `xlink:href`

**Allowed schemes by default**:
- `http:`
- `https:`
- `mailto:`
- `tel:`
- Relative URLs (always allowed: `/path`, `./path`, `../path`, `#hash`, `?query`)

**Blocked schemes**:
- `javascript:` - Direct code execution
- `data:` - Can contain executable content (blocked by default)
- `vbscript:` - VBScript execution
- `file:` - Local file access
- Any other non-allowlisted scheme

### 3. Template Include Restrictions

Template includes via `data-fly-include` are restricted to:
- Same-origin URLs only
- Relative paths (e.g., `/blocks/card/card.html`)
- Full URLs matching `window.location.origin`

Cross-origin template loading is blocked by default.

## Configuration

You can customize the default security by passing configuration options:

```javascript
import createSecurity from './scripts/faintly.security.js';

await renderBlock(block, {
  security: createSecurity({
    // Customize one or more options
  }),
});
```

### Configuration Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `blockedAttributePatterns`<br/>(Array&lt;RegExp&gt;) | Regex patterns for attribute names to block | `[/^on/i]`<br/>(blocks all event handlers) | `[/^data-/i]`<br/>(block data- attributes) |
| `blockedAttributes`<br/>(Array&lt;string&gt;) | Specific attribute names to block (case-insensitive) | `['srcdoc']` | `['srcdoc', 'sandbox', 'allow']`<br/>(block additional attributes) |
| `urlAttributes`<br/>(Array&lt;string&gt;) | Attributes that should have URL scheme validation applied | `['href', 'src', 'action', 'formaction', 'xlink:href']` | `['href']`<br/>(only validate href) |
| `allowedUrlSchemes`<br/>(Array&lt;string&gt;) | URL schemes that are allowed. Relative URLs are always allowed. | `['http:', 'https:', 'mailto:', 'tel:']` | `['http:', 'https:', 'mailto:', 'tel:', 'data:']`<br/>(allow data URIs) |

## Custom Security Hooks

For complete control, provide your own security implementation with `shouldAllowAttribute` and `allowIncludePath` hooks:

```javascript
await renderBlock(block, {
  security: {
    shouldAllowAttribute(attrName, value) {
      // Return true to allow, false to block
      // Your custom logic here
      
      // Example: Block all data- attributes
      if (attrName.toLowerCase().startsWith('data-')) {
        return false;
      }
      
      // Example: Block specific values
      if (value && value.includes('unsafe-content')) {
        return false;
      }
      
      return true;
    },
    
    allowIncludePath(templatePath) {
      // Return true to allow, false to block
      // Your custom logic here
      
      // Example: Only allow specific directories
      return templatePath.startsWith('/blocks/') 
          || templatePath.startsWith('/templates/');
    },
  },
});
```

## Best Practices

Always sanitize user input before adding it to the context. **Adding any user-input to context to be used by faintly without first validating and sanitizing is inherently UNSAFE.**

> [!DANGER]
> **Never allow user input to become part of templates/HTML.** User input must ONLY go into the context, never into template strings, innerHTML, or attribute values that will be rendered. If users can control template content, they can inject expressions like `${utils:eval(...)}` to execute arbitrary code.

**Guidelines:**
- **Validate all user input** - URL parameters, form data, cookies, localStorage
- **NEVER put user input in templates/HTML** - User input goes in context only. Never: `innerHTML = userInput`, `setAttribute('title', userInput)`, or template files with user content
- **Use strings for user content** - Not DOM elements (strings are treated as plain text)
- **Avoid `utils:eval()` with untrusted data** - It uses JavaScript's `Function` constructor with `with()` statement, requires `unsafe-eval` CSP, and **has full access to context AND browser globals** (`window`, `document`, etc.). An attacker could craft expressions like `utils:eval(window.location='https://evil.com')` or `utils:eval(document.cookie)`. Prefer context functions for complex logic.
- **Layer your defenses** - Use CSP headers, input validation, and Faintly's security
- **Audit context sources** - Know what data goes into your context and where it comes from
- **Be careful with data URIs** - If enabling them, validate thoroughly or restrict to known-safe values

## Disabling Security (Not Recommended)

> [!CAUTION]
> **Disabling security bypasses all XSS protection and is strongly discouraged.**

If you absolutely must disable security:

```javascript
await renderBlock(block, {
  security: false, // or 'unsafe'
});
```

This allows:
- All event handler attributes
- All URL schemes (including `javascript:`, `data:`, `file:`)
- Cross-origin template includes
- Any attribute to be set

**Only disable security if:**
- You are absolutely certain all context data is safe
- Your application has other layers of XSS protection
- You understand and accept the security risks

---

For questions or security concerns, please open an issue on the [GitHub repository](https://github.com/adobe/faintly).

