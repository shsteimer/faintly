# Faintly

Faintly is an HTML templating library meant to be used with AEM Edge Delivery for rendering blocks. Its syntax is inspired by and may __faintly__ &#128579; resemble that of Sightly/HTL.

## Motivation (Why Does this Exist?)

I've always liked the developer ergonomics (autocomplete, etc.) and separation of concerns you get from keeping HTML in it's own file, distinct from js and css. For simple blocks with basic DOM transformations, doing things directly in block decoration functions works great, but as things get more complex, I find this gets harder to manage and maintain.

I've experimented with other existing libraries (ejs templates, etc.) but wanted something simple and purpose built.

## Getting Started

1. copy the /dist/faintly.js file to the scripts directory of your project
2. in the folder for your block, add a `blockName.html` file for the block template
3. in your block javascript, call the `renderBlock` function:

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
* `data-fly-include` - Replace the elements content/children with another template. Attribute value can be:
   * the name of a template: `data-fly-include="a-template-name"`
   * the absolute path to a template file: `data-fly-include="/blocks/some-block/some-template.html"`
   * both: `data-fly-include="/blocks/some-block/some-template.html#a-template-name"`
* `data-fly-unwrap` - Remove an element but keep it's child nodes. Set the attribute value to an expression that can be coerced to a Boolean to make the unwrap conditional.

> [!IMPORTANT]  
> Directives are evaluated in a fixed order, as listed above, regardless of the order you place them on the element.
> 
> This means, for example, that the context item set in `data-fly-repeat` can be used in `data-fly-include` on the same element, but not in a `data-fly-test`.

## Expressions

Faintly supports a simple expression syntax for resolving data from the rendering context. It supports only object dot-notation, but will call (optionally async) functions as well. This means that if you need to do something that can't be expressed in dot-notation, then you need to define a custom function for it, and add that function to the rendering context.

For `data-fly-include`, HTML text, and normal attributes, wrap your expression in `${}`. 

In all other `data-fly-*` attributes, just set the expression directly as the attribute value, no wrapping needed.