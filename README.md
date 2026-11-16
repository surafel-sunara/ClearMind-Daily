# ClearMind Daily

ClearMind Daily is a large-print puzzle site with free guest play and an optional paid club. It runs on Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma 7 with PostgreSQL, Auth.js v5, Stripe, and jsPDF.

## Start locally

Use Node.js 22.13 or later on the 22.x line, or Node.js 24 LTS. Open a terminal in the extracted `clearmind-daily` folder.

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Guest play works immediately. All moves run in the browser, and your device saves unfinished boards, preferences, and guest results. Daily puzzles change at midnight UTC so everyone gets the same board. The four games offer tap and keyboard controls, and Word Search and Solitaire also support mouse dragging.

Create `.env` from the included example when you want sign-in, billing, or ads.

- macOS/Linux: `cp .env.example .env`
- Windows PowerShell: `Copy-Item .env.example .env`

## Turn on sign-in and score sync

1. Create a PostgreSQL database in [Neon](https://console.neon.tech/) or use an existing local PostgreSQL instance. Copy the PostgreSQL connection string into `DATABASE_URL`. On Neon, use the pooled connection for the app and paste the direct connection into `DIRECT_DATABASE_URL` for Prisma CLI commands. Preserve the provider’s SSL settings.
2. Create the tables. For a disposable local database, run `npx prisma db push`. For a fresh production database, run `npm run db:deploy` to apply the included migration. Use a separate database or a backed-up branch for development.
3. Set `APP_URL` and `AUTH_URL` to the exact URL used in the browser. Use `https://` with your public domain. Generate an `AUTH_SECRET` and keep it private.

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

4. Choose one email transport:
   - **Resend.** Verify your sender domain, create a sending API key, and set `AUTH_RESEND_KEY` and `AUTH_EMAIL_FROM` in the form `ClearMind Daily <no-reply@your-domain>`. Use a sender on the verified domain. Resend takes precedence when both transports are configured.
   - **SMTP.** Leave `AUTH_RESEND_KEY` empty. Set `AUTH_EMAIL_FROM` and use `smtp://USER:PASSWORD@HOST:587` for STARTTLS or `smtps://USER:PASSWORD@HOST:465` for implicit TLS in `AUTH_SMTP_URL`. URL-encode characters in the username or password. The `smtp:` loopback exception supports a local test sink on your machine.
5. Restart the app. Visit `/account`, request a link, then open it in the browser. Links expire after 15 minutes and can be used once. Sign-in limits are per email address and, on Vercel, per verified forwarding IP.
6. In My Account, turn on **Score Sync** if you want completed scores and activity to follow that account. Guest results stay under the browser’s guest profile. Turning sync off pauses transfers. It retains previously synced scores.

[Auth.js email providers](https://authjs.dev/getting-started/authentication/email) · [Neon with Prisma](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql) · [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction)

## Set up Stripe in test mode

1. In the Stripe Dashboard, create a product named **ClearMind Daily Ad-Free Club**. Add two recurring USD prices with these exact amounts.

   | Plan | Price | Environment variable |
   | --- | --- | --- |
   | Monthly | $4.99 each month | `STRIPE_PRICE_MONTHLY_ID` |
   | Annual | $29.00 each year | `STRIPE_PRICE_ANNUAL_ID` |

2. Set `STRIPE_SECRET_KEY` to the test secret key and set the two price variables to their respective `price_…` IDs. Use keys, price IDs, and signing secrets from the same Stripe environment.
3. Under Stripe Customer Portal settings, activate the portal. Enable payment method updates and cancellation. Choose your cancellation timing in Stripe. Members keep benefits while their current subscription is active and within its billing period.
4. Create a webhook endpoint at `https://your-domain/api/webhooks/stripe` with the following events. Paste its signing secret into `STRIPE_WEBHOOK_SECRET`.

   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`

   For local use, install the Stripe CLI and run this in a second terminal. Use the signing secret printed by this listener in the local `.env`.

   ```sh
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

5. Restart the app. Sign in at `/account`, choose a plan at `/club`, and complete Checkout with a [Stripe test card](https://docs.stripe.com/testing). Check that your membership appears under My Account, use **Manage Billing** to open the portal, and download the 2-page pack from **Printables**. Test cancellation and confirm access follows the effective Stripe subscription status.
6. When ready for live payments, create or copy the product and prices in live mode and use the live secrets, live webhook endpoint, and live portal settings.

Checkout requires a verified email and reuses the associated Stripe customer. The server compares the configured price to the advertised plan. Signed events reconcile the latest Stripe subscription, so replayed or out-of-order events converge on the same state.

[Stripe Checkout subscriptions](https://docs.stripe.com/payments/checkout/build-subscriptions) · [Customer Portal](https://docs.stripe.com/customer-management/integrate-customer-portal) · [Subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)

## Turn on Google AdSense

1. Add your public domain to AdSense, complete site review, and create manual display units. Turn off Auto ads for this site so placement stays controlled.
2. Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` to your `ca-pub-…` publisher ID. Set `NEXT_PUBLIC_ADSENSE_LEADERBOARD_SLOT` and `NEXT_PUBLIC_ADSENSE_RECTANGLE_SLOT` to the corresponding numeric ad-unit IDs. You can enable either or both. Public Next.js environment variables are read at build time, so redeploy after editing these values.
3. Check `/ads.txt` on your domain and compare the entry with the one supplied by AdSense. It derives the seller from the publisher ID. Set `ADSENSE_SELLER_ID` if you need to specify the `pub-…` value explicitly.
4. Set up Google Privacy & Messaging or another Google-certified consent platform for applicable traffic. Set `SUPPORT_EMAIL` to the site's support address and review the included `/privacy` page for your deployment.
5. Verify guest placements and mobile spacing in the approved AdSense setup. Standard display units are reserved in 90px and 250px areas away from game controls. They are excluded for active members. Trivia keeps a single display unit as players advance through the questions. The five-second free hint uses a house promotion for the Club. It never requires viewing or clicking a display ad.

[AdSense placement policies](https://support.google.com/adsense/answer/1346295) · [Google-certified consent management](https://support.google.com/adsense/answer/13554116) · [Ads.txt setup](https://support.google.com/adsense/answer/7532444)

## Deploy to Vercel

1. Push the extracted project to a Git repository and choose **Add New → Project → Import** in [Vercel](https://vercel.com/new). Set the root to the folder containing `package.json` and choose the **Next.js** framework preset.
2. Select Node.js 22.x or 24.x. Leave the standard install command in place and use `npm run build` for the build. The package generates the Prisma client during install and at build time.
3. For guest-only deployment, set `APP_URL` to your public origin. For account, Club, and ads, add the relevant values from `.env.example` to Vercel’s Environment Variables. Set `AUTH_URL` to the same origin. Keep Preview credentials separate from Live credentials.
4. For an account-enabled deployment, apply the schema to your production database from a trusted terminal with its direct database URL. Run `npm run db:deploy` before exposing account-enabled traffic.
5. Deploy. If you add a custom domain or change the public origin, update both URLs, redeploy, and update the Stripe webhook endpoint. Use `/sitemap.xml` for search indexing.

[Vercel’s Next.js deployment guide](https://vercel.com/docs/frameworks/full-stack/nextjs)

## Verification

```sh
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm test
npm run build
npm start
```

In a second terminal, use `npm run smoke` against the running site. It calls the homepage, all four games, the Club, printables, the sitemap, and a themed Word Search route. Set `APP_URL` in the terminal if the server is running at another origin.

`npm test` checks UTC date boundaries, Word Search placements across all 16 themes, Sudoku uniqueness and clue counts for 2,190 boards, Klondike rules and legal auto-complete, the 104-question bank, streaks, and the PDF page count.

## Project map

| Area | Location |
| --- | --- |
| Public pages, account, membership, and endpoints | `src/app/` |
| Accessible site controls and game components | `src/components/` |
| Deterministic engines and trivia | `src/lib/puzzles/` |
| Sessions, billing, scoring, and PDF generation | `src/lib/` |
| PostgreSQL schema and migration | `prisma/` |
| Automated repeatable checks | `scripts/` |

Static content and source code ship alongside the dependency lockfile. Regenerate the Prisma client and the Next.js output from the source on the target machine.
