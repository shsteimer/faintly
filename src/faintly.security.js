/**
 * Minimal security stub for faintly.
 * This is a placeholder that allows all attributes and includes by default.
 * Full implementation coming soon.
 *
 * @returns {Object} Security hooks
 */
export default function createSecurity() {
  return {
    shouldAllowAttribute() {
      return true;
    },
    allowIncludePath() {
      return true;
    },
  };
}
