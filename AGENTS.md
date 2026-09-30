# Nabez Sardo approved baseline

This repository serves the live news site at https://nabzesardo.ir. Treat the current production design and the editorial workflow as approved. Implement a requested change narrowly. Do not redesign, remove, disable, or revert another approved feature as a side effect. A direct request from the site owner can change this baseline; update the relevant checks and this file with that change.

## Design and editorial behavior to preserve

- Keep the existing header and hero photograph, dimensions, wording, and spacing. Keep the article page order and `public/article-lock.css`.
- Preserve the compact homepage groups, short-news rows, the citizen-news callout, the archive, the category navigation, and configured advertising behavior.
- For stories without a real photo, use the premium branded fallback covers. The fallback palette varies by category and by story, including repeated political and short-news stories. A real uploaded image takes precedence.
- Preserve article saving without duplicate submissions or lost concurrent updates; preserve the editor and administrator paths.
- Keep compact article URLs and social previews working for Telegram, Rubika, WhatsApp, and other crawlers.

## Operations to preserve

- Cloudflare Worker and D1 remain primary; Arvan stores media. Keep the daily encrypted backup and the separate weekly in-site backup.
- Automatic distribution to Telegram and Rubika stays enabled in production. WhatsApp remains opt-in per article. Keep delivery checkpoints and duplicate-send safeguards; do not replay older automatic jobs when changing distribution.
- Do not switch off a production integration, auto publishing, backups, or the live routes for a local experiment.

## Before deployment

Run `npm test`; its approved-behavior checks are a deployment gate. Inspect the diff for incidental changes to the areas above. After deployment, check the production health and cutover endpoints and the GitHub Actions deployment result. Any intentional change to this baseline needs an explicit owner request and a matching test update.


## Owner-requested refinements approved 2026-09-30

- Keep six latest stories in publication order, including featured and short news. Place that section after top stories and before short news and promotional sections.
- Use larger, brighter listing headings and dates while retaining compact rows. Archive pages show 12 stories with combined search/category/Tehran-date filters.
- Focus cards link to real categories or search and show a current story when available.
- Category fallback covers retain their varied premium palettes and now use subject artwork. Preserve the original assets as rollback sources.
- The two known designation-only headlines may present the news lead as the title and the designation as a kicker. Keep stored editorial data untouched.
- Congratulatory/condolence messages use the announcement label instead of a breaking-news label.
- Article sharing includes a separate full-text, no-photo Story option. Read the complete article text, paginate at readable size, preserve all paragraphs, and offer numbered PNGs, native file sharing, and an all-pages ZIP. Existing photo/video/story sharing remains available.
- Following the owner's feedback that the text Story looked too simple, use a layered navy/gold frame, pulse branding, category strip, stronger title treatment, and explicit continuation/end markers. Preserve complete text and readable pagination.
- Text Story body rows are justified for tidy edges. Keep paragraph endings and headlines naturally aligned; balance word gaps without stretching letters, breaking Persian shaping or reordering numbers.
- The owner requests feature-by-feature rollback for any change they dislike. Keep independent commits; see DESIGN_CHANGELOG_2026-09-30.md. The header/hero and locked article reading layout still apply.
