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
        // normalize white space
        child.textContent = child.textContent.replace(/\s+/g, ' ');
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
    if (snapshot.nodeType !== block.nodeType) {
      return `node type mismatch: ${snapshot.nodeType} vs ${block.nodeType}`;
    }

    if (snapshot.nodeName !== block.nodeName) {
      return `tag name mismatch: ${snapshot.nodeName} vs ${block.nodeName}`;
    }

    if (snapshot.nodeType === Node.TEXT_NODE) {
      if (snapshot.textContent.trim() !== block.textContent.trim()) {
        return `text content mismatch at ${block.nodeName}: ${snapshot.textContent} vs ${block.textContent}`;
      }
    }

    if (snapshot.nodeType === Node.ELEMENT_NODE) {
      if (snapshot.attributes.length !== block.attributes.length) {
        return `different number of attributes at ${block.nodeName}: ${snapshot.attributes.length} vs ${block.attributes.length}`;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const attr of snapshot.attributes) {
        const val = attr.value;
        if (val !== block.getAttribute(attr.name)) {
          return `attribute ${attr.name} mismatch at ${block.nodeName}: ${val} vs ${block.getAttribute(attr.name)}`;
        }
      }
    }
  }

  if (snapshot.childNodes.length !== block.childNodes.length) {
    return `different number of children at ${block.nodeName}: ${snapshot.childNodes.length} vs ${block.childNodes.length}`;
  }

  for (let i = 0; i < snapshot.childNodes.length; i += 1) {
    const childFailureReason = domMatch(snapshot.childNodes[i], block.childNodes[i], false);
    if (childFailureReason) return childFailureReason;
  }

  return '';
}

export async function compareDomInline(el, markup) {
  const dp = new DOMParser();
  const expected = dp.parseFromString(markup, 'text/html');

  const expectedRoot = expected.body;
  const compareRoot = el.tagName === 'TEMPLATE' ? el.content : el;
  const failureReason = domMatch(expectedRoot, compareRoot, true);

  if (failureReason) {
    expect.fail(el.innerHTML, markup, `dom structures are not equal: ${failureReason}`);
  }
}

export async function compareDom(el, snapshotName) {
  const resp = await fetch(`/test/snapshots/${snapshotName}.html`);
  const markup = await resp.text();

  await compareDomInline(el, markup);
}

export async function pageReady() {
  return new Promise((resolve) => {
    const intervalId = setInterval(() => {
      const blocks = document.querySelectorAll('main > div > div > div');
      const ready = [...blocks].every((block) => block.dataset.blockStatus === 'loaded');
      if (ready) {
        clearInterval(intervalId);
        resolve();
      }
    }, 100);
  });
}
