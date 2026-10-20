const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../lp/medicao.js'), 'utf8');

function browser({ store = new Map(), search = '?utm_source=google&utm_campaign=guia', pathname = '/recursos/checklist-antes-do-lance/', form = false, blocked = false, configured = true } = {}) {
  const elements = new Map();
  const events = {};
  const windowEvents = {};
  const resources = [];
  const deletedCookies = [];
  let reloads = 0;
  const preferences = form ? { elements: { analytics: { checked: false }, marketing: { checked: false } }, addEventListener(name, callback) { events['form:' + name] = callback; } } : null;
  if (form) { elements.set('medicao-preferencias', preferences); elements.set('medicao-status', {}); }
  const document = {
    readyState: 'complete', referrer: 'https://www.google.com/search?q=privado',
    head: { appendChild(element) { resources.push(element); } },
    body: { appendChild(element) { elements.set(element.id, element); } },
    createElement(tag) { return { tag, setAttribute() {}, remove() { elements.delete(this.id); } }; },
    getElementById(id) { return elements.get(id); },
    addEventListener(name, callback) { events[name] = callback; },
  };
  Object.defineProperty(document, 'cookie', { get: () => '_ga=analytics; _fbp=marketing; session=keep', set: value => deletedCookies.push(value) });
  const window = {
    location: { search, pathname, hostname: 'www.argosleiloes.com.br', reload() { reloads++; } },
    localStorage: {
      getItem(key) { if (blocked) throw Error('blocked'); return store.get(key) || null; },
      setItem(key, value) { if (blocked) throw Error('blocked'); store.set(key, value); },
      removeItem(key) { if (blocked) throw Error('blocked'); store.delete(key); },
    },
    addEventListener(name, callback) { windowEvents[name] = callback; },
  };
  const code = configured ? source.replace("var META_PIXEL_ID = '';", "var META_PIXEL_ID = '123';").replace("var GA4_ID = '';", "var GA4_ID = 'G-TEST';") : source;
  vm.runInNewContext(code, { window, document, URL, URLSearchParams, Date, Number });
  return {
    window, resources, store, elements, preferences, deletedCookies,
    get reloads() { return reloads; },
    choose(value) { events.click({ target: { dataset: { medicao: value }, closest() { return this; } } }); },
    save(analytics, marketing) { preferences.elements.analytics.checked = analytics; preferences.elements.marketing.checked = marketing; events['form:submit']({ preventDefault() {} }); },
    storage(event) { windowEvents.storage(event); },
  };
}

test('sem escolha não carrega rastreadores nem guarda ou envia origem', () => {
  const b = browser();
  assert.equal(b.resources.filter(item => item.tag === 'script').length, 0);
  assert.equal(b.store.has('argos_origem'), false);
  assert.equal(b.window.argosMedicao.origem().utm_source, '');
  assert.ok(b.elements.has('medicao-aviso'));
});

test('recusa persiste sem criar origem e nunca envia eventos', () => {
  const b = browser(); b.choose('reject'); b.window.argosMedicao.inscricao();
  assert.equal(b.resources.filter(item => item.tag === 'script').length, 0);
  assert.equal(b.store.has('argos_origem'), false);
  assert.equal(JSON.parse(b.store.get('argos_consentimento')).analytics, false);
  assert.equal(b.elements.has('medicao-aviso'), false);
  assert.equal(browser({ store: b.store }).elements.has('medicao-aviso'), false);
});

test('aceite captura campanha e preserva origem na navegação recurso → home', () => {
  const b = browser(); b.choose('accept');
  assert.equal(b.resources.filter(item => item.tag === 'script').length, 2);
  const origin = b.window.argosMedicao.origem();
  assert.equal(origin.utm_source, 'google');
  assert.equal(origin.referrer, 'www.google.com');
  assert.equal(origin.landing_page, '/recursos/checklist-antes-do-lance/');
  const home = browser({ store: b.store, search: '?cadastro=1', pathname: '/' });
  assert.equal(home.window.argosMedicao.origem().utm_source, 'google');
  assert.equal(home.window.argosMedicao.origem().landing_page, origin.landing_page);
  const next = browser({ store: b.store, search: '?utm_source=whatsapp', pathname: '/' });
  assert.equal(next.window.argosMedicao.origem().utm_source, 'whatsapp');
});

test('preferências são separadas por finalidade e IDs vazios não carregam SDKs', () => {
  const analytics = browser({ form: true }); analytics.save(true, false);
  assert.equal(analytics.resources.filter(item => item.tag === 'script').length, 1);
  assert.match(analytics.resources.find(item => item.tag === 'script').src, /googletagmanager/);
  analytics.window.argosMedicao.inscricao();
  assert.ok(analytics.window.dataLayer.some(args => args[1] === 'generate_lead'));
  const marketing = browser({ form: true }); marketing.save(false, true);
  assert.equal(marketing.window.argosMedicao.origem().utm_source, '');
  assert.match(marketing.resources.find(item => item.tag === 'script').src, /facebook/);
  marketing.window.argosMedicao.inscricao();
  assert.ok(marketing.window.fbq.queue.some(args => args[1] === 'Lead'));
  const empty = browser({ configured: false }); empty.choose('accept');
  assert.equal(empty.resources.filter(item => item.tag === 'script').length, 0);
});

test('revogação apaga origem e cookies próprios conhecidos e descarrega SDKs', () => {
  const b = browser(); b.choose('accept'); b.choose('reject');
  assert.equal(b.store.has('argos_origem'), false);
  assert.equal(b.window.argosMedicao.origem().utm_source, '');
  assert.equal(b.reloads, 1);
  assert.equal(b.window['ga-disable-G-TEST'], true);
  assert.ok(b.deletedCookies.some(value => value.startsWith('_ga=')));
  assert.ok(b.deletedCookies.some(value => value.startsWith('_fbp=')));
  assert.equal(b.deletedCookies.some(value => value.startsWith('session=')), false);
  b.storage({ key: 'argos_consentimento' }); assert.equal(b.reloads, 2);
});

test('consentimento vencido e origem inválida não são reutilizados', () => {
  const store = new Map([
    ['argos_consentimento', JSON.stringify({ version: 1, analytics: true, marketing: true, ts: Date.now() - 181 * 86400000 })],
    ['argos_origem', JSON.stringify({ utm_source: 'old', ts: Date.now() })],
  ]);
  const b = browser({ store });
  assert.equal(b.store.has('argos_origem'), false);
  assert.equal(b.resources.filter(item => item.tag === 'script').length, 0);
  const blocked = browser({ blocked: true }); blocked.choose('accept');
  assert.equal(blocked.window.argosMedicao.origem().utm_source, 'google');
});
