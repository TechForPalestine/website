# QGiv Webhook Setup for Plausible Donation Tracking

This document explains how to configure QGiv webhooks via Zapier to track donation conversions in Plausible Analytics.

## Overview

The donation tracking system works as follows:

1. **User completes donation** on the QGiv form (T4P Website Donation Form, embed ID: 83460)
2. **QGiv triggers Zapier** when donation is processed
3. **Zapier sends webhook** to our endpoint with donation details
4. **Our webhook endpoint** parses the donation type and calls Plausible Events API directly
5. **Plausible dashboard** records the conversion immediately

**Architecture:** The webhook calls Plausible's API server-to-server, so there's no browser involvement or cookie tracking needed. This makes it reliable and fast.

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
5. **Data:** Forward all QGiv fields (use "Send as JSON" in Zapier and map the entire donation object)

### Step 5: Create Second Zap for Recurring Donations

Repeat Steps 2-4 with these changes:
- **Trigger Event:** "New Recurring Donation"
- Same webhook URL and configuration

### Step 6: Test Your Zaps

1. Click **Test trigger** to fetch a sample donation from QGiv
2. Click **Test action** to send test webhook
3. Check Zapier logs for successful webhook delivery
4. Check Plausible dashboard for the test event
5. If successful, click **Publish** on both Zaps

## Webhook Endpoint Details

### Endpoint: `/api/qgiv-webhook`

**Method:** POST

**Expected Payload Fields:**

The webhook endpoint checks QGiv's actual field formats:

**QGiv Field Structure:**
```json
{
  "isRecurring": "y" | "n",  // String, not boolean
  "type": "one time" | "recurring",  // String with space
  "form": {
    "id": "1094620",
    "name": "T4P Website Donation Form"
  },
  "value": "25.75",  // Total amount
  "id": "33627371",  // Transaction ID
  "firstName": "...",
  "lastName": "...",
  "contactEmail": "..."
}
```

**Donation Type Detection:**
- **Monthly/Recurring:** `isRecurring === "y"` OR `type === "recurring"`
- **One-time:** `isRecurring === "n"` OR `type === "one time"`

### Response

**Success (200):**
```json
{
  "success": true,
  "donationType": "onetime",
  "eventName": "One-time-donate",
  "message": "Donation tracked successfully in Plausible"
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Failed to send event to Plausible",
  "donationType": "onetime"
}
```

## Plausible Integration

The webhook calls Plausible's Events API directly:

**Endpoint:** `POST https://plausible.io/api/event`

**Payload:**
```json
{
  "domain": "techforpalestine.org",
  "name": "One-time-donate" | "Monthly-donate",
  "url": "https://techforpalestine.org/donate",
  "props": {
    "source": "webhook",
    "form": "T4P Website Donation Form",
    "amount": "25.75",
    "transactionId": "33627371"
  }
}
```

**Events Tracked:**
- `One-time-donate` - Single donations
- `Monthly-donate` - Recurring donations

## Testing

### Testing with Zapier

1. In Zapier, use "Test" feature to send sample webhook
2. Check Zapier logs for webhook response
3. Check server logs (Cloudflare Pages logs) for:
   ```
   QGiv webhook received: {payload}
   ✅ Plausible event sent: One-time-donate
   ```
4. Verify event appears in Plausible dashboard

### Testing with Real Donation

1. Make a test donation on https://techforpalestine.org/donate
2. Check Zapier dashboard for triggered Zap
3. Check Plausible dashboard (usually updates within 30 seconds)

## Debugging

### Check Zapier Logs

In Zapier dashboard:
1. Go to Zap History
2. Find the triggered Zap
3. Check webhook response:
   - ✅ 200 = Success
   - ❌ 500 = Error (check error message)

### Check Server Logs

The webhook endpoint logs all activity:
```
QGiv webhook received: {full payload JSON}
✅ Plausible event sent: One-time-donate
```

If donation type isn't detected:
```
Could not determine donation type from payload: {payload}
```

If Plausible API fails:
```
Plausible API error: {error message}
```

### Common Issues

**Issue:** Webhook not firing
- **Solution:** Check Zapier Zap is turned ON
- **Solution:** Verify QGiv trigger is configured correctly
- **Solution:** Check webhook URL is correct

**Issue:** Donation type not detected
- **Solution:** Check QGiv payload structure matches expected format
- **Solution:** Look for `isRecurring` and `type` fields in Zapier test data

**Issue:** Plausible event not appearing
- **Solution:** Check Plausible dashboard filters (date range, etc.)
- **Solution:** Verify goals exist: "One-time-donate" and "Monthly-donate"
- **Solution:** Check webhook response for Plausible API errors

**Issue:** Events tracked but wrong type
- **Solution:** Check QGiv field values in Zapier logs
- **Solution:** Verify monthly donations have `isRecurring: "y"`

## Plausible Goal Setup

Make sure these goals exist in your Plausible dashboard:

1. Go to Plausible Settings → Goals
2. Add custom events if they don't exist:
   - `One-time-donate`
   - `Monthly-donate`

## Security Considerations

- Webhook endpoint accepts POST requests from any origin (Zapier)
- No authentication required (webhook URL acts as secret)
- Consider adding IP whitelist for Zapier IPs if needed
- Plausible API is public (no authentication needed for sending events)

## Files Modified

- `/src/pages/api/qgiv-webhook.ts` - Webhook endpoint that calls Plausible API
- `/src/pages/donate.astro` - Donation page (no tracking code needed)
- `/docs/qgiv-webhook-setup.md` - This documentation

## Architecture Benefits

**Server-to-Server Tracking:**
- ✅ No browser/cookie issues
- ✅ Works with ad blockers
- ✅ Reliable and fast
- ✅ No polling or client-side complexity
- ✅ Tracks actual completed donations (not just button clicks)

## Support

If you need to modify the webhook logic:

1. Check QGiv API documentation: https://www.qgiv.com/api/
2. Check Plausible Events API: https://plausible.io/docs/events-api
3. Contact QGiv support for webhook payload documentation
4. Update field checks in `/src/pages/api/qgiv-webhook.ts`
