const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../lp/script.js'), 'utf8');
// Executa o handler real, sem iniciar menus, carrosséis ou chamadas de rede.
const handler = source.slice(source.indexOf("form.addEventListener('submit'"), source.indexOf('// ===== Compartilhar depois do cadastro'));

for (const created of [true, false, undefined]) {
  test(`conversão só dispara quando a API confirma cadastro novo: ${created}`, async () => {
    let submit;
    let conversions = 0;
    const context = {
      form: {
        elements: { fullName: { value: 'Maria Silva' }, phone: { value: '(11) 99999-9999' }, email: { value: 'maria@example.com' }, company: { value: '' } },
        dataset: { source: 'morar' }, addEventListener(name, callback) { submit = callback; },
      },
      window: { argosMedicao: { origem: () => ({}), inscricao() { conversions++; } } },
      submitBtn: { querySelector: () => ({}), dataset: {} },
      modalBody: { hidden: false }, modalSuccess: { hidden: true },
      setError() {}, submitLabel: 'Cadastrar',
      EMAIL_RE: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, PHONE_RE: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
      fetch: async () => ({ ok: true, json: async () => ({ ok: true, created }) }),
    };
    vm.runInNewContext(handler, context);
    await submit({ preventDefault() {} });
    assert.equal(context.modalSuccess.hidden, false);
    assert.equal(conversions, created === true ? 1 : 0);
  });
}
