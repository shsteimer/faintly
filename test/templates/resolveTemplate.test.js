/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { exportForTesting } from '../../src/faintly.js';
import { compareDom } from '../test-utils.js';

const { resolveTemplate } = exportForTesting;

describe('resolveTemplates', () => {
  it('loads the default template for a block', async () => {
    const template = await resolveTemplate({
      codeBasePath: '/test/fixtures',
      blockName: 'static-block',
    });
    expect(template).to.not.be.null;
    expect(template.content).to.not.be.null;
    await compareDom(template.content, 'templates/static-block');
  });

  it('loads a named template for a block', async () => {
    const template = await resolveTemplate({
      codeBasePath: '/test/fixtures',
      blockName: 'static-block',
      template: {
        name: 'static-alt',
      },
    });
    expect(template).to.not.be.null;
    expect(template.content).to.not.be.null;

    await compareDom(template, 'templates/static-block-alt');
  });

  it('loads a default template from a custom path', async () => {
    const template = await resolveTemplate({
      template: {
        path: '/test/fixtures/blocks/static-block/custom-template.html',
      },
    });
    expect(template).to.not.be.null;
    expect(template.content).to.not.be.null;

    await compareDom(template, 'templates/static-block-custom-template');
  });

  it('loads a named template from a custom path', async () => {
    const template = await resolveTemplate({
      template: {
        path: '/test/fixtures/blocks/static-block/custom-template.html',
        name: 'custom-alt',
      },
    });
    expect(template).to.not.be.null;
    expect(template.content).to.not.be.null;

    await compareDom(template, 'templates/static-block-custom-named-template');
  });

  it('throws an error if template fetch fails', async () => {
    try {
      await resolveTemplate({
        template: {
          path: '/test/fixtures/blocks/static-block/template-dne.html',
        },
      });
      expect.fail('exception not thrown');
    } catch (e) {
      expect(e.message.startsWith('Failed to fetch template'), e.message).to.be.true;
    }
  });
});
