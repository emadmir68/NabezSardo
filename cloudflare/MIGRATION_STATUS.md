# Cloudflare migration status

This branch is isolated from the Railway production deployment.

Current migration design:
- Existing public/admin templates remain in the repository.
- Cloudflare Workers runs the existing Node HTTP application through a compatibility adapter.
- D1 stores the application JSON state and analytics state.
- R2 stores uploaded images and citizen media.
- Workers Static Assets serves files from public/.
- /__migration/import and /__migration/export are protected by MIGRATION_TOKEN.
- No production domain route is configured in this branch.
- Railway production must remain untouched until preview verification is complete.

Safety rule: do not merge this branch to main or point nabzesardo.ir to Cloudflare until the preview passes.

- Combined smart covers: Workers AI first; branded SVG fallback if AI is unavailable.
