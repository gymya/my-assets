# Verification

## Automated checks

Passed: `npm run typecheck`, `npm run lint`, `npm test` (18 tests), and `npm run build`.

## Browser verification

- Mobile 390 × 844 and desktop 1440 × 1000 layouts reviewed.
- Created a TWD account and a 2330 holding using synthetic test inputs.
- Verified official dated stock quote and matching asset totals.
- Created a USD liability and verified its TWD conversion and net-worth subtraction.
- Reloaded the page and verified IndexedDB persistence.
- Verified the privacy toggle masks amounts and stock share counts.
- Downloaded a JSON backup, reimported it, and confirmed successful restoration.
- Submitted an invalid backup and confirmed an error without replacing existing data.
- Confirmed the production API and PWA manifest.
- Stopped the production server and reloaded the app: the service worker served the application shell and IndexedDB retained the last official FX rates. The expected market-update error was displayed. Restarted the server after testing.

Workflow tests used a separate localhost origin. The main preview at 127.0.0.1 starts without synthetic financial records. Native installation on physical Android/iOS devices has not been tested.

## Follow-up fixes

- Donut chart renders a full 360-degree circle without segment gaps or sweep animation.
- New accounts are bank accounts; the cash option is removed. Legacy records and backups remain readable.
- Number-input steppers are hidden while numeric validation and mobile keyboards remain available.
- Verified stock-name search (台積 → 2330 台積電), selection, and code search endpoint.
- Verified dark/light switching and persistence after reload. Existing backups default to dark.
- PWA shell revision now changes for each build so updates can replace the cached shell.
