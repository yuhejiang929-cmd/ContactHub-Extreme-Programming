import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { normalizeContact } from '../src/contacts.js';
import { MAX_FILE_BYTES, readWorkbook, writeWorkbook } from '../src/excel.js';
import { createContactStore } from '../src/storage.js';

async function fixture(rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Test').addRows(rows);
  return workbook.xlsx.writeBuffer();
}

const detailed = normalizeContact({
  name: '林晓 <林> & Lin', isFavorite: true, notes: '一行\nSecond line',
  phones: ['059112345678', '+8613800138000', '003', '004', '005'],
  emails: ['one@example.com', 'two@example.com', 'three@example.com'],
  socials: ['微信_测试', '@lin'],
  addresses: ['福建省福州市', 'Dublin, Ireland'],
});

describe('real XLSX files', () => {
  it('T11 / T15 / T16 writes one styled row per contact and expandable text columns', async () => {
    const bytes = await writeWorkbook([detailed, normalizeContact({ name: 'A' })]);
    expect(Array.from(bytes.slice(0, 2))).toEqual([80, 75]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes);
    const sheet = workbook.getWorksheet('Contacts');
    expect(sheet.rowCount).toBe(3);
    expect(sheet.getRow(1).values).toContain('Phone 5');
    expect(sheet.getRow(1).values).toContain('Email 3');
    expect(sheet.getCell('B2').type).toBe(ExcelJS.ValueType.String);
    expect(sheet.getCell('B2').value).toBe('059112345678');
    expect(sheet.getCell('C2').value).toBe('+8613800138000');
    expect(sheet.getCell('A1').font.bold).toBe(true);
    expect(sheet.getColumn(2).width).toBeGreaterThan(15);
  });

  it('T12 reads reordered headers, handles numeric ordering and skips blank rows', async () => {
    const input = await fixture([
      ['Email 1', 'PHONE 10', 'Favorite', ' Name ', 'Phone 2', 'Address 1', 'Social 1'],
      ['a@example.com', 222, '是', '测试', '001', '泉州', '@a'],
      [],
      ['b@example.com', null, false, 'B'],
    ]);
    const result = await readWorkbook(input);
    expect(result.blankRows).toBe(1);
    expect(result.issues).toEqual([]);
    expect(result.contacts).toEqual([
      normalizeContact({
        name: '测试', isFavorite: true, phones: ['001', '222'],
        emails: ['a@example.com'], socials: ['@a'], addresses: ['泉州'],
      }),
      normalizeContact({ name: 'B', emails: ['b@example.com'] }),
    ]);
  });

  it('T13–T15 exports, reads and imports every field into an empty store', async () => {
    const contacts = [detailed, normalizeContact({ name: 'No methods' }), detailed];
    const parsed = await readWorkbook(await writeWorkbook(contacts));
    const cache = new Map();
    const store = createContactStore({ getItem: (key) => cache.get(key), setItem: (key, value) => cache.set(key, value) });
    const restored = store.importContacts(parsed.contacts);
    expect(parsed.issues).toEqual([]);
    expect(restored.added).toBe(3);
    expect(restored.contacts.map(({ id, ...contact }) => {
      expect(id).toBeTruthy();
      return contact;
    })).toEqual(contacts);
  });

  it('reports invalid records and rejects formulas without returning cached values', async () => {
    const bytes = await fixture([
      ['Name', 'Phone 1', 'Favorite', 'Email 1'],
      ['Valid', '01', 'No'],
      [null, '42', 'No'],
      ['Formula', { formula: '1+1', result: 2 }, 'Yes'],
      ['Invalid flag', '42', 'maybe'],
      ['Invalid email', null, 'No', 'invalid'],
    ]);
    const result = await readWorkbook(bytes);
    expect(result.contacts.map(({ name }) => name)).toEqual(['Valid']);
    expect(result.issues.map(({ row }) => row)).toEqual([3, 4, 5, 6]);
    expect(result.issues[1].message).toMatch(/Formulas/);
  });

  it('writes text starting with an equals sign as a string', async () => {
    const contact = normalizeContact({ name: '=existing-text', phones: ['=1+1'], notes: '=2+2' });
    expect((await readWorkbook(await writeWorkbook([contact]))).contacts).toEqual([contact]);
  });

  it('T17 rejects unreadable files and files over the compressed size limit', async () => {
    await expect(readWorkbook(new Uint8Array([4, 5, 6]))).rejects.toThrow('readable');
    await expect(readWorkbook(new Uint8Array(MAX_FILE_BYTES + 1))).rejects.toThrow('5 MB');
  });

  it('rejects absent or ambiguous headers', async () => {
    await expect(readWorkbook(await fixture([['Phone 1'], ['001']]))).rejects.toThrow('Name column');
    await expect(readWorkbook(await fixture([['Name', 'Phone 1', 'phone 01']]))).rejects.toThrow('duplicate');
  });

  it('T18 writes a usable empty template', async () => {
    expect(await readWorkbook(await writeWorkbook([]))).toEqual({ contacts: [], blankRows: 0, issues: [] });
  });
});
