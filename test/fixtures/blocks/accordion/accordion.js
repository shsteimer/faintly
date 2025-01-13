import { renderBlock } from '../../../../src/faintly.js';

export default async function decorate(block) {
  await renderBlock(block);
}
