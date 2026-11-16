export const detailedContact = {
  name: '林晓 Lin Xia',
  phone: ['059112345678', '+86 138 0013 8000', '0032056789'],
  email: ['lin@example.com', 'lin.work@example.com', 'lin.study@example.com'],
  social: ['微信 lin-demo', '@lin-design'],
  address: ['福建省福州市鼓楼区', 'Dublin, Ireland'],
  notes: 'Design studio colleague. Prefers email in the morning.',
};

export function cardFor(page, name) {
  return page.locator('article.contact-card').filter({
    has: page.getByRole('button', { name, exact: true }),
  });
}

export async function fillContact(page, contact) {
  await page.getByRole('button', { name: 'Add Contact', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Contact' });
  await dialog.getByRole('textbox', { name: 'Full name' }).fill(contact.name);
  for (const label of ['Phone', 'Email', 'Social', 'Address']) {
    const values = contact[label.toLowerCase()] ?? [];
    for (const [index, value] of values.entries()) {
      await dialog.getByRole('button', { name: `Add ${label}`, exact: true }).click();
      await dialog.getByRole('textbox', { name: `${label} ${index + 1}`, exact: true }).fill(value);
    }
  }
  if (contact.notes) {
    await dialog.getByRole('textbox', { name: 'Notes' }).fill(contact.notes);
  }
  return dialog;
}

export async function addContact(page, contact) {
  const dialog = await fillContact(page, contact);
  await dialog.getByRole('button', { name: 'Save Contact' }).click();
  await dialog.waitFor({ state: 'hidden' });
}
