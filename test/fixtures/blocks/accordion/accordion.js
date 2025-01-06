import { renderBlock } from '../../../../src/faintly.js';

export default async function decorate(block) {
  await renderBlock(block, {
    getLabel: ({ item }) => item.items[0].childNodes,
    getBody: ({ item }) => item.items[1].childNodes,
  });

  // [...block.children].forEach((row) => {
  //   // decorate accordion item label
  //   const label = row.children[0];
  //   const summary = document.createElement('summary');
  //   summary.className = 'accordion-item-label';
  //   summary.append(...label.childNodes);
  //   // decorate accordion item body
  //   const body = row.children[1];
  //   body.className = 'accordion-item-body';
  //   // decorate accordion item
  //   const details = document.createElement('details');
  //   details.className = 'accordion-item';
  //   details.append(summary, body);
  //   row.replaceWith(details);
  // });
}
