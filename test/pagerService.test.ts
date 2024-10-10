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

    pagerService = new PagerService(mockTimerService);
    pagerService.addMonitoredService(monitoredService);

    alert = new Alert("Service is down", "service1");
  });

  /**
   *Use Case Scenario 1:
   *Given a Monitored Service in a Healthy State,
   *When the Pager receives an Alert related to this Monitored Service,
   *Then the Monitored Service becomes Unhealthy,
   *And the Pager notifies all targets of the first level of the escalation policy,
   *And sets a 15-minutes acknowledgement delay.
   **/

  test("should notify first-level targets when an alert is received for a healthy service", async () => {
    // Act
    await pagerService.processAlert(alert);

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

  /**
   *Use Case Scenario 2:
   *Given a Monitored Service in an Unhealthy State,
   *The corresponding Alert is not Acknowledged,
   *And the last level has not been notified,
   *When the Pager receives the Acknowledgement Timeout,
   *Then the Pager notifies all targets of the next level of the escalation policy,
   *And sets a 15-minutes acknowledgement delay.
   **/

  test("should escalate to next level when acknowledgment timeout occurs without acknowledgment", async () => {
    // Arrange
    const emailTargetLevel2 = new EmailTarget(
      "target-email-2",
      "manager@saleslights.com",
      mockEmailService,
    );
    const level2 = new EscalationLevel(1, [emailTargetLevel2]);
    monitoredService.escalationPolicy.levels.push(level2);

    await pagerService.processAlert(alert);

    // Act
    // Simulate timer expiration (Acknowledgment Timeout)
    const timerId = monitoredService["acknowledgmentTimerId"]!;
    triggerTimer(timerId);

    // Assert
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      "manager@saleslights.com",
      "Alert for Service service1",
      "Service is down",
    );
    expect(monitoredService["currentAlert"]!.escalationLevelNumber).toBe(1);
    expect(mockTimerService.startTimer).toHaveBeenCalledTimes(2); // Initial and after escalation
  });

  /**
   *Use Case Scenario 3:
   *Given a Monitored Service in an Unhealthy State,
   *When the Pager receives the Acknowledgement,
   *And later receives the Acknowledgement Timeout,
   *Then the Pager doesn't notify any Target,
   *And doesn't set an acknowledgement delay.
   **/

  test("should not escalate if acknowledgment is received before timeout", async () => {
    // Arrange
    const emailTargetLevel2 = new EmailTarget(
      "target-email-2",
      "manager@saleslights.com",
      mockEmailService,
    );
    const level2 = new EscalationLevel(1, [emailTargetLevel2]);
    monitoredService.escalationPolicy.levels.push(level2);

    await pagerService.processAlert(alert);

    // Act
    // Acknowledge before timer expires
    pagerService.processAcknowledgment("service1");

    // Simulate timer expiration
    const timerId = monitoredService["acknowledgmentTimerId"]!;
    triggerTimer(timerId);

    // Assert
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1); // Only initial notifications
    expect(mockTimerService.startTimer).toHaveBeenCalledTimes(1); // Only initial timer
    expect(monitoredService["currentAlert"]!.acknowledged).toBe(true);
  });

  test("should handle duplicate acknowledgments gracefully", async () => {
    // Arrange
    await pagerService.processAlert(alert);

    // Act
    pagerService.processAcknowledgment("service1");
    pagerService.processAcknowledgment("service1"); // Duplicate acknowledgment

    // Assert
    expect(mockTimerService.cancelTimer).toHaveBeenCalledTimes(1); // Timer canceled once
    expect(monitoredService["currentAlert"]!.acknowledged).toBe(true);
  });

  /**
   *Use Case Scenario 4:
   *Given a Monitored Service in an Unhealthy State,
   *When the Pager receives an Alert related to this Monitored Service,
   *Then the Pager doesn’t notify any Target,
   *And doesn’t set an acknowledgement delay.
   **/
  test("should not notify targets when an alert is received for an unhealthy service", async () => {
    // Arrange Monitored Service is Unhealthy
    await pagerService.processAlert(alert);

    // Act Pager Receives Another Alert
    const newAlert = new Alert("Another issue detected", "service1");
    pagerService.processAlert(newAlert);

    // Assert Does Not Set Another Acknowledgement Delay
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1); // Only initial notifications
    expect(mockSMSService.sendSMS).toHaveBeenCalledTimes(1); // Only initial notification
    expect(mockTimerService.startTimer).toHaveBeenCalledTimes(1); // Only one timer
  });

  /**
   *Use Case Scenario 5:
   *Given a Monitored Service in an Unhealthy State,
   *When the Pager receives a Healthy event related to this Monitored Service,
   *And later receives the Acknowledgement Timeout,
   *Then the Monitored Service becomes Healthy,
   *And the Pager doesn’t notify any Target,
   *And doesn’t set an acknowledgement delay.
   **/
  test("should reset state when service becomes healthy before acknowledgment timeout", async () => {
    // Arrange
    await pagerService.processAlert(alert);

    // Act Monitored Service is Unhealthy
    pagerService.processHealthyEvent("service1");

    // Simulate timer expiration
    const timerId = monitoredService["acknowledgmentTimerId"]!;
    triggerTimer(timerId);

    // Assert: Does Not Set Another Acknowledgement Delay
    expect(monitoredService.state).toBe(ServiceState.Healthy);
    expect(monitoredService["currentAlert"]).toBeUndefined();
    expect(mockTimerService.cancelTimer).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1); // Only initial notifications
  });

  /**
   * Concurrency Considerations
   * Is the Pager Service allowed to send 2 notifications to the same target when 2 alerts (same or different one)
   * are received at the same time? The answer is “no” (only 1 notification is sent). So take care of this during your design phase.
   **/
  test("should prevent duplicate notifications when multiple alerts are received simultaneously", async () => {
    // Act
    await pagerService.processAlert(alert);
    const simultaneousAlert = new Alert("Simultaneous alert", "service1");
    await pagerService.processAlert(simultaneousAlert);

    // Assert
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1); // Only initial notifications
    expect(mockSMSService.sendSMS).toHaveBeenCalledTimes(1);
    expect(monitoredService["currentAlert"]!.notifiedTargets.size).toBe(2);
  });

  test("should handle unknown service gracefully", async () => {
    // Spy on console.error
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Act
    await pagerService.processAlert(
      new Alert("Service is down", "unknown-service"),
    );

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Service with ID unknown-service not found.",
    );
    consoleErrorSpy.mockRestore();
  });

  test("should handle empty escalation policy without errors", async () => {
    // Arrange
    const emptyEscalationPolicy = new EscalationPolicy([]);
    const serviceWithEmptyPolicy = new MonitoredService(
      "service2",
      emptyEscalationPolicy,
      mockTimerService,
    );
    pagerService.addMonitoredService(serviceWithEmptyPolicy);

    // Act
    const alertForService2 = new Alert("Service is down", "service2");
    await pagerService.processAlert(alertForService2);

    // Assert
    expect(serviceWithEmptyPolicy.state).toBe(ServiceState.Unhealthy);
    expect(mockEmailService.sendEmail).not.toHaveBeenCalledWith();
    expect(mockSMSService.sendSMS).not.toHaveBeenCalledWith();
    expect(mockTimerService.startTimer).toHaveBeenCalled(); // Timer should still be set
  });

  test("should not notify targets multiple times at the same escalation level", async () => {
    // Arrange
    await pagerService.processAlert(alert);

    // Simulate acknowledgment timeout to escalate
    const timerId = monitoredService["acknowledgmentTimerId"]!;
    triggerTimer(timerId);

    // Simulate another acknowledgment timeout at the same level
    const secondTimerId = monitoredService["acknowledgmentTimerId"]!;
    triggerTimer(secondTimerId);

    // Assert
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1); // Only initial notifications
    expect(mockSMSService.sendSMS).toHaveBeenCalledTimes(1);
    expect(mockTimerService.startTimer).toHaveBeenCalledTimes(1); // Initial and one retry
  });

  test("should handle exceptions in notification services gracefully", async () => {
    // Arrange
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (mockEmailService.sendEmail as jest.Mock).mockRejectedValueOnce(
      new Error("Email service error"),
    );
    await pagerService.processAlert(alert);

    // Wait for promises to settle
    await new Promise(process.nextTick);

    // Assert
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
    expect(mockSMSService.sendSMS).toHaveBeenCalled();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error notifying target"),
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});
