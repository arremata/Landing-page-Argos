(() => {
  const input = document.querySelector('[data-dictionary-search]');
  if (!input) return;

  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const entries = [...document.querySelectorAll('[data-dictionary-entry]')];
  const groups = [...document.querySelectorAll('[data-dictionary-group]')];
  const count = document.querySelector('[data-dictionary-count]');
  const empty = document.querySelector('[data-dictionary-empty]');
  const index = document.querySelector('[data-dictionary-index]');

  input.addEventListener('input', () => {
    const query = normalize(input.value);
    let visible = 0;

    for (const entry of entries) {
      const matches = !query || normalize(entry.dataset.search).includes(query);
      entry.hidden = !matches;
      if (matches) visible += 1;
    }

    for (const group of groups) {
      group.hidden = !group.querySelector('[data-dictionary-entry]:not([hidden])');
    }

    index.hidden = Boolean(query);
    count.hidden = !query || visible === 0;
    empty.hidden = !query || visible !== 0;
    if (query && visible > 0) {
      count.textContent = `${visible} ${visible === 1 ? 'palavra' : 'palavras'}`;
    }
  });
})();
