[![Ceasefire Now](https://badge.techforpalestine.org/default)](https://techforpalestine.org/learn-more)

# Tech for Palestine

Help normalize Palestinian humanity in different ways.

## Getting started

To run this project on your local machine, first install dependencies:

```bash
pnpm install
```

Next, run the development server:

```bash
pnpm dev
```

Finally, open [http://localhost:4321](http://localhost:4321) in your browser to view the website.

For CI environments, prefer a clean, reproducible install:

```bash
npm ci
```

## Features

### Events System

The `/events` page displays events from a Notion database. See [docs/EVENTS.md](docs/EVENTS.md) for detailed documentation.

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

Contributions of all kind are welcome. Fork this repo, clone, create branch and make the first commit for change. Open a PR with appropriate title.
