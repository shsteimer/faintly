import { createOptimizedPicture } from '../../scripts/aem.js';
import { renderBlock } from '../../../../src/faintly.js';

function transformCardColumn(context) {
  const col = context.item;

  const picture = col.querySelector('picture');

  if (picture && col.children.length === 1) col.className = 'cards-card-image';
  else col.className = 'cards-card-body';

  if (picture) {
    const img = picture.querySelector(':scope > img');
    picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  }

  return col;
}

export default async function decorate(block) {
  await renderBlock(block, {
    transformCardColumn,
  });
}
