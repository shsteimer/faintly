import { renderBlock } from '../../../../src/render.js';

export default async function decorate(block) {
  await renderBlock(block);
}
