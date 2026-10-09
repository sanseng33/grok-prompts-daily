#!/usr/bin/env python3
"""Convert daily grok_prompts_YYYY-MM-DD.xlsx → data/YYYY-MM-DD.json (array of row objects)."""
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
    df = pd.read_excel(xlsx)
    rows = [{c: cell(row[c]) for c in df.columns} for _, row in df.iterrows()]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
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
