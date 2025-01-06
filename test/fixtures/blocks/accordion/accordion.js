import { renderBlock } from '../../../../src/faintly.js';

export default async function decorate(block) {
  await renderBlock(block, {
    getLabel: ({ item }) => item.items[0].childNodes,
    getBody: ({ item }) => item.items[1].childNodes,
  });
}
