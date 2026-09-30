# Contributing

Thanks for helping. Please read the [Code of Conduct](http://github.com/techforpalestine/code-of-conduct) first.

## Setup

Requires Node 22 (see `.nvmrc`) and `pnpm` 9+ (via Corepack). Do not use yarn or npm.

```bash
pnpm install --frozen-lockfile
pnpm dev        # http://localhost:4321
```

Secrets for local dev go in `.dev.vars` (see `.env.example` and [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)). Never commit them.

## Before opening a PR

```bash
pnpm lint       # ESLint
pnpm check      # type-check
pnpm test       # Vitest
pnpm build      # production build
pnpm exec prettier --write <files you changed>
```

- Branch from `main`, use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Keep PRs focused. Do not reformat unrelated files.
- Do not build on the dead `*-new` pages; work on the live pages and follow [DESIGN.md](DESIGN.md).
- If you remove or rename a page, add a 301 in `public/_redirects`.

## Security rules

Summarised from [CLAUDE.md](CLAUDE.md) and [docs/SECURITY.md](docs/SECURITY.md):

- Read env vars through `getEnv()`; never hardcode secrets or expose them to client code.
- Compare secrets with `constantTimeEqual`, not `===`.
- Public POST endpoints validate input and check `Origin`; payment side effects are verified against Qgiv.
- No `'unsafe-inline'` in CSP and no `style=""` attributes.
- Never return raw errors to clients or log PII.
