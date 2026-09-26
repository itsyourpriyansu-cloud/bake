# Seed data location

The deployable prototype reads its canonical products and modifier groups from:

- `src/prototype/bakery/bakery.seed.ts`
- `src/prototype/bakery/bakery.db.ts`
- `src/prototype/bakery/bakery.handlers.ts`

The seed is written to browser IndexedDB on first use. Do not convert it to a server database for this prototype; Vercel only needs the static frontend contained in this directory.
