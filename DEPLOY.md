# Portfolio: deploy and update notes

- **Repo (local working copy):** `/opt/data/portfolio` in the Hermes container (persistent). Remote: `github.com/niracheta/portfolio` (public, to be created).
- **Image:** `ghcr.io/niracheta/portfolio:latest` (built by GitHub Actions on push to `main`; `npm run check` runs inside the build, so a leak fails the image).
- **Unraid container:** `portfolio`, host port `8095` -> container `8080`, no volumes.
- **Public URL:** `https://portfolio.nirachetahomelab.org` via `Unraid-Cloudflared-Tunnel`. No Access policy. NOT bound to the offline-notice Worker.

## Current state (2026-11-02)

- Running on Unraid since 2026-11-02 from an image **built on Unraid** (`/mnt/user/appdata/portfolio/src`, `docker build -t ghcr.io/niracheta/portfolio:latest .`), tagged with the GHCR name so switching to CI images is just a pull.
- Template: `/boot/config/plugins/dockerMan/templates-user/my-portfolio.xml` (bridge, 8095->8080, `--read-only --tmpfs /tmp --security-opt no-new-privileges --restart unless-stopped`).
- Verified on host: healthy, 200/404 routes, CSP + 4 security headers, `/healthz` ok, rootfs read-only, runs as uid 101, ~15 MiB RAM.
- Until GHCR has the image, "Check for updates" in the Unraid UI will report the image as unavailable. That is expected.

## Manual rebuild on Unraid (no GitHub needed)

From the Hermes container:

```bash
cd /opt/data/portfolio && npm run check
tar czf - --exclude=node_modules --exclude=dist --exclude=.astro --exclude=.git . \
  | ssh -i ~/.ssh/id_ed25519 root@192.168.68.80 'rm -rf /mnt/user/appdata/portfolio/src && mkdir -p /mnt/user/appdata/portfolio/src && tar xzf - -C /mnt/user/appdata/portfolio/src'
ssh ... 'cd /mnt/user/appdata/portfolio/src && docker build -t ghcr.io/niracheta/portfolio:latest . && docker rm -f portfolio' 
# then Unraid > Docker > Add Container > template "portfolio" > Apply (or re-run the docker run line from DEPLOY history)
```

## Update flow (once GitHub is wired)

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
