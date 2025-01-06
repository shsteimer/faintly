# Faintly

Faintly is an HTML templating library meant to be used with AEM Edge Delivery for rendering blocks. Its syntax is inspired by and may __faintly__ resemble that of Sightly/HTL.

## Motivation (Why Does this Exist?)

I've always liked the developer ergonoamics (autocomplete, etc.) and separation of concerns you get from keeping html in it's own file, away from js and css. For simple blocks with basic DOM transformations, doing things right in block js is fine, but as things get more complex, this gets harder to manage and maintain, IMHO.

I've experimented with other existing libraries (ejs templates, etc.) but wanted something simple and purpose built.


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

## Directives

Faintly supports the following directives.

### `data-fly-repeat` - repeat an element over the items of a collection

### `data-fly-test` - conditionally include an element

### `data-fly-unwrap` - remove an element but keep it's child nodes

### `data-fly-content` - replace the elements content/children

### `data-fly-include` - replace the elements content/children with another template

### `data-fly-attributes` - set attributes on the element

## Expressions

For repeat, test, content, and attributes, as well as within text nodes and attribute values, faintly supports a simple expression syntax for resolving data from the rendering context.