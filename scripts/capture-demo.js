import { chromium, expect } from '@playwright/test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addContact, cardFor, detailedContact, fillContact } from '../tests/e2e/fixtures.js';

const baseURL = process.env.CONTACTHUB_TEST_URL ?? 'http://127.0.0.1:4174/';
const screenshotDir = 'docs/screenshots';
const demoDir = 'docs/demo';
await Promise.all([mkdir(screenshotDir, { recursive: true }), mkdir(demoDir, { recursive: true })]);
const temporary = await mkdtemp(join(tmpdir(), 'contacthub-recording-'));
const browser = await chromium.launch({ channel: process.env.CONTACTHUB_CHROMIUM_CHANNEL || undefined });
const context = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: temporary, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
const recording = page.video();
const pause = (milliseconds = 1100) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const screenshot = (name) => page.screenshot({ path: join(screenshotDir, name), animations: 'disabled' });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(baseURL);
  await expect(page).toHaveTitle('ContactHub');
  await expect(page.getByText('No contacts yet')).toBeVisible();
  await pause(1700);

  const editor = await fillContact(page, detailedContact);
  await editor.getByRole('textbox', { name: 'Full name' }).scrollIntoViewIfNeeded();
  await screenshot('02-add-contact.png');
  await pause(2800);
  await editor.getByRole('button', { name: 'Save Contact' }).click();
  await expect(cardFor(page, detailedContact.name)).toBeVisible();
  await pause();

  const samples = [
    { name: 'Amira Patel', phone: ['+353 1 555 0128'], email: ['amira@example.com'], social: ['@amira'], address: ['Dublin, Ireland'] },
    { name: '陈宇 Chen Yu', phone: ['059112100008'], email: ['chen@example.com'], address: ['福建省厦门市'] },
    { name: 'Jordan Kim', phone: ['+1 202 555 0148'], email: ['jordan@example.com'], social: ['@jordan'] },
    { name: 'Maya Okafor', phone: ['+234 700 555 0135'], email: ['maya@example.com'], address: ['Lagos, Nigeria'] },
    { name: 'Sophie Laurent', phone: ['+33 1 55 50 01 40'], email: ['sophie@example.com'] },
  ];
  for (const sample of samples) {
    await addContact(page, sample);
  }

  const featured = cardFor(page, detailedContact.name);
  const featureStar = featured.getByRole('button', { name: `Favorite ${detailedContact.name}` });
  await featureStar.click();
  await cardFor(page, 'Amira Patel').getByRole('button', { name: 'Favorite Amira Patel' }).click();
  await page.reload();
  await expect(page.locator('article')).toHaveCount(6);
  await expect(featureStar).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#notification')).toBeHidden();
  await screenshot('01-home.png');
  await pause();

  await page.getByRole('navigation').getByRole('button', { name: 'Favorites' }).click();
  await expect(page.locator('article')).toHaveCount(2);
  await screenshot('03-favorites.png');
  await pause(1900);
  await cardFor(page, 'Amira Patel').getByRole('button', { name: 'Favorite Amira Patel' }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await pause();

  await featured.getByRole('button', { name: 'View', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('0032056789')).toBeVisible();
  await screenshot('04-multiple-methods.png');
  await pause(2600);
  await page.getByRole('button', { name: 'Done' }).click();

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Excel' }).click();
  const download = await downloadEvent;
  const workbook = join(demoDir, 'contacthub-demo-contacts.xlsx');
  await download.saveAs(workbook);
  await expect(page.locator('#notification')).toHaveText('Exported 6 contacts to Excel.');
  await screenshot('05-excel-export.png');
  await pause(1850);

  await featured.getByRole('button', { name: 'Delete', exact: true }).click();
  await pause();
  await page.getByRole('button', { name: 'Delete Contact', exact: true }).click();
  await expect(page.getByText('No favorites yet')).toBeVisible();
  await pause();

  await page.getByRole('button', { name: 'Import Excel' }).click();
  await page.getByLabel('Excel workbook').setInputFiles(workbook);
  await expect(page.locator('#import-ready')).toHaveText('1');
  await expect(page.locator('#import-skipped')).toHaveText('5');
  await screenshot('06-excel-import.png');
  await pause(2100);
  await page.getByRole('button', { name: 'Import Contacts' }).click();
  await expect(page.locator('#notification')).toHaveText('Imported 1 · Skipped 5 · Failed 0');
  await expect(featureStar).toHaveAttribute('aria-pressed', 'true');
  await pause(1700);

  await page.getByRole('searchbox').fill('059112345678');
  await expect(page.locator('article')).toHaveCount(1);
  await pause();
  await featured.getByRole('button', { name: 'Edit', exact: true }).click();
  const editing = page.getByRole('dialog', { name: 'Edit Contact' });
  await editing.getByRole('textbox', { name: 'Email 3' }).fill('lin.archive@example.com');
  await pause(1400);
  await editing.getByRole('button', { name: 'Save Contact' }).click();
  await expect(page.locator('#notification')).toHaveText('Contact updated.');
  await pause(900);

  await page.reload();
  await page.getByRole('navigation').getByRole('button', { name: 'Favorites' }).click();
  await expect(featureStar).toHaveAttribute('aria-pressed', 'true');
  await featured.getByRole('button', { name: 'View', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('lin.archive@example.com')).toBeVisible();
  await pause(2600);
  expect(errors).toEqual([]);
  await context.close();
  await recording.saveAs(join(demoDir, 'contacthub-demo.webm'));
  console.log('Saved 6 screenshots, an exported XLSX workbook, and a real browser recording.');
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
