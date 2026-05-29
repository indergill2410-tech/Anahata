module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/tests/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/tests/**',
    '!server/index.js'
  ],
  coverageThreshold: {
    global: { lines: 60, functions: 60, branches: 50 }
  },
  setupFiles: ['<rootDir>/jest.setup.js']
};
