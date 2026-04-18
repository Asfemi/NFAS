# NFAS
Nigeria Flood Alert System, enriching grassroot communities and farmers with needed timely flood information to prevent flooding losses

# Flood Sentinel Nigeria 

A multilingual flood alert and advisory system that transforms complex flood risk data into clear, actionable warnings for communities across Nigeria.

## Problem

Nigeria already has flood forecasting data (e.g., NIHSA, Google Flood Models), but:

- It does not reach local communities effectively
- It is not easy to understand
- It is not actionable
- It is not localized or multilingual

This leads to preventable loss of lives and property.

## Solution

Flood Sentinel Nigeria bridges this gap by:

- Accepting a user's **Local Government Area (LGA)**
- Retrieving flood risk data
- Converting it into **plain-language advice**
- Returning **English** plus **one regional language** per LGA (South West → Yoruba; South East / South South → Igbo; North / North Central → Hausa)
- Formatting it into **SMS-ready alerts (≤160 characters)**

##  MVP Scope

### Features
- LGA-based flood risk query
- AI-generated plain-language alerts
- Bilingual SMS output: English + auto-selected regional language for the LGA’s state
- SMS-ready formatting
- Lightweight web interface

### Not Included (Phase 2)
- Live satellite data integration
- Direct NIHSA API connection
- Mobile app
- Real-time push notifications

---

## How It Works

1. User selects or inputs their LGA
2. System retrieves flood risk level from dataset
3. AI generates:
   - Risk explanation
   - Safety advice
4. Output is:
   - Translated into 4 languages
   - Condensed into SMS format

---

## Tech Stack

- **Frontend:** Web (React / Next.js or similar)
- **Backend:** Node.js / Python (API layer)
- **AI Engine:** Google Gemini API
- **Data Source:** Curated flood-risk dataset (LGA-based)
- **Deployment:** Vercel / Cloudflare / Firebase

---

## Project Structure

/frontend
/backend
/data
/docs

## 📊 Data Model (MVP)

```json
{
  "lga": "Lokoja",
  "state": "Kogi",
  "risk_level": "high",
  "timeframe": "7 days"
}
```

## Supported Languages
English
Hausa
Yoruba
Igbo

## Contributing
Pick an issue
Create a branch
Submit a PR

⚠️ Disclaimer

This system provides advisory alerts and does not replace official emergency services.
