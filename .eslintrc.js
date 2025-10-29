module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  settings: {
    'import/extensions': ['.js', '.mjs'],
  },
  rules: {
    'import/extensions': ['error', { js: 'always', mjs: 'always' }], // require extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
  overrides: [
    {
      files: ['scripts/**/*.mjs', 'scripts/**/*.js'],
      env: { node: true },
    },
  ],
};
