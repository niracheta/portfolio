# Portfolio: deploy and update notes

- **Repo (local working copy):** `/opt/data/portfolio` in the Hermes container (persistent). Remote: `github.com/niracheta/portfolio` (public, to be created).
- **Image:** `ghcr.io/niracheta/portfolio:latest` (built by GitHub Actions on push to `main`; `npm run check` runs inside the build, so a leak fails the image).
- **Unraid container:** `portfolio`, host port `8095` -> container `8080`, no volumes.
- **Public URL:** `https://portfolio.nirachetahomelab.org` via `Unraid-Cloudflared-Tunnel`. No Access policy. NOT bound to the offline-notice Worker.

## Update flow

1. Edit Markdown in `src/content/projects/` or pages in `src/pages/`.
2. `npm run check` -> must end `fail 0`.
3. `git commit` + `git push`. Actions builds and pushes the image.
4. Unraid > Docker > portfolio > Check for updates > Update.

## Leak guard

`tests/leaks.test.mjs` blocks private IPs, Tailscale IPs, Cloudflare/GitHub token shapes, 32-hex IDs, private keys, and em dashes.
Extra private terms (machine names, internal domains) live in `tests/private-terms.txt`, which is **gitignored**: CI does not see it, so always run `npm run check` locally before pushing.

## Go-live checklist

- [ ] Every project page approved; `grep -r "ASK NICO" src/` returns nothing
- [ ] Real resume PDF (no street address) replaces the placeholder in `public/`
- [ ] Email/LinkedIn/GitHub filled in `src/data/site.ts`
- [ ] MeshCentral write-up cleared (currently `draft: true`)
- [ ] Public URL checks pass (200 /, 200 /projects/, 404 on a bad path, CSP header present)
