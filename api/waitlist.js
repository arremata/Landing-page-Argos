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

async function saveToDatabase({ fullName, phone, email, source }) {
  await getPool().query(
    `insert into public.waitlist (full_name, phone, email, source)
     values ($1, $2, $3, $4)
     on conflict (email) do nothing`,
    [fullName, phone, email, source]
  );
}

async function saveToFile({ fullName, phone, email, source }) {
  let entries = [];
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    entries = JSON.parse(raw);
  } catch {
    entries = [];
  }

  if (!entries.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
    entries.push({ fullName, phone, email, source, ts: new Date().toISOString() });
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

  const { fullName, phone, email, company, source } = req.body || {};

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
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[waitlist]', err);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
};
