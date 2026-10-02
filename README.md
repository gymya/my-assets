# My Assets / 我的資產

A mobile-first, local-only net-worth PWA built with Nuxt 4, Vue 3, TypeScript, Pinia, Nuxt UI, Tailwind CSS, Zod, IndexedDB (`idb`), and Chart.js. The interface uses Traditional Chinese, a dark theme, and primary color `#F05E1C`. Supported currencies: TWD, USD, JPY.

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm install
npm run dev -- --port 3000
```

Open http://127.0.0.1:3000. Use this same address consistently: browser data is scoped to the hostname and port. `localhost` and `127.0.0.1` have separate storage.

```sh
npm run typecheck
npm run lint
npm test
npm run build
HOST=127.0.0.1 PORT=3000 npm run preview
```

Stop the development server before starting production on the same port. PWA installation and offline caching are enabled in the production build; visit once online before using offline. Keep the Node server running when refreshing market prices. Production deployment requires HTTPS; localhost is permitted for development.

## Environment configuration

Copy `.env.example` to `.env` for local development:

```sh
cp .env.example .env
```

`NUXT_TAIFEX_API_BASE` overrides the server-only `runtimeConfig.taifexApiBase`. The default is `https://openapi.taifex.com.tw/v1/`; the server appends `DailyForeignExchangeRates` using the fetch client's `baseURL` option. Exchange-rate cache keys include this base URL to avoid mixing different providers.

Nuxt loads `.env` during development and builds. The production Node server does not load `.env` automatically; set the environment variable in the process or hosting environment. It can be changed at startup without rebuilding:

```sh
NUXT_TAIFEX_API_BASE=https://openapi.taifex.com.tw/v1/ HOST=127.0.0.1 PORT=3000 npm run preview
```

Local `.env` files are ignored by Git; `.env.example` documents the supported setting. This value is outside `runtimeConfig.public` and is accessed only by the server.

## Features

- Create, edit, and delete bank accounts, TWSE stock holdings, and liabilities.
- Convert USD and JPY balances and debts to TWD with official daily reference rates.
- Dashboard, asset-allocation donut, monthly net-worth trend and historical table.
- Dated market quotes, explicit missing-data states, retained quotes on failed refresh.
- Append-only snapshots on financial changes; latest valid snapshot per Taiwan calendar month.
- Versioned JSON export and validated, atomic restore with confirmation.
- Amount privacy toggle, persisted dark/light theme, responsive navigation, PWA manifest and offline app shell.

No login, cloud database, account sync, transaction tracking, or investment-performance calculation is included. Browser data can be lost if site data is cleared; export backups regularly. Backup JSON is unencrypted and should be stored securely.

## Market sources

Verified against actual official JSON responses during implementation:

- [TWSE OpenAPI](https://openapi.twse.com.tw/): `GET https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`. Fields: `Date` (ROC `YYYMMDD`), `Code`, `Name`, `ClosingPrice` (string). Missing/untraded closing prices are not converted to zero. Only TWSE-listed securities are supported, not TPEx OTC stocks.
- [TAIFEX OpenAPI](https://openapi.taifex.com.tw/): `GET https://openapi.taifex.com.tw/v1/DailyForeignExchangeRates`. Fields: `Date` (`YYYYMMDD`), `USD/NTD`, `USD/JPY`. Rows are sorted by date to select the latest. `JPY/TWD = USD/NTD ÷ USD/JPY`. Explicit JSON response parsing is required because the endpoint may use a non-JSON content type.

Stock search accepts names or codes through `/api/stocks/search?q=...`. Routes `/api/stocks/:symbol` and `/api/exchange-rates` proxy and validate these public feeds. The server caches only public market information; financial balances, shares, debts, and snapshots stay in IndexedDB. Stock symbols are sent to the local proxy to request quotes. Daily reference values are not real-time or actual bank liquidation rates.

## Data and history

See [architecture](docs/architecture.md). Net worth equals assets minus liabilities. Negative previous net worth uses the specification's signed denominator for percentage change. Previous value zero has no percentage. Missing previous calendar month has no monthly comparison. Missing valuation data prevents saving a misleading snapshot. Months without observations are not fabricated or interpolated. Cached prices remain usable but their original market dates are displayed.

The repository abstracts persistence and accepts serialized mutations. All changed data and snapshots commit atomically. Web Locks coordinate writes across tabs where supported; IndexedDB transactions protect atomicity on all supported browsers. Backup import validates the entire file before a transaction clears or writes records.

## Testing

Vitest exercises valuations, missing/zero quotes, USD/JPY conversion, debts, monthly changes, Taiwan timezone boundaries, historical immutability, monthly grouping, IndexedDB persistence, concurrent mutations, backup round-trips, and malformed backup rejection. Browser QA is performed against a separate `localhost` origin so test records do not populate the normal `127.0.0.1` preview.
