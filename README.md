# Faintly

Faintly is an HTML templating library meant to be used with AEM Edge Delivery for rendering blocks. Its syntax is inspired by and may __faintly__ &#128579; resemble that of Sightly/HTL.

## Motivation (Why Does this Exist?)

I've always liked the developer ergonomics (autocomplete, etc.) and separation of concerns you get from keeping HTML in it's own file, distinct from js and css. For simple blocks with basic DOM transformations, doing things directly in block decoration functions works great, but as things get more complex, I find this gets harder to manage and maintain.

I've experimented with other existing libraries (ejs templates, etc.) but wanted something simple and purpose built.

## Getting Started

1. Copy the `/dist/faintly.js` and `/dist/faintly.security.js` files to the scripts directory of your project
2. In the folder for your block, add a `blockName.html` file for the block template
3. In your block javascript, call the `renderBlock` function:

```
import { renderBlock } from '../scripts/faintly.js';

export default async function decorate(block) {
  await renderBlock(block);
}
```

You can pre-populate the rendering context with data and functions as needed:

```
import { renderBlock } from '../scripts/faintly.js';

export default async function decorate(block) {
  await renderBlock(block, {
    someData: 'a string',
    someFunction: (context) => {
      // functions are passed a copy of the current rendering context
      // do whatever you need here to return data your template needs
      return 'some value';
    },
  });
}
```

See the test [Sample Blocks](test/fixtures/blocks) for a robust set of examples.

## Templates

Each template should be wrapped in a `template` tag. Templates can optionally be named by adding a `data-fly-name` attribute e.g. `<template data-fly-name="card"></template>`.

## Rendering Context

The rendering context is a javascript object used to provide data to the template and is also passed into functions to provide more dynamic data elements. It will always include the following elements:

* block - a reference to the block element
* currentNode - a reference to the current node/element being processed
* blockName - the block name
* template
   * path - the path to the template being rendered
   * name - the template name, if there is one
* security - security configuration (see Security section below)

When in a repeat loop, it will also include:

* item - the item currently being processed
* itemIndex - the 0-based index of the current item
* itemNumber - the 1-based index of the current item
* itemKey - the key for the item (useful when repeating over objects and not arrays)

 You can change the name of these by using the syntax `data-fly-repeat.name`. For example, if using `data-fly-repeat.card`, then the context will have `card`, `cardIndex`, `cardNumber`, and `cardKey`.

 Similarly, any named tests of the form `data-fly-test.name` will have their boolean result stored in the context using that name for future reference/re-use.

> [!NOTE]  
> Because element attributes are case-insensitive, context names are converted to lower case. e.g. `data-fly-test.myTest` will be set in the context as `mytest`.

## Security

Faintly includes built-in security features to help protect against XSS (Cross-Site Scripting) attacks. By default, security is **enabled** and provides:

* **Attribute sanitization** - Blocks dangerous attributes like event handlers (`onclick`, `onerror`, etc.) and `srcdoc`
* **URL scheme validation** - Restricts URLs in attributes like `href` and `src` to safe schemes (`http:`, `https:`, `mailto:`, `tel:`)
* **Same-origin enforcement** - Template includes are restricted to same-origin URLs only

### Default Security

When you call `renderBlock()` without a security context, default security is automatically applied:

```javascript
await renderBlock(block); // Default security enabled
```

The default security module (`dist/faintly.security.js`) is dynamically loaded on first use.

### Custom Security

For more control, you can provide a custom security object with `shouldAllowAttribute` and `allowIncludePath` hooks:

```javascript
await renderBlock(block, {
  security: {
    shouldAllowAttribute(attrName, value) {
      // Return true to allow the attribute, false to block it
      // Your custom logic here
      return true;
    },
    allowIncludePath(templatePath) {
      // Return true to allow the template include, false to block it
      // Your custom logic here
      return true;
    },
  },
});
```

You can also use the default security module and override specific configuration:

```javascript
import createSecurity from './scripts/faintly.security.js';

await renderBlock(block, {
  security: createSecurity({
    // Add 'data:' URLs to allowed schemes
    allowedUrlSchemes: ['http:', 'https:', 'mailto:', 'tel:', 'data:'],
    // Block additional attributes
    blockedAttributes: ['srcdoc', 'sandbox'],
  }),
});
```

### Security Configuration Options

The default security module accepts the following configuration:

* `blockedAttributePatterns` (Array<RegExp>) - Regex patterns for blocked attribute names (default: `/^on/i` blocks all event handlers)
* `blockedAttributes` (Array<string>) - Specific attribute names to block (default: `['srcdoc']`)
* `urlAttributes` (Array<string>) - Attributes that contain URLs to validate (default: `['href', 'src', 'action', 'formaction', 'xlink:href']`)
* `allowedUrlSchemes` (Array<string>) - Allowed URL schemes; relative URLs are always allowed (default: `['http:', 'https:', 'mailto:', 'tel:']`)


### Disabling Security (Unsafe Mode)

You can disable security if needed. **THIS IS NOT RECOMMENDED**


> [!CAUTION]  
> **THIS IS NOT RECOMMENDED**  and bypasses all XSS protection.

```javascript
await renderBlock(block, {
  security: false, // or 'unsafe'
});
```


### Trust Boundaries

It's important to understand what Faintly's security does and doesn't protect:

**Protected:**
- ✅ Dangerous attributes (event handlers, `srcdoc`)
- ✅ Malicious URL schemes (`javascript:`, `data:` by default)
- ✅ Cross-origin template includes

**Trusted (by design):**
- The rendering context you provide is fully trusted
- Templates fetched from your same-origin are trusted
- DOM Node objects provided in context are inserted directly

> [!WARNING]  
> **Be extremely careful when adding user-supplied data to the rendering context.** URL parameters, form inputs, cookies, and other user-controlled data should be validated and sanitized before adding to the context. The context is fully trusted, so untrusted data placed in it can bypass security protections.

> [!TIP]  
> Security works best in layers. Faintly's security helps prevent common XSS vectors, but you should also: validate and sanitize user input before adding it to context, use Content Security Policy headers, and follow secure coding practices.

## Directives

Faintly supports the following directives.

* `data-fly-test` - Conditionally include an element. Attribute value should be an expression that can be coerced to a Boolean, element is included only if the value is truthy.
* `data-fly-not` - Conditionally exclude an element. Attribute value should be an expression that can be coerced to a Boolean, element is included only if the value is falsy.
* `data-fly-repeat` - Repeat an element for each item of a collection. Attribute value should be an expression that resolves to a collection of Nodes/Elements.
* `data-fly-attributes` - Set attributes on the element. Attribute value should be an expression that resolves to a collection of key/value pairs.
* `data-fly-content` - Replace the elements content/children. Attribute value should be an expression that resolves to a Node/Element/String, or a collection there-of.
  * Content has precedence over include: if both `data-fly-content` and `data-fly-include` are present on the same element, only content is executed.
* `data-fly-include` - Replace the elements content/children with another template. Attribute value can be:
   * the name of a template: `data-fly-include="a-template-name"`
   * the absolute path to a template file: `data-fly-include="/blocks/some-block/some-template.html"`
   * both: `data-fly-include="/blocks/some-block/some-template.html#a-template-name"`
* `data-fly-unwrap` - Remove an element but keep it's child nodes. Set the attribute value to an expression that can be coerced to a Boolean to make the unwrap conditional.

> [!IMPORTANT]  
> Directives are evaluated in a fixed order, as listed above, regardless of the order you place them on the element.
> 
> This means, for example, that the context item set in `data-fly-repeat` can be used in `data-fly-include` on the same element, but not in a `data-fly-test`.
> 
> When `data-fly-include` runs, the included template is fully rendered before being inserted and the element's children are not traversed again. This prevents double-processing. Conversely, when `data-fly-content` runs, the injected nodes are traversed so that any directives/expressions inside them are processed.

## Expressions

Faintly supports a simple expression syntax for resolving data from the rendering context. It supports only object dot-notation, but will call (optionally async) functions as well. This means that if you need to do something that can't be expressed in dot-notation, then you need to define a custom function for it, and add that function to the rendering context.

**In `data-fly-*` directive attributes:**
- Both bare expressions and `${}` wrapped expressions are supported
- `data-fly-test="condition"` and `data-fly-test="${condition}"` both work
- The `${}` syntax is supported for familiarity with HTL/Sightly

**In `data-fly-include`, HTML text, and normal attributes:**
- You must wrap your expression in `${}`
- Example: `<div class="${className}">`, `<p>Hello ${user.name}</p>`

**Escaping:**
- Use a leading backslash to prevent evaluation of an expression in text/attributes
- Example: `\${some.value}` will remain literal `${some.value}`
