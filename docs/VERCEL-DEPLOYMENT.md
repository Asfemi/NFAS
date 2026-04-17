# Vercel Deployment Guide

## Production Deployment Checklist

### Step 1: Prepare Your Repository
```bash
# Make sure everything is committed
git add .
git commit -m "Prepare for Vercel deployment with SMS features"
```

### Step 2: Connect to Vercel

#### Option A: CLI
```bash
npm i -g vercel
vercel
```

#### Option B: Web Interface
1. Go to [vercel.com](https://vercel.com)
2. Sign in / Sign up
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Select your project and deploy

### Step 3: Set Environment Variables

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add the following:

| Variable | Value | Required |
|----------|-------|----------|
| `TWILIO_ACCOUNT_SID` | `ACa1c6a6c9e5f4e8ef2de868874f5f7ca` | ✅ |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | ✅ |
| `TWILIO_PHONE_NUMBER` | `+2348165595886` | ✅ |
| `DATABASE_URL` | PostgreSQL connection string (optional) | ⚠️ |

### Step 4: Deploy

#### From CLI
```bash
vercel --prod
```

#### From Web
- Click "Deploy"
- Wait for build to complete
- Your app will be live at `https://your-project.vercel.app`

## Environment Variables Setup

### Vercel Storage (Recommended)
For persistent SMS subscriptions storage:

1. Go to **Storage** → **Create Database** → **Postgres**
2. Select your region
3. Vercel will create `DATABASE_URL` automatically
4. Update `backend/sms-db.ts` to implement database queries

### Alternative: External Databases

#### Firebase Realtime Database
```
FIREBASE_API_KEY=xxx
FIREBASE_PROJECT_ID=xxx
DATABASE_URL=https://xxx.firebaseio.com
```

#### MongoDB Atlas
```
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/dbname
```

#### Supabase (Postgres)
```
DATABASE_URL=postgresql://user:password@host/dbname
```

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Build succeeds (`vercel --prod`)
- [ ] SMS endpoint working (`/api/alerts/sms`)
- [ ] Twilio phone number correct
- [ ] Database configured (if using one)
- [ ] Error logging enabled
- [ ] CORS configured if needed
- [ ] Domain configured (custom domain)
- [ ] SSL certificate (automatic with Vercel)

## Monitoring & Debugging

### View Logs
```bash
vercel logs your-project-name
```

### Test SMS Endpoint
```bash
curl -X GET https://your-project.vercel.app/api/alerts/sms/test
```

### Test Twilio Configuration
```bash
curl -X POST https://your-project.vercel.app/api/alerts/sms/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+2348165595886",
    "message": "Test SMS from Vercel"
  }'
```

## Implementing Database Support

Update `backend/sms-db.ts` to connect to your database:

### Example: Vercel Postgres
```typescript
import { sql } from '@vercel/postgres';

export async function getSubscriptionsForLga(lga: string): Promise<SMSSubscriptionRecord[]> {
  try {
    const result = await sql`
      SELECT * FROM sms_subscriptions 
      WHERE lga = ${lga} AND active = true
    `;
    return result.rows as SMSSubscriptionRecord[];
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}
```

Install Vercel Postgres:
```bash
npm install @vercel/postgres
```

## Performance Optimization

### For Vercel Functions
- SMS sending is async and non-blocking
- Typical SMS send time: 1-3 seconds
- Timeout: 30 seconds (can increase in Pro plan)

### Recommended Pro Plan Features
- Extended timeout (up to 300 seconds)
- Custom domains
- Password protection
- Advanced analytics

## Troubleshooting

### Build Fails
```bash
# Check build logs in Vercel Dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies

npm run build  # Test locally first
```

### SMS Not Sending
1. Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
2. Check Twilio phone number format
3. Review Twilio logs at [console.twilio.com](https://console.twilio.com)
4. Check Vercel function logs

### Database Connection Issues
1. Verify `DATABASE_URL` format
2. Check firewall/security groups
3. Verify credentials
4. Test connection locally with `psql`

## Cost Estimates

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Vercel | ✅ Generous | Unlimited deployments |
| Twilio | SMS: $0.0075/msg | Per SMS sent |
| Vercel Postgres | ✅ Included | 60 database connections |

## Next Steps

1. Deploy to Vercel
2. Configure SMS database
3. Set up monitoring
4. Add rate limiting
5. Configure custom domain
6. Set up CI/CD for automated deployments

## Support

- Vercel Docs: https://vercel.com/docs
- Twilio Docs: https://www.twilio.com/docs
- Next.js Docs: https://nextjs.org/docs
