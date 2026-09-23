// ===== Mobile nav =====
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

function closeMobileMenu() {
  navToggle.classList.remove('is-open');
  mobileMenu.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('is-open');
  navToggle.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

mobileMenu.querySelectorAll('a, button').forEach((el) => {
  el.addEventListener('click', closeMobileMenu);
});

// ===== Navbar scroll =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 20);
}, { passive: true });

// ===== Smooth scroll =====
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ===== Modal popup =====
const overlay = document.getElementById('modalOverlay');
const modalBox = overlay.querySelector('.modal-box');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');
const modalSuccess = document.getElementById('modalSuccess');

function openModal() {
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeMobileMenu();
  setTimeout(() => {
    const firstInput = modalBox.querySelector('input:not(.hp)');
    if (firstInput) firstInput.focus();
  }, 350);
}

function closeModal() {
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-open-modal]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });
});

modalClose.addEventListener('click', closeModal);

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (overlay.classList.contains('is-open')) closeModal();
    closeMobileMenu();
  }
});

// ===== Phone mask =====
const phoneInput = document.getElementById('phone');

phoneInput.addEventListener('input', () => {
  let v = phoneInput.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 6) {
    v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 2) {
    v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  } else if (v.length > 0) {
    v = `(${v}`;
  }
  phoneInput.value = v;
});

// ===== Waitlist form =====
const form = document.getElementById('waitlistForm');
const submitBtn = document.getElementById('submitBtn');
const formError = document.getElementById('formError');
const submitLabel = submitBtn.querySelector('.btn-label').textContent;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;

function setError(message) {
  formError.hidden = !message;
  formError.textContent = message || '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setError('');

  const fullName = form.elements.fullName.value.trim();
  const phone = form.elements.phone.value.trim();
  const email = form.elements.email.value.trim();
  const honeypot = form.elements.company.value;

  if (!fullName || fullName.length < 3) {
    setError('Digite seu nome completo.');
    form.elements.fullName.focus();
    return;
  }

  if (!PHONE_RE.test(phone)) {
    setError('Digite um celular válido. Ex: (41) 99999-9999');
    form.elements.phone.focus();
    return;
  }

  if (!EMAIL_RE.test(email)) {
    setError('Digite um e-mail válido.');
    form.elements.email.focus();
    return;
  }

  if (honeypot) {
    modalBody.hidden = true;
    modalSuccess.hidden = false;
    return;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-label').textContent = 'Enviando...';

  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone, email, source: form.dataset.source || 'investir' }),
    });

    if (!res.ok) throw new Error('request_failed');

    modalBody.hidden = true;
    modalSuccess.hidden = false;
  } catch (err) {
    setError('Não foi possível concluir. Tente novamente em alguns instantes.');
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-label').textContent = submitLabel;
  }
});

// ===== Live analysis animation =====
const analysisSteps = document.querySelectorAll('.live-step');
const analysisResult = document.getElementById('analysisResult');
const analysisStatus = document.getElementById('analysisStatus');

let analysisStarted = false;

function runAnalysis() {
  if (analysisStarted) return;
  analysisStarted = true;

  const delays = [600, 1400, 2400, 3200, 3800];

  analysisSteps.forEach((item, i) => {
    setTimeout(() => {
      item.classList.add('is-done');
    }, delays[i]);
  });

  setTimeout(() => {
    analysisStatus.innerHTML = '<span class="live-dot" style="animation:none;opacity:1"></span> Análise concluída';
    analysisResult.classList.add('is-visible');
  }, 4400);
}

const liveCardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setTimeout(runAnalysis, 500);
      liveCardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const liveCard = document.getElementById('liveCard');
if (liveCard) liveCardObserver.observe(liveCard);

// ===== Scroll reveal =====
const revealEls = document.querySelectorAll('[data-reveal]');
const revealCards = document.querySelectorAll('.step-card, .feature-card');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      sectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach((el) => sectionObserver.observe(el));

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const card = entry.target;
      const siblings = Array.from(card.parentElement.children);
      const idx = siblings.indexOf(card);
      setTimeout(() => card.classList.add('is-visible'), idx * 120);
      cardObserver.unobserve(card);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

revealCards.forEach((el) => cardObserver.observe(el));

// ===== Counter animation =====
const counters = document.querySelectorAll('[data-count]');

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const el = entry.target;
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isDecimal = String(target).includes('.');
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = target * eased;
      const formatted = isDecimal
        ? current.toFixed(1)
        : Math.round(current).toLocaleString('pt-BR');
      el.textContent = formatted + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.3 });

counters.forEach((el) => counterObserver.observe(el));

// ===== Compare rows stagger =====
const compareRows = document.querySelectorAll('[data-reveal-row]');

const rowObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const row = entry.target;
    const rows = Array.from(row.parentElement.querySelectorAll('[data-reveal-row]'));
    const idx = rows.indexOf(row);
    setTimeout(() => row.classList.add('is-visible'), idx * 100);
    rowObserver.unobserve(row);
  });
}, { threshold: 0.1 });

compareRows.forEach((el) => rowObserver.observe(el));

// ===== Signup FAB (show after 30% scroll) =====
const signupFab = document.getElementById('signupFab');

if (signupFab) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    signupFab.classList.toggle('is-visible', scrolled > 0.3);
  }, { passive: true });
}
