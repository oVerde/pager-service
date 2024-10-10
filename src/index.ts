import {
  PagerService,
  TimerServiceImplementation,
  EmailServiceImplementation,
  SMSServiceImplementation,
} from "./services";
import {
  MonitoredService,
  EscalationPolicy,
  EscalationLevel,
  Alert,
  EmailTarget,
  SMSTarget,
} from "./domain";
import { ServiceId } from "./types";

// Instantiate service implementations
const timerService = new TimerServiceImplementation();
const emailService = new EmailServiceImplementation();
const smsService = new SMSServiceImplementation();

// Create targets
const emailTarget1 = new EmailTarget(
  "target1",
  "engineer@saleslights.com",
  emailService,
);
const smsTarget1 = new SMSTarget("target2", "+1234567890", smsService);

// Create escalation levels
const level1 = new EscalationLevel(0, [emailTarget1, smsTarget1]);

// Create escalation policy
const escalationPolicy = new EscalationPolicy([level1]);

// Create monitored service
const monitoredService = new MonitoredService(
  "service1",
  escalationPolicy,
  timerService,
);

// Create pager service and add monitored service
const pagerService = new PagerService(timerService);
pagerService.addMonitoredService(monitoredService);

// Process an alert
const alert = new Alert("Service is down", "service1");
pagerService.processAlert(alert);

// Later, process acknowledgment
pagerService.processAcknowledgment("service1");

// Or, process a healthy event
pagerService.processHealthyEvent("service1");
