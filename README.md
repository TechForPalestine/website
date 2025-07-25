[![Ceasefire Now](https://badge.techforpalestine.org/default)](https://techforpalestine.org/learn-more)

# Tech for Palestine

Help normalize Palestinian humanity in different ways.

## Getting started

To run this project on your local machine, first install the npm dependencies:

```bash
npm install 
```

OR

```bash
yarn install
```

Next, run the development server:

```bash
npm run dev
```

Finally, open [http://localhost:4321](http://localhost:4321) in your browser to view the website.


## Features

### Events System
The `/events` page displays real-time events from a Notion database with automatic image caching. See [docs/EVENTS.md](docs/EVENTS.md) for detailed documentation.

Key features:
- Real-time polling for event updates
- Cloudflare Worker proxy for persistent image caching
- Graceful fallbacks for failed images
- Responsive event cards with registration/recording links

## Documentation

- [Events System](docs/EVENTS.md) - Complete guide to the events page functionality
- [Image Proxy Deployment](DEPLOYMENT.md) - Cloudflare Worker setup instructions

## Contributions

Contributions of all kind are welcome. Fork this repo, clone, create branch and make the first commit for change. Open a PR with appropriate title.
