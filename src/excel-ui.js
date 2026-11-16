import { selectImportAdditions } from './contacts.js';
import { node } from './ui.js';

const loadExcel = () => import('./excel.js');

export function connectExcelActions({ store, receiveContacts, notify }) {
  const dialog = document.getElementById('import-dialog');
  const fileField = document.getElementById('workbook-file');
  const importButton = document.getElementById('confirm-import');
  const exportButton = document.getElementById('export-excel');
  const templateButton = document.getElementById('download-template');
  const help = document.getElementById('import-help');
  const error = document.getElementById('import-error');
  const counts = document.getElementById('import-counts');
  const issues = document.getElementById('import-issues');
  let result;
  let revision = 0;

  function setError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function resetPreview() {
    result = undefined;
    importButton.disabled = true;
    counts.hidden = true;
    issues.replaceChildren();
    setError('');
  }

  document.getElementById('import-excel').addEventListener('click', () => {
    fileField.value = '';
    resetPreview();
    help.textContent = 'Choose a .xlsx workbook to review its rows before importing.';
    dialog.showModal();
  });

  fileField.addEventListener('change', async () => {
    const currentRevision = ++revision;
    const file = fileField.files[0];
    resetPreview();
    if (!file) {
      help.textContent = 'Choose a .xlsx workbook to review its rows before importing.';
      return;
    }
    help.textContent = `Reading ${file.name}…`;

    try {
      if (!/\.xlsx$/iu.test(file.name)) {
        throw new Error('Choose an Excel file with the .xlsx extension.');
      }
      const { readWorkbook, MAX_FILE_BYTES } = await loadExcel();
      if (file.size > MAX_FILE_BYTES) {
        throw new Error('Choose a .xlsx file no larger than 5 MB.');
      }
      const parsed = await readWorkbook(await file.arrayBuffer());
      if (currentRevision !== revision || !dialog.open) {
        return;
      }
      const preview = selectImportAdditions(store.list(), parsed.contacts);
      result = parsed;
      document.getElementById('import-ready').textContent = preview.additions.length;
      document.getElementById('import-skipped').textContent = preview.duplicates + parsed.blankRows;
      document.getElementById('import-failed').textContent = parsed.issues.length;
      help.textContent = `Reviewed ${file.name}. Existing contacts stay in your address book.`;
      counts.hidden = false;
      importButton.disabled = !preview.additions.length;
      for (const issue of parsed.issues.slice(0, 5)) {
        issues.append(node('li', '', `Row ${issue.row} — ${issue.message}`));
      }
      if (parsed.issues.length > 5) {
        issues.append(node('li', '', `${parsed.issues.length - 5} more rows have errors.`));
      }
    } catch (caught) {
      if (currentRevision === revision && dialog.open) {
        help.textContent = 'Check the workbook and try again.';
        setError(caught.message);
      }
    }
  });

  importButton.addEventListener('click', () => {
    if (!result) {
      return;
    }
    try {
      const current = store.importContacts(result.contacts);
      receiveContacts(current.contacts);
      dialog.close();
      notify(`Imported ${current.added} · Skipped ${current.duplicates + result.blankRows} · Failed ${result.issues.length}`);
    } catch (caught) {
      setError(caught.message);
    }
  });

  exportButton.addEventListener('click', async () => {
    exportButton.disabled = true;
    try {
      const contacts = store.list();
      if (!contacts.length) {
        notify('There are no contacts to export.', true);
        return;
      }
      const { downloadWorkbook } = await loadExcel();
      await downloadWorkbook(contacts, 'contacthub-contacts.xlsx');
      notify(`Exported ${contacts.length} ${contacts.length === 1 ? 'contact' : 'contacts'} to Excel.`);
    } catch (caught) {
      notify(caught.message, true);
    } finally {
      exportButton.disabled = false;
    }
  });

  templateButton.addEventListener('click', async () => {
    templateButton.disabled = true;
    try {
      const { downloadWorkbook } = await loadExcel();
      await downloadWorkbook([], 'contacthub-template.xlsx');
    } catch (caught) {
      setError(caught.message);
    } finally {
      templateButton.disabled = false;
    }
  });
}
