import axios from 'axios';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private provider: 'resend' | 'postmark';

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as 'resend' | 'postmark') || 'resend';
    this.apiKey = process.env.EMAIL_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@sonder.fm';
  }

  async sendWaitlistConfirmation(
    email: string,
    name: string | undefined,
    position: number,
    referralCode: string
  ): Promise<void> {
    const subject = 'Welcome to the Sonder.fm Waitlist! 🎵';
    const displayName = name || 'Music Lover';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Sonder.fm</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .position-badge {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              display: inline-block;
              margin: 20px 0;
            }
            .referral-code {
              background: #f3f4f6;
              border: 2px dashed #d1d5db;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .referral-code code {
              font-size: 18px;
              font-weight: bold;
              color: #8b5cf6;
              background: white;
              padding: 8px 16px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #8b5cf6, #ec4899);
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 12px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">S</div>
              <h1 style="margin: 0; color: #1f2937;">Welcome to Sonder.fm!</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">You're officially on the waitlist</p>
            </div>

            <p>Hey ${displayName},</p>

            <p>Welcome to the future of music sharing! We're thrilled to have you join the Sonder.fm community.</p>

            <div style="text-align: center;">
              <div class="position-badge">
                You're #${position} in line
              </div>
            </div>

            <p>While you wait, here's your personal referral code to share with friends:</p>

            <div class="referral-code">
              <p style="margin: 0 0 10px 0; font-weight: 600;">Your Referral Code</p>
              <code>${referralCode}</code>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                Share this code and move up the waitlist for each friend who joins!
              </p>
            </div>

            <p>Here's what you can expect:</p>
            <ul style="color: #4b5563;">
              <li>🎵 <strong>Early Access:</strong> Be first to experience the future of music sharing</li>
              <li>✨ <strong>Exclusive Features:</strong> Special perks for early members</li>
              <li>💝 <strong>Shape the Platform:</strong> Your feedback will help us build something amazing</li>
            </ul>

            <div style="text-align: center;">
              <a href="https://sonder.fm?ref=${referralCode}" class="cta-button">
                Share Your Referral Link
              </a>
            </div>

            <p>We'll email you as soon as it's your turn to join. In the meantime, follow us on social media for updates and sneak peeks!</p>

            <p>Thanks for being part of the journey,<br>
            <strong>The Sonder.fm Team</strong></p>

            <div class="footer">
              <p>
                <a href="https://sonder.fm" style="color: #8b5cf6;">Sonder.fm</a> •
                Connect. Share. Vibe.
              </p>
              <p style="margin-top: 10px;">
                This email was sent because you joined our waitlist.
                <a href="#" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to Sonder.fm, ${displayName}!

      You're officially on the waitlist and you're #${position} in line.

      Your referral code: ${referralCode}
      Share this code with friends to move up the waitlist!

      We'll email you as soon as it's your turn to join.

      Thanks for being part of the journey!
      The Sonder.fm Team
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  private async sendEmail(data: EmailData): Promise<void> {
    if (!this.apiKey) {
      console.warn('Email API key not configured, skipping email send');
      return;
    }

    try {
      if (this.provider === 'resend') {
        await this.sendWithResend(data);
      } else {
        await this.sendWithPostmark(data);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  private async sendWithResend(data: EmailData): Promise<void> {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: this.fromEmail,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  private async sendWithPostmark(data: EmailData): Promise<void> {
    await axios.post(
      'https://api.postmarkapp.com/email',
      {
        From: this.fromEmail,
        To: data.to,
        Subject: data.subject,
        HtmlBody: data.html,
        TextBody: data.text,
      },
      {
        headers: {
          'X-Postmark-Server-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export const emailService = new EmailService();