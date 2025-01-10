export default {
  groups: [
    {
      name: 'unit',
      files: [
        'test/**/*.test.{html,js}',
        '!test/performance/**',
      ],
    },
    {
      name: 'perf',
      files: 'test/performance/**/*.test.js',
    },
  ],
  coverageConfig: {
    report: true,
    reportDir: 'coverage',
    threshold: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    exclude: [
      'test/fixtures/**',
      'test/snapshots/**',
      'test/test-utils.js',
      'node_modules/**',
    ],
  },
};
