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

// ===== Modal em modo "contato" =====
// Os botões com data-modal="contato" abrem o mesmo formulário, com texto de contato.
(() => {
  const form = document.getElementById('waitlistForm');
  if (!form) return;
  const title = document.getElementById('modalTitle');
  const desc = document.querySelector('.modal-desc');
  const label = form.querySelector('.btn-label');
  const okTitle = document.querySelector('#modalSuccess h3');
  const okText = document.querySelector('#modalSuccess p');

  const TEXTS = {
    padrao: {
      title: title.textContent, desc: desc.textContent, label: label.textContent,
      okTitle: okTitle.textContent, okText: okText.textContent, source: form.dataset.source,
    },
    contato: {
      title: 'Fale com a nossa equipe',
      desc: 'Informe seus dados e entraremos em contato pelo WhatsApp.',
      label: 'Enviar',
      okTitle: 'Contato recebido',
      okText: 'Nossa equipe falará com você em breve.',
      source: 'contato',
    },
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-modal]');
    if (!btn) return;
    const t = TEXTS[btn.dataset.modal] || TEXTS.padrao;
    title.textContent = t.title;
    desc.textContent = t.desc;
    label.textContent = t.label;
    label.closest('button').dataset.label = t.label;
    okTitle.textContent = t.okTitle;
    okText.textContent = t.okText;
    form.dataset.source = t.source;
  }, true);
})();

// ===== Menu some ao rolar para baixo; o botão flutuante assume o lugar =====
// Rolando para baixo: o menu sai por cima e o "Quero ser avisado" flutuante entra.
// Rolando para cima (ou no topo): o menu volta e o flutuante sai. Nunca os dois.
(() => {
  const nav = document.getElementById('nav');
  const fab = document.getElementById('signupFab');
  const menu = document.getElementById('mobileMenu');
  if (!nav || !fab) return;

  const TOP = 80;      // perto do topo, o menu fica sempre visível
  const DELTA = 6;     // ignora tremidas pequenas de rolagem
  let lastY = window.scrollY;
  let ticking = false;

  function setHidden(hidden) {
    nav.classList.toggle('is-hidden', hidden);
    fab.classList.toggle('is-visible', hidden);
  }

  function update() {
    ticking = false;
    const y = window.scrollY;
    if (menu && menu.classList.contains('is-open')) { lastY = y; return; }
    if (y < TOP) { setHidden(false); lastY = y; return; }
    if (Math.abs(y - lastY) < DELTA) return;
    setHidden(y > lastY);
    lastY = y;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  // Foco por teclado dentro do menu traz o menu de volta.
  nav.addEventListener('focusin', () => setHidden(false));
  setHidden(false);
})();
