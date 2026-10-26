/* Preview selector only. Existing project, booking and calculator flows remain unchanged. */
(() => {
  const requested = new URL(window.location.href).searchParams.get('cabecera');
  const version = ['a', 'b', 'c'].includes(requested) ? requested : 'a';
  document.documentElement.dataset.ciVersion = version;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector(`[data-ci-option="${version}"]`)?.setAttribute('aria-current', 'page');
  });
})();
