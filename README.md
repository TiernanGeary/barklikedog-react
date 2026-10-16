# rlyrlynice

Next.js storefront with products and content managed in Sanity, a persistent browser cart, and Stripe Checkout. The existing radio, media, CMS, and server integrations remain available.

## Development

Use Node.js 24 (the version configured in Vercel).

```sh
npm ci
vercel link --project barklikedog-react
vercel env pull .env.local
npm run dev
```

Keep environment files local. The existing Vercel project holds the Sanity and Stripe configuration; no new backend or migration is needed for this redesign.

## Homepage

The centered wordmark and portrait slideshow both link to `/shop`. Photos crossfade every five seconds, pause while hovered or focused or while the browser tab is hidden, and remain still when reduced motion is enabled. The first photo is the hoodie. Responsive WebP assets in `public/landing` are supplied at 640px and 1200px wide.

- Wordmark: `public/rlyrlynicelogo.svg`
- Favicon: `app/icon.svg`
- Slideshow: `components/LandingSlideshow.tsx`
- Responsive layout: `app/globals.css`

The existing Sanity coming-soon gate remains in effect when enabled.

## Validation and release

```sh
npm run build
```

Check desktop and mobile layouts, homepage links, product variants, cart persistence, and the checkout redirect before releasing. Vercel deploys the existing project from `main`. The design preceding this refresh is preserved on `archive/pre-redesign-2026-10-16`.
