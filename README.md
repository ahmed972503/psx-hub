# PSX Intelligence

Private, approval-based desk for Pakistan Stock Exchange news and corporate events.

Phase 1 is the working spine: access control, one public RSS collector, manual intake, a rules-and-exposure impact engine, the intelligence feed, corporate calendar, dividends, results, watchlist, in-app alerts, and admin review.

The current limits are deliberate:

- Automatic collection is Dawn Business RSS only. Anything else is pasted by an admin, with the original URL.
- Invitation and password-reset email is sent only after SMTP values are set in `.env`. Until then, the admin copies the invitation link.
- Impact analysis stays on rules and the exposure map. No generative model is called.

Prices, volume, and the KSE-100 are not shown. They stay behind a market-data provider slot until a licensed feed is connected.

## Run

1. Start Docker Desktop.
2. From this folder:

```bash
docker compose up -d
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

3. Open http://localhost:3000 and log in with the admin account in `.env`.

The seeded admin is `admin@psx.local` / `PSX-Admin-2026!` unless you change `.env` before seeding. Change that password before any shared deployment.

## Email

Use a Gmail account with 2-Step Verification turned on, then create an App Password at https://myaccount.google.com/apppasswords. Put these values in `.env` and restart the app:

```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="you@gmail.com"
SMTP_PASSWORD="the-16-character-app-password"
SMTP_FROM="PSX Intelligence <you@gmail.com>"
```

Check it with `npm run mail:test`. The normal Gmail password will be rejected.

## What is intentionally not faked

- No share prices, index levels, or volumes.
- No expected EPS or analyst targets.
- No dividend rate unless the source text states one.
- No full article text. The collector keeps the headline, link, time, and a short feed excerpt.
- HTML, official, and sitemap sources are stored as configuration. Automatic collection runs only for RSS.
