# Asset ledger UI

This refinement follows frontend-design and ui-ux-pro-max. Existing user choices take precedence: Traditional Chinese, orange #F05E1C, dark default, light mode, no slogans or emoji.

Palette: background #141414, surface #202020, divider #383838, primary text #F5F5F5, secondary text #B0B0B0, action #F05E1C. Light mode maps the same roles to neutral white and gray. Orange buttons use dark text for contrast.

Type: local system sans with PingFang TC for Traditional Chinese; no remote font dependency. Headings use 26–28px, section titles 17px, input text 16px, supplementary text 13px. Financial values use tabular numerals.

Layout: left-aligned account ledger, right-aligned row amounts. Net worth remains the main figure because it is the product's core task. Totals share one divided row rather than independent floating cards.

```text
Title                  Add asset
Net worth and monthly change
Total assets | Total liabilities
Trend chart  | Allocation
Accounts and holdings
```

On mobile, charts stack and five persistent navigation targets sit above the bottom safe area. Controls have 44px minimum hit areas. Dialogs retain the VisualViewport keyboard handling.

Critique: the skill's generated marketing-page patterns do not fit a local finance tool. Use its accessibility and interaction guidance instead. Remove decorative growth bars and empty-state trend lines so imagery cannot imply financial results. Retain only useful functional copy.

Validation: typecheck, lint and build passed; all five routes checked for horizontal overflow at 375, 812 and 1440px. Mobile screenshot reviewed in Chrome with reduced motion. Actual iOS Dynamic Type and software keyboard behavior still require device review.
