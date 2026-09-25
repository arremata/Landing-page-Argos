// Grava os cadastros na tabela public.waitlist do Supabase (schema em
// supabase/waitlist.sql) via REST, com a secret key que só existe na Vercel.
// Sem SUPABASE_URL/SUPABASE_SECRET_KEY (dev local) cai em data/signups.json;
// na Vercel o filesystem é efêmero, então lá o Supabase é obrigatório.

const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'signups.json');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;

// De qual porta a pessoa veio: LP de quem quer morar (/) ou de investidor (/investidor/)
const SOURCES = ['investir', 'morar'];

async function saveToSupabase({ fullName, phone, email, source }) {
  const base = process.env.SUPABASE_URL.replace(/\/+$/, '');
  const res = await fetch(`${base}/rest/v1/waitlist?on_conflict=email`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json',
      // E-mail repetido não é erro: mantém o primeiro cadastro e responde ok.
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({ full_name: fullName, phone, email, source }),
  });

  if (!res.ok) {
    throw new Error(`supabase ${res.status}: ${await res.text()}`);
  }
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
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    return saveToSupabase(signup);
  }
  if (process.env.VERCEL) {
    throw new Error('SUPABASE_URL/SUPABASE_SECRET_KEY não configuradas na Vercel');
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
