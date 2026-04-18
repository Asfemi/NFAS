# SMS Alert Features - Setup Guide

## Overview
The SMS alert system is now integrated with Twilio, allowing users to receive flood alerts via SMS in their preferred language.

## Configuration

### Step 1: Update .env.local
Set your Twilio credentials in `.env.local`:
- `TWILIO_ACCOUNT_SID`: Your Account SID (starts with AC)
- `TWILIO_AUTH_TOKEN`: Your Auth Token
- `TWILIO_PHONE_NUMBER`: Your Twilio sending phone number

### Step 2: Get Your Twilio Phone Number
1. Go to [Twilio Console](https://www.twilio.com/console/phone-numbers/incoming)
2. Find your active phone number
3. Copy it (format: +1XXXXXXXXXX or +234XXXXXXXXXX)
4. Update `TWILIO_PHONE_NUMBER` in `.env.local`

## API Endpoints

### SMS Subscription Endpoint
**Base URL:** `/api/alerts/sms`

#### Subscribe to Alerts
```bash
POST /api/alerts/sms
Content-Type: application/json

{
  "action": "subscribe",
  "phoneNumber": "0801234567",  # or +234801234567
  "lga": "Lokoja",
  "preferredLanguage": "en"  # en, ha, yo, ig
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS alert subscription created for +234801234567",
  "subscription": {
    "phoneNumber": "+234801234567",
    "lga": "Lokoja",
    "state": "Kogi",
    "preferredLanguage": "en",
    "createdAt": "2026-04-17T...",
    "active": true
  },
  "smsPreview": "Flood alert text...",
  "welcomeMessageSent": true
}
```

#### Unsubscribe from Alerts
```bash
POST /api/alerts/sms
Content-Type: application/json

{
  "action": "unsubscribe",
  "phoneNumber": "0801234567"
}
```

#### Send Alert to All Subscribers of an LGA
```bash
POST /api/alerts/sms
Content-Type: application/json

{
  "action": "send",
  "lga": "Lokoja"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS alerts sent to 5 subscribers",
  "sent": 5,
  "failed": 0,
  "total": 5,
  "alerts": [
    {
      "phoneNumber": "+234801234567",
      "language": "en",
      "message": "Flood alert text...",
      "status": "sent",
      "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  ]
}
```

#### Check Subscription Status
```bash
GET /api/alerts/sms?phone=0801234567
```

### Test SMS Endpoint
**URL:** `/api/alerts/sms/test`

#### Send Test SMS
```bash
POST /api/alerts/sms/test
Content-Type: application/json

{
  "to": "+234801234567",
  "message": "Hello! This is a test SMS from Flood Sentinel Nigeria."
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SMxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "from": "+1234567890",
  "to": "+234801234567",
  "message": "SMS sent successfully to +234801234567"
}
```

#### Check Configuration
```bash
GET /api/alerts/sms/test
```

## Frontend Integration

### SMSAlertComponent
Located in `frontend/components/sms-alert.tsx`

The component is automatically included in the alert form results. It provides:
- Phone number input with Nigerian number validation
- Language preference selector
- SMS preview showing truncated message
- Success/error feedback
- Welcome message confirmation

### User Flow
1. User searches for flood alerts by LGA
2. Gets alert information and risk level
3. Sees "Stay Updated via SMS" section
4. Clicks "Subscribe to SMS Alerts"
5. Enters phone number and selects language
6. Receives confirmation and welcome SMS

## Phone Number Formats

The system accepts multiple Nigerian phone number formats:
- `0801234567` (local format)
- `+234801234567` (international format)
- `234801234567` (without +)

All are normalized to `+234XXXXXXXXXX` internally.

## Troubleshooting

### SMS Not Sending
1. Check that `TWILIO_PHONE_NUMBER` is set in `.env.local`
2. Verify the phone number format is correct (starts with + or country code)
3. Check Twilio account has sufficient credits
4. Review logs in terminal for error messages

### Test Configuration
```bash
# Check if Twilio is configured
curl http://localhost:3000/api/alerts/sms/test

# Send a test SMS
curl -X POST http://localhost:3000/api/alerts/sms/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+234801234567",
    "message": "Test message"
  }'
```

### Database for Production
Currently, subscriptions are stored in-memory. For production:
1. Set up a database (PostgreSQL, MongoDB, etc.)
2. Persist subscriptions to database instead of Map
3. Add subscription expiration and renewal logic
4. Track message delivery status

## Security Notes
- Credentials are in `.env.local` (never commit to git)
- Phone numbers are validated before sending
- Messages are truncated to 160 characters (SMS standard)
- Consider rate limiting for SMS sending
