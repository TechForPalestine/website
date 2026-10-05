[![Ceasefire Now](https://badge.techforpalestine.org/default)](https://techforpalestine.org/learn-more)

# Tech for Palestine

Help normalize Palestinian humanity in different ways.

## Getting started

To run this project on your local machine you need Node 22 (see `.nvmrc`) and pnpm 9+ (via Corepack). Install dependencies:

```bash
pnpm install --frozen-lockfile
```

Next, run the development server:

```bash
pnpm dev
```

Finally, open [http://localhost:4321](http://localhost:4321) in your browser to view the website.

## Features

### Events System

The `/events` page displays events from a public ICS calendar feed (Mattermost Events Calendar plugin). See [docs/EVENTS.md](docs/EVENTS.md) for detailed documentation.

Key features:

- Manual refresh (no background polling)
- Graceful fallbacks for failed/expired images
- Responsive event cards with registration/recording links

## Documentation

Full documentation index: [docs/README.md](docs/README.md) — architecture, API reference, security model, Notion/ProjectHub integrations, donation pipeline, and more.

- [Deployment](DEPLOYMENT.md) - Cloudflare Pages deployment and environment variables

## Code of Conduct

This project follows the Tech for Palestine Code of Conduct. Please read it before contributing: [http://github.com/techforpalestine/code-of-conduct](http://github.com/techforpalestine/code-of-conduct)

## Contributions

Contributions of all kind are welcome. Fork this repo, clone, create branch and make the first commit for change. Open a PR with appropriate title. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and the pre-PR checklist.
