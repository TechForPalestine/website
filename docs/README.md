# Documentation Index

| Doc | Covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Rendering model, middleware chain, data source map, env var resolution, the `-new` A/B page pattern, directory layout |
| [ENVIRONMENT.md](ENVIRONMENT.md) | How `.env` / `.dev.vars` / Cloudflare dashboard env vars actually resolve, full variable audit table, known gaps |
| [API.md](API.md) | Reference table of every route under `src/pages/api/`: auth, upstream, notes |
| [SECURITY.md](SECURITY.md) | The security rules that came out of six audit rounds, each tied to the incident that produced it |
| [NOTION.md](NOTION.md) | All 7 Notion databases, which routes consume each, the two integration patterns in use |
| [EVENTS.md](EVENTS.md) | The `/events` page in detail — Notion fetch, image handling, no-polling behavior |
| [PROJECTS.md](PROJECTS.md) | ProjectHub integration for `/projects` and `/projects-new`, and how it differs from the unrelated `project-proxy` form endpoint |
| [DONATIONS.md](DONATIONS.md) | QGIV → EmailOctopus/Hub → Plausible conversion pipeline, the KV dropped-event fallback, and the admin dashboard |
| [E4P.md](E4P.md) | Entrepreneurs for Palestine pledge/signatory flow |

Also relevant, at the repo root:

- [`../CLAUDE.md`](../CLAUDE.md) — agent-facing project guidance (commands, conventions, security rules)
- [`../AGENTS.md`](../AGENTS.md) — repository conventions summary
- [`../DEPLOYMENT.md`](../DEPLOYMENT.md) — Cloudflare Pages deployment and the full environment variable list
- [`../PRODUCT.md`](../PRODUCT.md) / [`../DESIGN.md`](../DESIGN.md) — brand, product positioning, and design system tokens
