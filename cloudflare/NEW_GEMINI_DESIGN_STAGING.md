# Uploaded Gemini design - staging integration

User-supplied new visual design is staged in `gemini-source/`. The current Cloudflare Worker and D1 store are preserved. CI workflow validates compilation and tests without deploying to production.

Do not merge into `cloudflare-migration` until:
- build and regression tests pass;
- preview deployed on isolated Cloudflare worker with read-only/sandbox DB;
- UI visual check mobile/desktop;
- auth, CRUD, uploads, live D1, scheduled monitoring and content exclusion reviewed.

New source images have matching filenames in existing original Gemini source ZIP used by the CI build. No production D1, R2 or queue change was made.
