# Flood Sentinel Nigeria MVP Scope

## Included

- LGA input and lookup from a curated local dataset
- Flood risk response (`low`, `medium`, `high`) with timeframe
- Plain-language advisories generated through Gemini when configured
- Fallback advisory generation when Gemini key is not set
- Bilingual output: English plus one regional language chosen from the LGA’s state (South West → Yoruba; South East / South South → Igbo; North / North Central → Hausa)
- SMS-ready output constrained to 160 characters per message

## Excluded (Phase 2)

- Live satellite ingestion
- Direct NIHSA API integration
- Mobile app
- Push notifications
