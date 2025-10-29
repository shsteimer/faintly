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
  rules: {
    // Globally require .js file extensions in imports
    'import/extensions': ['error', { js: 'always' }],
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
  overrides: [
    {
      files: ['scripts/**/*.mjs', 'scripts/**/*.js'],
      env: { node: true },
      rules: {
        // Allow .mjs extensions in build scripts only
        'import/extensions': ['error', { js: 'always', mjs: 'always' }],
      },
    },
  ],
};
