#!/usr/bin/env python3
"""Regenerate docs/day.html (fetches docs/data/<date>.json) from templates/."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
T = ROOT / "templates"
css, js, gate = ((T / f).read_text(encoding="utf-8") for f in ("viewer.css", "viewer.js", "gate.js"))
js = (T / "storage.js").read_text(encoding="utf-8") + "\n" + js
html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Grok 提示词 · 日视图</title>
  <style>{css}</style>
</head>
<body>
  <div class="wrap gated" id="app">
    <div class="nav"><a href="index.html">← 日期列表</a></div>
    <h1>Grok 提示词 · <span id="date-label">…</span></h1>
    <div id="viewer"><p class="empty">加载中…</p></div>
  </div>
  <script>{js}</script>
  <script>
    (async function () {{
      const date = new URLSearchParams(location.search).get('date');
      const v = document.getElementById('viewer');
      if (!date) {{ v.innerHTML = '<p class="empty">—</p>'; return; }}
      document.title = 'Grok 提示词 · ' + date;
      try {{ GrokPromptViewer.mount(document.getElementById('app'), await GrokPromptViewer.loadRows(), date); }}
      catch (e) {{ document.getElementById('date-label').textContent = date;
        v.innerHTML = '<p class="empty">' + '<a href="embedded/' + encodeURIComponent(date) + '.html">' + date + '</a></p>'; }}
    }})();
  </script>
  <script>{gate}</script>
</body>
</html>
"""
(ROOT / "docs" / "day.html").write_text(html, encoding="utf-8")
print("wrote docs/day.html")
