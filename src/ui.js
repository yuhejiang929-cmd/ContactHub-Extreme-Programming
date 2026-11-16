import { METHOD_TYPES } from './contacts.js';

export function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

export function icon(name) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(namespace, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function action(label, iconName, className, onClick) {
  const button = node('button', className);
  button.type = 'button';
  button.append(icon(iconName), node('span', '', label));
  button.addEventListener('click', onClick);
  return button;
}

function initials(name) {
  const words = name.split(/\s+/u);
  if (words.length === 1) {
    return Array.from(name).slice(0, /\p{Script=Han}/u.test(name) ? 2 : 1).join('').toUpperCase();
  }
  return [words[0], words.at(-1)].map((word) => Array.from(word)[0]).join('').toUpperCase();
}

export function contactCard(contact, handlers) {
  const card = node('article', 'contact-card');
  const header = node('header', 'card-header');
  const identity = node('div', 'identity');
  const avatar = node('div', 'avatar', initials(contact.name));
  avatar.dataset.color = String((contact.name.codePointAt(0) ?? 0) % 5);
  avatar.setAttribute('aria-hidden', 'true');
  const name = node('button', 'contact-name', contact.name);
  name.type = 'button';
  name.addEventListener('click', () => handlers.view(contact));
  const heading = node('h2');
  heading.append(name);
  identity.append(avatar, heading);
  header.append(identity);

  const methods = node('div', 'card-methods');
  for (const { key, icon: methodIcon } of METHOD_TYPES) {
    if (contact[key].length) {
      const line = node('div', 'method-summary');
      line.append(icon(methodIcon), node('span', 'method-value', contact[key][0]));
      if (contact[key].length > 1) {
        line.append(node('span', 'method-count', `+${contact[key].length - 1}`));
      }
      methods.append(line);
    }
  }
  if (!methods.children.length) {
    methods.append(node('p', 'muted', 'No contact methods'));
  }
  const footer = node('footer', 'card-footer');
  footer.append(
    action('View', 'arrow', 'card-action', () => handlers.view(contact)),
    action('Edit', 'edit', 'card-action', () => handlers.edit(contact)),
    action('Delete', 'trash', 'card-action card-delete', () => handlers.remove(contact)),
  );
  card.append(header, methods, footer);
  return card;
}

export function detailContent(contact) {
  const content = document.createDocumentFragment();
  for (const { key, label, icon: methodIcon } of METHOD_TYPES) {
    if (!contact[key].length) {
      continue;
    }
    const section = node('section', 'detail-group');
    const title = node('h3');
    title.append(icon(methodIcon), label);
    const list = node('ul', 'detail-values');
    list.append(...contact[key].map((value) => node('li', '', value)));
    section.append(title, list);
    content.append(section);
  }
  if (contact.notes) {
    const section = node('section', 'detail-group');
    section.append(node('h3', '', 'Notes'), node('p', 'preserve-text', contact.notes));
    content.append(section);
  }
  if (!content.childNodes.length) {
    content.append(node('p', 'muted', 'No contact details have been added.'));
  }
  return content;
}

export function renderMethodFields(container, contact) {
  container.replaceChildren();
  for (const { key, label, icon: methodIcon, maxLength } of METHOD_TYPES) {
    const section = node('fieldset', 'method-fieldset');
    const legend = node('legend');
    legend.append(icon(methodIcon), `${label}`);
    const input = node('input');
    input.name = key;
    input.type = key === 'emails' ? 'email' : key === 'phones' ? 'tel' : 'text';
    input.maxLength = maxLength;
    input.setAttribute('aria-label', label);
    input.value = contact?.[key][0] ?? '';
    section.append(legend, input);
    container.append(section);
  }
}
