// Página do imóvel: mostra o cartão lateral que leva à análise no Argos depois
// que a pessoa rola um terço da página. Fechado, não volta na mesma sessão.
// Nunca aparece junto do aviso de medição nem cobre o conteúdo no celular
// (lá o caminho é a barra fixa, em CSS).
(function () {
  'use strict';
  var popup = document.getElementById('imovelPopup');
  if (!popup) return;
  var CHAVE = 'argos_popup_imovel';
  try { if (window.sessionStorage.getItem(CHAVE)) return; } catch (e) { /* armazenamento bloqueado */ }
  var desktop = window.matchMedia('(min-width: 881px)');

  function mostrar() {
    if (!desktop.matches || document.getElementById('medicao-aviso')) return;
    var rolado = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (rolado < 0.33) return;
    window.removeEventListener('scroll', mostrar);
    popup.hidden = false;
    // Um quadro depois de exibir, para a transição de entrada acontecer.
    window.requestAnimationFrame(function () { popup.classList.add('is-visible'); });
  }

  popup.querySelector('[data-popup-fechar]').addEventListener('click', function () {
    popup.classList.remove('is-visible');
    popup.hidden = true;
    try { window.sessionStorage.setItem(CHAVE, '1'); } catch (e) { /* vale nesta página */ }
  });
  window.addEventListener('scroll', mostrar, { passive: true });
})();
