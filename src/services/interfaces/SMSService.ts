export interface SMSService {
  sendSMS(to: string, message: string): Promise<void>;
}
