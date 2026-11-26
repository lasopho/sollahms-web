'use strict';
(() => {
  const endpoint = '/api/interno-bonos-pie';
  const requestForm = document.getElementById('request-form');
  const verifyForm = document.getElementById('verify-form');
  const requestButton = document.getElementById('request-code');
  const verifyButton = document.getElementById('verify-code');
  const resendButton = document.getElementById('resend-code');
  const codeInput = document.getElementById('code');
  const status = document.getElementById('login-status');
  let sending = false;
  let waitUntil = 0;
  let timer;
  function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
  }
  async function post(op, body) {
    const response = await fetch(`${endpoint}?op=${op}`, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(response.status === 429 ? 'Se alcanzó el límite de intentos. Espera unos minutos antes de volver a intentar.' : response.status === 401 || response.status === 400 ? 'El código no es válido o ha vencido. Revísalo o solicita uno nuevo.' : 'No pudimos completar el acceso. Inténtalo nuevamente en unos minutos.');
      error.status = response.status;
      throw error;
    }
    return result;
  }
  function cooldown() {
    const seconds = Math.max(0, Math.ceil((waitUntil - Date.now()) / 1000));
    resendButton.disabled = sending || seconds > 0;
    resendButton.textContent = seconds > 0 ? `Enviar otro código en ${seconds} s` : 'Enviar otro código';
    if (seconds === 0 && timer) { clearInterval(timer); timer = undefined; }
  }
  async function requestCode(event) {
    event?.preventDefault();
    if (sending || Date.now() < waitUntil) return;
    sending = true;
    requestButton.disabled = true;
    resendButton.disabled = true;
    requestButton.setAttribute('aria-busy', 'true');
    message('Enviando un código a la cuenta administradora…');
    try {
      await post('request-code', {});
      requestForm.hidden = true;
      verifyForm.hidden = false;
      codeInput.value = '';
      codeInput.focus();
      message('Código enviado. Revisa el correo de la cuenta administradora.');
      waitUntil = Date.now() + 60_000;
      if (timer) clearInterval(timer);
      timer = setInterval(cooldown, 1000);
    } catch (error) {
      message(error.status === 400 || error.status === 401 ? 'No pudimos enviar el código de acceso. Inténtalo nuevamente.' : error.message || 'No hay conexión. Inténtalo nuevamente.', true);
    } finally {
      sending = false;
      requestButton.disabled = false;
      requestButton.removeAttribute('aria-busy');
      cooldown();
    }
  }
  requestForm.addEventListener('submit', requestCode);
  resendButton.addEventListener('click', requestCode);
  codeInput.addEventListener('input', () => { codeInput.value = codeInput.value.replace(/[^0-9]/g, '').slice(0, 8); codeInput.removeAttribute('aria-invalid'); });
  verifyForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    if (!/^[0-9]{8}$/.test(codeInput.value)) { codeInput.setAttribute('aria-invalid', 'true'); codeInput.focus(); message('Ingresa los ocho dígitos del código.', true); return; }
    sending = true;
    verifyButton.disabled = true;
    resendButton.disabled = true;
    verifyButton.setAttribute('aria-busy', 'true');
    message('Verificando acceso…');
    try {
      await post('verify-code', { code: codeInput.value });
      codeInput.value = '';
      window.location.replace('/bonos-pie');
    } catch (error) {
      codeInput.setAttribute('aria-invalid', 'true');
      message(error.message || 'No hay conexión. Inténtalo nuevamente.', true);
      codeInput.focus();
    } finally {
      sending = false;
      verifyButton.disabled = false;
      verifyButton.removeAttribute('aria-busy');
      cooldown();
    }
  });
})();
