# NFAS - Flood Sentinel Nigeria

Flood Sentinel Nigeria is a multilingual flood alert and advisory MVP for Nigerian communities and farmers.

It accepts an LGA, looks up flood risk data, and returns clear SMS-ready advisories in:

- English
- Hausa
- Yoruba
- Igbo

## MVP Features

- LGA-based flood risk query from local dataset
- Live flood risk lookup from Open-Meteo Flood API (with local fallback)
- Plain-language advisory generation
- Multilingual output in four languages
- SMS-ready messages capped at 160 characters
- Lightweight web interface

## Tech Stack

- Frontend: Next.js (App Router)
- Backend: Next.js Route Handlers + simple service modules
- AI: Gemini API (optional, with fallback)
- Data: Local curated JSON dataset

## Project Structure

- `frontend` - UI components
- `backend` - alert generation and lookup logic
- `data` - LGA flood-risk dataset
- `docs` - scope and supporting documentation

## Environment Setup

Create a `.env.local` file:

```bash
GEMINI_API_KEY=your_api_key_here
```

If `GEMINI_API_KEY` is not set, the app still works with built-in fallback advisories.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Disclaimer

This system provides advisory alerts and does not replace official emergency services.
