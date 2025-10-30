/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { expect } from '@esm-bundle/chai';
import { initializeSecurity } from '../../src/render.js';

describe('initializeSecurity', () => {
  it('throws when custom security is missing shouldAllowAttribute', async () => {
    const context = {
      security: {
        allowIncludePath: () => true,
      },
    };

    try {
      await initializeSecurity(context);
      expect.fail('initializeSecurity should throw when required hooks are missing');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.equal('security.shouldAllowAttribute and security.allowIncludePath must be functions');
    }
  });

  it('throws when custom security is missing allowIncludePath', async () => {
    const context = {
      security: {
        shouldAllowAttribute: () => true,
      },
    };

    try {
      await initializeSecurity(context);
      expect.fail('initializeSecurity should throw when required hooks are missing');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.equal('security.shouldAllowAttribute and security.allowIncludePath must be functions');
    }
  });
});

