/**
 * CRA/CRACO proxy middleware.
 * Routes any /api/* request to the backend (port 8001).
 * This ensures API calls work even if the Kubernetes ingress
 * routes them to port 3000 (frontend) instead of port 8001.
 *
 * /mapi/* is a mobile-specific prefix that:
 *   1. Always routes to port 3000 (ingress doesn't intercept it)
 *   2. setupProxy rewrites /mapi → /api and forwards to port 8001
 *   3. This bypasses the Cloudflare/ingress /api routing that fails on iOS
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Standard /api proxy (for web frontend and any ingress fallback)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8001',
      changeOrigin: true,
      logLevel: 'warn',
    })
  );

  // Mobile-specific proxy: /mapi → /api on backend
  // This path is NOT intercepted by the Kubernetes ingress,
  // so it always reaches port 3000 and gets proxied here.
  app.use(
    '/mapi',
    createProxyMiddleware({
      target: 'http://localhost:8001',
      changeOrigin: true,
      pathRewrite: { '^/mapi': '/api' },
      logLevel: 'warn',
    })
  );
};
