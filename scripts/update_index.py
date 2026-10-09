#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

def main() -> None:
    dates = sorted(
        (p.stem for p in DATA.glob("*.json") if p.name != "index.json"),
        reverse=True,
    )
    out = DATA / "index.json"
    out.write_text(json.dumps({"dates": dates}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out} dates={dates}")


if __name__ == "__main__":
    main()
