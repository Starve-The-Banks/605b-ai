import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend only when API key is available (runtime, not build time)
let resend = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resendClient = getResend();
    if (!resendClient) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    const { notifications, email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json(
        { error: 'No notifications to send' },
        { status: 400 }
      );
    }

    // Build email content
    const urgentItems = notifications.filter(n => n.type === 'urgent');
    const warningItems = notifications.filter(n => n.type === 'warning');

    const emailSubject = urgentItems.length > 0
      ? '⚠️ Action Required: Credit Bureau Deadline Passed'
      : '📅 Upcoming Credit Dispute Deadlines';

    const emailBody = buildEmailBody(urgentItems, warningItems);

    // Send email via Resend
    const { data, error } = await resendClient.emails.send({
      from: '605b.ai <notifications@605b.ai>',
      to: email,
      subject: emailSubject,
      html: emailBody,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      emailId: data?.id,
    });
  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}

function buildEmailBody(urgentItems, warningItems) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>605b.ai Notification</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="padding-bottom: 24px;">
                  <h1 style="margin: 0; color: #f7d047; font-size: 24px; font-weight: 700;">
                    605b.ai
                  </h1>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="background-color: #121214; border-radius: 12px; padding: 32px; border: 1px solid #27272a;">
                  ${urgentItems.length > 0 ? `
                  <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h2 style="margin: 0 0 12px 0; color: #ef4444; font-size: 16px; font-weight: 600;">
                      ⚠️ Action Required
                    </h2>
                    ${urgentItems.map(item => `
                      <p style="margin: 8px 0; color: #fafafa; font-size: 14px; line-height: 1.5;">
                        • ${item.message}
                      </p>
                    `).join('')}
                  </div>
                  ` : ''}

                  ${warningItems.length > 0 ? `
                  <div style="background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <h2 style="margin: 0 0 12px 0; color: #f59e0b; font-size: 16px; font-weight: 600;">
                      📅 Upcoming Deadlines
                    </h2>
                    ${warningItems.map(item => `
                      <p style="margin: 8px 0; color: #fafafa; font-size: 14px; line-height: 1.5;">
                        • ${item.message}
                      </p>
                    `).join('')}
                  </div>
                  ` : ''}

                  <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                    Under the Fair Credit Reporting Act (FCRA), credit bureaus must respond to disputes within 30 days.
                    If they miss this deadline, you may have additional leverage for escalation or legal action.
                  </p>

                  <a href="https://605b.ai/dashboard/tracker" style="display: inline-block; background: linear-gradient(135deg, #f7d047 0%, #d4b840 100%); color: #09090b; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                    View Your Disputes →
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding-top: 24px; text-align: center;">
                  <p style="margin: 0; color: #52525b; font-size: 12px;">
                    You're receiving this because you have deadline reminders enabled.
                    <br>
                    <a href="https://605b.ai/dashboard/settings" style="color: #71717a;">Manage notification preferences</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
