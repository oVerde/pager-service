export interface TimerService {
  startTimer(duration: number, callback: () => void): string;
  cancelTimer(timerId: string): void;
}
