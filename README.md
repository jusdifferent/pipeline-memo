# Pipeline Memo: site

A static site for Vercel with 39 deep dives across four series. There's no framework and no dependencies: one small build script generates every page, and one serverless function sends signups to Beehiiv.

## What's on the site

- **Home**: modeled on Acquired's layout. A header with the wordmark, a search bar, and Menu and Subscribe buttons, then straight into a grid of square tiles: each company's official logo on its brand color, a name label, and the title underneath.
- **Menu**: a side panel that filters the grid by series or industry in place. Search filters as you type. Filters stay in the URL (for example `/?series=gtm`), so filtered views can be shared.
- **Previews**: clicking any tile opens a preview panel with the opening of the essay and an email gate. The URL updates and the back button closes it. Each preview is also a full page for search engines and direct links.
- **Signup points**, in order of expected conversion:
  1. The **gate** in every preview, right after the hook, when the reader is most invested.
  2. A **floating email pill** at the bottom center of every page. It steps aside when the footer signup or a gate is on screen, disappears once someone subscribes, and stays dismissed for the session if closed.
  3. The **Subscribe button** in the header, which opens a signup panel.
  4. The **signup band** above the footer.
- Returning subscribers skip gates automatically. Every signup is tagged in Beehiiv (`utm_campaign`) with where it happened: `floating-pill`, `header-modal`, `footer-band`, or the slug of the deep dive whose gate converted them.

## Personal details

`site.config.json` holds `author`, `contactEmail`, `linkedin`, and `bio` (a list of About-page paragraphs). Anything left empty is hidden on the site rather than shown as a placeholder. Set `url` to the custom domain once there is one.

## Publishing a deep dive

Every topic already exists in `content/deep-dives.json`. To publish one, add a Markdown file named after its slug to `content/deep-dives/`, for example `content/deep-dives/how-okta-won-identity.md`:

```markdown
---
date: 2026-11-03
dek: Optional. Replaces the summary shown under the title.
readUrl: https://yourname.beehiiv.com/p/how-okta-won-identity
---

Opening paragraphs. Everything before the first ## heading is the free preview.

## The founding insight

Use ## for chapter headings.

> Lines starting with > become pull lines.
```

**Where the rest of the essay lives.** Without `readUrl`, the full essay is on your site and the gate unlocks it in place. With `readUrl`, the site shows only the preview, and after signing up the reader goes to that Beehiiv post. The on-site option is better for search traffic; the Beehiiv option keeps the full text off the open web. Note that the on-site gate is a soft gate: the full text is in the page for search engines, and a determined reader could find it.

The preview runs to the first `##` heading, capped at `PREVIEW_PARAGRAPHS` (in `build.mjs`) paragraphs.

## Editing topics

`content/deep-dives.json` holds every topic: company, title, series, industry, summary, cover palette (0 to 9), and whether it's featured in the home carousel. Keep the `slug` stable once a page is live, since it's the URL.

## Logos and brand colors

Logos load automatically from **Brandfetch's Logo API**, which serves each company's official logo by domain. It's free, needs no attribution, and is built for embedding in pages.

1. Register for a free client ID at developers.brandfetch.com/register.
2. Paste it into `site.config.json` as `brandfetchClientId`, then rebuild or redeploy.

Each tile then requests the company's horizontal logo, in the light version for dark brand colors and the dark version for light ones. If Brandfetch has no logo for a company, the tile shows the company name instead of a broken image.

**Overrides.** A file in `public/logos/` always wins over Brandfetch. Use this when you'd rather use the file from a company's own press or brand page, or when Brandfetch's version doesn't suit the tile. Name it after the company in lowercase with dashes: `wiz.svg`, `hubspot.svg`, `microsoft-azure.svg`, `monday-com.svg`.

**Domains** for each company are in `content/deep-dives.json` (`domain`). Microsoft Azure uses `microsoft.com`; drop an Azure logo file into `public/logos/microsoft-azure.svg` if you want Azure's own mark.

**Brand colors** are in `content/deep-dives.json` (`brand`). Wiz's is from its Brandfetch profile; the rest are approximate. Check each company's profile at `brandfetch.com/<domain>` and update the hex values before launch.

Company names and logos identify the subject of each deep dive. The footer and About page note that they don't imply endorsement.

## Essays tab

The site has two tabs at the top: **Company deep dives** (`/`, the logo tiles) and **Essays** (`/essays`, text links grouped by theme). The search bar filters whichever tab you're on.

Essay titles live in `content/essays.json` as one list. The tab shows them newest first: published essays by date, then the rest in the order listed. To publish an essay, add `content/essays/<slug>.md` (the slug is the title in lowercase with dashes, as in the essay's URL). It uses the same front matter as deep dives (`date`, optional `dek` and `readUrl`), with the same preview and email gate. Essays in research show a "notify me" form instead.

Signups from essay pages are tagged in Beehiiv as `essay-<slug>`.

## Beehiiv setup

1. In Beehiiv, create custom fields named **Name**, **Role**, and **Company** (all optional on the form).
2. Get your **API key** and **Publication ID** (starts with `pub_`). API access depends on your Beehiiv plan.
3. In Vercel, set `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` under Project > Settings > Environment Variables, then redeploy.

Beehiiv's welcome email is sent by default. Set `BEEHIIV_SEND_WELCOME=false` to turn it off.

## Deploy and preview

Push this folder to GitHub and import it in Vercel. Vercel reads `vercel.json`, runs `node build.mjs`, and serves `dist/`. Every push publishes.

```bash
npm run dev    # local preview at http://localhost:4321 (the signup form only works on Vercel)
```

## Structure

```
site.config.json            site-wide settings
content/deep-dives.json     the 39 topics, series, industries, palettes, featured picks
content/deep-dives/         one Markdown file per published essay
src/covers.mjs              code-drawn cover art
src/styles.css              design system
src/site.js                 carousel, filters, reading progress, form
build.mjs                   page templates and the build
api/subscribe.js            Beehiiv signup function
public/                     favicon and share image
```
