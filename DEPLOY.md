# Portfolio: deploy and update notes

- **Repo (local working copy):** `/opt/data/portfolio` in the Hermes container (persistent). Remote: `github.com/niracheta/portfolio` (public, to be created).
- **Image:** `ghcr.io/niracheta/portfolio:latest` (built by GitHub Actions on push to `main`; `npm run check` runs inside the build, so a leak fails the image).
- **Unraid container:** `portfolio`, host port `8095` -> container `8080`, no volumes.
- **Public URL:** `https://portfolio.nirachetahomelab.org` via `Unraid-Cloudflared-Tunnel`. No Access policy. NOT bound to the offline-notice Worker.

## Current state (2026-11-02)

- **Live** at https://portfolio.nirachetahomelab.org, running the CI-built image from GHCR (public package, anonymous pull works).
- GitHub: `github.com/niracheta/portfolio` (public). Agent pushes with `~/.ssh/github_ed25519` (account key, title "vulcan-hermes@IHome github 2026-11-02") via `core.sshCommand` in the profile's global git config.
- Template: `/boot/config/plugins/dockerMan/templates-user/my-portfolio.xml` (bridge, 8095->8080, `--read-only --tmpfs /tmp --security-opt no-new-privileges --restart unless-stopped`).
- Verified: healthy, 200/404 routes over the tunnel, CSP + 4 security headers, `/healthz` ok, rootfs read-only, uid 101, ~15 MiB RAM; public resume PDF sha256 matches the repo copy.

## Resume PDF

- Master: `/Vulcan/Projects/portfolio/Nicolas Iracheta Resume.docx` (+ `.pdf`), includes email; for applications. Original pre-edit file kept as `...orig-20261102.docx`.
- Web copy (`public/Nicolas_Iracheta_Resume.pdf`): same content, **email removed**, phone kept (work number).
- Convert docx to PDF with the Paperless Gotenberg container: `curl -F files=@resume.docx http://192.168.68.80:3000/forms/libreoffice/convert -o out.pdf`. The first call after idle can 503 (LibreOffice cold start); retry once.
- The leak tests do not read PDFs. Check a new PDF's text by hand before committing (no email, no street address, no private terms).

## Manual rebuild on Unraid (no GitHub needed)

From the Hermes container:

```bash
cd /opt/data/portfolio && npm run check
tar czf - --exclude=node_modules --exclude=dist --exclude=.astro --exclude=.git . \
  | ssh -i ~/.ssh/id_ed25519 root@192.168.68.80 'rm -rf /mnt/user/appdata/portfolio/src && mkdir -p /mnt/user/appdata/portfolio/src && tar xzf - -C /mnt/user/appdata/portfolio/src'
ssh ... 'cd /mnt/user/appdata/portfolio/src && docker build -t ghcr.io/niracheta/portfolio:latest . && docker rm -f portfolio' 
# then Unraid > Docker > Add Container > template "portfolio" > Apply (or re-run the docker run line from DEPLOY history)
```

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
