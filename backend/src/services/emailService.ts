import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = Number(process.env.SMTP_PORT) || 465;
      const secure = process.env.SMTP_SECURE !== 'false';
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        throw new Error('SMTP_USER and SMTP_PASS environment variables must be configured.');
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }
    return this.transporter;
  }

  async sendInviteOtp(toEmail: string, otp: string, spaceName: string, recipientName?: string): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const from = process.env.EMAIL_FROM || 'Bhagabhagi <iambetadev@gmail.com>';
      const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Bhagabhagi</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Shared Expense Tracker</p>
          </div>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 12px 0; color: #1e293b; font-size: 15px;">${greeting}</p>
            <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">
              You have been invited to join <strong>${spaceName}</strong>. Use the one-time verification code below to access your space.
            </p>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background: #eef2ff; border: 1.5px dashed #6366f1; border-radius: 10px; padding: 14px 28px; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #4338ca;">
              ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">This code expires in 10 minutes and can only be used once.</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0;">If you didn't request this code or weren't expecting this invite, you can safely ignore this email.</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from,
        to: toEmail,
        subject: `Your verification code for ${spaceName} is ${otp}`,
        text: `${greeting}\n\nYour one-time verification code to join ${spaceName} is: ${otp}\n\nThis code expires in 10 minutes.\n\n— Bhagabhagi Team`,
        html,
      });

      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send invite OTP email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
