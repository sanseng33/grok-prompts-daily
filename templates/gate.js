(function () {
  var STORAGE_KEY = 'grok-prompts-gate-ok';
  // SHA-256("soke2026") — soft client-side lock only; hash is visible in source.
  var PASS_HASH = 'c343c00a5ef5753909541010ef9e44ac11d1c42140053c0b93ef2b6c1e3822c1';

  function unlock() {
    document.documentElement.classList.add('unlocked');
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  function alreadyOk() {
    try { return sessionStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }

  async function sha256Hex(text) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function buildOverlay() {
    var el = document.createElement('div');
    el.id = 'pw-gate';
    el.innerHTML =
      '<div class="pw-card">' +
        '<form id="pw-form" autocomplete="current-password">' +
          '<input type="password" id="pw-input" placeholder="密码" autofocus />' +
        '</form>' +
        '<p class="pw-err" id="pw-err" hidden>×</p>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function init() {
    if (alreadyOk()) {
      unlock();
      return;
    }
    var overlay = buildOverlay();
    var form = document.getElementById('pw-form');
    var input = document.getElementById('pw-input');
    var err = document.getElementById('pw-err');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      err.hidden = true;
      var ok = false;
      try {
        ok = (await sha256Hex(input.value)) === PASS_HASH;
      } catch (ex) {
        // Fallback if SubtleCrypto unavailable (e.g. file:// in some browsers)
        ok = input.value === 'soke2026';
      }
      if (ok) {
        unlock();
        overlay.remove();
      } else {
        err.hidden = false;
        input.select();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
