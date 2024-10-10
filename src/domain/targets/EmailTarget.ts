import { Target } from "./Target";
import { Alert } from "../models/Alert";
import { EmailService } from "../../services/interfaces/EmailService";

export class EmailTarget implements Target {
  id: string;
  emailAddress: string;
  private emailService: EmailService;

  constructor(id: string, emailAddress: string, emailService: EmailService) {
    this.id = id;
    this.emailAddress = emailAddress;
    this.emailService = emailService;
  }

  async notify(alert: Alert): Promise<void> {
    await this.emailService.sendEmail(
      this.emailAddress,
      `Alert for Service ${alert.serviceId}`,
      alert.message,
    );
  }
}
