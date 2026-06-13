# URL Shortener

A URL shortening service built with Express and Neon Postgres, deployable on Vercel. Takes long URLs and generates short, shareable codes using a base62 encoding scheme.

**Live demo:** [https://code-alpha-url-shortner.vercel.app/](https://code-alpha-url-shortner.vercel.app/)

## Features

- Shorten any valid URL into a 7-character code
- Duplicate detection — the same long URL always returns the same short code
- Redirect via the short code to the original URL
- Admin page at `/admin` to view all stored URLs or reset the database
- Data persists across deployments via Neon Postgres
- URL validation via the `validator` library (requires `http`/`https` protocol and a valid domain, IP, or `localhost`)
- Rate limiting on `/shorten` (max 10 requests per 15 minutes per IP) to prevent abuse

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A **Neon Postgres** database (serverless Postgres). You can create one through the [Vercel Storage](https://vercel.com/docs/storage) tab or directly at [neon.tech](https://neon.tech).

## Installation

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/HelmyIsMad/CodeAlpha_URLShortner.git
cd CodeAlpha_URLShortner
npm install
```

2. Set up your Neon Postgres database and get the connection string. It looks like:

```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

3. Create a `.env` file in the project root with your connection string:

```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

4. Start the server:

```bash
npm start
```

The app runs at `http://localhost:3000`.

## Usage

| Endpoint  | Description                          |
|-----------|--------------------------------------|
| `GET /`   | Main page with a URL shortening form |
| `POST /shorten` | API to shorten a URL (JSON body: `{ "longUrl": "..." }`). Rate-limited to 10 req/15min per IP. Returns `400` for invalid URLs, `429` when rate-limited |
| `GET /:code` | Redirects a short code to the original URL |
| `GET /admin` | Admin panel to view/reset the database |

## Deployment (Vercel)

Push the repo to GitHub and import it into Vercel. Add a Neon Postgres database via the Vercel Storage tab — the `DATABASE_URL` environment variable is injected automatically. No manual `.env` setup needed on Vercel.

## Project Structure

```
├── api/
│   └── index.js           — Vercel serverless entry point
├── src/
│   ├── server.js          — Server entry point (starts listener)
│   ├── app.js             — Express app setup (middleware, routes, rate limiter)
│   ├── routes/index.js    — Route definitions
│   ├── controllers/urlController.js — Request handlers
│   ├── config/database.js — Database layer (Neon Postgres)
│   └── utils/helpers.js   — Base62 encoder, URL validator, baseURL helper
├── templates/
│   ├── index.html         — Homepage with URL shortening form
│   └── admin.html         — Admin panel
├── vercel.json            — Vercel deployment config
├── .env                   — Local environment variables (not tracked)
└── .env.example           — Example environment variables
```
