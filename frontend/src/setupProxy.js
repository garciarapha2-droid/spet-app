/**
 * CRA/CRACO proxy middleware.
 * Routes any /api/* request to the backend (port 8001).
 * This ensures API calls work even if the Kubernetes ingress
 * routes them to port 3000 (frontend) instead of port 8001.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8001',
      changeOrigin: true,
      logLevel: 'warn',
    })
  );
};
