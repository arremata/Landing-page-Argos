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

// ===== Abas do imóvel (mesmo comportamento das abas do app) =====
const tabs = Array.from(document.querySelectorAll('.app-tab'));

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

// ===== Simulador: quanto você tem disponível → quanto dá para oferecer =====
// Mesma equação do app (PD-006/PD-008): oferta + custos = total até a chave.
// Aqui ela roda ao contrário: parte do valor que a pessoa tem.
const EXAMPLE = {
  valorInicial: 180000,
  avaliacao: 290000,
  comissao: 0.05,
  itbi: 0.03,
  registro: 0.008,
  desocupacao: 5000,
  reformaMax: 60000,
};

const pctSobreOferta = EXAMPLE.comissao + EXAMPLE.itbi + EXAMPLE.registro;
const brl = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const brlCents = (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const budgetRange = document.getElementById('budgetRange');
const renoRange = document.getElementById('renoRange');
const desocToggle = document.getElementById('desocToggle');
const billRows = document.getElementById('billRows');
const budgetAnswer = document.getElementById('budgetAnswer');
const compareFact = document.getElementById('compareFact');

function reforma() {
  return Math.round((Number(renoRange.value) / 100) * EXAMPLE.reformaMax / 100) * 100;
}

// Explicações "?" abertas continuam abertas quando a conta é refeita.
const openHints = new Set();

function desocupacao() {
  return desocToggle && !desocToggle.checked ? 0 : EXAMPLE.desocupacao;
}

function rowHtml(r, total) {
  const pct = total > 0 ? (r.value / total) * 100 : 0;
  const open = openHints.has(r.label);
  return `
    <div class="bill-row" role="row">
      <button type="button" class="bill-q" aria-expanded="${open}" aria-label="Explicação de ${r.label}" data-key="${r.label}">?</button>
      <span><span class="bill-label">${r.label}</span><span class="bill-hint"${open ? '' : ' hidden'}>${r.hint}</span></span>
      <span class="bill-weight"><span class="bill-bar"><span style="width:${Math.min(pct * 2.5, 100)}%"></span></span><span class="bill-pct">${pct.toFixed(1)}%</span></span>
      <span class="bill-money">${brlCents(r.value)}</span>
    </div>`;
}

function setFill(input) {
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--fill', pct + '%');
}

function render() {
  const budget = Number(budgetRange.value);
  const ref = reforma();
  const desoc = desocupacao();
  const fixos = desoc + ref;

  const maxOferta = Math.floor((budget - fixos) / (1 + pctSobreOferta) / 100) * 100;
  const cabe = maxOferta >= EXAMPLE.valorInicial;
  const oferta = cabe ? maxOferta : EXAMPLE.valorInicial;

  const rows = [
    { label: 'Valor da compra', value: oferta, hint: 'O seu lance. É o que vai para quem está vendendo.' },
    { label: 'Comissão do leiloeiro (5%)', value: oferta * EXAMPLE.comissao, hint: 'Pago por você, além do lance. Não está incluído no preço.' },
    { label: 'ITBI (3%)', value: oferta * EXAMPLE.itbi, hint: 'O imposto da prefeitura para passar o imóvel para o seu nome.' },
    { label: 'Registro em cartório (0,8%)', value: oferta * EXAMPLE.registro, hint: 'Para o imóvel ficar oficialmente no seu nome.' },
    { label: 'Desocupação (estimativa)', value: desoc, hint: 'Reserva para o caso de alguém estar morando. Estimativa nossa, não é obrigatória: você decide se inclui.' },
    { label: 'Reforma', value: ref, hint: 'O que você pretende gastar para se mudar. Você escolhe no controle acima.' },
  ].filter((r) => r.value > 0);

  const total = rows.reduce((s, r) => s + r.value, 0);
  billRows.innerHTML = rows.map((r) => rowHtml(r, total)).join('');

  document.querySelector('[data-out="budget"]').textContent = brl(budget);
  document.querySelector('[data-out="reforma"]').textContent = brl(ref);
  const desocOut = document.querySelector('[data-out="desocupacao"]');
  if (desocOut) desocOut.closest('.field-card').classList.toggle('is-off', desoc === 0);
  document.querySelector('[data-out="total"]').textContent = brlCents(total);

  if (cabe) {
    budgetAnswer.classList.remove('is-short');
    budgetAnswer.innerHTML = `Com <strong>${brl(budget)}</strong> para a sua casa, dá para oferecer até <strong>${brl(oferta)}</strong> neste imóvel — com todos os custos até a chave.`;
  } else {
    budgetAnswer.classList.add('is-short');
    budgetAnswer.innerHTML = `Com <strong>${brl(budget)}</strong> ainda não fecha. Neste imóvel, o valor inicial é ${brl(EXAMPLE.valorInicial)} e o total mínimo até a chave é <strong>${brl(total)}</strong>.`;
  }

  const folga = EXAMPLE.avaliacao - total;
  compareFact.textContent = folga >= 0
    ? `O total fica ${brl(folga)} abaixo do valor de avaliação (${brl(EXAMPLE.avaliacao)}).`
    : `O total passa o valor de avaliação (${brl(EXAMPLE.avaliacao)}) em ${brl(-folga)}.`;

  budgetRange.setAttribute('aria-valuetext', brl(budget));
  renoRange.setAttribute('aria-valuetext', brl(ref));
  setFill(budgetRange);
  setFill(renoRange);
}

if (budgetRange) {
  budgetRange.addEventListener('input', render);
  renoRange.addEventListener('input', render);
  if (desocToggle) desocToggle.addEventListener('change', render);

  // "?" de cada linha abre a explicação, como no app
  billRows.addEventListener('click', (e) => {
    const btn = e.target.closest('.bill-q');
    if (!btn) return;
    const hint = btn.parentElement.querySelector('.bill-hint');
    hint.hidden = !hint.hidden;
    btn.setAttribute('aria-expanded', String(!hint.hidden));
    if (hint.hidden) openHints.delete(btn.dataset.key); else openHints.add(btn.dataset.key);
  });

  render();

  // Movimento sutil na primeira vez que o simulador aparece: mostra que dá
  // para arrastar sem ninguém precisar explicar.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let touched = false;
  budgetRange.addEventListener('pointerdown', () => { touched = true; });

  const nudgeObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    nudgeObserver.disconnect();
    if (reduced) return;

    const start = Number(budgetRange.value);
    const peak = start + 30000;
    const duration = 1600;
    let t0;

    function frame(now) {
      if (touched) return;
      t0 = t0 || now;
      const p = Math.min((now - t0) / duration, 1);
      budgetRange.value = Math.round((start + (peak - start) * Math.sin(p * Math.PI)) / 1000) * 1000;
      render();
      if (p < 1) requestAnimationFrame(frame);
    }
    setTimeout(() => requestAnimationFrame(frame), 500);
  }, { threshold: 0.6 });

  nudgeObserver.observe(budgetRange);
}

// ===== Passo a passo: marcar o que já fez =====
const checks = Array.from(document.querySelectorAll('.check'));
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

function renderProgress() {
  const done = checks.filter((c) => c.classList.contains('is-done')).length;
  const pct = Math.round((done / checks.length) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = `${done} de ${checks.length} etapas · ${pct}%`;
}

checks.forEach((btn) => {
  btn.addEventListener('click', () => {
    const done = btn.classList.toggle('is-done');
    btn.setAttribute('aria-pressed', String(done));
    renderProgress();
  });
});

renderProgress();

// ===== Aluguel x imobiliária x leilão =====
// Exemplo ilustrativo, com as premissas escritas em "Como a conta foi feita".
// Mesmas condições de financiamento nas duas compras: só muda o preço de partida.
(() => {
  const root = document.getElementById('cmp');
  if (!root) return;

  const JUROS_ANO = 0.10;
  const MESES = 360;
  const ENTRADA = 0.20;
  const ALUGUEL = 1500;

  const i = Math.pow(1 + JUROS_ANO, 1 / 12) - 1;
  const parcela = (valor) => valor * i / (1 - Math.pow(1 + i, -MESES));

  const imobPreco = 290000;
  const leilaoLance = 180000;

  // Saldo que ainda falta pagar do financiamento depois de n meses (tabela Price).
  const saldo = (valor, n) => {
    const f = Math.pow(1 + i, n);
    return Math.max(0, valor * f - parcela(valor) * (f - 1) / i);
  };

  const paths = {
    aluguel: { start: 0, month: ALUGUEL },
    imobiliaria: {
      financiado: imobPreco * (1 - ENTRADA),
      // entrada + ITBI (3%) + registro (0,8%)
      start: imobPreco * ENTRADA + imobPreco * (0.03 + 0.008),
      month: parcela(imobPreco * (1 - ENTRADA)),
    },
    leilao: {
      financiado: leilaoLance * (1 - ENTRADA),
      // entrada + comissão (5%) + ITBI (3%) + registro (0,8%) + reserva de desocupação
      start: leilaoLance * ENTRADA + leilaoLance * (0.05 + 0.03 + 0.008) + 5000,
      month: parcela(leilaoLance * (1 - ENTRADA)),
    },
  };

  const opts = Array.from(root.querySelectorAll('.cmp-opt'));
  const seg = root.querySelector('.cmp-seg');
  const take = document.getElementById('cmpTake');

  function render(years) {
    const paid = {};
    Object.entries(paths).forEach(([k, p]) => { paid[k] = p.start + p.month * 12 * years; });
    const max = Math.max(...Object.values(paid));

    Object.entries(paths).forEach(([k, p]) => {
      const row = root.querySelector(`[data-path="${k}"]`);
      row.querySelector('[data-c="start"]').textContent = brl(p.start);
      row.querySelector('[data-c="month"]').textContent = brl(p.month);
      row.querySelector('[data-c="paid"]').textContent = brl(paid[k]);
      row.querySelector('.cmp-fill').style.setProperty('--w', (paid[k] / max).toFixed(4));
      const end = row.querySelector('[data-c="end"]');
      if (end && p.financiado) {
        const falta = saldo(p.financiado, years * 12);
        const base = k === 'leilao'
          ? 'No fim: o mesmo imóvel, avaliado em R$ 290.000, está no seu nome.'
          : 'No fim: o imóvel está no seu nome.';
        end.innerHTML = falta > 0
          ? `${base} <span class="cmp-owe">Falta pagar ${brl(falta)} do financiamento.</span>`
          : `${base} <span class="cmp-owe">Financiamento quitado.</span>`;
      }
    });

    const menos = paid.imobiliaria - paid.leilao;
    const abaixoAluguel = ALUGUEL - paths.leilao.month;
    let txt = `Em <strong>${years} anos</strong>, comprando em leilão você paga <strong>${brl(menos)} a menos</strong> do que pela imobiliária — pelo mesmo imóvel.`;
    if (abaixoAluguel > 0) txt += ` E a parcela fica <strong>${brl(abaixoAluguel)} abaixo</strong> do aluguel.`;
    take.innerHTML = txt;
  }

  function select(btn) {
    opts.forEach((o, idx) => {
      const on = o === btn;
      o.classList.toggle('is-on', on);
      o.setAttribute('aria-checked', String(on));
      o.tabIndex = on ? 0 : -1;
      if (on) seg.style.setProperty('--i', idx);
    });
    render(Number(btn.dataset.years));
  }

  opts.forEach((o, idx) => {
    o.addEventListener('click', () => select(o));
    o.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = opts[(idx + step + opts.length) % opts.length];
      select(next);
      next.focus();
    });
  });

  // As barras crescem quando a seção aparece (explica a diferença), não antes.
  const initial = opts.find((o) => o.classList.contains('is-on')) || opts[1];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) { select(initial); return; }
  opts.forEach((o) => { o.tabIndex = o === initial ? 0 : -1; });
  seg.style.setProperty('--i', opts.indexOf(initial));
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    select(initial);
  }, { threshold: 0.35 });
  io.observe(root);
})();

// ===== Modal em modo "contato" =====
// Os botões com data-modal="contato" abrem o mesmo formulário, com texto de contato.
(() => {
  const form = document.getElementById('waitlistForm');
  if (!form) return;
  const title = document.getElementById('modalTitle');
  const desc = document.querySelector('.modal-desc');
  const label = form.querySelector('.btn-label');
  const note = document.querySelector('.modal-note');
  const okTitle = document.querySelector('#modalSuccess h3');
  const okText = document.querySelector('#modalSuccess p');

  const TEXTS = {
    padrao: {
      title: title.textContent, desc: desc.innerHTML, label: label.textContent,
      note: note ? note.lastChild.textContent : '', okTitle: okTitle.textContent, okText: okText.textContent,
      source: form.dataset.source,
    },
    contato: {
      title: 'Fale com a gente',
      desc: 'Deixe seu contato. <strong>Uma pessoa da nossa equipe</strong> te chama no WhatsApp para tirar suas dúvidas.',
      label: 'Quero conversar',
      note: ' Sem spam. A gente só fala sobre a sua dúvida.',
      okTitle: 'Recebemos seu contato!',
      okText: 'Uma pessoa da nossa equipe vai te chamar em breve.',
      source: 'contato',
    },
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-modal]');
    if (!btn) return;
    const t = TEXTS[btn.dataset.modal] || TEXTS.padrao;
    title.textContent = t.title;
    desc.innerHTML = t.desc;
    label.textContent = t.label;
    label.closest('button').dataset.label = t.label;
    if (note) note.lastChild.textContent = t.note;
    okTitle.textContent = t.okTitle;
    okText.textContent = t.okText;
    form.dataset.source = t.source;
  }, true);
})();
