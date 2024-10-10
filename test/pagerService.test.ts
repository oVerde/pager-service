import { MonitoredService } from "../src/domain/models/MonitoredService";
import { EscalationPolicy } from "../src/domain/models/EscalationPolicy";
import { EscalationLevel } from "../src/domain/models/EscalationLevel";
import { EmailTarget } from "../src/domain/targets/EmailTarget";
import { SMSTarget } from "../src/domain/targets/SMSTarget";
import { Alert } from "../src/domain/models/Alert";
import { PagerService } from "../src/services/PagerService";
import { ServiceState } from "../src/domain/enums/ServiceState";
import { TimerService } from "../src/services/interfaces/TimerService";
import { EmailService } from "../src/services/interfaces/EmailService";
import { SMSService } from "../src/services/interfaces/SMSService";

// Mock implementations
const mockEmailService: EmailService = {
  sendEmail: jest.fn().mockResolvedValue(undefined),
};

const mockSMSService: SMSService = {
  sendSMS: jest.fn().mockResolvedValue(undefined),
};

let timerCallbacks: { [key: string]: () => void } = {};
let timerIdCounter = 0;

const mockTimerService: TimerService = {
  startTimer: jest.fn((duration: number, callback: () => void) => {
    const timerId = `timer-${timerIdCounter++}`;
    timerCallbacks[timerId] = callback;
    return timerId;
  }),
  cancelTimer: jest.fn((timerId: string) => {
    delete timerCallbacks[timerId];
  }),
};

// Helper function to simulate timer expiration
const triggerTimer = (timerId: string) => {
  const callback = timerCallbacks[timerId];
  if (callback) {
    callback();
    delete timerCallbacks[timerId];
  }
};

describe("PagerService", () => {
  let pagerService: PagerService;
  let monitoredService: MonitoredService;
  let emailTarget: EmailTarget;
  let smsTarget: SMSTarget;
  let alert: Alert;

  beforeEach(() => {
    jest.clearAllMocks();
    timerCallbacks = {};
    timerIdCounter = 0;

    emailTarget = new EmailTarget(
      "target-email",
      "engineer1@saleslights.com",
      mockEmailService,
    );
    smsTarget = new SMSTarget("target-sms", "+1234567890", mockSMSService);

    const level1 = new EscalationLevel(0, [emailTarget, smsTarget]);
    const escalationPolicy = new EscalationPolicy([level1]);

    monitoredService = new MonitoredService(
      "service1",
      escalationPolicy,
      mockTimerService,
    );

    pagerService = new PagerService();
    pagerService.addMonitoredService(monitoredService);

    alert = new Alert("Service is down", "service1");
  });

  test("should notify first-level targets when an alert is received for a healthy service", async () => {
    // Act
    pagerService.processAlert(alert);

    // Assert
    expect(monitoredService.state).toBe(ServiceState.Unhealthy);
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      "engineer1@saleslights.com",
      "Alert for Service service1",
      "Service is down",
    );
    expect(mockSMSService.sendSMS).toHaveBeenCalledWith(
      "+1234567890",
      "Alert for Service service1: Service is down",
    );
    expect(mockTimerService.startTimer).toHaveBeenCalled();
    expect(monitoredService["acknowledgmentTimerId"]).toBeDefined();
  });
});
