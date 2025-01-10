/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { renderElement } from '../../src/faintly.js';

describe('performance tests', () => {
  it('renders in similar amount of time as traditional dom manipulations', async () => {
    const iterations = 100_000;

    const traditional = document.createElement('div');
    traditional.className = 'traditional';
    document.body.appendChild(traditional);

    const start = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      const div = document.createElement('div');
      div.textContent = `hello ${i}`;
      div.setAttribute('data-index', i);
      traditional.appendChild(div);
    }
    const end = performance.now();
    console.log('traditional', end - start);

    const array = [];
    for (let i = 0; i < iterations; i += 1) {
      array.push(i);
    }

    const faintly = document.createElement('div');
    faintly.className = 'faintly';
    document.body.appendChild(faintly);

    const start2 = performance.now();
    await renderElement(faintly, {
      array,
      template: {
        path: '/test/performance/perf.html',
      },
    });
    const end2 = performance.now();
    console.log('faintly', end2 - start2);
  });
});
