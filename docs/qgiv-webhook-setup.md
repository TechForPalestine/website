# QGiv Webhook Setup for Plausible Donation Tracking

This document explains how to configure QGiv webhooks to track donation conversions in Plausible Analytics.

## Overview

The donation tracking system works as follows:

1. **User completes donation** on the QGiv form (T4P Website Donation Form, embed ID: 83460)
2. **QGiv sends webhook** to our endpoint with donation details
3. **Our webhook endpoint** parses the donation type (one-time vs monthly) and sets a cookie
4. **Frontend JavaScript** detects the cookie and fires the appropriate Plausible event
5. **Plausible dashboard** records the conversion

## QGiv + Zapier Configuration

**Note:** QGiv does not have native webhook support. We use Zapier as an intermediary to send donation data to our webhook endpoint.

### Step 1: Create Zapier Account

1. Sign up for Zapier at https://zapier.com
2. QGiv integration is available on free tier (no subscription limit for webhooks)

### Step 2: Create New Zap

1. In Zapier, click **Create Zap**
2. **Trigger:** Search for "QGiv" and select it
3. **Event:** Choose one of these triggers:
   - "New Donation" (for one-time donations)
   - "New Recurring Donation" (for monthly donations)

### Step 3: Connect QGiv Account

1. Click **Sign in to QGiv**
2. Enter your QGiv API token: `tMdjmbU9CsS9e75WucmTfK8E`
3. Select the form: **T4P Website Donation Form** (embed ID: 83460)

### Step 4: Set Up Webhook Action

1. **Action:** Search for "Webhooks by Zapier"
2. **Event:** Select "POST"
3. **URL:** Enter your webhook endpoint:
   ```
   https://techforpalestine.org/api/qgiv-webhook
   ```

   For testing with preview deploy:
   ```
   https://preview-branch-name.website-xyz.pages.dev/api/qgiv-webhook
   ```

4. **Payload Type:** JSON
5. **Data:** Map QGiv fields to JSON payload:
   ```json
   {
     "eventType": "Donation Created",
     "donationType": "{{donation_type}}",
     "recurring": "{{is_recurring}}",
     "amount": "{{amount}}",
     "donorEmail": "{{email}}",
     "transactionId": "{{transaction_id}}"
   }
   ```

### Step 5: Create Second Zap for Recurring Donations

Repeat Steps 2-4 with these changes:
- **Trigger Event:** "New Recurring Donation"
- **Data payload eventType:** "Recurring Donation Created"

### Step 6: Test Your Zaps

1. Click **Test trigger** to fetch a sample donation from QGiv
2. Click **Test action** to send test webhook
3. Check server logs for: `"QGiv webhook received:"`
4. If successful, click **Publish** on both Zaps

## Webhook Endpoint Details

### Endpoint: `/api/qgiv-webhook`

**Method:** POST

**Expected Payload Fields:**

The webhook endpoint checks for these fields to determine donation type:

**Monthly/Recurring indicators:**
- `eventType === 'Recurring Donation Created'`
- `eventType === 'Recurring Donation Billed'`
- `recurringDonation === true`
- `recurring === true`
- `isRecurring === true`
- `donationType === 'recurring'`
- `frequency === 'monthly'`

**One-time indicators:**
- `eventType === 'Donation Created'`
- `eventType === 'Transaction Successful'`
- `recurring === false`
- `isRecurring === false`
- `donationType === 'one-time'`

### Response

**Success (200):**
```json
{
  "success": true,
  "donationType": "monthly",
  "message": "Donation tracked successfully"
}
```

**Error (500):**
```json
{
  "error": "Failed to process webhook",
  "details": "Error message"
}
```

## Frontend Integration

The donate page (`/src/pages/donate.astro`) includes JavaScript that:

1. **Polls for cookie** every 2 seconds for up to 60 seconds
2. **Reads `donation_completed` cookie** (value: `monthly` or `onetime`)
3. **Fires Plausible event:**
   - `Monthly-donate` for monthly donations
   - `One-time-donate` for one-time donations
4. **Clears the cookie** after tracking

## Testing

### Local Testing

1. Start dev server: `yarn dev`
2. Use a webhook testing tool like ngrok to expose localhost:
   ```bash
   ngrok http 4321
   ```
3. Configure QGiv webhook to point to ngrok URL: `https://your-ngrok-url.ngrok.io/api/qgiv-webhook`
4. Make a test donation
5. Check console logs for:
   - `"QGiv webhook received:"` (in server logs)
   - `"✅ Tracked: Monthly-donate (via webhook)"` (in browser console)

### Production Testing

1. Deploy to production or preview environment
2. Make a test donation on the live donate page
3. Check browser console for tracking confirmation
4. Verify conversion appears in Plausible dashboard

## Debugging

### Check Server Logs

The webhook endpoint logs all incoming payloads:
```
QGiv webhook received: {full payload JSON}
```

If donation type cannot be determined:
```
Could not determine donation type from payload: {payload}
```

### Check Browser Console

When a donation is tracked:
```
✅ Tracked: Monthly-donate (via webhook)
```
or
```
✅ Tracked: One-time-donate (via webhook)
```

### Common Issues

**Issue:** Webhook not firing
- **Solution:** Check QGiv webhook configuration, verify URL is correct
- **Solution:** Check that events (Donation Created, Recurring Donation Created) are enabled

**Issue:** Donation type not detected
- **Solution:** Check server logs for webhook payload structure
- **Solution:** Update `/src/pages/api/qgiv-webhook.ts` to handle QGiv's actual field names

**Issue:** Frontend not tracking
- **Solution:** Check if cookie is being set (`document.cookie` in console)
- **Solution:** Verify donate page is polling for cookie (check console logs)

**Issue:** Duplicate tracking
- **Solution:** Cookie should be cleared after first detection
- **Solution:** Check that polling interval stops after 60 seconds

## Plausible Goal Setup

Make sure these goals exist in your Plausible dashboard:

1. Go to Plausible Settings → Goals
2. Verify these custom events exist:
   - `One-time-donate`
   - `Monthly-donate`

(Based on your screenshot, these are already configured)

## Security Considerations

- Webhook endpoint accepts POST requests from any origin
- Consider adding signature verification if QGiv provides webhook signatures
- Cookie is set with `httpOnly: false` to allow JavaScript access
- Cookie expires after 30 seconds to limit exposure
- Secure flag is enabled in production

## Files Modified

- `/src/pages/api/qgiv-webhook.ts` - Webhook endpoint
- `/src/pages/donate.astro` - Frontend tracking code
- `/docs/qgiv-webhook-setup.md` - This documentation

## Support

If you need to modify the webhook logic or add support for additional fields:

1. Check QGiv API documentation: https://www.qgiv.com/api/
2. Contact QGiv support for webhook payload documentation
3. Update the field checks in `/src/pages/api/qgiv-webhook.ts`
