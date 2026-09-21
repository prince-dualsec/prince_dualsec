# PRINCE | Cybersecurity Portfolio

A modern, professional cybersecurity portfolio built with React, Vite, and Tailwind CSS.

## Features

- **Dark Cyber Theme** - Black/deep navy with neon cyan accents
- **Glassmorphism Cards** - Modern frosted glass design
- **Smooth Animations** - Framer Motion powered transitions
- **Responsive** - Mobile-first design
- **SEO Optimized** - Meta tags and semantic HTML
- **Accessible** - ARIA labels and keyboard navigation

## Sections

- Hero with animated typing effect
- About Me with stats
- Skills & Tools with tabbed interface
- Projects showcase with filters
- Security Lab (hands-on learning)
- Security Journey timeline
- Achievements & Certifications
- GitHub repos (live API)
- Security Resources
- Contact form with validation
- Custom 404 page

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## SEO & the share card

The share card (LinkedIn, WhatsApp, X, Slack, Discord) and the canonical link
need the site's **absolute** URL. Social scrapers do not run JavaScript and do
not resolve relative paths, so these are baked into `index.html` at build time
by `plugins/seo.js`, which also emits `robots.txt` and `sitemap.xml`.

The URL is detected automatically, in this order:

1. `VITE_SITE_URL` — explicit override, always wins
2. `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` — set by Vercel
3. `URL` / `DEPLOY_PRIME_URL` — set by Netlify
4. `http://localhost:3000` — local fallback

On Vercel or Netlify nothing needs configuring. Anywhere else — including a
local `npm run build` whose `dist/` you upload by hand — set `VITE_SITE_URL`,
or the card will point at localhost and fail to render.

```bash
VITE_SITE_URL=https://your-domain.com npm run build
```

After deploying, prime the scrapers' caches:
- LinkedIn: https://www.linkedin.com/post-inspector/
- Facebook/WhatsApp: https://developers.facebook.com/tools/debug/
- X: https://cards-dev.twitter.com/validator
- Google: submit `sitemap.xml` in Search Console

## Deployment to GitHub Pages

### 1. Update Configuration

Edit `src/config/site.js` with your real info:
- Email address
- LinkedIn URL
- Twitter URL

### 2. Set Up GitHub Repository

```bash
git init
git add .
git commit -m "Initial portfolio deployment"
git remote add origin https://github.com/prince-dualsec/portfolio.git
git branch -M main
git push -u origin main
```

### 3. Deploy to GitHub Pages

```bash
# Install gh-pages
npm install -g gh-pages

# Deploy
npm run deploy
```

Or use GitHub Actions (recommended):

1. Go to your repo → Settings → Pages
2. Source: GitHub Actions
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Project Structure

```
portfolio/
├── public/
│   ├── favicon.svg
│   └── 404.html          # GitHub Pages SPA redirect
├── src/
│   ├── components/
│   │   ├── Navbar.jsx     # Sticky responsive nav
│   │   ├── Hero.jsx       # Landing section
│   │   ├── About.jsx      # Bio & stats
│   │   ├── Skills.jsx     # Skills tabs & tools grid
│   │   ├── Projects.jsx   # Project cards with filters
│   │   ├── SecurityLab.jsx # Hands-on labs
│   │   ├── Journey.jsx    # Timeline
│   │   ├── Achievements.jsx # Certifications
│   │   ├── GitHub.jsx     # Live GitHub repos
│   │   ├── Resources.jsx  # Security resources
│   │   ├── Contact.jsx    # Form with validation
│   │   ├── Footer.jsx     # Site footer
│   │   ├── NotFound.jsx   # Custom 404
│   │   └── ScrollToTop.jsx
│   ├── config/
│   │   ├── site.js        # Personal info
│   │   ├── skills.js      # Skills & tools
│   │   ├── projects.js    # Project data
│   │   ├── github.js      # GitHub config
│   │   ├── journey.js     # Timeline data
│   │   └── achievements.js # Certs & resources
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Customization

All data is in `src/config/` - edit those files to update:
- Personal info (`site.js`)
- Skills and tools (`skills.js`)
- Projects (`projects.js`)
- GitHub username (`github.js`)
- Journey timeline (`journey.js`)
- Certifications and resources (`achievements.js`)

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Framer Motion
- React Router
- React Icons
- React Type Animation
