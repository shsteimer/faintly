# Faintly

Faintly is an HTML templating library meant to be used with AEM Edge Delivery for rendering blocks. Its syntax is inspired by and may __faintly__ &#128579; resemble that of Sightly/HTL.

## Motivation (Why Does this Exist?)

I've always liked the developer ergonomics (autocomplete, etc.) and separation of concerns you get from keeping HTML in it's own file, distinct from js and css. For simple blocks with basic DOM transformations, doing things directly in block decoration functions works great, but as things get more complex, I find this gets harder to manage and maintain.

I've experimented with other existing libraries (ejs templates, etc.) but wanted something simple and purpose built, so I just decided to build it myself.


## Getting Started

1. copy the faintly.js file to the scripts directory of your project
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

See the [sample-block](test/sample-blocks/) tests for a robust set of examples.

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

 You can change the name of these by using the syntax `data-fly-repeat.name`. For example, if using `data-fly-repeat.card`, then the context will have `card`, `cardIndex`, and `cardNumber`.

 Similarly, any named tests of the form `data-fly-test.name` will have their boolean result stored in the context for future reference/re-use.

## Directives

Faintly supports the following directives.

* `data-fly-repeat` - repeat an element for each item of a collection

* `data-fly-test` - conditionally include an element

* `data-fly-unwrap` - remove an element but keep it's child nodes

* `data-fly-content` - replace the elements content/children

* `data-fly-include` - replace the elements content/children with another template

* `data-fly-attributes` - set attributes on the element

## Expressions

For repeat, test, content, and attributes, as well as within text nodes and attribute values, faintly supports a simple expression syntax for resolving data from the rendering context. It supports only object dot-notation, but will call (optionally async) functions as well.