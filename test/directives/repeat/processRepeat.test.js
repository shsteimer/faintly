/* eslint-disable no-template-curly-in-string */
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { expect } from '@esm-bundle/chai';
import { exportForTesting } from '../../../src/faintly.js';

const { processRepeat } = exportForTesting;

describe('processRepeat', () => {
  it('repeats the node over a collection', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', 'array');
    el.textContent = 'Hello, ${item}!';

    const repeated = await processRepeat(el, {
      array: ['bob', 'alice', 'charlie'],
    });
    expect(repeated.length).to.equal(3);
    expect(repeated[0].textContent).to.equal('Hello, bob!');
    expect(repeated[1].textContent).to.equal('Hello, alice!');
    expect(repeated[2].textContent).to.equal('Hello, charlie!');
  });

  it('repeats with a custom context name', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat.name', 'array');
    el.textContent = 'Hello, ${name}!';

    const repeated = await processRepeat(el, {
      array: ['bob', 'alice', 'charlie'],
    });
    expect(repeated.length).to.equal(3);
    expect(repeated[0].textContent).to.equal('Hello, bob!');
    expect(repeated[1].textContent).to.equal('Hello, alice!');
    expect(repeated[2].textContent).to.equal('Hello, charlie!');
  });

  it('sets related context variables', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', 'obj');
    el.textContent = 'Hello, ${itemKey} ${item}, you are contestent ${itemNumber}. Ref: ${itemIndex}';

    const repeated = await processRepeat(el, {
      obj: {
        Bob: 'Lee',
        Alice: 'Smith',
        Charlie: 'Brown',
      },
    });
    expect(repeated.length).to.equal(3);
    expect(repeated[0].textContent).to.equal('Hello, Bob Lee, you are contestent 1. Ref: 0');
    expect(repeated[1].textContent).to.equal('Hello, Alice Smith, you are contestent 2. Ref: 1');
    expect(repeated[2].textContent).to.equal('Hello, Charlie Brown, you are contestent 3. Ref: 2');
  });

  it('removes repeat directive from returned elements', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', 'arr');
    el.textContent = 'Hello, ${item}';

    const repeated = await processRepeat(el, {
      arr: [1, 2, 3, 4, 5],
    });
    repeated.forEach((repeatedEl) => {
      expect(repeatedEl.hasAttribute('data-fly-repeat')).to.equal(false);
    });
  });
});
