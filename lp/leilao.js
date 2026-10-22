// "Leilão em 1 minuto" — carrossel didático, depois da seção do que é gratuito.
// Sem dependências. Tudo dentro de um bloco para não colidir com os
// nomes globais de script.js e morar.js.
(() => {
  const root = document.querySelector('[data-lm]');
  if (!root) return;

  const viewport = root.querySelector('.lm-viewport');
  const track = root.querySelector('.lm-track');
  const slides = Array.from(track.children);
  const prevBtn = root.querySelector('[data-lm-prev]');
  const nextBtn = root.querySelector('[data-lm-next]');
  const dotsWrap = root.querySelector('.lm-dots');
  const nowEl = root.querySelector('[data-lm-now]');
  const live = root.querySelector('.lm-live');
  const total = slides.length;
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stackedMq = window.matchMedia('(max-width: 860px)');
  const reduced = () => reduceMq.matches;

  let index = 0;

  // A coluna do celular acompanha apenas o conteúdo do slide atual.
  // Não animamos altura; a leitura e a rolagem permanecem livres.
  function fitViewport() {
    viewport.style.height = stackedMq.matches ? `${slides[index].offsetHeight}px` : '';
  }

  // ----- Pontos de progresso -----
  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'lm-dot';
    dot.setAttribute('aria-label', `Ir para o slide ${i + 1} de ${total}`);
    // e.detail === 0: clique veio do teclado (Enter/Espaço) → sem animação
    dot.addEventListener('click', (e) => go(i, e.detail !== 0, true));
    dotsWrap.appendChild(dot);
    return dot;
  });

  // ----- Posição do trilho -----
  const setPx = (x) => { track.style.transform = `translate3d(${x}px,0,0)`; };

  function place(animate) {
    const target = `translate3d(${-index * 100}%,0,0)`;
    if (animate && !reduced()) {
      track.style.transition = '';
      track.style.transform = target;
      return;
    }
    track.style.transition = 'none';
    track.style.transform = target;
    void track.offsetWidth; // aplica sem transição antes de devolver a transição
    track.style.transition = '';
  }

  // Valor na tela agora (no meio de uma transição, não é o valor final)
  function presentX() {
    const t = getComputedStyle(track).transform;
    return t && t !== 'none' ? new DOMMatrixReadOnly(t).m41 : 0;
  }

  // ----- Explicação: toca uma vez, na primeira vez que o slide aparece -----
  const brl = (v) => 'R$ ' + v.toLocaleString('pt-BR');

  function play(slide) {
    if (!slide.hasAttribute('data-explain') || slide.classList.contains('is-played')) return;
    const totalEl = slide.querySelector('[data-lm-total]');
    const rows = Array.from(slide.querySelectorAll('[data-add]'));

    if (reduced()) {
      slide.classList.add('is-played');
      return;
    }

    // A conta soma item a item, no ritmo em que cada linha aparece
    if (totalEl && rows.length) {
      let sum = Number(rows[0].dataset.add);
      totalEl.textContent = brl(sum);
      rows.forEach((row, i) => {
        row.style.transitionDelay = `${i * 110}ms`;
        if (i === 0) return;
        setTimeout(() => {
          sum += Number(row.dataset.add);
          totalEl.textContent = brl(sum);
        }, 160 + i * 110);
      });
    }

    // Espera o slide quase assentar para a explicação não disputar atenção
    setTimeout(() => slide.classList.add('is-played'), 160);
  }

  // Antes de tocar, a conta mostra só o lance (o resto ainda não apareceu)
  if (!reduced()) {
    slides.forEach((slide) => {
      const totalEl = slide.querySelector('[data-lm-total]');
      const first = slide.querySelector('[data-add]');
      if (totalEl && first) totalEl.textContent = brl(Number(first.dataset.add));
    });
  }

  // ----- Estado -----
  function update(announce) {
    const focusInside = slides.some((s) => s !== slides[index] && s.contains(document.activeElement));

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.toggleAttribute('inert', !active);
      if (active) slide.removeAttribute('aria-hidden');
      else slide.setAttribute('aria-hidden', 'true');
    });

    dots.forEach((dot, i) => {
      if (i === index) {
        dot.setAttribute('aria-current', 'true');
        dot.classList.add('is-seen');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    nowEl.textContent = String(index + 1);
    prevBtn.setAttribute('aria-disabled', String(index === 0));
    nextBtn.setAttribute('aria-disabled', String(index === total - 1));

    if (announce) {
      live.textContent = `Slide ${index + 1} de ${total}: ${slides[index].dataset.title}`;
    }

    // O foco estava num slide que saiu de vista: leva para o novo
    if (focusInside) {
      slides[index].tabIndex = -1;
      slides[index].focus({ preventScroll: true });
    }

    play(slides[index]);
    fitViewport();
  }

  function go(i, animate, reveal = false) {
    stopHint();
    const next = Math.max(0, Math.min(total - 1, i));
    const changed = next !== index;
    index = next;
    place(animate);
    if (changed) update(true);
    if (changed && reveal && stackedMq.matches && root.getBoundingClientRect().top < 64) {
      root.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }

  // ----- Botões -----
  prevBtn.addEventListener('click', (e) => go(index - 1, e.detail !== 0, true));
  nextBtn.addEventListener('click', (e) => go(index + 1, e.detail !== 0, true));

  // ----- Teclado (setas quando o foco está no carrossel) -----
  // Ação de teclado não anima: troca direto.
  root.addEventListener('keydown', (e) => {
    const map = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: total - 1 };
    if (!(e.key in map) || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const onDot = dots.includes(document.activeElement);
    go(map[e.key], false, true);
    if (onDot) dots[index].focus();
  });

  // ----- Arraste (Pointer Events) -----
  // Segue o dedo 1:1 a partir de onde a pessoa pegou; ao soltar, usa a
  // velocidade para decidir o slide e a mesma curva para assentar.
  const SLOP = 10; // px antes de decidir entre arrastar e rolar a página
  let drag = null;
  let suppressClick = false;

  function rubber(over, dim) {
    const c = 0.55;
    return (over * dim * c) / (dim + c * Math.abs(over));
  }

  viewport.addEventListener('pointerdown', (e) => {
    if (drag) return; // ignora um segundo dedo
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, from: index, samples: [] };
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;

    if (!drag.active) {
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
      if (Math.abs(dy) >= Math.abs(dx)) { drag = null; return; } // é rolagem
      drag.active = true;
      drag.x0 = e.clientX;
      drag.base = presentX(); // pega de onde o trilho está, mesmo no meio da transição
      stopHint();
      track.style.transition = 'none';
      setPx(drag.base);
      try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ponteiro já solto */ }
      root.classList.add('is-dragging');
      const sel = window.getSelection && window.getSelection();
      if (sel) sel.removeAllRanges();
    }

    const w = viewport.clientWidth;
    const min = -(total - 1) * w;
    let x = drag.base + (e.clientX - drag.x0);
    if (x > 0) x = rubber(x, w);
    else if (x < min) x = min - rubber(min - x, w);
    drag.x = x;
    setPx(x);

    drag.samples.push({ x: e.clientX, t: e.timeStamp });
    while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
  });

  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.active) return;

    root.classList.remove('is-dragging');
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);

    const w = viewport.clientWidth;
    const s = d.samples;
    const first = s[0];
    const last = s[s.length - 1];
    const dt = last && first ? last.t - first.t : 0;
    const v = dt > 0 ? (last.x - first.x) / dt : 0; // px/ms
    const moved = d.x - (-d.from * w);

    let target;
    if (e.type !== 'pointercancel' && Math.abs(v) > 0.11 && Math.sign(v) === Math.sign(moved) && Math.abs(moved) > 24) {
      target = d.from - Math.sign(v); // um toque rápido já basta
    } else {
      // Projeta para onde o gesto estava indo (desaceleração 0.99, px/ms)
      // e escolhe o slide mais perto
      const projected = d.x + v * 0.99 / (1 - 0.99);
      target = Math.round(-projected / w);
    }
    target = Math.max(d.from - 1, Math.min(d.from + 1, target));
    go(target, true);
  }

  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);

  // Soltar depois de arrastar não pode "clicar" num link ou botão do slide
  viewport.addEventListener('click', (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClick = false;
  }, true);

  track.addEventListener('dragstart', (e) => e.preventDefault());

  // ----- Dica de arraste -----
  // Quando o carrossel aparece, o trilho desliza um pouco para a esquerda e
  // volta, mostrando a ponta do slide 2; a seta do "Próximo" acompanha.
  // Avisa que há mais conteúdo ao lado. Toca no máximo duas vezes, só no
  // slide 1, e para de vez na primeira troca de slide ou arraste.
  // Com "reduzir movimento", não toca.
  const HINT_DELAY = 700;  // depois que a seção termina de entrar
  const HINT_GAP = 4000;   // pausa até a segunda dica
  const HINT_MAX = 2;
  const HINT_OUT = 300;    // ida, --ease-out
  const HINT_HOLD = 160;   // parada na ponta
  const HINT_BACK = 300;   // volta, --ease-in-out
  const nextIcon = nextBtn.querySelector('svg');
  const cssVar = (name, fallback) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;

  let hintOff = typeof track.animate !== 'function';
  let hintPlays = 0;
  let hintInView = false;
  let hintTimer = 0;
  let hintAnims = [];

  // Celular: ~50px; telas largas: até 96px (sem cortar demais o slide 1)
  const hintDistance = () => Math.round(Math.min(96, Math.max(48, viewport.clientWidth * 0.14)));

  function hintFrames(x) {
    const total = HINT_OUT + HINT_HOLD + HINT_BACK;
    const out = cssVar('--ease-out', 'cubic-bezier(0.23, 1, 0.32, 1)');
    const back = cssVar('--ease-in-out', 'cubic-bezier(0.77, 0, 0.175, 1)');
    return [
      { transform: 'translate3d(0,0,0)', easing: out },
      { transform: `translate3d(${x}px,0,0)`, offset: HINT_OUT / total },
      { transform: `translate3d(${x}px,0,0)`, offset: (HINT_OUT + HINT_HOLD) / total, easing: back },
      { transform: 'translate3d(0,0,0)' },
    ];
  }

  function scheduleHint(delay) {
    clearTimeout(hintTimer);
    hintTimer = setTimeout(playHint, delay);
  }

  function playHint() {
    hintTimer = 0;
    if (hintOff || hintAnims.length || !hintInView || index !== 0 || reduced()) return;
    if (drag || document.hidden) { scheduleHint(HINT_DELAY); return; }

    hintPlays += 1;
    const duration = HINT_OUT + HINT_HOLD + HINT_BACK;
    hintAnims = [track.animate(hintFrames(-hintDistance()), { duration })];
    if (nextIcon) hintAnims.push(nextIcon.animate(hintFrames(4), { duration }));

    hintAnims[0].onfinish = () => {
      hintAnims = [];
      if (hintPlays >= HINT_MAX) hintObserver.disconnect();
      else if (hintInView) scheduleHint(HINT_GAP);
    };
  }

  // Troca de slide ou arraste: a dica sai de cena sem salto, e não volta
  function stopHint() {
    if (hintOff) return;
    hintOff = true;
    clearTimeout(hintTimer);
    hintObserver.disconnect();
    if (!hintAnims.length) return;
    const x = presentX();
    hintAnims.forEach((a) => a.cancel());
    hintAnims = [];
    track.style.transition = 'none';
    setPx(x);
    void track.offsetWidth;
    track.style.transition = '';
  }

  // "Na tela" = 60% do carrossel visível, ou meia tela ocupada por ele
  // (no celular o carrossel pode ser mais alto que a tela)
  const hintObserver = new IntersectionObserver(([entry]) => {
    const seen = entry.intersectionRect.height;
    hintInView = entry.isIntersecting &&
      seen >= Math.min(entry.boundingClientRect.height * 0.6, window.innerHeight * 0.5);
    if (!hintInView) { clearTimeout(hintTimer); hintTimer = 0; return; }
    if (!hintTimer && !hintAnims.length && hintPlays < HINT_MAX) scheduleHint(HINT_DELAY);
  }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });

  if (!hintOff) hintObserver.observe(root);

  // ----- Início -----
  root.classList.add('is-ready');
  place(false);
  update(false);
  const sizeObserver = new ResizeObserver(fitViewport);
  slides.forEach((slide) => sizeObserver.observe(slide));
  stackedMq.addEventListener('change', fitViewport);
})();
