/**
 * Jest Configuration for hello_world Node.js HTTP Server
 *
 * Configures Jest 29.7.0 test runner for the Node.js CommonJS project.
 * Targets test files in __tests__/ directory matching *.test.js pattern.
 * Enforces 100% coverage thresholds across all metrics given the minimal
 * 14-line codebase with cyclomatic complexity of 1.
 *
 * @see https://jestjs.io/docs/configuration
 */
module.exports = {
  // Use Node.js test environment (not jsdom) since tests exercise
  // Node.js HTTP server functionality via the built-in http module
  testEnvironment: 'node',

  // Enable detailed per-test output showing individual test results
  verbose: true,

  // Enable Istanbul-based code coverage collection on every test run
  collectCoverage: true,

  // Explicitly specify source files to collect coverage from, ensuring
  // server.js is instrumented even when tests do not require() it directly
  // (tests recreate the handler to avoid auto-start EADDRINUSE conflicts)
  collectCoverageFrom: ['server.js'],

  // Output coverage reports (text, html, lcov) to the coverage/ directory
  coverageDirectory: 'coverage',

  // Discover test files: any .test.js file inside any __tests__/ directory
  testMatch: ['**/__tests__/**/*.test.js'],

  // Enforce 100% coverage thresholds globally — achievable and expected
  // for a 14-line server with zero branching (cyclomatic complexity 1)
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
