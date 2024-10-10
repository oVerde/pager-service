import { TimerService } from "../interfaces/TimerService";

/**
 * NOTE: AWS Lambda does not allow long-running processes, and execution is limited.
 * This can be achivied through AWS Step Functions or EventBridge/CloudWatch for stateful or future invocation
 * Also involves IAM permissions changes
 **/

export class TimerServiceImplementation implements TimerService {
  startTimer(duration: number, callback: () => void): string {
    const timerId = setTimeout(callback, duration);
    return timerId.toString();
  }

  cancelTimer(timerId: string): void {
    clearTimeout(Number(timerId));
  }
}
