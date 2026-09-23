// LP "Quero morar". Nav, modal, formulário e reveal vêm de /lp/script.js;
// aqui ficam só as abas, o simulador de lance e o passo a passo.

// ===== Abas do imóvel de exemplo =====
const tabs = Array.from(document.querySelectorAll('.tab'));

function selectTab(tab) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
    t.tabIndex = active ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
  });
}

tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
});

// ===== Simulador "Quanto você pretende oferecer" =====
// Números do imóvel de exemplo. Sem "Seu limite" (PD-012 do app: parecia
// recomendação). Condomínio fica de fora de propósito: o documento cita a
// dívida sem valor, e por isso o total leva "+" (PD-009).
const EXAMPLE = {
  avaliacao: 290000,
  comissao: 0.05,
  itbi: 0.03,
  registro: 4100,
  iptu: 2300,
  reforma: 12000,
  jurosAno: 0.105,
  meses: 360,
  seguros: 50,
};

const brl = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

function costs(lance) {
  const comissao = lance * EXAMPLE.comissao;
  const itbi = lance * EXAMPLE.itbi;
  const total = lance + comissao + itbi + EXAMPLE.registro + EXAMPLE.iptu + EXAMPLE.reforma;
  return { comissao, itbi, total };
}

function parcela(lance) {
  const financiado = lance * 0.95;
  const i = Math.pow(1 + EXAMPLE.jurosAno, 1 / 12) - 1;
  const pmt = financiado * i / (1 - Math.pow(1 + i, -EXAMPLE.meses));
  return Math.round((pmt + EXAMPLE.seguros) / 10) * 10;
}

const range = document.getElementById('bidRange');
const fill = document.querySelector('.slider-fill');
const signalText = document.getElementById('signalText');

function render() {
  const lance = Number(range.value);
  const { comissao, itbi, total } = costs(lance);
  const folga = EXAMPLE.avaliacao - total;

  const out = {
    lance: brl(lance),
    comissao: brl(comissao),
    itbi: brl(itbi),
    total: brl(total),
    entrada: brl(lance * 0.05),
    parcela: brl(parcela(lance)),
  };
  document.querySelectorAll('[data-out]').forEach((el) => {
    el.textContent = out[el.dataset.out];
  });

  // Fato, não conselho: só compara o total com a avaliação oficial
  const aval = brl(EXAMPLE.avaliacao);
  signalText.textContent = folga >= 0
    ? `Com essa oferta, o total até a chave fica ${brl(folga)} abaixo do valor de avaliação (${aval}).`
    : `Com essa oferta, o total até a chave passa o valor de avaliação (${aval}) em ${brl(-folga)}.`;

  const pct = ((lance - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
  fill.style.width = pct + '%';
  range.setAttribute('aria-valuetext', brl(lance));
}

if (range) {
  range.addEventListener('input', render);
  render();

  // Movimento sutil na primeira vez que o simulador aparece: mostra que dá
  // para arrastar sem precisar de ninguém explicar.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let touched = false;
  range.addEventListener('pointerdown', () => { touched = true; });

  const nudgeObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    nudgeObserver.disconnect();
    if (reduced) return;

    const start = Number(range.value);
    const peak = start + 22000;
    const duration = 1400;
    const t0 = performance.now();

    function frame(now) {
      if (touched) return;
      const p = Math.min((now - t0) / duration, 1);
      const wave = Math.sin(p * Math.PI);
      range.value = Math.round((start + (peak - start) * wave) / 1000) * 1000;
      render();
      if (p < 1) requestAnimationFrame(frame);
    }
    setTimeout(() => requestAnimationFrame(frame), 500);
  }, { threshold: 0.6 });

  nudgeObserver.observe(range);
}

// ===== Passo a passo: marcar o que já fez =====
const checks = Array.from(document.querySelectorAll('.check'));
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

function renderProgress() {
  const done = checks.filter((c) => c.classList.contains('is-done')).length;
  const pct = Math.round((done / checks.length) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = `${done} de ${checks.length} etapas concluídas · ${pct}%`;
}

checks.forEach((btn) => {
  btn.addEventListener('click', () => {
    const done = btn.classList.toggle('is-done');
    btn.setAttribute('aria-pressed', String(done));
    renderProgress();
  });
});

renderProgress();
