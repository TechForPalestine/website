## Summary

<!-- What changed and why. Link issues. Add screenshots for UI changes. -->

## Checklist

- [ ] Env vars are read through `getEnv(name, locals)`; no secrets in source or client code
- [ ] No `style=""` attributes and no `'unsafe-inline'` added to the CSP
- [ ] Secrets are compared with `constantTimeEqual`, not `===`
- [ ] Public POST endpoints check `Origin` before parsing the body and validate input
- [ ] Removed or renamed pages have a 301 in `public/_redirects`
- [ ] New experimental or orphan pages are in the sitemap `filter` exclude list
- [ ] No new `-new` pages
- [ ] `pnpm lint`, `pnpm check` and `pnpm test` pass
