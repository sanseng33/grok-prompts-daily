#!/usr/bin/env python3
"""Convert daily grok_prompts_YYYY-MM-DD.xlsx → data/YYYY-MM-DD.json ({"rows": [...], "excluded_creators": ["@handle", ...]}; older days are a bare array)."""
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]


def cell(v):
    if v is None or (isinstance(v, float) and math.isnan(v)) or pd.isna(v):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        f = float(v)
        return int(f) if f.is_integer() else f
    if isinstance(v, (np.bool_, bool)):
        return bool(v)
    return str(v) if not isinstance(v, (str, int, float, bool)) else v


def convert(xlsx: Path, out: Path | None = None) -> Path:
    m = re.search(r"(\d{4}-\d{2}-\d{2})", xlsx.name)
    if not m:
        raise SystemExit(f"cannot parse date from filename: {xlsx.name}")
    date = m.group(1)
    out = out or (ROOT / "data" / f"{date}.json")
    sheets = pd.read_excel(xlsx, sheet_name=None)  # v3: 已关注博主 / 新发现博主 两个工作表
    rows = []
    excluded = []
    fused = []
    for name, df in sheets.items():
        if name == "融合提示词":
            for _, row in df.iterrows():
                srcs = []
                for line in str(cell(row.get("来源元素")) or "").splitlines():
                    a, _, b = line.partition("：")
                    if a.strip(): srcs.append({"post": a.strip(), "element": b.strip()})
                fused.append({"group": cell(row["分组"]), "type": cell(row["类型"]), "nsfw": cell(row["NSFW程度"]),
                              "prompt": cell(row["英文提示词"]), "zh": cell(row["中文翻译"]), "sources": srcs})
            continue
        if name == "已排除":  # handles only — nothing else is ever stored for these
            for v in df.get("博主", []):
                h = cell(v)
                if h:
                    h = "@" + str(h).strip().lstrip("@")
                    if h.lower() not in [x.lower() for x in excluded]:
                        excluded.append(h)
            continue
        for _, row in df.iterrows():
            d = {c: cell(row[c]) for c in df.columns}
            d.setdefault("分区", name)
            d["分区"] = name
            rows.append(d)
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = {"fused": fused, "rows": rows, "excluded_creators": excluded}
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out} rows={len(rows)}")
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx", type=Path)
    ap.add_argument("-o", "--out", type=Path, default=None)
    args = ap.parse_args()
    convert(args.xlsx, args.out)


if __name__ == "__main__":
    main()
