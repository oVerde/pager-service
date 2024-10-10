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

  async processAlert(alert: Alert): Promise<void> {
    const service = this.monitoredServices.get(alert.serviceId);
    if (service) {
      await service.receiveAlert(alert);
    } else {
      console.error(`Service with ID ${alert.serviceId} not found.`);
    }
  }

  async processAcknowledgment(serviceId: ServiceId): Promise<void> {
    const service = this.monitoredServices.get(serviceId);
    if (service) {
      await service.acknowledgeAlert();
    }
  }

  async processHealthyEvent(serviceId: ServiceId): Promise<void> {
    const service = this.monitoredServices.get(serviceId);
    if (service) {
      service.receiveHealthyEvent();
    }
  }
}
