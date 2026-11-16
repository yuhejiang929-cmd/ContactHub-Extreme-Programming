import ExcelJS from 'exceljs';
import { unzipSync } from 'fflate';
import { METHOD_TYPES, normalizeContact } from './contacts.js';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 32 * 1024 * 1024;
const MAX_DATA_ROWS = 5000;
const MAX_COLUMNS = 16384;
const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function columnSchema(contacts) {
  const columns = [{ header: 'Name', key: 'name', width: 26 }];
  for (const { key, label } of METHOD_TYPES) {
    const count = contacts.reduce((max, contact) => Math.max(max, contact[key].length), 1);
    for (let index = 0; index < count; index += 1) {
      columns.push({
        header: `${label} ${index + 1}`,
        key: `${key}-${index}`,
        width: { phones: 23, emails: 36, socials: 29, addresses: 43 }[key],
        style: { numFmt: '@' },
      });
    }
  }
  columns.push({ header: 'Favorite', key: 'isFavorite', width: 12 }, { header: 'Notes', key: 'notes', width: 44 });
  if (columns.length > MAX_COLUMNS) {
    throw new Error('The contact methods exceed Excel’s 16,384-column limit.');
  }
  return columns;
}

export async function writeWorkbook(contacts) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Contacts', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columnSchema(contacts);
  for (const contact of contacts) {
    const row = { name: contact.name, isFavorite: contact.isFavorite ? 'Yes' : 'No', notes: contact.notes };
    for (const { key } of METHOD_TYPES) {
      contact[key].forEach((value, index) => {
        row[`${key}-${index}`] = value;
      });
    }
    sheet.addRow(row);
  }
  const header = sheet.getRow(1);
  header.height = 23;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5341B3' } };
    cell.alignment = { vertical: 'middle' };
  });
  return book.xlsx.writeBuffer();
}

function assertWorkbookArchive(bytes) {
  if (!bytes.length || bytes.byteLength > MAX_FILE_BYTES) {
    throw new Error('Choose a non-empty .xlsx file no larger than 5 MB.');
  }
  const entries = new Set();
  let expandedBytes = 0;
  try {
    // Inspect the ZIP directory without inflating any entry.
    unzipSync(bytes, {
      filter({ name, originalSize }) {
        entries.add(name);
        expandedBytes += originalSize;
        return false;
      },
    });
  } catch (cause) {
    throw new Error('This file is not a readable .xlsx workbook.', { cause });
  }
  if (expandedBytes > MAX_EXPANDED_BYTES) {
    throw new Error('The workbook expands beyond the 32 MB import limit.');
  }
  if (!entries.has('[Content_Types].xml') || !entries.has('xl/workbook.xml')) {
    throw new Error('This file is not a readable .xlsx workbook.');
  }
}

function cellText(cell) {
  if (cell.value === null) {
    return '';
  }
  if (cell.type === ExcelJS.ValueType.Formula) {
    throw new Error('Formulas are not accepted in contact fields.');
  }
  const allowed = [ExcelJS.ValueType.String, ExcelJS.ValueType.Number, ExcelJS.ValueType.Boolean,
    ExcelJS.ValueType.RichText, ExcelJS.ValueType.Hyperlink];
  if (!allowed.includes(cell.type)) {
    throw new Error('A contact field contains an unsupported cell type. Use text.');
  }
  return cell.text.trim();
}

function columnMap(sheet) {
  const fields = new Map();
  const methods = new Map(METHOD_TYPES.map(({ key }) => [key, new Map()]));
  sheet.getRow(1).eachCell((cell, column) => {
    const title = cellText(cell).replace(/\s+/gu, ' ').toLowerCase();
    if (['name', 'favorite', 'notes'].includes(title)) {
      if (fields.has(title)) {
        throw new Error(`Duplicate column “${cell.text}” in the header.`);
      }
      fields.set(title, column);
    }

    const match = /^(phone|email|social|address) (\d+)$/u.exec(title);
    if (match) {
      const type = METHOD_TYPES.find(({ label }) => label.toLowerCase() === match[1]);
      const index = Number(match[2]);
      const indexed = methods.get(type.key);
      if (index < 1 || index > MAX_COLUMNS || indexed.has(index)) {
        throw new Error(`Invalid or duplicate column “${cell.text}” in the header.`);
      }
      indexed.set(index, column);
    }
  });
  if (!fields.has('name')) {
    throw new Error('The first row needs a Name column. Use the Excel template for the expected format.');
  }
  return {
    fields,
    methods: Array.from(methods, ([key, indexed]) => [
      key,
      Array.from(indexed).sort(([left], [right]) => left - right).map(([, column]) => column),
    ]),
  };
}

function readFavorite(value) {
  const normalized = value.toLowerCase();
  if (['yes', 'true', '1', '是'].includes(normalized)) {
    return true;
  }
  if (['', 'no', 'false', '0', '否'].includes(normalized)) {
    return false;
  }
  throw new Error('Favorite must be Yes or No.');
}

function readContactRow(row, { fields, methods }) {
  const read = (title) => fields.has(title) ? cellText(row.getCell(fields.get(title))) : '';
  const input = { name: read('name'), notes: read('notes'), isFavorite: readFavorite(read('favorite')) };
  for (const [key, columns] of methods) {
    input[key] = columns.map((column) => cellText(row.getCell(column)));
  }
  return normalizeContact(input);
}

function hasData(row) {
  return row.values.some((value) => value != null && (typeof value !== 'string' || value.trim()));
}

export async function readWorkbook(source) {
  const bytes = new Uint8Array(source);
  assertWorkbookArchive(bytes);
  const book = new ExcelJS.Workbook();
  try {
    await book.xlsx.load(bytes);
  } catch (cause) {
    throw new Error('This file is not a readable .xlsx workbook.', { cause });
  }
  const sheet = book.worksheets.find(({ name }) => name === 'Contacts') ?? book.worksheets[0];
  if (!sheet) {
    throw new Error('This workbook has no worksheets.');
  }
  if (sheet.rowCount > MAX_DATA_ROWS + 1) {
    throw new Error('The worksheet exceeds the 5,000-row import limit.');
  }
  const schema = columnMap(sheet);
  const result = { contacts: [], blankRows: 0, issues: [] };
  for (let number = 2; number <= sheet.rowCount; number += 1) {
    const row = sheet.getRow(number);
    if (!hasData(row)) {
      result.blankRows += 1;
      continue;
    }
    try {
      result.contacts.push(readContactRow(row, schema));
    } catch (error) {
      result.issues.push({ row: number, message: error.message });
    }
  }
  return result;
}

export async function downloadWorkbook(contacts, filename) {
  const bytes = await writeWorkbook(contacts);
  const url = URL.createObjectURL(new Blob([bytes], { type: MIME }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
