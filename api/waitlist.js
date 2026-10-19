// Grava os cadastros na tabela public.waitlist do Supabase (schema em
// supabase/waitlist.sql) pela conexão Postgres que já existe na Vercel.
// Sem DATABASE_URL (dev local) cai em data/signups.json;
// na Vercel o filesystem é efêmero, então lá o Supabase é obrigatório.

const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');

const DATA_FILE = path.join(__dirname, '..', 'data', 'signups.json');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
let pool;

// De qual porta a pessoa veio: LP de quem quer morar (/) ou de investidor (/investidor/)
const SOURCES = ['investir', 'morar'];

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true,
    });
  }
  return pool;
}

// Origem da inscrição (lp/medicao.js). Cada campo é texto curto e opcional;
// qualquer outra coisa vira string vazia.
const ORIGEM_LIMITES = {
  utm_source: 200,
  utm_medium: 200,
  utm_campaign: 200,
  utm_content: 200,
  landing_page: 300,
  referrer: 200,
};

function cleanOrigem(origem) {
  const limpo = {};
  for (const [campo, limite] of Object.entries(ORIGEM_LIMITES)) {
    const valor = origem && typeof origem[campo] === 'string' ? origem[campo].trim() : '';
    limpo[campo] = valor.slice(0, limite);
  }
  return limpo;
}

// Postgres: coluna inexistente. Acontece se o deploy sair antes de rodar
// supabase/waitlist-origem.sql; nesse caso o cadastro é gravado sem a origem.
const UNDEFINED_COLUMN = '42703';

async function saveToDatabase({ fullName, phone, email, source, origem }) {
  try {
    await getPool().query(
      `insert into public.waitlist
         (full_name, phone, email, source,
          utm_source, utm_medium, utm_campaign, utm_content, landing_page, referrer)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (email) do nothing`,
      [
        fullName, phone, email, source,
        origem.utm_source || null,
        origem.utm_medium || null,
        origem.utm_campaign || null,
        origem.utm_content || null,
        origem.landing_page || null,
        origem.referrer || null,
      ]
    );
  } catch (err) {
    if (err && err.code === UNDEFINED_COLUMN) {
      console.warn('[waitlist] colunas de origem ausentes; rode supabase/waitlist-origem.sql');
      await getPool().query(
        `insert into public.waitlist (full_name, phone, email, source)
         values ($1, $2, $3, $4)
         on conflict (email) do nothing`,
        [fullName, phone, email, source]
      );
      return;
    }
    throw err;
  }
}

async function saveToFile({ fullName, phone, email, source, origem }) {
  let entries = [];
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    entries = JSON.parse(raw);
  } catch {
    entries = [];
  }

  if (!entries.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
    entries.push({ fullName, phone, email, source, origem, ts: new Date().toISOString() });
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
  }
}

async function saveSignup(signup) {
  if (process.env.DATABASE_URL) {
    return saveToDatabase(signup);
  }
  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL não configurada na Vercel');
  }
  return saveToFile(signup);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const { fullName, phone, email, company, source, origem } = req.body || {};

  if (company) {
    res.status(200).json({ ok: true });
    return;
  }

  if (typeof fullName !== 'string' || fullName.trim().length < 3) {
    res.status(400).json({ ok: false, error: 'invalid_name' });
    return;
  }

  if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
    res.status(400).json({ ok: false, error: 'invalid_phone' });
    return;
  }

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: 'invalid_email' });
    return;
  }

  try {
    await saveSignup({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      source: SOURCES.includes(source) ? source : 'investir',
      origem: cleanOrigem(origem),
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[waitlist]', err);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
};
