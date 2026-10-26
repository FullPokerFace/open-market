# Open Market

A free, open-source earnings calendar, made for its users to create and maintain features together as a community.

- Every company reporting earnings, by day, week or month, marked by when it reports and whether it beat, missed or was mixed
- Your own ticker lists, a watchlist and search
- Market sentiment (CNN Fear & Greed) and the next Fed, CPI, jobs and GDP releases
- Company details: EPS and revenue against estimates, surprise history, SEC filings

See what's live and what's next on the in-app Roadmap page (`/roadmap`), or in `docs/features.html`.

## Contributing

Open Market is built by the people who use it. Suggest a feature (in the app or as an issue), pick something off the roadmap, or fix a bug, then open a pull request at [github.com/FullPokerFace/open-market](https://github.com/FullPokerFace/open-market).

## Getting started

Needs Node.js, a free [Finnhub](https://finnhub.io) API key and a MongoDB Atlas user. Copy `example.env` to `.env.local` and fill it in; the main values are:

```bash
FINNHUB_API_KEY=your_key
MONGO_DB_USER=your_mongo_user
MONGO_DB_PASSWORD=your_mongo_password
# Optional: the "Suggest a feature" board (moderation and card titles by OpenAI)
OPEN_AI_KEY=your_openai_key
# Optional: emails each suggestion to you through Gmail SMTP
GMAIL_SENDER_ADDRESS=you@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Every request sent to Finnhub is logged in the server console.

Built with Next.js 16 (App Router), Tailwind CSS v4 and shadcn/ui (Base UI). Design notes are in `docs/DESIGN.md`.

## Credits

Data from [Finnhub](https://finnhub.io), [SEC EDGAR](https://www.sec.gov/edgar), [Kalshi](https://kalshi.com) and [CNN Fear & Greed](https://www.cnn.com/markets/fear-and-greed). Design inspired by [ArtCraft](https://getartcraft.com).

Open Market is for information only and isn't investment advice.
