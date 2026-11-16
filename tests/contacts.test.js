import { beforeEach, describe, expect, it } from 'vitest';
import { findContacts, normalizeContact } from '../src/contacts.js';
import { createContactStore, STORAGE_KEY } from '../src/storage.js';

describe('contact model and persistence', () => {
  let cache;
  let storage;
  let store;

  beforeEach(() => {
    cache = new Map();
    storage = { getItem: (key) => cache.get(key), setItem: (key, item) => cache.set(key, item) };
    store = createContactStore(storage);
  });

  it('T01 adds a validated contact with a UUID', () => {
    const [contact] = store.add({ name: '  Lin Xia  ', emails: ['lin@example.com'] });
    expect(contact.name).toBe('Lin Xia');
    expect(contact.id).toMatch(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/u);
    expect(contact.isFavorite).toBe(false);
    expect(store.list()).toEqual([contact]);
  });

  it('T02 edits an existing record without changing its ID or favorite state', () => {
    const [{ id }] = store.add({ name: 'A', isFavorite: true, phones: ['001', '002', '003'] });
    const [edited] = store.edit(id, { name: 'B', phones: ['001', '004'] });
    expect(edited).toMatchObject({ id, name: 'B', isFavorite: true, phones: ['001', '004'] });
  });

  it('T03 removes a favorited contact and rejects a stale ID', () => {
    const [{ id }] = store.add({ name: 'A', isFavorite: true });
    expect(store.remove(id)).toEqual([]);
    expect(store.list()).toEqual([]);
    expect(() => store.remove(id)).toThrow('no longer available');
  });

  it('T04 allows the same name for distinct contacts', () => {
    const [first] = store.add({ name: '林晓' });
    const [, second] = store.add({ name: '林晓' });
    expect(first.id).not.toBe(second.id);
    expect(store.remove(second.id)).toEqual([first]);
  });

  it('T05–T07 toggles two favorites and filters without mutating source', () => {
    const [first] = store.add({ name: 'Lin' });
    const [, second] = store.add({ name: 'Liu' });
    store.toggleFavorite(first.id);
    const both = store.toggleFavorite(second.id);
    expect(findContacts(both, { favoritesOnly: true })).toEqual(both);
    const latest = store.toggleFavorite(first.id);
    expect(findContacts(latest, { favoritesOnly: true }).map(({ id }) => id)).toEqual([second.id]);
    expect(latest).toHaveLength(2);
    expect(both[0].isFavorite).toBe(true);
  });

  it('T08 / T19 restores all data and favorite state in another store', () => {
    const [contact] = store.add({ name: '华英', socials: ['@demo'], addresses: ['福州'] });
    store.toggleFavorite(contact.id);
    expect(createContactStore(storage).list()).toEqual([{ ...contact, isFavorite: true }]);
  });

  it('T09–T10 preserves three numbers, three emails and additional methods after trimming', () => {
    const [contact] = store.add({
      name: 'A',
      phones: [' 001 ', '002', '   ', '+86333'],
      emails: ['a@example.com', 'b@example.com', 'c@example.com'],
      socials: ['@one', '@two'],
      addresses: ['甲', '乙'],
    });
    expect(contact).toMatchObject({
      phones: ['001', '002', '+86333'], emails: ['a@example.com', 'b@example.com', 'c@example.com'],
      socials: ['@one', '@two'], addresses: ['甲', '乙'],
    });
  });

  it('T18 accepts empty methods and reports an empty contact book', () => {
    expect(store.list()).toEqual([]);
    expect(normalizeContact({ name: 'A', phones: ['   '] })).toMatchObject({
      phones: [], emails: [], addresses: [], socials: [],
    });
  });

  it('T20 searches name, formatted phone and email case-insensitively', () => {
    const [contact] = store.add({ name: 'Yuhe 林', phones: ['+86 0591-1234'], emails: ['Dev@EXAMPLE.com'] });
    const contacts = store.add({ name: '林', phones: ['333'] });
    for (const query of [' YUHE ', '05911234', 'dev@example.com']) {
      expect(findContacts(contacts, { query })).toEqual([contact]);
    }
    expect(findContacts(contacts, { query: '林' })).toHaveLength(2);
    expect(findContacts(contacts, { query: '??' })).toEqual([]);
  });

  it('refuses blank names and invalid email without writing data', () => {
    expect(() => store.add({ name: ' ' })).toThrow('Enter a name');
    expect(() => store.add({ name: 'A', emails: ['invalid'] })).toThrow('valid email');
    expect(cache.has(STORAGE_KEY)).toBe(false);
  });

  it('retains the stored copy when storage is unreadable or a write fails', () => {
    cache.set(STORAGE_KEY, 'broken data');
    expect(() => store.add({ name: 'B' })).toThrow('could not be read');
    expect(cache.get(STORAGE_KEY)).toBe('broken data');
    cache.delete(STORAGE_KEY);
    store.add({ name: 'A' });
    const restricted = createContactStore({
      getItem: storage.getItem,
      setItem() { throw new Error('Quota'); },
    });
    expect(() => restricted.add({ name: 'B' })).toThrow('Could not save');
    expect(store.list().map(({ name }) => name)).toEqual(['A']);
  });

  it('adds unmatched occurrences on import and skips the same workbook on retry', () => {
    store.add({ name: '同名', phones: ['1'] });
    const same = { name: '同名', phones: ['1'] };
    const different = { name: '同名', phones: ['2'] };
    const result = store.importContacts([same, same, different]);
    expect(result).toMatchObject({ added: 2, duplicates: 1 });
    expect(result.contacts.map(({ phones }) => phones[0])).toEqual(['1', '1', '2']);
    expect(store.importContacts([same, same, different])).toMatchObject({ added: 0, duplicates: 3 });
  });
});
