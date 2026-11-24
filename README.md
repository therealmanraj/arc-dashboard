# ARC Dashboard & CMS

An office TV display and content management system for the [Applied Research Centre](https://langara.ca/applied-research-centre) (ARC) at Langara College.

- **TV display**: a bright, auto-rotating loop of slides showing ARC's grants, funding and news. It refreshes on its own and needs no one to touch it.
- **Admin CMS**: ARC staff add and update grants, posts and photos, import grant data from Excel, and control what the TV shows.

> **Status:** planning. This repo holds the spec, architecture, data model, build plan and design system. Code comes next.

## Docs

| Document | Contents |
| --- | --- |
| [Product spec](docs/spec.md) | Goals, roles, data model, every TV slide and admin screen, roadmap, acceptance criteria, open questions |
| [Architecture](docs/architecture.md) | Tech stack, local setup, folder layout, key decisions |
| [Data model](docs/data-model.md) | Collections, fields, access rules, metric formulas |
| [Build plan](docs/build-plan.md) | Features in build order, each with its done-when |
| [Design system](design/README.md) | Colours, type, components and logos, ready for code |
| [CLAUDE.md](CLAUDE.md) | Working rules for Claude Code and contributors |

Designs: [screen designs](https://claude.ai/artifact/VYvfbYRXrCikR8EFNApyFB) · [ARC Design System](https://claude.ai/artifact/V9iBXwRrpKDrb37ay1ijEb)

## Stack

Payload CMS 3 on Next.js (TypeScript), PostgreSQL in Docker, and media on local disk. Phase 1 runs locally on one office computer. See [architecture](docs/architecture.md).

## Getting started

Needs Node 26 LTS (see `.nvmrc`), pnpm and Docker.

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm dev
```

- Admin panel: http://localhost:3000/admin
- TV display: http://localhost:3000/display?key=YOUR_DISPLAY_KEY
