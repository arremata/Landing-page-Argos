// MVP local-first: grava os cadastros em data/signups.json no disco.
// Em produção na Vercel o filesystem é efêmero — troque por Supabase,
// Airtable ou Resend antes de divulgar a lista publicamente.

const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'signups.json');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;

async function saveSignup({ fullName, phone, email }) {
  let entries = [];
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    entries = JSON.parse(raw);
  } catch {
    entries = [];
  }

  if (!entries.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
    entries.push({ fullName, phone, email, ts: new Date().toISOString() });
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const { fullName, phone, email, company } = req.body || {};

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
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'server_error' });
  }
};
