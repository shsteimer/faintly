import { renderBlock } from '../../../../src/index.js';

export default async function decorate(block) {
  await renderBlock(block);
}
