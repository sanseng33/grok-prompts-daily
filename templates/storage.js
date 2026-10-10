(function () {
  // Storage adapter for hidden rows. Async API: get(id) / set(id, rec|null) / list().
  // Record shape: { id, handle, date, hidden_at (ISO), reason }
  // localStorage = offline cache; when signed in to Supabase, hidden_items is the source of truth.
  const PREFIX = 'grok-hidden:';
  const SB_URL = 'https://zvfyxgtxwwpcvrwakkzq.supabase.co';
  const SB_KEY = 'sb_publishable_h8c4KdaD1mNrRl2b5HEn3A_MWUgUbC8';
  const local = {
    async get(id) { try { const v = localStorage.getItem(PREFIX + id); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    async set(id, rec) { try { rec == null ? localStorage.removeItem(PREFIX + id) : localStorage.setItem(PREFIX + id, JSON.stringify(rec)); } catch (e) {} },
    async list() {
      const out = [];
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) out.push(JSON.parse(localStorage.getItem(k))); } } catch (e) {}
      return out;
    },
    clear() { try { Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  };
  let sb = null, user = null;
  const toRow = r => ({ post_id: r.id, handle: r.handle || null, day: r.date || null, reason: r.reason || null, hidden_at: r.hidden_at || new Date().toISOString() });
  const fromRow = x => ({ id: x.post_id, handle: x.handle || '', date: x.day || '', reason: x.reason || '', hidden_at: x.hidden_at });
  const emit = () => window.dispatchEvent(new Event('grok-hidden-sync'));

  async function sync() {
    if (!sb || !user) return;
    const flag = 'grok-sync-merged:' + user.id;
    if (!localStorage.getItem(flag)) {  // first sign-in on this device: push local hides up
      const mine = await local.list();
      if (mine.length) {
        const { error } = await sb.from('hidden_items').upsert(mine.map(toRow), { onConflict: 'user_id,post_id' });
        if (error) { console.warn(error); return; }
      }
      localStorage.setItem(flag, '1');
    }
    const all = []; let from = 0;
    for (;;) {
      const { data, error } = await sb.from('hidden_items').select('post_id,handle,day,reason,hidden_at').range(from, from + 999);
      if (error) { console.warn(error); return; }
      all.push(...data); if (data.length < 1000) break; from += 1000;
    }
    local.clear();
    for (const x of all) await local.set(x.post_id, fromRow(x));
    emit();
  }

  window.HiddenStore = {
    get: local.get,
    list: local.list,
    async set(id, rec) {
      await local.set(id, rec);
      if (!sb || !user) return;
      const q = rec == null ? sb.from('hidden_items').delete().eq('post_id', id)
                            : sb.from('hidden_items').upsert(toRow(rec), { onConflict: 'user_id,post_id' });
      const { error } = await q; if (error) console.warn(error);
    }
  };
  window.Prefs = {
    get(k, d) { try { const v = localStorage.getItem('grok-pref:' + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('grok-pref:' + k, v); } catch (e) {} }
  };

  function ui() {
    const box = document.createElement('div'); box.id = 'sync-box';
    document.body.appendChild(box);
    function draw() {
      if (user) {
        box.innerHTML = `<span>${(user.email || '').replace(/[<>&]/g, '')}</span> <button type="button" id="sync-out">退出</button>`;
        box.querySelector('#sync-out').onclick = async () => { await sb.auth.signOut(); };
      } else {
        box.innerHTML = `<button type="button" id="sync-open">登录同步</button><form id="sync-form" hidden>
          <input type="email" id="sync-email" placeholder="email" autocomplete="username" required/>
          <input type="password" id="sync-pw" placeholder="password" autocomplete="current-password" required/>
          <button type="submit">登录</button><span id="sync-err"></span></form>`;
        const f = box.querySelector('#sync-form');
        box.querySelector('#sync-open').onclick = () => { f.hidden = !f.hidden; };
        f.onsubmit = async e => {
          e.preventDefault();
          if (!sb) { box.querySelector('#sync-err').textContent = '×'; return; }
          const { error } = await sb.auth.signInWithPassword({ email: f.querySelector('#sync-email').value, password: f.querySelector('#sync-pw').value });
          box.querySelector('#sync-err').textContent = error ? '× ' + error.message : '';
        };
      }
    }
    draw();
    return draw;
  }

  async function init() {
    const draw = ui();
    try {
      const mod = await import('https://esm.sh/@supabase/supabase-js@2');
      sb = mod.createClient(SB_URL, SB_KEY);
      const { data } = await sb.auth.getSession();
      user = data.session ? data.session.user : null; draw();
      if (user) sync();
      sb.auth.onAuthStateChange((ev, session) => {
        const was = user && user.id; user = session ? session.user : null; draw();
        if (user && user.id !== was) sync();
      });
    } catch (e) { console.warn('supabase unavailable', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
