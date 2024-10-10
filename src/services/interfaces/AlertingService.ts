export interface AlertingService {
  receiveAlert(serviceId: string, message: string): Promise<void>;
}
