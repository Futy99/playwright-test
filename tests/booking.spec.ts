import { test, expect, Page } from '@playwright/test';
import { nanoid } from 'nanoid'

const BASE_URL = 'https://automationintesting.online';
const ADMIN_URL = `${BASE_URL}/#/admin`;
const roomNumber = '303';
const START_DATE = '15';
const END_DATE = '17';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'password' };
const testRunId = nanoid().slice(0, 18)

const SELECTORS = {
  tutorialButton: 'text=Let me hack!',
  admin: {
    usernameInput: '[data-testid="username"]',
    passwordInput: '[data-testid="password"]',
    loginButton: '[data-testid="submit"]',
    roomNameInput: '[data-testid="roomName"]',
    accessibleDropdown: '#accessible',
    roomPriceInput: '#roomPrice',
    createRoomButton: '#createRoom',
    deleteRoomButton: '.roomDelete',
    inboxIcon: '.fa-inbox',
    bookingMessage: (text: string) => `text=${text}`,
    deleteMessageButton: (id: string) => `[data-testid="Delete${capitalizeFirstLetter(id)}"]`,
  },
  hotelRoom: {
    hotelRoom: '.hotel-room-info',
    bookingButton: '.openBooking',
    calendar: '.rbc-calendar',
    nextMonthButton: 'text=Next',
    dateCellButton: (date: string) => `.rbc-date-cell:not(.rbc-off-range) .rbc-button-link:has-text("${date}")`,
    bookingDetails: '2 night(s) - £400',
    bookingModal: '.confirmation-modal',
    closeModalButton: 'text=Close',
    bookingForm: {
      firstNameInput: '.room-firstname',
      lastNameInput: '.room-lastname',
      emailInput: '.room-email',
      phoneInput: '.room-phone',
      bookButton: '.book-room:has-text("Book")',
    },
  },
};

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.click(SELECTORS.tutorialButton);
});

function getNextMonthName() {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const nextMonthIndex = (new Date().getMonth() + 1) % 12;
  return months[nextMonthIndex];
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function loginToAdmin(page: Page) {
  await page.goto(ADMIN_URL);
  await page.fill(SELECTORS.admin.usernameInput, ADMIN_CREDENTIALS.username);
  await page.fill(SELECTORS.admin.passwordInput, ADMIN_CREDENTIALS.password);
  await page.click(SELECTORS.admin.loginButton);
  await expect(page.locator('text=Room #')).toBeVisible({ timeout: 3000 });
}

async function deleteAllRooms(page: Page) {
  while (true) {
    const deleteButtons = page.locator(SELECTORS.admin.deleteRoomButton);
    const deleteButtonCount = await deleteButtons.count();

    if (deleteButtonCount === 0) {
      break;
    }
    await deleteButtons.first().click();
    await page.waitForTimeout(200);
  }
}
async function createSuite(page: Page, roomNumber: string) {
  await page.fill(SELECTORS.admin.roomNameInput, roomNumber);
  await page.selectOption(SELECTORS.admin.accessibleDropdown, { value: 'true' });
  await page.fill(SELECTORS.admin.roomPriceInput, '200');
  await page.click(SELECTORS.admin.createRoomButton);
  const suite = page.locator(`#roomName${roomNumber}`);
  await expect(suite).toBeVisible({ timeout: 3000 });
}

test.describe('Booking process', () => {
  test('Should login to admin and delete all existing suites', async ({ page }) => {
    await loginToAdmin(page);
    await page.waitForTimeout(500);
    await deleteAllRooms(page);
  });

  test('Should login to admin and create suite 303', async ({ page }) => {
    await loginToAdmin(page);
    await createSuite(page, roomNumber);
  });

  test('Should book a 3-night stay in the future if available', async ({ page }) => {
    const suiteSelector = page.locator(SELECTORS.hotelRoom.hotelRoom, {  has: page.getByAltText(`Preview image of room${roomNumber}`) })
    const bookButton = suiteSelector.locator(SELECTORS.hotelRoom.bookingButton);

    await bookButton.click();

    const calendar = page.locator(SELECTORS.hotelRoom.calendar);
    await expect(calendar).toBeVisible({ timeout: 3000 });

    await page.click(SELECTORS.hotelRoom.nextMonthButton);
    const newMonthName = `${getNextMonthName()} ${new Date().getFullYear()}`;
    await expect(page.getByText(newMonthName)).toBeVisible({ timeout: 3000 });

    const start = calendar.locator(SELECTORS.hotelRoom.dateCellButton(START_DATE));
    const end = calendar.locator(SELECTORS.hotelRoom.dateCellButton(END_DATE));

    await expect(start).toBeVisible();
    await expect(end).toBeVisible();

    const startBounding = await start.boundingBox();
    const endBounding = await end.boundingBox();

    if (!startBounding || !endBounding) {
      throw new Error('Cannot book a vacation!');
    }

    await page.mouse.move(startBounding.x - 20 + startBounding.width / 2, startBounding.y + 10 + startBounding.height / 2, { steps: 10 });
    await page.mouse.down()
    await page.mouse.move(endBounding.x - 20 + endBounding.width / 2, endBounding.y + 10 + endBounding.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect(page.locator(`text=${SELECTORS.hotelRoom.bookingDetails}`)).toBeVisible();

    await page.fill(SELECTORS.hotelRoom.bookingForm.firstNameInput, testRunId);
    await page.fill(SELECTORS.hotelRoom.bookingForm.lastNameInput, testRunId);
    await page.fill(SELECTORS.hotelRoom.bookingForm.emailInput, 'test.email@gmail.com');
    await page.fill(SELECTORS.hotelRoom.bookingForm.phoneInput, '+420733362388');
    await page.click(SELECTORS.hotelRoom.bookingForm.bookButton);

    const confirmationModal = page.locator(SELECTORS.hotelRoom.bookingModal);
    await expect(confirmationModal).toBeVisible();

    await page.click(SELECTORS.hotelRoom.closeModalButton);
  });

  test('Should go to admin and verify booking was created', async ({ page }) => {
    await loginToAdmin(page);
    await page.click(SELECTORS.admin.inboxIcon);

    const bookingMessage = page.locator(SELECTORS.admin.bookingMessage(`${testRunId} ${testRunId}`));
    await expect(bookingMessage).toBeVisible({ timeout: 3000 });

    const testId = await bookingMessage.locator('..').getAttribute('data-testid');

    if (!testId) {
      throw new Error('Could not find booking');
    }

    const deleteMessageButton = SELECTORS.admin.deleteMessageButton(testId);
    await page.click(deleteMessageButton);
  });
});