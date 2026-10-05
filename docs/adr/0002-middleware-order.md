# 2. Middleware order

Status: accepted

`src/middleware/index.ts` is the only entry point and chains `sequence(sentryInit, securityHeaders, cacheControl, csp)`. `csp` runs last because it can replace the response through `HTMLRewriter`; the headers set by the earlier middlewares survive that rewrite. A parallel `src/middleware.ts` would silently shadow the entry point (audit finding M-6).

Details: [ARCHITECTURE.md](../ARCHITECTURE.md#request-pipeline-middleware).
