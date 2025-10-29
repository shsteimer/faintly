// src/faintly.security.js
function createSecurity() {
  return {
    shouldAllowAttribute() {
      return true;
    },
    allowIncludePath() {
      return true;
    }
  };
}
export {
  createSecurity as default
};
