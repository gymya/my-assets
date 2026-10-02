# Architecture

Nuxt 4 runs as a client-rendered PWA with read-only Nitro market-data proxies. No personal financial data is sent to the server. The UI and Pinia store depend on repository interfaces, never IndexedDB directly.

- `app/components`: navigation, accessible editors, charts, asset rows
- `app/pages`: dashboard, assets, liabilities, monthly history, backup/settings
- `app/stores`: hydrated state and serialized financial mutations
- `shared`: Zod domain/API schemas, TypeScript models, pure calculations
- `repositories`: repository contract, IndexedDB implementation, atomic backup restore
- `server/api`: public TWSE and TAIFEX proxy routes
- `tests`: financial, external boundary, repository, backup integrity tests

IndexedDB `my-assets`, version 1: accounts, stocks, liabilities, prices, exchangeRates, snapshots, settings. Entity stores use `id`; prices use `symbol`; rates/settings use `id`. A validated state and its snapshot are committed in one transaction. Snapshot records are append-only, and monthly views select the latest per calendar month in Asia/Taipei. Months without observations remain absent, never fabricated. Hydration in a new month records the current known valuation; cached market dates remain visible.

Missing stock prices or foreign exchange rates yield an incomplete valuation. No snapshot is saved until all required valuations exist. Zero holdings need no price. Historical snapshots store fixed TWD values and the rates used; today's quotes cannot rewrite them. Percent change is undefined when prior net worth is zero; a negative prior value uses the explicitly requested signed-denominator formula.

Backups are versioned, bounded in size, validated in full (including duplicate keys, snapshot totals, and identifiers), then replaced atomically. Restore requires in-app confirmation. The application uses Web Locks for writes where supported and reloads state before mutation to prevent stale-tab overwrites.
