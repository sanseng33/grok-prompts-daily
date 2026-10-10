(function () {
  // Storage adapter for per-post user state (hidden rows). Async API so a cloud backend
  // (Cloudflare KV / Supabase) can replace localStorage without touching viewer.js.
  // Record shape: { id, handle, date, hidden_at (ISO), reason }
  const PREFIX = 'grok-hidden:';
  const local = {
    async get(id) { try { const v = localStorage.getItem(PREFIX + id); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    async set(id, rec) { try { rec == null ? localStorage.removeItem(PREFIX + id) : localStorage.setItem(PREFIX + id, JSON.stringify(rec)); } catch (e) {} },
    async list() {
      const out = [];
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) out.push(JSON.parse(localStorage.getItem(k))); } } catch (e) {}
      return out;
    }
  };
  window.HiddenStore = window.HiddenStore || local;
  window.Prefs = {
    get(k, d) { try { const v = localStorage.getItem('grok-pref:' + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('grok-pref:' + k, v); } catch (e) {} }
  };
})();
