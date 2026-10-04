# LIFE OS — 365-Day Performance System

Personal operating system. **All metrics start at zero.** Data appears only after you submit it.

## Program period
**1 October 2026 → 31 December 2027**

## Features
- Dashboard — only your submitted data (empty until you add something)
- Today — tasks + habits (you create them)
- Hourly Log — log every hour 05:00–22:00
- Daily Submit — checkboxes + numbers + Submit button
- Daily Selfie — Camera **or** folder upload · high quality (1920px, JPEG 92%) · camera shots get date+time stamp on image · download day-wise or all
- Sports — log sport, duration, intensity daily
- Goals / Habits / Demat Investments
- Advanced Analytics — built only from your submissions
- Export — JSON full dump + CSV daily logs + all selfies

## Run locally

```bash
cd life-os
npm install
npm run dev
```

Open http://localhost:3000

## Deploy (Vercel)

```bash
npm i -g vercel
vercel
```

Or push to GitHub → import on vercel.com

## Data storage
Everything is stored in your browser (localStorage). Clear site data = reset to zero.
Selfies are stored as compressed high-quality JPEG data URLs.

## Tech
Next.js 14 · TypeScript · Tailwind · Prisma schema included (optional SQLite)
