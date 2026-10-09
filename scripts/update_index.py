#!/usr/bin/env python3
from __future__ import annotations
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DOCS_DATA = ROOT / "docs" / "data"


def main() -> None:
    dates = sorted(
        (p.stem for p in DATA.glob("*.json") if p.name != "index.json"),
        reverse=True,
    )
    payload = json.dumps({"dates": dates}, ensure_ascii=False, indent=2) + "\n"
    out = DATA / "index.json"
    out.write_text(payload, encoding="utf-8")
    DOCS_DATA.mkdir(parents=True, exist_ok=True)
    (DOCS_DATA / "index.json").write_text(payload, encoding="utf-8")
    # Keep docs/data/*.json in sync for GitHub Pages (/docs only)
    for p in DATA.glob("*.json"):
        if p.name == "index.json":
            continue
        shutil.copy2(p, DOCS_DATA / p.name)
    print(f"wrote {out} (+ docs/data/) dates={dates}")


if __name__ == "__main__":
    main()
