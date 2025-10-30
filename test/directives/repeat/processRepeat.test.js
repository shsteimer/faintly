/* eslint-disable no-template-curly-in-string */
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { expect } from '@esm-bundle/chai';
import { processRepeat } from '../../../src/directives.js';

describe('processRepeat', () => {
  it('returns false when repeat the directive is absent', async () => {
    const el = document.createElement('div');
    el.textContent = 'Some text';
    const result = await processRepeat(el);
    expect(result).to.be.false;
  });

  it('repeats the node over a collection', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', 'array');
    el.textContent = 'Hello, ${item}!';

    const parent = document.createElement('div');
    parent.append(el);

    const repeated = await processRepeat(el, {
      array: ['bob', 'alice', 'charlie'],
    });
    expect(repeated).to.be.true;
    expect(el.parentNode).to.equal(null);
    expect(parent.children[0].textContent).to.equal('Hello, bob!');
    expect(parent.children[1].textContent).to.equal('Hello, alice!');
    expect(parent.children[2].textContent).to.equal('Hello, charlie!');
  });

  it('repeats the node over an empty collection', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', 'array');
    el.textContent = 'Hello, ${item}!';

    const parent = document.createElement('div');
    parent.append(el);

    const repeated = await processRepeat(el, {
      array: [],
    });
    expect(repeated).to.be.true;
    expect(parent.children.length).to.equal(0);
  });

  it('repeats with a custom context name', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat.name', 'array');
    el.textContent = 'Hello, ${name}!';

    const parent = document.createElement('div');
    parent.append(el);

    const repeated = await processRepeat(el, {
      array: ['bob', 'alice', 'charlie'],
    });
    expect(repeated).to.be.true;
    expect(parent.children[0].textContent).to.equal('Hello, bob!');
    expect(parent.children[1].textContent).to.equal('Hello, alice!');
    expect(parent.children[2].textContent).to.equal('Hello, charlie!');
  });

  it('sets related context variables', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', 'obj');
    el.textContent = 'Hello, ${itemKey} ${item}, you are contestent ${itemNumber}. Ref: ${itemIndex}';

    const parent = document.createElement('div');
    parent.append(el);

    const repeated = await processRepeat(el, {
      obj: {
        Bob: 'Lee',
        Alice: 'Smith',
        Charlie: 'Brown',
      },
    });
    expect(repeated).to.be.true;
    expect(parent.children[0].textContent).to.equal('Hello, Bob Lee, you are contestent 1. Ref: 0');
    expect(parent.children[1].textContent).to.equal('Hello, Alice Smith, you are contestent 2. Ref: 1');
    expect(parent.children[2].textContent).to.equal('Hello, Charlie Brown, you are contestent 3. Ref: 2');
  });

  it('removes repeat directive from returned elements', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', 'arr');
    el.textContent = 'Hello, ${item}';

    const parent = document.createElement('div');
    parent.append(el);

    await processRepeat(el, {
      arr: [1, 2, 3, 4, 5],
    });
    [...parent.children].forEach((repeatedEl) => {
      expect(repeatedEl.hasAttribute('data-fly-repeat')).to.equal(false);
    });
  });

  it('supports ${} wrapped expressions', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat', '${array}');
    el.textContent = 'Hello, ${item}!';

    const parent = document.createElement('div');
    parent.append(el);

    const repeated = await processRepeat(el, {
      array: ['bob', 'alice', 'charlie'],
    });
    expect(repeated).to.be.true;
    expect(el.parentNode).to.equal(null);
    expect(parent.children[0].textContent).to.equal('Hello, bob!');
    expect(parent.children[1].textContent).to.equal('Hello, alice!');
    expect(parent.children[2].textContent).to.equal('Hello, charlie!');
  });

  it('supports ${} wrapped expressions with custom context name', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-fly-repeat.name', '${array}');
    el.textContent = 'Hello, ${name}!';

    const parent = document.createElement('div');
    parent.append(el);

    const repeated = await processRepeat(el, {
      array: ['bob', 'alice', 'charlie'],
    });
    expect(repeated).to.be.true;
    expect(parent.children[0].textContent).to.equal('Hello, bob!');
    expect(parent.children[1].textContent).to.equal('Hello, alice!');
    expect(parent.children[2].textContent).to.equal('Hello, charlie!');
  });
});
