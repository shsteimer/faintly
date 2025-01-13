import { createOptimizedPicture } from '../../scripts/aem.js';
import { renderBlock } from '../../../../src/faintly.js';

// non-faintly decorator
// used for perf comparison
export function decorateOld(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}

function transformCardColumn(context) {
  const col = context.card;

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
