import type { APIRoute } from 'astro';

export const prerender = false;

// QGiv webhook endpoint to receive donation notifications
// Form: T4P Website Donation Form (embed ID: 83460)
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const payload = await request.json();

    console.log('QGiv webhook received:', JSON.stringify(payload, null, 2));

    // Determine donation type based on QGiv event
    // QGiv sends different events: "Recurring Donation Created" for monthly, regular donation events for one-time
    let donationType: 'monthly' | 'onetime' | null = null;

    // Check various fields that might indicate recurring donation
    if (
      payload.eventType === 'Recurring Donation Created' ||
      payload.eventType === 'Recurring Donation Billed' ||
      payload.recurringDonation === true ||
      payload.recurring === true ||
      payload.isRecurring === true ||
      payload.donationType === 'recurring' ||
      payload.frequency === 'monthly'
    ) {
      donationType = 'monthly';
    } else if (
      payload.eventType === 'Donation Created' ||
      payload.eventType === 'Transaction Successful' ||
      payload.recurring === false ||
      payload.isRecurring === false ||
      payload.donationType === 'one-time'
    ) {
      donationType = 'onetime';
    }

    // If we detected a donation type, store it in a cookie for the frontend to read
    if (donationType) {
      // Set a short-lived cookie (30 seconds) that the frontend can check
      cookies.set('donation_completed', donationType, {
        path: '/',
        maxAge: 30,
        httpOnly: false, // Make it accessible to JavaScript
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      console.log(`Donation webhook processed: ${donationType} donation`);

      return new Response(JSON.stringify({
        success: true,
        donationType,
        message: 'Donation tracked successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // If we couldn't determine the donation type, log the payload for debugging
    console.warn('Could not determine donation type from payload:', payload);

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook received but donation type unclear',
      payload
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error processing QGiv webhook:', error);

    return new Response(JSON.stringify({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// Handle OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
