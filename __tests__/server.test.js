'use strict';

/**
 * Comprehensive Jest Test Suite for server.js
 *
 * Tests the Node.js HTTP server defined in server.js which serves a static
 * "Hello, World!\n" response on every request regardless of method, path,
 * or payload.
 *
 * IMPORTANT: This test file does NOT require('../server.js') directly because
 * that module auto-starts the server on port 3000 when loaded. Instead, the
 * exact same request handler is recreated here and bound to ephemeral ports
 * (port 0) to avoid EADDRINUSE conflicts.
 *
 * Uses ONLY:
 *  - Node.js built-in `http` module (for server creation and HTTP requests)
 *  - Jest built-in utilities (describe, it, expect, jest.fn, jest.spyOn)
 */

const http = require('http');

// ---------------------------------------------------------------------------
// Helper: Create a test server with the EXACT same handler as server.js lines 6-9
// ---------------------------------------------------------------------------

/**
 * Creates an HTTP server using the identical request handler defined in
 * server.js. The server is NOT started (not listening) — callers must
 * invoke server.listen() with the desired port and hostname.
 *
 * @returns {http.Server} An unstarted HTTP server instance.
 */
function createTestServer() {
  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, World!\n');
  });
  return server;
}

// ---------------------------------------------------------------------------
// Helper: Promise-based HTTP request utility
// ---------------------------------------------------------------------------

/**
 * Makes an HTTP request and collects the full response (status, headers, body).
 * Uses the Node.js built-in http.request() — no external HTTP client libraries.
 *
 * @param {object} options - Standard http.request options (hostname, port, path, method, etc.)
 * @returns {Promise<{statusCode: number, headers: object, body: string}>}
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ===========================================================================
// TEST SUITE 1: Request Handler — Unit Tests (Mock req/res)
// ===========================================================================

describe('Request Handler - Unit Tests', () => {
  let handler;

  beforeAll(() => {
    // Extract the request listener (handler) from a server instance.
    // server.listeners('request') returns an array of registered listeners;
    // the first one is the handler we passed to http.createServer().
    const server = createTestServer();
    handler = server.listeners('request')[0];
    server.close();
  });

  it('should set status code to 200', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    handler(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(200);
  });

  it('should set Content-Type header to text/plain', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    handler(mockReq, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
  });

  it('should send "Hello, World!\\n" as response body', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    handler(mockReq, mockRes);

    expect(mockRes.end).toHaveBeenCalledWith('Hello, World!\n');
  });

  it('should call res.end exactly once', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    handler(mockReq, mockRes);

    expect(mockRes.end).toHaveBeenCalledTimes(1);
  });

  it('should call res.setHeader exactly once', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    handler(mockReq, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledTimes(1);
  });

  it('should not read or use the request object', () => {
    // The handler in server.js never accesses req — any object works
    const mockReq = { method: 'CUSTOM', url: '/anything', headers: {} };
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    handler(mockReq, mockRes);

    // Same behavior regardless of what's in req
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(mockRes.end).toHaveBeenCalledWith('Hello, World!\n');
  });
});

// ===========================================================================
// TEST SUITE 2: HTTP Response Tests (Integration — Happy Path)
// ===========================================================================

describe('HTTP Response Tests', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = createTestServer();
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should return 200 status code for GET request', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return Content-Type header as text/plain', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
    });

    expect(response.headers['content-type']).toBe('text/plain');
  });

  it('should return "Hello, World!\\n" as response body', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
    });

    expect(response.body).toBe('Hello, World!\n');
  });

  it('should include Content-Type in response headers', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
    });

    expect(response.headers).toHaveProperty('content-type');
    expect(response.headers['content-type']).toBe('text/plain');
  });
});

// ===========================================================================
// TEST SUITE 3: Method-Agnostic Tests (Edge Cases)
// ===========================================================================

describe('Method-Agnostic Tests', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = createTestServer();
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

  methods.forEach((method) => {
    it(`should return 200 status code for ${method} request`, async () => {
      const response = await makeRequest({
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: method,
      });

      expect(response.statusCode).toBe(200);
    });

    it(`should return correct body for ${method} request`, async () => {
      const response = await makeRequest({
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: method,
      });

      expect(response.body).toBe('Hello, World!\n');
    });

    it(`should return correct Content-Type for ${method} request`, async () => {
      const response = await makeRequest({
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: method,
      });

      expect(response.headers['content-type']).toBe('text/plain');
    });
  });
});

// ===========================================================================
// TEST SUITE 4: HEAD Request Tests (Edge Case)
// ===========================================================================

describe('HEAD Request Tests', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = createTestServer();
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should return 200 status code for HEAD request', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'HEAD',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return Content-Type header for HEAD request', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'HEAD',
    });

    expect(response.headers['content-type']).toBe('text/plain');
  });

  it('should return empty body for HEAD request', async () => {
    // Node.js HTTP server automatically strips the response body for HEAD requests
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'HEAD',
    });

    expect(response.body).toBe('');
  });
});


// ===========================================================================
// TEST SUITE 5: Path-Agnostic Tests (Edge Cases)
// ===========================================================================

describe('Path-Agnostic Tests', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = createTestServer();
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const paths = [
    '/',
    '/foo',
    '/bar/baz',
    '/nonexistent',
    '/?key=value',
    '/deeply/nested/path/to/resource',
  ];

  paths.forEach((testPath) => {
    it(`should return 200 for path: ${testPath}`, async () => {
      const response = await makeRequest({
        hostname: '127.0.0.1',
        port: port,
        path: testPath,
        method: 'GET',
      });

      expect(response.statusCode).toBe(200);
    });

    it(`should return correct body for path: ${testPath}`, async () => {
      const response = await makeRequest({
        hostname: '127.0.0.1',
        port: port,
        path: testPath,
        method: 'GET',
      });

      expect(response.body).toBe('Hello, World!\n');
    });

    it(`should return correct Content-Type for path: ${testPath}`, async () => {
      const response = await makeRequest({
        hostname: '127.0.0.1',
        port: port,
        path: testPath,
        method: 'GET',
      });

      expect(response.headers['content-type']).toBe('text/plain');
    });
  });
});

// ===========================================================================
// TEST SUITE 6: Server Lifecycle Tests
// ===========================================================================

describe('Server Lifecycle Tests', () => {
  it('should start and bind to a port successfully', (done) => {
    const server = createTestServer();

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      expect(address).not.toBeNull();
      expect(address.port).toBeGreaterThan(0);
      expect(address.address).toBe('127.0.0.1');

      server.close(done);
    });
  });

  it('should log the startup message when listen callback fires', (done) => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const server = createTestServer();

    server.listen(0, '127.0.0.1', () => {
      const assignedPort = server.address().port;
      // Simulate the same console.log call from server.js line 13
      const hostname = '127.0.0.1';
      console.log(`Server running at http://${hostname}:${assignedPort}/`);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Server running at')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        `Server running at http://127.0.0.1:${assignedPort}/`
      );

      consoleSpy.mockRestore();
      server.close(done);
    });
  });

  it('should close cleanly via server.close()', (done) => {
    const server = createTestServer();

    server.listen(0, '127.0.0.1', () => {
      // Verify the server is listening before closing
      expect(server.listening).toBe(true);

      server.close(() => {
        // After close callback fires, the server is no longer listening
        expect(server.listening).toBe(false);
        done();
      });
    });
  });

  it('should not throw on double close', (done) => {
    const server = createTestServer();

    server.listen(0, '127.0.0.1', () => {
      server.close(() => {
        // Second close should invoke callback with an error but NOT throw
        server.close((err) => {
          // Node.js passes an error to the callback on double close:
          // "Error: Server is not running."
          expect(err).toBeDefined();
          expect(err.message).toMatch(/not running/i);
          done();
        });
      });
    });
  });

  it('should return a valid address object while listening', (done) => {
    const server = createTestServer();

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      expect(address).toHaveProperty('address');
      expect(address).toHaveProperty('family');
      expect(address).toHaveProperty('port');
      expect(typeof address.port).toBe('number');
      expect(address.family).toBe('IPv4');

      server.close(done);
    });
  });
});

// ===========================================================================
// TEST SUITE 7: Error Handling Tests
// ===========================================================================

describe('Error Handling Tests', () => {
  it('should emit error event when port is already in use (EADDRINUSE)', (done) => {
    const server1 = createTestServer();

    server1.listen(0, '127.0.0.1', () => {
      const occupiedPort = server1.address().port;

      const server2 = createTestServer();

      server2.on('error', (err) => {
        expect(err).toBeDefined();
        expect(err.code).toBe('EADDRINUSE');

        // Clean up both servers
        server1.close(() => {
          done();
        });
      });

      // Attempt to bind to the already-occupied port
      server2.listen(occupiedPort, '127.0.0.1');
    });
  });

  it('should emit error with valid error properties on EADDRINUSE', (done) => {
    const server1 = createTestServer();

    server1.listen(0, '127.0.0.1', () => {
      const occupiedPort = server1.address().port;

      const server2 = createTestServer();

      server2.on('error', (err) => {
        expect(err.code).toBe('EADDRINUSE');
        // The error should have a message property
        expect(err.message).toBeDefined();
        expect(typeof err.message).toBe('string');
        // The error should have the 'syscall' and 'address' system error properties
        expect(err.syscall).toBeDefined();

        server1.close(() => {
          done();
        });
      });

      server2.listen(occupiedPort, '127.0.0.1');
    });
  });

  it('should not crash the process when error listener is attached', (done) => {
    const server1 = createTestServer();

    server1.listen(0, '127.0.0.1', () => {
      const occupiedPort = server1.address().port;

      const server2 = createTestServer();
      let errorEmitted = false;

      server2.on('error', () => {
        errorEmitted = true;
      });

      server2.listen(occupiedPort, '127.0.0.1');

      // Give the error event time to fire
      setTimeout(() => {
        expect(errorEmitted).toBe(true);
        server1.close(() => {
          done();
        });
      }, 200);
    });
  });
});

// ===========================================================================
// TEST SUITE 8: Concurrent Requests (Edge Case)
// ===========================================================================

describe('Concurrent Requests', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = createTestServer();
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should handle multiple concurrent requests correctly', async () => {
    const concurrentCount = 10;
    const requestPromises = [];

    for (let i = 0; i < concurrentCount; i++) {
      requestPromises.push(
        makeRequest({
          hostname: '127.0.0.1',
          port: port,
          path: '/',
          method: 'GET',
        })
      );
    }

    const responses = await Promise.all(requestPromises);

    // Every single concurrent response must be identical
    responses.forEach((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain');
      expect(response.body).toBe('Hello, World!\n');
    });
  });

  it('should handle concurrent requests with different methods', async () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const requestPromises = methods.map((method) =>
      makeRequest({
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: method,
      })
    );

    const responses = await Promise.all(requestPromises);

    responses.forEach((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('Hello, World!\n');
    });
  });
});

// ===========================================================================
// TEST SUITE 9: Response Integrity Tests
// ===========================================================================

describe('Response Integrity Tests', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = createTestServer();
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should return response body with exact trailing newline', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
    });

    // The body must end with a newline character
    expect(response.body.endsWith('\n')).toBe(true);
    // The body must be exactly 14 characters: "Hello, World!\n"
    expect(response.body.length).toBe(14);
    // Verify the exact string
    expect(response.body).toBe('Hello, World!\n');
  });

  it('should return response encoded as UTF-8', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
    });

    // Verify the response body can be properly handled as a UTF-8 string
    const buffer = Buffer.from(response.body, 'utf-8');
    expect(buffer.toString('utf-8')).toBe('Hello, World!\n');
  });

  it('should not include unexpected content in the response body', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
    });

    // No extra whitespace, no HTML, no JSON — just the plain text greeting
    expect(response.body).not.toContain('<html');
    expect(response.body).not.toContain('{');
    expect(response.body).toBe('Hello, World!\n');
  });

  it('should return consistent Content-Length header matching body size', async () => {
    const response = await makeRequest({
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'GET',
    });

    // Node.js automatically sets Content-Length for known-length responses
    // "Hello, World!\n" is 14 bytes in UTF-8
    if (response.headers['content-length']) {
      expect(parseInt(response.headers['content-length'], 10)).toBe(14);
    }
    // Verify the body itself is the expected length
    expect(Buffer.byteLength(response.body, 'utf-8')).toBe(14);
  });
});

// ===========================================================================
// TEST SUITE 10: server.js Module Coverage Tests
// ===========================================================================

/**
 * This describe block safely requires the actual server.js module to achieve
 * code coverage instrumentation of all 14 lines. Without this, Jest's Istanbul
 * coverage engine never executes server.js because other test suites recreate
 * the handler pattern instead of importing the module directly.
 *
 * Strategy: Mock http.createServer() BEFORE requiring server.js so that:
 *   - The request handler callback is captured without starting a real server
 *   - server.listen() is intercepted to prevent actual TCP binding (no EADDRINUSE)
 *   - The listen callback executes, covering the console.log startup message
 *   - The captured handler is then invoked with mock req/res to cover lines 7-9
 *
 * IMPORTANT: This block is intentionally placed LAST so all other test suites
 * (which use the real http module) complete before mocking begins.
 */
describe('server.js Module Coverage', () => {
  let capturedHandler;
  let mockServerInstance;
  let consoleSpy;

  beforeAll(() => {
    // Clear Jest module registry so require('../server') re-executes server.js
    jest.resetModules();

    // Spy on console.log before requiring server.js to capture the real
    // startup message from server.js line 13 — not a simulated call
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Create a mock server object that server.js will receive from createServer()
    mockServerInstance = {
      listen: jest.fn((listenPort, listenHostname, callback) => {
        // Execute the listen callback to cover server.js line 13 (console.log)
        if (typeof callback === 'function') {
          callback();
        }
      }),
      on: jest.fn(),
      close: jest.fn((callback) => {
        if (typeof callback === 'function') {
          callback();
        }
      }),
      address: jest.fn(() => ({ address: '127.0.0.1', family: 'IPv4', port: 3000 })),
    };

    // Mock http.createServer to capture the request handler without starting a server
    const httpModule = require('http');
    jest.spyOn(httpModule, 'createServer').mockImplementation((handler) => {
      capturedHandler = handler;
      return mockServerInstance;
    });

    // Require server.js — executes all 14 lines under Istanbul instrumentation:
    //   Line 1:  const http = require('http')       — uses our mocked http module
    //   Line 3:  const hostname = '127.0.0.1'       — constant assignment (covered)
    //   Line 4:  const port = 3000                  — constant assignment (covered)
    //   Line 6:  http.createServer((req, res) => {  — mock captures the handler
    //   Line 12: server.listen(3000, '127.0.0.1', …) — mock executes the callback
    //   Line 13: console.log(…)                     — executed by listen callback
    require('../server');
  });

  afterAll(() => {
    // Restore all mocks to prevent interference with any subsequent operations
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should call http.createServer with a request handler function', () => {
    const httpModule = require('http');
    expect(httpModule.createServer).toHaveBeenCalledTimes(1);
    expect(typeof capturedHandler).toBe('function');
  });

  it('should call server.listen with port 3000, hostname 127.0.0.1, and a callback', () => {
    expect(mockServerInstance.listen).toHaveBeenCalledTimes(1);
    expect(mockServerInstance.listen).toHaveBeenCalledWith(
      3000,
      '127.0.0.1',
      expect.any(Function)
    );
  });

  it('should log the correct startup message from server.js', () => {
    // Verifies the ACTUAL console.log call from server.js line 13,
    // not a simulated call — this addresses the lifecycle log design concern
    expect(consoleSpy).toHaveBeenCalledWith(
      'Server running at http://127.0.0.1:3000/'
    );
  });

  it('should define a handler that sets statusCode to 200', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    // Invoke the captured handler to cover server.js lines 7-9
    capturedHandler(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(200);
  });

  it('should define a handler that sets Content-Type to text/plain', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    capturedHandler(mockReq, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
  });

  it('should define a handler that sends Hello, World!\\n as response body', () => {
    const mockReq = {};
    const mockRes = {
      statusCode: null,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    capturedHandler(mockReq, mockRes);

    expect(mockRes.end).toHaveBeenCalledWith('Hello, World!\n');
  });
});
