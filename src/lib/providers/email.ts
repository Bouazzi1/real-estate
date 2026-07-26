import { Resend } from "resend";

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}

export class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    console.log("=========================================");
    console.log(`SENDING EMAIL TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log("-----------------------------------------");
    console.log(html);
    console.log("=========================================");
  }
}

export class ResendEmailProvider implements EmailProvider {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const fromAddress = process.env.EMAIL_FROM || "Elysium Residences <onboarding@resend.dev>";
    try {
      const { error } = await this.resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        console.error("Resend error sending email:", error);
        throw error;
      }
    } catch (e) {
      console.error("Failed to send email via Resend:", e);
      throw e;
    }
  }
}

export function getEmailProvider(): EmailProvider {
  // If no Resend API key is set or if key starts with placeholder 're_', default to Console in dev
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("re_") || process.env.NODE_ENV !== "production") {
    return new ConsoleEmailProvider();
  }
  return new ResendEmailProvider();
}
