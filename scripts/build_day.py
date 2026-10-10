#!/usr/bin/env python3
"""Regenerate docs/day.html (fetches docs/data/<date>.json) from templates/."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
T = ROOT / "templates"
css, js, gate = ((T / f).read_text(encoding="utf-8") for f in ("viewer.css", "viewer.js", "gate.js"))
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
    <div class="banner">⚠️ 成人内容（NSFW）· 仅供私人收藏与研究 · 客户端密码仅为软锁（源码可查）</div>
    <div class="nav"><a href="index.html">← 日期列表</a></div>
    <h1>Grok 提示词 · <span id="date-label">…</span></h1>
    <p class="sub">在线拉取 data/日期.json · 已关注 / 新发现 分区，组内按 类型(生图/生视频/多步) → 点赞 排序 · 发布时间悬停显示 UTC+8 绝对时间</p>
    <div id="viewer"><p class="empty">加载中…</p></div>
  </div>
  <script>{js}</script>
  <script>
    (async function () {{
      const date = new URLSearchParams(location.search).get('date');
      const v = document.getElementById('viewer');
      if (!date) {{ v.innerHTML = '<p class="empty">请带上 ?date=YYYY-MM-DD</p>'; return; }}
      document.title = 'Grok 提示词 · ' + date;
      try {{ GrokPromptViewer.mount(document.getElementById('app'), await GrokPromptViewer.loadRows(), date); }}
      catch (e) {{ document.getElementById('date-label').textContent = date;
        v.innerHTML = '<p class="empty">' + String(e.message || e) + '<br/>请打开 <a href="embedded/' + encodeURIComponent(date) + '.html">embedded/' + date + '.html</a></p>'; }}
    }})();
  </script>
  <script>{gate}</script>
</body>
</html>
"""
(ROOT / "docs" / "day.html").write_text(html, encoding="utf-8")
print("wrote docs/day.html")
