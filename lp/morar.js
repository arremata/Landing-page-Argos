// LP "Quero morar". Nav, modal, formulário e reveal vêm de /lp/script.js;
// aqui ficam o vídeo, as abas do imóvel de exemplo, o simulador e o passo a passo.

// ===== Vídeo demo =====
// Para publicar: preencher data-video-src do #videoPlay com um link do
// YouTube/Vimeo ou um arquivo .mp4.
const videoBtn = document.getElementById('videoPlay');

function embedUrl(src) {
  const yt = src.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vimeo = src.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  return null;
}

if (videoBtn) {
  videoBtn.addEventListener('click', () => {
    const src = videoBtn.dataset.videoSrc;
    if (!src) return;
    let player;
    const url = embedUrl(src);
    if (url) {
      player = document.createElement('iframe');
      player.src = url;
      player.allow = 'autoplay; fullscreen; picture-in-picture';
      player.allowFullscreen = true;
      player.title = 'Vídeo de demonstração do Argos';
    } else {
      player = document.createElement('video');
      player.src = src;
      player.controls = true;
      player.autoplay = true;
      player.playsInline = true;
    }
    videoBtn.replaceWith(player);
    const note = document.getElementById('videoNote');
    if (note) note.hidden = true;
  });
}

// ===== Contato: formulário que abre o e-mail com a dúvida pronta =====
(() => {
  const EMAIL_TO = 'argosleiloes@gmail.com';
  const overlay = document.getElementById('contactOverlay');
  if (!overlay) return;
  const form = document.getElementById('contactForm');
  const body = document.getElementById('contactBody');
  const ok = document.getElementById('contactSuccess');
  const err = document.getElementById('contactError');
  const phone = document.getElementById('cPhone');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    body.hidden = false;
    ok.hidden = true;
    err.hidden = true;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('cName').focus(), 200);
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open-contact]').forEach((btn) => {
    btn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  });
  document.getElementById('contactClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  phone.addEventListener('input', () => {
    let v = phone.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    phone.value = v;
  });

  function fail(msg, field) {
    err.textContent = msg;
    err.hidden = false;
    field.focus();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    err.hidden = true;
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const tel = form.elements.phone.value.trim();
    const msg = form.elements.message.value.trim();

    if (name.length < 3) return fail('Informe seu nome completo.', form.elements.name);
    if (!EMAIL_RE.test(email)) return fail('Informe um e-mail válido.', form.elements.email);
    if (!PHONE_RE.test(tel)) return fail('Informe um telefone válido. Ex.: (41) 99999-9999', form.elements.phone);
    if (msg.length < 5) return fail('Escreva sua dúvida.', form.elements.message);

    const subject = `Dúvida pelo site — ${name}`;
    const text = `${msg}\n\n---\nNome: ${name}\nE-mail: ${email}\nTelefone: ${tel}`;
    window.location.href = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

    body.hidden = true;
    ok.hidden = false;
    form.reset();
  });
})();

// ===== Menu some ao rolar para baixo; o botão flutuante assume o lugar =====
// Rolando para baixo: o menu sai por cima e o "Quero ser avisado" flutuante entra.
// Rolando para cima (ou no topo): o menu volta e o flutuante sai. Nunca os dois.
(() => {
  const nav = document.getElementById('nav');
  const fab = document.getElementById('signupFab');
  const menu = document.getElementById('mobileMenu');
  if (!nav || !fab) return;

  const TOP = 160;     // perto do topo, o menu fica sempre visível
  const HIDE_AFTER = 60; // só some depois de descer 60px seguidos (evita sumir de repente)
  const SHOW_AFTER = 24; // volta com uma subida curta
  let travel = 0;        // quanto já rolou na direção atual
  let lastY = window.scrollY;
  let ticking = false;

  function setHidden(hidden) {
    nav.classList.toggle('is-hidden', hidden);
    fab.classList.toggle('is-visible', hidden);
  }

  // Clique num link do menu (ou em qualquer âncora da página): a rolagem até a
  // seção é nossa, não da pessoa, então o menu fica visível até ela terminar.
  let locked = false;
  let unlockTimer = null;
  function unlockSoon() {
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(() => { locked = false; lastY = window.scrollY; }, 150);
  }
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.getAttribute('href').length < 2) return;
    locked = true;
    setHidden(false);
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(() => { locked = false; lastY = window.scrollY; }, 1200);
  }, true);

  function update() {
    ticking = false;
    const y = window.scrollY;
    if (locked) { setHidden(false); lastY = y; unlockSoon(); return; }
    if (menu && menu.classList.contains('is-open')) { lastY = y; return; }
    if (y < TOP) { setHidden(false); travel = 0; lastY = y; return; }
    const dy = y - lastY;
    lastY = y;
    if (dy === 0) return;
    // acumula na mesma direção; trocar de direção zera a conta
    travel = (Math.sign(dy) === Math.sign(travel)) ? travel + dy : dy;
    if (travel > HIDE_AFTER) setHidden(true);
    else if (travel < -SHOW_AFTER) setHidden(false);
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  // Foco por teclado dentro do menu traz o menu de volta.
  nav.addEventListener('focusin', () => setHidden(false));
  setHidden(false);
})();
