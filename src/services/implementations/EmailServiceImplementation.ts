import { EmailService } from "../interfaces/EmailService";

export class EmailServiceImplementation implements EmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // For the purposes of this domain logic implementation, we'll log the email.
    console.log(
      `Email sent to ${to} with subject "${subject}" and body "${body}"`,
    );
    // In a real implementation, this method would integrate with an email service provider.
  }
}
