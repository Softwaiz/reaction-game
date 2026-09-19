# Reaction

A synchronized multiplayer reaction game — a light flashes at the exact same
instant for every visitor, timed by a single Durable Object's alarm, not
each client's own clock. First click after the flash wins the round.

It's a demo, but a deliberately chosen one: this can't be built fairly on a
static site. Every visitor needs the same authoritative "go" moment, which
means it genuinely needs the primitive it's demonstrating — a Durable
Object coordinating hibernatable WebSocket connections across everyone
currently on the page.

Built with [RedwoodSDK](https://rwsdk.com), served by
[celld](https://celld.dev) — a self-hosted, open-source reimplementation of
Cloudflare's Workers/Durable Objects platform — running off Cloudflare
entirely. Background on that investigation:
[What RedwoodSDK Actually Depends On](https://stories.softwaiz.com/redwoodsdk-celld)
and
[RedwoodSDK, Finally Unlocked from Cloudflare](https://stories.softwaiz.com/redwoodsdk-celld-production).

## How it works

- `GameRoom` (`src/worker.tsx`) is the Durable Object. Its `alarm()` runs
  the whole game loop: pick a random 2–6s delay, flash, wait up to 5s for
  clicks, announce results, repeat.
- Clients connect over a hibernatable WebSocket (`/game/ws`) and get
  pushed `flash` / `results` / `falseStart` events. The server — not any
  client's clock — decides who won: whoever's `click` message it receives
  first after broadcasting `flash`.
- The leaderboard persists in the Durable Object's own storage, so it
  survives restarts of the underlying celld node.

## Local development

```sh
npm install
npm run dev
```

## Building for celld

```sh
npm run build
npx @softwaiz/recell dist
celld dev dist   # or celld deploy, against a real bucket
```

## Deployment

`.github/workflows/deploy.yml` builds and adapts the app on every push to
`main`, then ships it to whatever server `DEPLOY_PATH` points at and runs
`celld deploy` there — see that file for the exact steps and the secrets
it expects (`SSH_HOST`, `SSH_USERNAME`, `SSH_KEY`, `SSH_PORT`,
`DEPLOY_PATH`). It assumes the celld + SeaweedFS platform (this repo's
[`recell/deploy/celld`](https://github.com/softwaiz/recell/tree/main/deploy/celld)
`docker-compose.yml`) is already running persistently on that server —
the workflow only ships this one app into it.
