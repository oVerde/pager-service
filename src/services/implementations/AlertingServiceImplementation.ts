import { Alert } from "../../domain";
import { AlertingService } from "../interfaces/AlertingService";
import { PagerService } from "../PagerService";

/**
 * AlertingService is responsible for receiving alerts from monitored services
 * and forwarding them to the PagerService.
 **/
export class AlertingServiceImpl implements AlertingService {
  constructor(private pagerService: PagerService) {}

  async receiveAlert(serviceId: string, message: string): Promise<void> {
    const alert = new Alert(message, serviceId);
    await this.pagerService.processAlert(alert);
  }
}
