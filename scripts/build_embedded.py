#!/usr/bin/env python3
"""Build docs/embedded/YYYY-MM-DD.html with DAY_DATA inlined."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
DOCS_EMB = ROOT / "docs" / "embedded"


def build(date: str, data_path: Path | None = None) -> Path:
    data_path = data_path or (ROOT / "data" / f"{date}.json")
    rows = json.loads(data_path.read_text(encoding="utf-8"))
    css = (TEMPLATES / "viewer.css").read_text(encoding="utf-8")
    js = (TEMPLATES / "viewer.js").read_text(encoding="utf-8")
    payload = json.dumps(rows, ensure_ascii=False)
    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Grok 提示词 · {date}（离线）</title>
  <style>{css}</style>
</head>
<body>
  <div class="wrap" id="app">
    <div class="banner">⚠️ 成人内容（NSFW）· 仅供私人收藏与研究 · 本页数据已内联，可下载后离线打开 · 请勿公开分享</div>
    <div class="nav"><a href="../index.html">← 日期列表</a></div>
    <h1>Grok 提示词 · <span id="date-label">{date}</span></h1>
    <p class="sub">离线内联版 · {len(rows)} 条 · 生成自 data/{date}.json</p>
    <div class="toolbar">
      <div><label>来源</label><select id="filter-source"></select></div>
      <div><label>类型</label><select id="filter-type"></select></div>
      <div class="stat" id="stat"></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>来源</th><th>博主</th><th>链接</th><th>时间</th><th>类型</th>
            <th>步骤数</th><th>题材</th><th>各步骤提示词 + 中文翻译</th><th>位置</th><th>点赞</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
    </div>
  </div>
  <script>window.DAY_DATA = {payload}; window.DAY_DATE = {json.dumps(date)};</script>
  <script>{js}</script>
  <script>
    GrokPromptViewer.mount(document.getElementById('app'), window.DAY_DATA, window.DAY_DATE);
  </script>
</body>
</html>
"""
    DOCS_EMB.mkdir(parents=True, exist_ok=True)
    out = DOCS_EMB / f"{date}.html"
    out.write_text(html, encoding="utf-8")
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("date", help="YYYY-MM-DD")
    ap.add_argument("--data", type=Path, default=None)
    args = ap.parse_args()
    out = build(args.date, args.data)
    print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
