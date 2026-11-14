# Cloudflare-only deployment status

Cloudflare Workers is the sole Production runtime for `nabzesardo.ir`. Railway is not part of the active request, storage, or deployment path.

## Production architecture

- Cloudflare Worker: public site, newsroom routes, and Node compatibility adapter.
- Cloudflare D1: application JSON state and analytics state.
- Arvan Object Storage: uploaded images and citizen media.
- Workers Static Assets: versioned public CSS, JavaScript, and static files.
- GitHub Actions: production deployment is triggered only from `cloudflare-migration`.

## Editorial rebuild preview

The Experimental Editorial redesign is being ported directly onto the Cloudflare Worker runtime.

- `wrangler.preview.jsonc` defines Worker Preview settings.
- Preview uses the separate D1 database `nabzesardo-editorial-preview`.
- The preview snapshot contains published articles only; drafts, contact messages, citizen submissions, credentials, and analytics are excluded.
- `PREVIEW_READONLY=1` and `CLOUDFLARE_PRIMARY=0` prevent production writes.
- Preview does not receive production cron triggers or queue consumers.
- Telegram, Rubika, WhatsApp, and automatic distribution remain disabled.
- Public media is read through the production public upload endpoint; the preview does not write to Arvan storage.
- HTML responses carry `X-Robots-Tag: noindex, nofollow, noarchive`, and `robots.txt` blocks crawling.
- Read-only newsroom dashboard: `/__preview/admin`.
- Read-only article editor: `/__preview/admin/editor`.

## Release safety

Do not merge the editorial preview branch into `cloudflare-migration` until the preview has been visually and functionally approved. Only the Cloudflare production workflow on `cloudflare-migration` can change the live domain.
