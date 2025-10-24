import type { APIRoute } from 'astro';

export const prerender = false;

// QGiv webhook endpoint to receive donation notifications
// Form: T4P Website Donation Form (embed ID: 83460)
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const payload = await request.json();

    console.log('QGiv webhook received:', JSON.stringify(payload, null, 2));

    // Determine donation type based on QGiv payload
    let donationType: 'monthly' | 'onetime' | null = null;

    // Check QGiv's actual field formats
    // isRecurring: "y" or "n" (string)
    // type: "one time" or "recurring" (string with space)
    if (
      payload.isRecurring === 'y' ||
      payload.type === 'recurring' ||
      payload.type === 'monthly' ||
      payload.eventType === 'Recurring Donation Created' ||
      payload.eventType === 'Recurring Donation Billed'
    ) {
      donationType = 'monthly';
    } else if (
      payload.isRecurring === 'n' ||
      payload.type === 'one time' ||
      payload.type === 'onetime' ||
      payload.type === 'one-time' ||
      payload.eventType === 'Donation Created' ||
      payload.eventType === 'Transaction Successful'
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
