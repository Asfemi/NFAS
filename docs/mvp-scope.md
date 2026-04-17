# Flood Sentinel Nigeria MVP Scope

## Included

- LGA input and lookup from a curated local dataset
- Flood risk response (`low`, `medium`, `high`) with timeframe
- Plain-language advisories generated through Gemini when configured
- Fallback advisory generation when Gemini key is not set
- Multilingual output in English, Hausa, Yoruba, and Igbo
- SMS-ready output constrained to 160 characters per language

## Excluded (Phase 2)

- Live satellite ingestion
- Direct NIHSA API integration
- Mobile app
- Push notifications
