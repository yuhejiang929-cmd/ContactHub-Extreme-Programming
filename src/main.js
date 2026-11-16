import './styles.css';
import { findContacts, METHOD_TYPES } from './contacts.js';
import { createContactStore, STORAGE_KEY } from './storage.js';
import { contactCard, detailContent, icon, renderMethodFields } from './ui.js';

const $ = (id) => document.getElementById(id);
const storage = createContactStore({
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
});
const search = $('search');
const editor = $('editor');
const form = $('contact-form');
const details = $('details');
const deleteDialog = $('delete-dialog');
let contacts = [];
let editId;
let deleteId;
let showNoticeTimer;

function message(element, value) {
  element.textContent = value;
  element.hidden = !value;
}

function notify(value, isError = false) {
  const notice = $('notification');
  notice.classList.toggle('error', isError);
  message(notice, value);
  clearTimeout(showNoticeTimer);
  showNoticeTimer = setTimeout(() => message(notice, ''), 6000);
}

function render() {
  const results = findContacts(contacts, { query: search.value });
  $('all-count').textContent = contacts.length;
  $('results-count').textContent = `${results.length} ${results.length === 1 ? 'contact' : 'contacts'}`;
  $('contacts').replaceChildren(...results.map((contact) => contactCard(contact, handlers)));
  $('empty').hidden = results.length > 0 || !$('storage-error').hidden;
  $('empty-icon').replaceChildren(icon(search.value.trim() ? 'search' : 'users'));
  $('empty-title').textContent = search.value.trim() ? 'No matching contacts' : 'No contacts yet';
  $('empty-text').textContent = search.value.trim()
    ? 'Try a different name, phone number or email.'
    : 'Add a contact to start building your address book.';
  $('empty-add').hidden = Boolean(search.value.trim());
}

function refresh() {
  try {
    contacts = storage.list();
    message($('storage-error'), '');
    $('add-contact').disabled = false;
  } catch (error) {
    contacts = [];
    message($('storage-error'), error.message);
    $('add-contact').disabled = true;
  }
  render();
}

function openEditor(contact) {
  form.reset();
  editId = contact?.id;
  $('editor-title').textContent = contact ? 'Edit Contact' : 'Add Contact';
  form.elements.name.value = contact?.name ?? '';
  form.elements.notes.value = contact?.notes ?? '';
  renderMethodFields($('method-fields'), contact);
  message($('editor-error'), '');
  editor.showModal();
}

const handlers = {
  view(contact) {
    $('detail-title').textContent = contact.name;
    $('detail-content').replaceChildren(detailContent(contact));
    details.showModal();
  },
  edit: openEditor,
  remove(contact) {
    deleteId = contact.id;
    $('delete-message').textContent = `Delete ${contact.name} from your address book? This action cannot be undone.`;
    message($('delete-error'), '');
    deleteDialog.showModal();
  },
};

search.addEventListener('input', render);
$('add-contact').addEventListener('click', () => openEditor());
$('empty-add').addEventListener('click', () => openEditor());

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const input = { name: formData.get('name'), notes: formData.get('notes') };
  for (const { key } of METHOD_TYPES) {
    input[key] = formData.getAll(key);
  }
  try {
    contacts = editId ? storage.edit(editId, input) : storage.add(input);
    editor.close();
    render();
    $('add-contact').focus();
    notify(editId ? 'Contact updated.' : 'Contact added.');
  } catch (error) {
    message($('editor-error'), error.message);
    if (!input.name.trim()) {
      form.elements.name.focus();
    }
  }
});

$('confirm-delete').addEventListener('click', () => {
  try {
    contacts = storage.remove(deleteId);
    deleteDialog.close();
    render();
    $('add-contact').focus();
    notify('Contact deleted.');
  } catch (error) {
    message($('delete-error'), error.message);
  }
});

for (const button of document.querySelectorAll('[data-close]')) {
  button.addEventListener('click', () => button.closest('dialog').close());
}

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    refresh();
  }
});

refresh();
