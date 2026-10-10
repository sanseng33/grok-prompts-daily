(function () {
  // v3 viewer (2026-10-10): 已关注/新发现 分区 + 类型分组 + 题材/参考图/NSFW 筛选 + 实时相对时间
  const C = {
    source: '来源', part: '分区', handle: '博主', link: '帖子链接', time: '发布时间(UTC+8)', iso: '发布时间ISO(UTC)',
    tcat: '类型分组', type: '类型', steps: '步骤数', tags: '题材标签', nsfw: 'NSFW程度', ref: '参考图兼容',
    reason: '判断理由', loc: '提示词位置', likes: '点赞数'
  };
  const SECTIONS = [['已关注', '已关注博主'], ['新发现', '新发现博主']];
  const TYPES = ['生图', '生视频', '多步'];
  const BUCKETS = [[0, 20, '0-20 日常/轻微性感'], [21, 40, '21-40 泳装内衣擦边'], [41, 60, '41-60 半裸/强暗示'],
                   [61, 80, '61-80 裸露/性暗示'], [81, 100, '81-100 露骨性行为']];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function tagsOf(r) { return String(r[C.tags] || '').split(/[、,，|]/).map(s => s.trim()).filter(Boolean); }
  function tcat(r) {
    if (r[C.tcat]) return r[C.tcat];
    return (Number(r[C.steps]) > 1 || String(r[C.type] || '').includes('→')) ? '多步' : (r[C.type] || '');
  }
  function srcOf(r) { const s = r[C.source] || r[C.part] || ''; return s.startsWith('已关注') ? '已关注' : '新发现'; }
  function isoOf(r) {
    if (r[C.iso]) return r[C.iso];
    const t = r[C.time]; if (!t) return null;
    return String(t).replace(' ', 'T') + ':00+08:00';
  }
  function rel(iso) {
    const t = Date.parse(iso); if (isNaN(t)) return '';
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + '分钟前';
    if (s < 86400) return Math.floor(s / 3600) + '小时前';
    if (s < 86400 * 30) return Math.floor(s / 86400) + '天前';
    return Math.floor(s / 86400 / 30) + '个月前';
  }
  function abs8(iso) {
    const t = Date.parse(iso); if (isNaN(t)) return '';
    const d = new Date(t + 8 * 3600e3);
    const p = n => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} (UTC+8)`;
  }
  function stepFields(row) {
    const out = [];
    for (let i = 1; i <= 8; i++) {
      const t = row[`步骤${i}类型`], p = row[`步骤${i}提示词`], z = row[`步骤${i}中文翻译`];
      if (!p && !z) continue;
      out.push({ i, type: t || '', prompt: p || '', zh: z || '' });
    }
    return out;
  }
  function promptHtml(label, text) {
    if (!text) return '';
    const collapsed = text.length > 120 || text.split('\n').length > 3;
    return `<div class="prompt-block"><div class="prompt-label">${esc(label)}</div>
      <div class="prompt-text${collapsed ? ' collapsed' : ''}">${esc(text)}</div>
      ${collapsed ? '<button type="button" class="toggle">展开 / 收起</button>' : ''}</div>`;
  }
  function nsfwClass(n) { return n > 80 ? 'n5' : n > 60 ? 'n4' : n > 40 ? 'n3' : n > 20 ? 'n2' : 'n1'; }

  function renderRow(r) {
    const steps = stepFields(r);
    const iso = isoOf(r);
    const n = Number(r[C.nsfw]);
    const ref = r[C.ref] || '';
    const prompts = steps.map(s => {
      const head = `步骤${s.i}${s.type ? ' · ' + s.type : ''}`;
      return promptHtml(head + ' · 原文', s.prompt) + promptHtml(head + ' · 中文', s.zh);
    }).join('');
    return `<tr data-tags="${esc(tagsOf(r).join('|'))}" data-ref="${esc(ref)}" data-nsfw="${isNaN(n) ? '' : n}">
      <td class="handle">${esc(r[C.handle] || '')}<br/><a href="${esc(r[C.link] || '#')}" target="_blank" rel="noopener">打开帖子</a></td>
      <td class="meta"><span class="reltime" data-iso="${esc(iso || '')}" title="${esc(iso ? abs8(iso) : '')}">${esc(iso ? rel(iso) : '')}</span></td>
      <td><span class="chip">${esc(r[C.type] || '')}</span></td>
      <td><span class="chip nsfw ${isNaN(n) ? '' : nsfwClass(n)}">${isNaN(n) ? '—' : n}</span></td>
      <td><span class="chip ${ref === '仅无图生成' ? 'noref' : 'okref'}">${esc(ref || '—')}</span><div class="meta">${esc(r[C.reason] || '')}</div></td>
      <td class="tags">${tagsOf(r).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</td>
      <td class="prompt-cell">${prompts || '<span class="meta">—</span>'}</td>
      <td class="meta">${esc(r[C.loc] || '')}</td>
      <td class="meta">${esc(r[C.likes] ?? '')}</td>
    </tr>`;
  }
  const THEAD = '<thead><tr><th>博主</th><th>发布</th><th>类型</th><th>NSFW</th><th>参考图兼容</th><th>题材</th><th>各步骤提示词 + 中文翻译</th><th>位置</th><th>点赞</th></tr></thead>';

  function mount(root, rows, dateLabel) {
    const dl = root.querySelector('#date-label'); if (dl && dateLabel) dl.textContent = dateLabel;
    const v = root.querySelector('#viewer');
    const allTags = [...new Set(rows.flatMap(tagsOf))].sort();
    const refs = [...new Set(rows.map(r => r[C.ref]).filter(Boolean))].sort();
    let html = `<div class="toolbar">
      <div><label>题材标签</label><select id="f-tag"><option value="">全部</option>${allTags.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
      <div><label>参考图兼容</label><select id="f-ref"><option value="">全部</option>${refs.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
      <div><label>NSFW档</label><select id="f-bucket"><option value="">全部</option>${BUCKETS.map((b, i) => `<option value="${i}">${b[2]}</option>`).join('')}</select></div>
      <div><label>NSFW 范围</label><input type="range" id="f-min" min="0" max="100" value="0"/><input type="range" id="f-max" min="0" max="100" value="100"/><span id="f-range">0–100</span></div>
      <div class="stat" id="stat"></div></div>
      <div class="tabs">${SECTIONS.map(([k, l], i) => `<button type="button" class="tab${i === 0 ? ' active' : ''}" data-sec="${k}">${l} <b data-count="${k}"></b></button>`).join('')}
      <button type="button" class="tab" data-sec="*">全部显示</button></div>`;
    for (const [k, label] of SECTIONS) {
      const part = rows.filter(r => srcOf(r) === k);
      html += `<section class="sec" data-sec="${k}"><h2>${label} <span class="meta" data-count2="${k}"></span></h2>`;
      if (!part.length) html += '<p class="empty">无</p>';
      for (const t of TYPES) {
        const g = part.filter(r => tcat(r) === t).sort((a, b) => (b[C.likes] || 0) - (a[C.likes] || 0));
        if (!g.length) continue;
        html += `<div class="grp"><h3>${t} <span class="meta grp-count"></span></h3><div class="table-wrap"><table>${THEAD}<tbody>${g.map(renderRow).join('')}</tbody></table></div></div>`;
      }
      html += '</section>';
    }
    v.innerHTML = html;
    const $ = s => v.querySelector(s);
    let current = SECTIONS[0][0];
    function apply() {
      const tag = $('#f-tag').value, ref = $('#f-ref').value, b = $('#f-bucket').value;
      let lo = +$('#f-min').value, hi = +$('#f-max').value; if (lo > hi) [lo, hi] = [hi, lo];
      if (b !== '') { lo = Math.max(lo, BUCKETS[b][0]); hi = Math.min(hi, BUCKETS[b][1]); }
      $('#f-range').textContent = `${lo}–${hi}`;
      let shown = 0;
      v.querySelectorAll('section.sec').forEach(sec => {
        const k = sec.getAttribute('data-sec'); let ss = 0, st = 0;
        sec.querySelectorAll('.grp').forEach(g => {
          let gs = 0, gt = 0;
          g.querySelectorAll('tbody tr').forEach(tr => {
            gt++;
            const n = tr.dataset.nsfw === '' ? -1 : +tr.dataset.nsfw;
            const ok = (!tag || tr.dataset.tags.split('|').includes(tag)) && (!ref || tr.dataset.ref === ref) &&
              (n < 0 ? (lo === 0 && hi === 100) : (n >= lo && n <= hi));
            tr.style.display = ok ? '' : 'none'; if (ok) gs++;
          });
          g.querySelector('.grp-count').textContent = `${gs} / ${gt}`;
          g.style.display = gs ? '' : 'none'; ss += gs; st += gt;
        });
        v.querySelector(`[data-count="${k}"]`).textContent = `(${ss}/${st})`;
        v.querySelector(`[data-count2="${k}"]`).textContent = `${ss} / ${st} 条`;
        const vis = current === '*' || current === k;
        sec.style.display = vis ? '' : 'none'; if (vis) shown += ss;
      });
      $('#stat').textContent = `当前显示 ${shown} 条 · 全日 ${rows.length} 条`;
    }
    ['#f-tag', '#f-ref', '#f-bucket'].forEach(s => $(s).onchange = apply);
    ['#f-min', '#f-max'].forEach(s => $(s).oninput = apply);
    v.querySelectorAll('.tab').forEach(btn => btn.onclick = () => {
      current = btn.dataset.sec;
      v.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === btn)); apply();
    });
    v.addEventListener('click', e => {
      const btn = e.target.closest('.toggle'); if (!btn) return;
      const box = btn.previousElementSibling; box.classList.toggle('expanded'); box.classList.toggle('collapsed');
    });
    const tick = () => v.querySelectorAll('.reltime').forEach(el => { if (el.dataset.iso) el.textContent = rel(el.dataset.iso); });
    setInterval(tick, 60000);
    apply();
  }

  async function loadRows() {
    if (Array.isArray(window.DAY_DATA)) return window.DAY_DATA;
    const date = new URLSearchParams(location.search).get('date') || window.DAY_DATE;
    let lastErr;
    for (const url of [`data/${date}.json`, `../data/${date}.json`]) {
      try { const r = await fetch(url); if (!r.ok) throw new Error(`${url} ${r.status}`); return await r.json(); } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }
  window.GrokPromptViewer = { mount, loadRows, COLS: C };
})();
