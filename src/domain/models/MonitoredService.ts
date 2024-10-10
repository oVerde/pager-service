import { ServiceId } from "../../types";
import { ServiceState } from "../enums";
import { EscalationPolicy } from "./EscalationPolicy";
import { Alert } from "./Alert";
import { TimerService } from "../../services/interfaces/TimerService";

export class MonitoredService {
  id: ServiceId;
  state: ServiceState;
  escalationPolicy: EscalationPolicy;
  currentAlert?: Alert;
  acknowledgmentTimerId?: string;
  private timerService: TimerService;

  constructor(
    id: ServiceId,
    escalationPolicy: EscalationPolicy,
    timerService: TimerService,
  ) {
    this.id = id;
    this.state = ServiceState.Healthy;
    this.escalationPolicy = escalationPolicy;
    this.timerService = timerService;
  }

  receiveAlert(alert: Alert): void {
    if (this.state === ServiceState.Healthy) {
      this.state = ServiceState.Unhealthy;
      this.currentAlert = alert;
      alert.escalationLevelNumber = 0;
      this.notifyCurrentLevelTargets();
      this.startAcknowledgmentTimer();
    }
    // Do nothing if already Unhealthy
  }

  receiveHealthyEvent(): void {
    this.state = ServiceState.Healthy;
    if (this.acknowledgmentTimerId) {
      this.timerService.cancelTimer(this.acknowledgmentTimerId);
      this.acknowledgmentTimerId = undefined;
    }
    this.currentAlert = undefined;
  }

  acknowledgeAlert(): void {
    if (this.currentAlert && !this.currentAlert.acknowledged) {
      this.currentAlert.acknowledge();
      if (this.acknowledgmentTimerId) {
        this.timerService.cancelTimer(this.acknowledgmentTimerId);
        this.acknowledgmentTimerId = undefined;
      }
    }
  }

  handleAcknowledgmentTimeout(): void {
    if (this.currentAlert && !this.currentAlert.acknowledged) {
      const isLastLevel = this.escalationPolicy.isLastLevel(
        this.currentAlert.escalationLevelNumber,
      );
      if (!isLastLevel) {
        this.currentAlert.escalationLevelNumber += 1;
        this.notifyCurrentLevelTargets();
        this.startAcknowledgmentTimer();
      } else {
        // No further escalation possible
        this.acknowledgmentTimerId = undefined;
      }
    }
  }

  private notifyCurrentLevelTargets(): void {
    const level = this.escalationPolicy.getLevel(
      this.currentAlert!.escalationLevelNumber,
    );
    if (level) {
      level.targets.forEach(async (target) => {
        if (!this.currentAlert!.notifiedTargets.has(target.id)) {
          await target.notify(this.currentAlert!);
          this.currentAlert!.notifiedTargets.add(target.id);
        }
      });
    }
  }

  private startAcknowledgmentTimer(): void {
    const duration = 15 * 60 * 1000; // 15 minutes
    this.acknowledgmentTimerId = this.timerService.startTimer(duration, () => {
      this.handleAcknowledgmentTimeout();
    });
  }
}
