# Faintly

Faintly is an HTML templating library meant to be used with AEM Edge Delivery for rendering blocks. Its syntax is inspired by and may __faintly__ &#128579; resemble that of Sightly/HTL.

## Motivation (Why Does this Exist?)

I've always liked the developer ergonomics (autocomplete, etc.) and separation of concerns you get from keeping HTML in it's own file, distinct from js and css. For simple blocks with basic DOM transformations, doing things directly in block decoration functions works great, but as things get more complex, I find this gets harder to manage and maintain.

I've experimented with other existing libraries (ejs templates, etc.) but wanted something simple and purpose built.

## Migrating from HTL/Sightly?

If you're coming from Adobe Experience Manager's HTL (HTML Template Language), check out **[HTL Migration Guide](./docs/HTL_MIGRATION.md)** for side-by-side comparisons.

## Getting Started

1. Copy the `/dist/faintly.js` and `/dist/faintly.security.js` files to the scripts directory of your project
2. In the folder for your block, add a `blockName.html` file for the block template
3. In your block javascript, call the `renderBlock` function:

```javascript
import { renderBlock } from '../scripts/faintly.js';

export default async function decorate(block) {
  await renderBlock(block);
}
```

You can pre-populate the rendering context with data and functions as needed:

```javascript
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

**In `data-fly-include`, HTML text, and normal attributes:**
- You must wrap your expression in `${}`
- Example: `<div class="${className}">`, `<p>Hello ${user.name}</p>`

**Escaping:**
- Use a leading backslash to prevent evaluation of an expression in text/attributes
- Example: `\${some.value}` will remain literal `${some.value}`

### JavaScript Expression Evaluation with `utils:eval()`

> [!CAUTION]
> **⚠️ This feature uses JavaScript's `Function` constructor (similar to `eval`)**
>
> - Will be blocked by Content Security Policy unless it allows `'unsafe-eval'`
> - **Has full access to context AND browser globals** (`window`, `document`, etc.)
> - An attacker with control over context data could craft expressions like `utils:eval(window.location='https://evil.com')` or `utils:eval(document.cookie)`
> - **Never put untrusted user input in the context** when using `utils:eval()`
>
> Use `utils:eval()` thoughtfully. For complex logic, context functions are safer and more maintainable.

When a small bits of logic are required, you can use `utils:eval()` to evaluate JavaScript expressions. Some examples:

```html
<!-- Comparisons -->
<div data-fly-test="utils:eval(count > 5)">More than 5</div>
<div data-fly-test="utils:eval(status === 'active')">Active</div>

<!-- Logical operators -->
<div data-fly-test="utils:eval(isAdmin || isModerator)">Admin or mod</div>
<div data-fly-test="utils:eval(isValid && isActive)">Valid and active</div>

<!-- Ternary operator -->
<div>${utils:eval(showCount ? count : 'N/A')}</div>
<div class="${utils:eval(isActive ? 'active' : 'inactive')}">Status</div>

<!-- Method calls with arguments -->
<div>${utils:eval(items.join(', '))}</div>
<div>${utils:eval(name.substring(0, 10))}</div>

<!-- String concatenation -->
<div>${utils:eval('Hello, ' + user.name)}</div>

<!-- Arithmetic -->
<div>${utils:eval(price * quantity)}</div>

<!-- Complex expressions -->
<div data-fly-test="utils:eval((count > 5 && !isDisabled) || isAdmin)">Complex logic</div>
```

**What works WITHOUT `utils:eval()`:**

```html
<!-- Simple property paths -->
<div>${user.name}</div>
<div>${user.profile.email}</div>

<!-- Array length -->
<div>${items.length}</div>

<!-- Array access by numeric index using dot notation -->
<div>${items.0}</div>
<div>${items.1}</div>

<!-- Function calls without arguments (auto-called by Faintly) -->
<div>${user.getName}</div>
<div>${text.trim}</div>
```

**When to Use `utils:eval()` vs Context Functions:**

- **Use context functions** for complex logic, API calls, or data transformations
- **Use `utils:eval()`** for simple comparisons, formatting, or inline expressions
- Context functions are generally safer and more maintainable for complex operations

> [!NOTE]
> While processing text nodes, expression parsing stops at the first closing `}`. `utils:eval()` expressions that include additional braces—such as template literals (`` `Hello ${user.name}` ``) will not be parsed correctly.

> [!TIP]
> Prefer direct expressions for string interpolation: `<div>Hello ${user.name}</div>`.

## Security

Faintly includes built-in XSS protections with sensible defaults that are automatically enabled

**What's protected:**
- ✅ Dangerous attributes (event handlers like `onclick`, `onerror`, etc.)
- ✅ Malicious URL schemes (`javascript:`, `data:`, `vbscript:`, `file:`)
- ✅ Cross-origin template includes
- ✅ HTML strings treated as plain text (not parsed as HTML)

**What's NOT protected (by design):**
- ⚠️ **Context data** - The rendering context is fully trusted
- ⚠️ **Pre-built DOM elements** - Elements passed through context are inserted as-is
- ⚠️ **Templates/HTML** - Templates are trusted. Never allow user input in templates, innerHTML, or setAttribute - expressions like `${...}` will be evaluated
- ⚠️ **`utils:eval()` expressions** - JavaScript evaluation could allow for arbitrary code execution, use carefully.

For detailed information about the security model, configuration options, custom security hooks, and best practices, see **[Security Documentation](./docs/SECURITY.md)**.