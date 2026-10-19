// Medição da divulgação: de onde veio cada inscrição e eventos para os anúncios.
// Carregado em todas as páginas (home, /investidor, blog e dicionário).
//
// 1. Origem: guarda os parâmetros utm_* da URL, a primeira página vista e o
//    site de onde a pessoa veio. Fica no navegador por 30 dias e segue junto
//    com o cadastro (lp/script.js lê argosMedicao.origem()). Assim, quem chega
//    por um artigo do blog e se inscreve depois na home mantém a origem.
// 2. Pixel da Meta e GA4: só carregam quando os IDs abaixo estiverem
//    preenchidos. Vazios, nada externo é carregado.

(function () {
  'use strict';

  // Preencher com os IDs das contas do Argos.
  var META_PIXEL_ID = ''; // ex.: '123456789012345'
  var GA4_ID = '';        // ex.: 'G-XXXXXXXXXX'

  var CHAVE = 'argos_origem';
  var VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;
  var CAMPOS_UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

  function ler() {
    try {
      var bruto = window.localStorage.getItem(CHAVE);
      if (!bruto) return null;
      var dado = JSON.parse(bruto);
      if (!dado || Date.now() - dado.ts > VALIDADE_MS) return null;
      return dado;
    } catch (e) {
      return null;
    }
  }

  function gravar(dado) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(dado));
    } catch (e) {
      // Navegação privada ou armazenamento bloqueado: segue sem origem.
    }
  }

  // Só o domínio de quem indicou (sem caminho nem parâmetros, que podem ter
  // dado pessoal). Visitas internas não contam como origem.
  function siteDeOrigem() {
    try {
      if (!document.referrer) return '';
      var host = new URL(document.referrer).hostname;
      return host === window.location.hostname ? '' : host;
    } catch (e) {
      return '';
    }
  }

  var params = new URLSearchParams(window.location.search);
  var utm = {};
  var temUtm = false;
  CAMPOS_UTM.forEach(function (campo) {
    var valor = (params.get(campo) || '').trim().slice(0, 200);
    utm[campo] = valor;
    if (valor) temUtm = true;
  });

  var atual = ler();
  // Último clique com UTM vence; sem UTM, mantém o que já estava guardado.
  if (temUtm || !atual) {
    gravar({
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      landing_page: window.location.pathname.slice(0, 300),
      referrer: siteDeOrigem(),
      ts: Date.now(),
    });
  }

  // ---- Pixel da Meta ----
  if (META_PIXEL_ID) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // ---- Google Analytics 4 ----
  if (GA4_ID) {
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    document.head.appendChild(tag);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  }

  function evento(nomeMeta, nomeGa, extra) {
    try {
      if (META_PIXEL_ID && window.fbq && nomeMeta) window.fbq('track', nomeMeta);
      if (GA4_ID && window.gtag && nomeGa) window.gtag('event', nomeGa, extra || {});
    } catch (e) {
      // Bloqueador de anúncios: o cadastro segue normalmente.
    }
  }

  window.argosMedicao = {
    origem: function () {
      var dado = ler() || {};
      return {
        utm_source: dado.utm_source || '',
        utm_medium: dado.utm_medium || '',
        utm_campaign: dado.utm_campaign || '',
        utm_content: dado.utm_content || '',
        landing_page: dado.landing_page || '',
        referrer: dado.referrer || '',
      };
    },
    // Inscrição concluída na lista de espera.
    inscricao: function () {
      evento('Lead', 'generate_lead');
    },
    // Clique em "Mandar para alguém no WhatsApp" depois do cadastro.
    compartilhou: function () {
      evento(null, 'share', { method: 'whatsapp' });
    },
  };
})();
