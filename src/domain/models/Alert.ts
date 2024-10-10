import { ServiceId } from "../../types";

export class Alert {
  message: string;
  serviceId: ServiceId;
  acknowledged: boolean;
  escalationLevelNumber: number;
  notifiedTargets: Set<string>;

  constructor(message: string, serviceId: ServiceId) {
    this.message = message;
    this.serviceId = serviceId;
    this.acknowledged = false;
    this.escalationLevelNumber = 0;
    this.notifiedTargets = new Set();
  }

  acknowledge(): void {
    this.acknowledged = true;
  }
}
