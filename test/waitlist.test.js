const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const { Pool } = require('pg');

const originalQuery = Pool.prototype.query;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalVercel = process.env.VERCEL;
let queries;
let queryResult;

before(() => {
  process.env.DATABASE_URL = 'postgres://example.test/database';
  delete process.env.VERCEL;
  Pool.prototype.query = async function query(text, values) {
    queries.push({ text, values });
    if (queryResult instanceof Error) throw queryResult;
    return queryResult;
  };
});

beforeEach(() => {
  queries = [];
  queryResult = { rowCount: 1 };
});

after(() => {
  Pool.prototype.query = originalQuery;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
});

function invoke(body, method = 'POST') {
  return new Promise((resolve) => {
    const response = {
      statusCode: 200,
      body: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        resolve(this);
      },
    };
    require('../api/waitlist')({ method, body }, response);
  });
}

test('grava o cadastro com SQL parametrizado', async () => {
  const response = await invoke({
    fullName: 'Maria Silva',
    phone: '(11) 99999-9999',
    email: 'MARIA@EXAMPLE.COM',
    source: 'morar',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(queries.length, 1);
  assert.match(queries[0].text, /on conflict \(email\) do nothing/);
  assert.deepEqual(queries[0].values, [
    'Maria Silva',
    '(11) 99999-9999',
    'maria@example.com',
    'morar',
  ]);
});

test('mantém sucesso quando o e-mail já existe', async () => {
  queryResult = { rowCount: 0 };
  const response = await invoke({
    fullName: 'Maria Silva',
    phone: '(11) 99999-9999',
    email: 'maria@example.com',
    source: 'investir',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
});

test('devolve 500 quando o banco falha', async () => {
  queryResult = new Error('database unavailable');
  const originalConsoleError = console.error;
  console.error = () => {};
  const response = await invoke({
    fullName: 'Maria Silva',
    phone: '(11) 99999-9999',
    email: 'maria@example.com',
    source: 'morar',
  });
  console.error = originalConsoleError;

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { ok: false, error: 'server_error' });
});

test('rejeita telefone inválido sem consultar o banco', async () => {
  const response = await invoke({
    fullName: 'Maria Silva',
    phone: '123',
    email: 'maria@example.com',
    source: 'morar',
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { ok: false, error: 'invalid_phone' });
  assert.equal(queries.length, 0);
});

test('honeypot responde sucesso sem consultar o banco', async () => {
  const response = await invoke({ company: 'spam bot' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(queries.length, 0);
});
