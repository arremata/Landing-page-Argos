// Opcionais desligados até uma escolha explícita. IDs vazios não carregam SDKs.
(function () {
  'use strict';
  var META_PIXEL_ID = '';
  var GA4_ID = '';
  var CHAVE = 'argos_origem';
  var CONSENTIMENTO = 'argos_consentimento';
  var DIA = 24 * 60 * 60 * 1000;
  var CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var gaIniciado = false;
  var metaIniciado = false;

  function ler(chave, dias) {
    try {
      var dado = JSON.parse(window.localStorage.getItem(chave));
      if (!dado || !Number.isFinite(dado.ts) || dado.ts > Date.now() || Date.now() - dado.ts >= dias * DIA) {
        window.localStorage.removeItem(chave);
        return null;
      }
      return dado;
    } catch (e) { return null; }
  }
  function gravar(chave, dado) {
    try { window.localStorage.setItem(chave, JSON.stringify(dado)); } catch (e) { /* escolha vale nesta página */ }
  }
  function remover(chave) {
    try { window.localStorage.removeItem(chave); } catch (e) { /* armazenamento bloqueado */ }
  }

  var salvo = ler(CONSENTIMENTO, 180);
  var escolha = salvo && salvo.version === 1 && typeof salvo.analytics === 'boolean' && typeof salvo.marketing === 'boolean' ? salvo : null;
  var origemMemoria = null;

  function capturarOrigem() {
    if (!escolha || !escolha.analytics) return;
    var params = new URLSearchParams(window.location.search);
    var utm = {};
    var temUtm = false;
    CAMPOS.forEach(function (campo) {
      utm[campo] = (params.get(campo) || '').trim().slice(0, 200);
      if (utm[campo]) temUtm = true;
    });
    var atual = ler(CHAVE, 30);
    // Última campanha com UTM vence; navegação interna não apaga a campanha.
    if (!temUtm && atual) { origemMemoria = atual; return; }
    var referrer = '';
    try {
      var host = new URL(document.referrer).hostname;
      if (host !== window.location.hostname) referrer = host;
    } catch (e) { /* sem referência externa */ }
    origemMemoria = Object.assign(utm, { landing_page: window.location.pathname.slice(0, 300), referrer: referrer, ts: Date.now() });
    gravar(CHAVE, origemMemoria);
  }

  function iniciarFerramentas() {
    if (escolha && escolha.marketing && META_PIXEL_ID && !metaIniciado) {
      metaIniciado = true;
      // Stub padrão: depois do download, o SDK instala callMethod.
      if (!window.fbq) {
        var fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
        fbq.queue = []; fbq.loaded = true; fbq.version = '2.0';
      }
      window._fbq = window._fbq || window.fbq;
      var pixel = document.createElement('script');
      pixel.async = true;
      pixel.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(pixel);
      window.fbq('consent', 'grant');
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }
    if (escolha && escolha.analytics && GA4_ID && !gaIniciado) {
      gaIniciado = true;
      window['ga-disable-' + GA4_ID] = false;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA4_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
      var tag = document.createElement('script');
      tag.async = true;
      tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
      document.head.appendChild(tag);
    }
  }

  function limparCookies(analytics, marketing) {
    document.cookie.split(';').forEach(function (cookie) {
      var nome = cookie.split('=')[0].trim();
      if (!(analytics && /^(?:_ga(?:_|$)|_gid$|_gat)/.test(nome)) && !(marketing && /^_fb[pc]$/.test(nome))) return;
      var partes = window.location.hostname.split('.');
      var dominios = [''];
      while (partes.length > 1) { dominios.push(partes.join('.')); partes.shift(); }
      dominios.forEach(function (dominio) {
        document.cookie = nome + '=; Max-Age=0; path=/' + (dominio ? '; domain=' + dominio : '');
      });
    });
  }

  function aplicar(analytics, marketing) {
    var revogaGa = gaIniciado && !analytics;
    var revogaMeta = metaIniciado && !marketing;
    escolha = { version: 1, analytics: analytics === true, marketing: marketing === true, ts: Date.now() };
    gravar(CONSENTIMENTO, escolha);
    if (!escolha.analytics) { remover(CHAVE); origemMemoria = null; }
    if (revogaGa) window['ga-disable-' + GA4_ID] = true;
    if (revogaMeta && window.fbq) window.fbq('consent', 'revoke');
    limparCookies(!escolha.analytics, !escolha.marketing);
    var aviso = document.getElementById('medicao-aviso');
    if (aviso) aviso.remove();
    atualizarFormulario();
    // Remover a tag não descarrega o SDK que já foi executado.
    if (revogaGa || revogaMeta) { window.location.reload(); return; }
    capturarOrigem();
    iniciarFerramentas();
  }

  function atualizarFormulario() {
    var form = document.getElementById('medicao-preferencias');
    if (!form) return;
    form.elements.analytics.checked = !!(escolha && escolha.analytics);
    form.elements.marketing.checked = !!(escolha && escolha.marketing);
    var status = document.getElementById('medicao-status');
    if (status) status.textContent = escolha ? 'Preferências salvas. Você pode alterá-las nesta página.' : 'A medição opcional está desligada. Escolha o que permitir.';
  }

  function interfaceConsentimento() {
    atualizarFormulario();
    if (!escolha || document.getElementById('medicao-preferencias')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = '/lp/medicao.css'; document.head.appendChild(css);
    }
    if (!escolha && !document.getElementById('medicao-preferencias')) {
      var aviso = document.createElement('aside');
      aviso.id = 'medicao-aviso'; aviso.className = 'medicao-aviso'; aviso.setAttribute('aria-labelledby', 'medicao-titulo');
      aviso.innerHTML = '<p id="medicao-titulo"><strong>Você escolhe como medir sua visita</strong></p><p>Com sua permissão, guardamos a origem do cadastro e usamos Google Analytics para medição e Meta para anúncios, quando configurados. Recusar não impede o cadastro.</p><div class="medicao-acoes"><button type="button" class="button is-secondary" data-medicao="reject">Recusar opcionais</button><button type="button" class="button" data-medicao="accept">Aceitar opcionais</button><a href="/privacidade/#preferencias">Escolher por finalidade</a></div>';
      document.body.appendChild(aviso);
    }
    document.addEventListener('click', function (event) {
      var alvo = event.target.closest('[data-medicao]');
      if (!alvo) return;
      aplicar(alvo.dataset.medicao === 'accept', alvo.dataset.medicao === 'accept');
    });
    var form = document.getElementById('medicao-preferencias');
    if (form) form.addEventListener('submit', function (event) {
      event.preventDefault();
      aplicar(form.elements.analytics.checked, form.elements.marketing.checked);
    });
  }

  if (!escolha || !escolha.analytics) remover(CHAVE);
  capturarOrigem();
  iniciarFerramentas();
  window.argosMedicao = {
    origem: function () {
      var dado = escolha && escolha.analytics ? (ler(CHAVE, 30) || origemMemoria || {}) : {};
      var limpo = {};
      CAMPOS.concat(['landing_page', 'referrer']).forEach(function (campo) { limpo[campo] = dado[campo] || ''; });
      return limpo;
    },
    inscricao: function () {
      try {
        if (escolha && escolha.marketing && metaIniciado) window.fbq('track', 'Lead');
        if (escolha && escolha.analytics && gaIniciado) window.gtag('event', 'generate_lead');
      } catch (e) { /* falha de medição não altera o cadastro */ }
    },
    compartilhou: function () {
      try {
        if (escolha && escolha.analytics && gaIniciado) window.gtag('event', 'share', { method: 'whatsapp' });
      } catch (e) { /* bloqueador não impede o compartilhamento */ }
    },
  };
  window.addEventListener('storage', function (event) {
    if (event.key === CONSENTIMENTO || event.key === null) window.location.reload();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', interfaceConsentimento);
  else interfaceConsentimento();
})();
