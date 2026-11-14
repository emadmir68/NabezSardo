# Railway PR Preview — Nabz Sardo

The redesign PR can run in an isolated Railway PR Environment before anything is merged to production.

## One-time Railway setup

1. Open the Nabz Sardo project in Railway.
2. Go to **Project Settings → Environments**.
3. Enable **PR Environments**.
4. Confirm the production service is connected to the `emadmir68/NabezSardo` GitHub repository.
5. For automatic preview URLs, keep a Railway-provided public domain enabled on the service.

Railway creates a temporary environment for an open pull request and posts the service URL in a GitHub PR comment when it is ready. The environment is removed when the PR is merged or closed.

## Preview safety built into this branch

The app automatically detects Railway PR/preview environments from `RAILWAY_ENVIRONMENT_NAME` or `RAILWAY_GIT_BRANCH` (and also supports an explicit `PREVIEW_MODE=true`).

In preview mode it:

- Serves the PR host instead of redirecting `*.up.railway.app` to the production domain.
- Sends `X-Robots-Tag: noindex, nofollow, noarchive` and disallows all crawlers in `robots.txt`.
- Disables Telegram, Rubika and WhatsApp delivery, even if production integration variables are inherited.
- Disables Cloudflare production sync.
- Does not run scheduled publishing, automatic monitoring ticks, production cleanup, or production content backfills.
- Uses a random session secret if no preview-specific `SESSION_SECRET` is present.
- Does not allow the default `change-this` admin password in preview mode. A non-empty `ADMIN_PASS` must be present to sign in.

Railway environment variables marked as sealed are not copied into PR Environments. If the production admin password is sealed, add a separate test-only `ADMIN_PASS` to the PR Environment so reviewers can sign in. Do not unseal or change the production credential for this purpose.

## Preview checklist

- [ ] PR Environment is created for PR #75.
- [ ] The Railway bot has posted the preview URL on the PR.
- [ ] `/health` returns HTTP 200.
- [ ] The homepage and article pages load on the preview domain.
- [ ] The admin login works with the preview-only test credential.
- [ ] `/robots.txt` contains `Disallow: /`.
- [ ] Response headers include `X-Robots-Tag: noindex, nofollow, noarchive`.
- [ ] Social integrations and Cloudflare sync remain disabled.
- [ ] Production domain and production data remain unchanged.

## Railway references

- PR Environments: https://docs.railway.com/environments
- Preview deployment guide: https://railway.com/guides/preview-deployments-with-pr-environments
- Railway variables and sealed values: https://docs.railway.com/variables
