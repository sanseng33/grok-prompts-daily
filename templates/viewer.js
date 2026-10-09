(function () {
  const COLS = {
    source: '来源',
    handle: '博主',
    link: '帖子链接',
    time: '发布时间(UTC+8)',
    type: '类型',
    steps: '步骤数',
    tags: '题材标签',
    loc: '提示词位置',
    likes: '点赞数'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function stepFields(row) {
    const out = [];
    for (let i = 1; i <= 8; i++) {
      const t = row[`步骤${i}类型`];
      const p = row[`步骤${i}提示词`];
      const z = row[`步骤${i}中文翻译`];
      if (p == null && z == null && t == null) continue;
      if (p === '' && z === '' && (t == null || t === '')) continue;
      out.push({ i, type: t || '', prompt: p || '', zh: z || '' });
    }
    return out;
  }

  function unique(arr) {
    return [...new Set(arr.filter(Boolean))].sort();
  }

  function fillSelect(sel, values, allLabel) {
    sel.innerHTML = '';
    const o0 = document.createElement('option');
    o0.value = ''; o0.textContent = allLabel;
    sel.appendChild(o0);
    values.forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
  }

  function promptHtml(label, text) {
    if (!text) return '';
    const collapsed = text.length > 120 || text.split('\n').length > 3;
    return `<div class="prompt-block">
      <div class="prompt-label">${esc(label)}</div>
      <div class="prompt-text${collapsed ? ' collapsed' : ''}">${esc(text)}</div>
      ${collapsed ? '<button type="button" class="toggle">展开 / 收起</button>' : ''}
    </div>`;
  }

  function renderRow(row) {
    const steps = stepFields(row);
    const source = row[COLS.source] || '';
    const typ = row[COLS.type] || '';
    const tags = (row[COLS.tags] || '').split(/[、,，]/).map(s => s.trim()).filter(Boolean);
    const link = row[COLS.link] || '#';
    const handle = row[COLS.handle] || '';
    const prompts = steps.map(s => {
      const head = `步骤${s.i}${s.type ? ' · ' + s.type : ''}`;
      return promptHtml(head + ' · 原文', s.prompt) + promptHtml(head + ' · 中文', s.zh);
    }).join('');

    return `<tr data-source="${esc(source)}" data-type="${esc(typ)}">
      <td><span class="chip source-${esc(source)}">${esc(source)}</span></td>
      <td class="handle">${esc(handle)}</td>
      <td><a href="${esc(link)}" target="_blank" rel="noopener">打开</a></td>
      <td class="meta">${esc(row[COLS.time] || '')}</td>
      <td><span class="chip type-${esc(typ)}">${esc(typ)}</span></td>
      <td class="meta">${esc(row[COLS.steps] ?? steps.length)}</td>
      <td class="tags">${tags.map(t => `<span class="chip">${esc(t)}</span>`).join('')}</td>
      <td class="prompt-cell">${prompts || '<span class="meta">—</span>'}</td>
      <td class="meta">${esc(row[COLS.loc] || '')}</td>
      <td class="meta">${esc(row[COLS.likes] ?? '')}</td>
    </tr>`;
  }

  function applyFilters(root) {
    const src = root.querySelector('#filter-source').value;
    const typ = root.querySelector('#filter-type').value;
    let shown = 0, total = 0;
    root.querySelectorAll('tbody tr').forEach(tr => {
      total++;
      const ok =
        (!src || tr.getAttribute('data-source') === src) &&
        (!typ || tr.getAttribute('data-type') === typ);
      tr.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    root.querySelector('#stat').textContent = `显示 ${shown} / ${total} 条`;
  }

  function mount(root, rows, dateLabel) {
    if (dateLabel) {
      const el = root.querySelector('#date-label');
      if (el) el.textContent = dateLabel;
    }
    fillSelect(root.querySelector('#filter-source'), unique(rows.map(r => r[COLS.source])), '全部来源');
    fillSelect(root.querySelector('#filter-type'), unique(rows.map(r => r[COLS.type])), '全部类型');
    const tbody = root.querySelector('#tbody');
    tbody.innerHTML = rows.length
      ? rows.map(renderRow).join('')
      : '<tr><td colspan="10" class="empty">当日无数据</td></tr>';
    root.querySelector('#filter-source').onchange = () => applyFilters(root);
    root.querySelector('#filter-type').onchange = () => applyFilters(root);
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle');
      if (!btn) return;
      const box = btn.previousElementSibling;
      if (!box) return;
      box.classList.toggle('expanded');
      box.classList.toggle('collapsed');
    });
    applyFilters(root);
  }

  async function loadRows() {
    if (Array.isArray(window.DAY_DATA)) return window.DAY_DATA;
    const params = new URLSearchParams(location.search);
    const date = params.get('date') || window.DAY_DATE;
    if (!date) throw new Error('缺少 date 参数');
    const res = await fetch(`../data/${date}.json`);
    if (!res.ok) throw new Error(`无法加载 ${date}.json（${res.status}）。私有仓库 raw 需登录；请改用 docs/embedded/${date}.html`);
    return res.json();
  }

  window.GrokPromptViewer = { mount, loadRows, COLS };
})();
