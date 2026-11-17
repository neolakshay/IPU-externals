# External Practical Lookup

A static lookup for MAIT (GGSIPU) B.Tech first-semester students in the 2026–27 academic session. Search by group code to see practical exam dates, times and rooms. The app remembers your group and theme on the device, and each group has a shareable URL such as `?group=C12`.

Built with React, TypeScript and Vite. The interface uses Material 3 styling, Catppuccin Latte and Mocha themes, and a locally hosted font. Schedule lookup runs in the browser.

## Local development

Use Node.js 22.12+ on the 22.x line, or Node.js 24+.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The Vite app is served under `/external-lookup/`. Browser tests use the production build. Set `LOOKUP_URL` to the full deployed URL ending in a slash to run the same tests against Pages. Set `PLAYWRIGHT_CHANNEL` to `msedge` or `chrome` to use an installed browser.

## Datesheet

The [MAIT draft datesheet dated 27 October 2026](public/mait-draft-practical-datesheet-nov-dec-2026.pdf) is the source for [the dataset](src/datesheet.json). Page 1 covers regular students under the new marking scheme effective from the 2023 batch. Its shift heading identifies C19, C20 and C21 as the second-shift groups.

- The legend lists 71 groups. All 330 populated timetable cells across seven subjects were checked against page 1, including four cells labeled `EE4/ME4`.
- The table lists separate `EE4` and `ME4` slots alongside the shared slot. The app preserves all three labels and asks affected students to confirm their assigned slot with MAIT.
- The draft lists Engineering Physics Lab (515) and Engineering Graphics-I Lab (227) in the same slot on 4 December for E1 (FN), E2 (N) and E3 (AN). The app shows both entries and flags the conflict.
- Weekdays are calculated from the printed dates. The sheet gives exam start and end times but no separate reporting time. Where it lists a pair of rooms, the app displays both as printed.
- The printed per-slot group counts match the 330 occupied cells. The printed student total of 6,468 differs from the sum of the per-slot student counts (7,260). Student headcounts are outside the lookup.

Check [MAIT announcements](https://www.mait.ac.in/) for the final schedule and any changes.

## Deployment

In **Settings → Pages**, select **GitHub Actions** as the publishing source. The [Pages workflow](.github/workflows/deploy.yml) tests and builds on pushes to `main` or on manual dispatch, then publishes `dist/`. The workflow uses the base path reported by GitHub Pages.
