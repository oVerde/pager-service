import { TimerService } from "../interfaces/TimerService";

/**
 * NOTE: AWS Lambda does not allow long-running processes, and execution is limited.
 * This can be achivied through AWS Step Functions or EventBridge/CloudWatch for stateful or future invocation
 * Also involves IAM permissions changes
 **/

export class MockAWSTimerService implements TimerService {
  private timers: { [key: string]: NodeJS.Timeout } = {};
  private timerIdCounter = 0;

  startTimer(duration: number, callback: () => void): string {
    const timerId = `timer-${this.timerIdCounter++}`;
    this.timers[timerId] = setTimeout(callback, duration);
    return timerId;
  }

  cancelTimer(timerId: string): void {
    clearTimeout(this.timers[timerId]);
    delete this.timers[timerId];
  }
}
