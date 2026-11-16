export const METHOD_TYPES = [
  { key: 'phones', label: 'Phone', icon: 'phone', maxLength: 80 },
  { key: 'emails', label: 'Email', icon: 'mail', maxLength: 254 },
  { key: 'socials', label: 'Social', icon: 'at', maxLength: 300 },
  { key: 'addresses', label: 'Address', icon: 'pin', maxLength: 500 },
];

export class ContactError extends Error {}

export function normalizeContact(input) {
  const name = String(input.name ?? '').trim();
  const notes = String(input.notes ?? '').trim();
  if (!name || name.length > 120) {
    throw new ContactError('Enter a name between 1 and 120 characters.');
  }
  if (notes.length > 2000) {
    throw new ContactError('Notes must be 2,000 characters or fewer.');
  }

  const fields = { name, notes, isFavorite: input.isFavorite === true };
  for (const { key, label, maxLength } of METHOD_TYPES) {
    const values = (input[key] ?? []).map((value) => String(value).trim()).filter(Boolean);
    for (const [index, value] of values.entries()) {
      if (value.length > maxLength) {
        throw new ContactError(`${label} ${index + 1} must be ${maxLength} characters or fewer.`);
      }
      if (key === 'emails' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value)) {
        throw new ContactError(`Enter a valid email address for Email ${index + 1}.`);
      }
    }
    fields[key] = values;
  }
  return fields;
}

// getRandomValues also works on HTTP, useful for a cloud VM served by IP.
export function createId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

export function findContacts(contacts, { query = '', favoritesOnly = false } = {}) {
  const term = query.trim().toLowerCase();
  const digits = term.replace(/\D/g, '');
  const phoneQuery = digits && /^[+\d().\s-]+$/.test(term);

  return contacts.filter((contact) => {
    if (favoritesOnly && !contact.isFavorite) {
      return false;
    }
    const searchable = [contact.name, ...contact.phones, ...contact.emails];
    return searchable.some((value) => value.toLowerCase().includes(term))
      || (phoneQuery && contact.phones.some((phone) => phone.replace(/\D/g, '').includes(digits)));
  });
}

function contactSignature(contact) {
  const nfc = (value) => value.normalize('NFC');
  return JSON.stringify([
    nfc(contact.name),
    contact.isFavorite,
    nfc(contact.notes),
    ...METHOD_TYPES.map(({ key }) => contact[key].map(nfc).sort()),
  ]);
}

export function selectImportAdditions(existing, incoming) {
  const remaining = new Map();
  for (const contact of existing) {
    const signature = contactSignature(contact);
    remaining.set(signature, (remaining.get(signature) ?? 0) + 1);
  }
  const additions = [];
  for (const input of incoming) {
    const contact = normalizeContact(input);
    const signature = contactSignature(contact);
    const matches = remaining.get(signature) ?? 0;
    if (matches === 0) {
      additions.push(contact);
    } else {
      remaining.set(signature, matches - 1);
    }
  }
  return { additions, duplicates: incoming.length - additions.length };
}
