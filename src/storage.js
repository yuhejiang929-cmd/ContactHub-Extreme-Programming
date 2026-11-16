import { ContactError, createId, normalizeContact } from './contacts.js';

export const STORAGE_KEY = 'contacthub.contacts.v1';

export function createContactStore(storage) {
  function read() {
    try {
      const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
      const ids = new Set();
      if (!Array.isArray(saved)) {
        throw new Error('Invalid contact collection.');
      }
      return saved.map(({ id, ...input }) => {
        if (typeof id !== 'string' || !id || ids.has(id)) {
          throw new Error('Invalid contact identifier.');
        }
        ids.add(id);
        return { id, ...normalizeContact(input) };
      });
    } catch (cause) {
      throw new ContactError('The saved contacts could not be read. Check your browser storage.', { cause });
    }
  }

  function write(contacts) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (cause) {
      throw new ContactError('Could not save. Check available browser storage and try again.', { cause });
    }
    return contacts;
  }

  function insert(input, reservedIds) {
    let id = createId();
    while (reservedIds.has(id)) {
      id = createId();
    }
    reservedIds.add(id);
    return { id, ...normalizeContact(input) };
  }

  function update(id, change) {
    const contacts = read();
    const index = contacts.findIndex((contact) => contact.id === id);
    if (index < 0) {
      throw new ContactError('This contact is no longer available.');
    }
    contacts.splice(index, 1, ...change(contacts[index]));
    return write(contacts);
  }

  return {
    list: read,
    add(input) {
      const current = read();
      return write([...current, insert(input, new Set(current.map(({ id }) => id)))]);
    },
    edit(id, input) {
      return update(id, (contact) => [{ id, ...normalizeContact({ ...contact, ...input }) }]);
    },
    remove(id) {
      return update(id, () => []);
    },
    toggleFavorite(id) {
      return update(id, (contact) => [{ ...contact, isFavorite: !contact.isFavorite }]);
    },
  };
}
