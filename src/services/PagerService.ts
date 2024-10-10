import { ServiceId } from "../types";
import { MonitoredService } from "../domain/models/MonitoredService";
import { TimerService } from "./interfaces/TimerService";
import { Alert } from "../domain/models/Alert";

export class PagerService {
  private monitoredServices: Map<ServiceId, MonitoredService>;

  constructor(private timerService: TimerService) {
    this.monitoredServices = new Map();
  }

  addMonitoredService(service: MonitoredService): void {
    this.monitoredServices.set(service.id, service);
  }

  processAlert(alert: Alert): void {
    const service = this.monitoredServices.get(alert.serviceId);
    if (service) {
      service.receiveAlert(alert);
    } else {
      // TODO: handle unknown service
    }
  }

  processAcknowledgment(serviceId: ServiceId): void {
    const service = this.monitoredServices.get(serviceId);
    if (service) {
      service.acknowledgeAlert();
    }
  }

  processHealthyEvent(serviceId: ServiceId): void {
    const service = this.monitoredServices.get(serviceId);
    if (service) {
      service.receiveHealthyEvent();
    }
  }
}
