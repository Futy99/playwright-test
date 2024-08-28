# Booking Automation Testing
This repository contains an automation solution to test the room booking functionality of the website [https://automationintesting.online](https://automationintesting.online). The automation scripts are written using Playwright, a framework for Web Testing and Automation. The tests cover the entire booking process, including booking a room, confirming the pop-up, and verifying the booking is made correctly in the admin panel.

## What could be done better

While the current automation solution works, there are a few areas that could be improved to enhance the test scenarios and overall reliability of the tests. Some of these trade-offs were made to reduce the complexity of the test scenarios and to complete the task within a manageable timeframe.

1. **Test Independence and Serial Execution:**
  Currently, the tests are executed in serial rather than in parallel, which is not the best practice. Ideally, each test should be independent, ensuring that it can be run in any order without affecting others. However, due to the shared nature of the testing environment (the website is being used by multiple users simultaneously), data can change unexpectedly, creating a challenging environment for testing. To simulate a cleaner environment, the first two tests delete all existing rooms and create a new suite. This setup makes all four tests dependent on each other, which is not ideal but simplifies the selection process under these conditions.

2. **Element Selection Strategy:**
  In some cases, elements are selected based on their text content or class attributes. Although test IDs (data-test-id attributes) were used wherever possible, they are not consistently available throughout the HTML structure, which is also complex for testing purposes. Ideally, all necessary elements would have unique test IDs, which would make the tests more robust and less prone to breakage due to future changes in the HTML.

3. **Cross-Browser Compatibility:**
  The current tests are designed to run using Chromium and do not pass when executed in Firefox. With additional time, cross-browser compatibility could be improved to ensure that the tests run successfully across all major browsers, including Firefox.

4. **HTML Structure and Test Friendliness:**
  In an ideal scenario where we have control over the product development, the HTML structure would be more test-friendly. This includes having consistent use of test IDs across all elements and ensuring the structure supports easy element selection. This approach would prevent tests from breaking due to future changes in the HTML.


## Getting Started
To get started with the automation solution, follow the steps below to set up your environment.

### Installation
1. Clone the repository:

```
  git clone https://github.com/Futy99/playwright-test.git
  cd booking-automation-testing
```

2. Install dependencies:

```
  npm install
```

### Running the Tests
To execute the test suite, run the following command:

```
  npx playwright test booking.spec.ts --project=chromium --workers=1
```
or run in UI (remember to run whole spec test scenario as it run in serial)
```
  npx playwright test --ui
```

### Test Cases
The following test scenarios are covered in the automation suite:

Open the website with the information banner already closed: The test navigates to the website and automatically clicks to close any tutorial or information pop-up.

**Test room booking:**

1. Login to the admin panel and delete all existing rooms.
2. Create a new suite for booking.
3. Book a two-night (three-day) stay at a displayed room and close confirm popup.
4. Verify that a booking was successfully created in the admin panel by checking inbox message.

