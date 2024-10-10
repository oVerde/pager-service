import { Target } from "./Target";
import { Alert } from "../models/Alert";
import { SMSService } from "../../services/interfaces/SMSService";

export class SMSTarget implements Target {
  id: string;
  phoneNumber: string;
  private smsService: SMSService;

  constructor(id: string, phoneNumber: string, smsService: SMSService) {
    this.id = id;
    this.phoneNumber = phoneNumber;
    this.smsService = smsService;
  }

  async notify(alert: Alert): Promise<void> {
    await this.smsService.sendSMS(
      this.phoneNumber,
      `Alert for Service ${alert.serviceId}: ${alert.message}`,
    );
  }
}
