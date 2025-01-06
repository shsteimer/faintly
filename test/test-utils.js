// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from '@esm-bundle/chai';

function cleanDom(node) {
  node.normalize();
  for (let n = 0; n < node.childNodes.length; n += 1) {
    const child = node.childNodes[n];
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
      n -= 1;
    } else if (child.nodeType === Node.TEXT_NODE) {
      if (!/\S/.test(child.nodeValue)) {
        // only white space
        node.removeChild(child);
        n -= 1;
      } else {
        // more than one leading space
        child.textContent = child.textContent.replace(/^\s+/g, ' ');
        // more than one trailing space
        child.textContent = child.textContent.replace(/\s+$/g, ' ');
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      cleanDom(child);
    }
  }
}

export function domMatch(snapshot, block, childrenOnly = false) {
  cleanDom(snapshot);
  cleanDom(block);

  if (!childrenOnly) {
    if (snapshot.nodeType !== block.nodeType) return false;

    if (snapshot.nodeName !== block.nodeName) return false;

    if (snapshot.nodeType === Node.TEXT_NODE) {
      if (snapshot.textContent !== block.textContent) return false;
    }

    if (snapshot.nodeType === Node.ELEMENT_NODE) {
      if (snapshot.attributes.length !== block.attributes.length) return false;

      // eslint-disable-next-line no-restricted-syntax
      for (const attr of snapshot.attributes) {
        const val = attr.value;
        if (val !== block.getAttribute(attr.name)) return false;
      }
    }
  }

  if (snapshot.childNodes.length !== block.childNodes.length) return false;

  for (let i = 0; i < snapshot.childNodes.length; i += 1) {
    const childMatch = domMatch(snapshot.childNodes[i], block.childNodes[i], false);
    if (!childMatch) return false;
  }

  return true;
}

export async function compareDomInline(el, markup) {
  const dp = new DOMParser();
  const expected = dp.parseFromString(markup, 'text/html');

  const expectedRoot = expected.body;
  const compareRoot = el.tagName === 'TEMPLATE' ? el.content : el;
  const match = domMatch(expectedRoot, compareRoot, true);

  if (!match) {
    expect.fail(el.innerHTML, markup, 'dom structures are not equal');
  }
}

export async function compareDom(el, snapshotName) {
  const resp = await fetch(`/test/snapshots/${snapshotName}.html`);
  const markup = await resp.text();

  await compareDomInline(el, markup);
}
