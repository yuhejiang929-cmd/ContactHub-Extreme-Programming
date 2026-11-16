import { expect, test } from '@playwright/test';
import ExcelJS from 'exceljs';
import { readFile } from 'node:fs/promises';
import { addContact, cardFor, detailedContact, fillContact } from './fixtures.js';

test('T01–T10 / T18–T20: CRUD, favorites, multiple methods and reload through the UI', async ({ page }) => {
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(`${message.location().url} ${message.text()}`);
    }
  });
  await page.goto('./');
  await expect(page.getByText('No contacts yet')).toBeVisible();

  const editor = await fillContact(page, { name: '   ' });
  await editor.getByRole('button', { name: 'Save Contact' }).click();
  await expect(editor.getByRole('alert')).toContainText('Enter a name');
  await editor.getByRole('button', { name: 'Cancel' }).click();

  await addContact(page, detailedContact);
  await addContact(page, { name: detailedContact.name, phone: ['222'], email: ['other@example.com'] });
  await addContact(page, { name: 'Quinn Reed' });
  await expect(cardFor(page, detailedContact.name)).toHaveCount(2);

  const search = page.getByRole('searchbox');
  await search.fill('0591 12345678');
  const person = cardFor(page, detailedContact.name);
  await expect(person).toHaveCount(1);
  await person.getByRole('button', { name: `Favorite ${detailedContact.name}` }).click();
  await expect(person.getByRole('button', { name: `Favorite ${detailedContact.name}` })).toHaveAttribute('aria-pressed', 'true');
  await search.fill('quinn');
  await cardFor(page, 'Quinn Reed').getByRole('button', { name: 'Favorite Quinn Reed' }).click();

  const favorites = page.getByRole('navigation').getByRole('button', { name: 'Favorites' });
  await favorites.click();
  await expect(page.locator('article')).toHaveCount(2);
  await cardFor(page, 'Quinn Reed').getByRole('button', { name: 'Favorite Quinn Reed' }).click();
  await expect(page.locator('article')).toHaveCount(1);

  await person.getByRole('button', { name: 'Edit', exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'Edit Contact' });
  await expect(edit.getByRole('textbox', { name: 'Phone 3' })).toHaveValue('0032056789');
  await edit.getByRole('button', { name: 'Remove Phone 2' }).click();
  await edit.getByRole('textbox', { name: 'Email 3' }).fill('updated@example.com');
  await edit.getByRole('button', { name: 'Add Address' }).click();
  await edit.getByRole('button', { name: 'Save Contact' }).click();
  await expect(person.getByRole('button', { name: `Favorite ${detailedContact.name}` })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await favorites.click();
  await person.getByRole('button', { name: 'View', exact: true }).click();
  const details = page.getByRole('dialog', { name: detailedContact.name });
  for (const value of ['059112345678', '0032056789', 'updated@example.com', '@lin-design', 'Dublin, Ireland']) {
    await expect(details.getByText(value, { exact: true })).toBeVisible();
  }
  await expect(details.getByText('+86 138 0013 8000', { exact: true })).toHaveCount(0);
  await details.getByRole('button', { name: 'Done' }).click();

  await person.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog', { name: 'Delete contact?' }).getByRole('button', { name: 'Cancel' }).click();
  await expect(person).toBeVisible();
  await person.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Contact', exact: true }).click();
  await expect(page.getByText('No favorites yet')).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'All Contacts' }).click();
  await search.fill('OTHER@EXAMPLE.COM');
  await expect(person).toHaveCount(1);
  await expect(page.locator('article')).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
});

test('T11–T17: real download, fresh-session import, duplicates and invalid file', async ({ page, browser }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Export Excel' }).click();
  await expect(page.locator('#notification')).toHaveText('There are no contacts to export.');
  await addContact(page, detailedContact);
  await addContact(page, { name: 'Amira Patel' });
  await cardFor(page, detailedContact.name).getByRole('button', { name: `Favorite ${detailedContact.name}` }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Favorites' }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Excel' }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('contacthub-contacts.xlsx');
  expect(await download.failure()).toBeNull();
  const workbookFile = {
    name: download.suggestedFilename(),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: await readFile(await download.path()),
  };

  const secondContext = await browser.newContext();
  try {
    const fresh = await secondContext.newPage();
    await fresh.goto(page.url());
    const openImport = fresh.getByRole('button', { name: 'Import Excel' });
    const file = fresh.getByLabel('Excel workbook');
    await openImport.click();
    await file.setInputFiles(workbookFile);
    await expect(fresh.locator('#import-ready')).toHaveText('2');
    await fresh.getByRole('button', { name: 'Import Contacts' }).click();
    await expect(fresh.locator('#notification')).toContainText('Imported 2 · Skipped 0 · Failed 0');
    const person = cardFor(fresh, detailedContact.name);
    await expect(person.getByRole('button', { name: `Favorite ${detailedContact.name}` })).toHaveAttribute('aria-pressed', 'true');
    await person.getByRole('button', { name: 'View', exact: true }).click();
    const details = fresh.getByRole('dialog', { name: detailedContact.name });
    for (const value of [...detailedContact.phone, ...detailedContact.email, ...detailedContact.social, ...detailedContact.address]) {
      await expect(details.getByText(value, { exact: true })).toBeVisible();
    }
    await details.getByRole('button', { name: 'Done' }).click();

    await openImport.click();
    await file.setInputFiles(workbookFile);
    await expect(fresh.locator('#import-skipped')).toHaveText('2');
    await expect(fresh.getByRole('button', { name: 'Import Contacts' })).toBeDisabled();
    await file.setInputFiles({ name: 'invalid.xlsx', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
    await expect(fresh.locator('#import-error')).toContainText('not a readable .xlsx workbook');
    await fresh.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(fresh.locator('article')).toHaveCount(2);
  } finally {
    await secondContext.close();
  }
});

test('partial import reports counts and renders uploaded HTML-like text as text', async ({ page }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Contacts').addRows([
    ['Name', 'Phone 1'],
    ['<img src=x onerror=alert(1)>', '001'],
    [],
    [null, '987'],
  ]);
  const buffer = await workbook.xlsx.writeBuffer();

  await page.goto('./');
  await addContact(page, { name: 'Existing' });
  await page.getByRole('button', { name: 'Import Excel' }).click();
  await page.getByLabel('Excel workbook').setInputFiles({
    name: 'partial.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer,
  });
  await expect(page.locator('#import-ready')).toHaveText('1');
  await expect(page.locator('#import-skipped')).toHaveText('1');
  await expect(page.locator('#import-failed')).toHaveText('1');
  await expect(page.locator('#import-issues')).toContainText('Row 4');
  await page.getByRole('button', { name: 'Import Contacts' }).click();
  await expect(page.locator('#notification')).toContainText('Imported 1 · Skipped 1 · Failed 1');
  await expect(page.locator('article')).toHaveCount(2);
  await expect(page.getByRole('button', { name: '<img src=x onerror=alert(1)>', exact: true })).toBeVisible();
  await expect(page.locator('img')).toHaveCount(0);
});

test('narrow screen avoids horizontal overflow; keyboard can add and dismiss a contact', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to contacts' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const add = page.getByRole('button', { name: 'Add Contact', exact: true });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Full name' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(add).toBeFocused();

  await addContact(page, {
    name: 'LongUnbrokenName'.repeat(7),
    email: [`${'a'.repeat(70)}@example.com`],
    address: ['A long block of text '.repeat(12)],
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeInViewport();
});
