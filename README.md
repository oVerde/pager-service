# Alert Pager Service

This project implements the domain logic for an Alert Pager Service as described in the problem statement. The service handles alerts from monitored services, escalates notifications according to defined policies, and manages acknowledgments and service health events.

## Prerequisites

- Node.js: Make sure you have Node.js (version 14 or higher) installed on your system. You can download it from Node.js Official Website.

- npm: npm is installed with Node.js. You can verify your installation by running:

```bash

  node -v
  npm -v
```

## Installation and Setup

1. Clone the repository to your local machine using Git:

2. Navigate to the Project Directory

3. Install Dependencies

```bash

    npm install

```

    This will install all dependencies listed in package.json, including development dependencies required for testing.

## Running Unit Tests

The project uses Jest as the testing framework along with TypeScript. Tests are located in the test directory.

To run the unit tests, execute the following command at project's root:

```bash

npm test

```

Alternatively, you can use:

```bash

npx jest

```

This command will:

- Compile the TypeScript code (if necessary).
- Run all test suites in the test directory.
- Display the test results in the console.

## Test Results

After running the tests, you should see an output similar to:

```plaintext
PASS test/pagerService.test.ts
PagerService
✓ should notify first-level targets when an alert is received for a healthy service (X ms)
✓ should escalate to next level when acknowledgment timeout occurs without acknowledgment (X ms)
✓ should not escalate if acknowledgment is received before timeout (X ms)
✓ should handle duplicate acknowledgments gracefully (X ms)
✓ should not notify targets when an alert is received for an unhealthy service (X ms)
✓ should reset state when service becomes healthy before acknowledgment timeout (X ms)
```
