# notes.osteele.com — Oliver's Notes

# List available commands
default:
    @just --list

# Dev server with hot reload
dev:
    bun install --frozen-lockfile 2>/dev/null || bun install && bun run dev

# Build the static site into dist/ (Astro + Pagefind index)
build:
    bun install --frozen-lockfile 2>/dev/null || bun install && bun run build

# Remove generated build and local tooling output
clean:
    rm -rf dist .astro

# Deploy to Cloudflare Pages
deploy: build
    wrangler pages deploy dist --project-name notes-osteele-com --branch main

# Preview the built site locally
preview: build
    bun run astro preview
