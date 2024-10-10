import { SMSService } from "../interfaces/SMSService";

export class SMSServiceImplementation implements SMSService {
  async sendSMS(to: string, message: string): Promise<void> {
    // For the purposes of this domain logic implementation, we'll log the SMS.
    console.log(`SMS sent to ${to} with message "${message}"`);
    // In a real implementation, this method would integrate with an SMS gateway.
  }
}
