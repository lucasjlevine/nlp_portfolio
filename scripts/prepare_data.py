#!/usr/bin/env python3
"""Regenerate public/data/*.json from the parent homework folders.

Run from portfolio-site/:
  python3 scripts/prepare_data.py
"""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1] / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def write(name: str, payload: object) -> None:
    path = OUT / name
    path.write_text(json.dumps(payload, indent=2))
    print("wrote", path.relative_to(OUT.parent.parent), f"({path.stat().st_size} bytes)")


def main() -> None:
    # This script assumes the richer one-shot prep already created the JSON.
    # Prefer editing the existing JSON, or re-run the audit prep cell.
    # For homework figure copies:
    figures = Path(__file__).resolve().parents[1] / "public" / "figures"
    figures.mkdir(exist_ok=True)
    pairs = [
        (ROOT / "hw3" / "figures", "*.png"),
        (ROOT / "hw4", "*.png"),
        (ROOT / "hw5" / "hw5_outputs", "*.png"),
    ]
    import shutil

    for folder, pattern in pairs:
        if not folder.exists():
            continue
        for src in folder.glob(pattern):
            dest = figures / src.name
            shutil.copy2(src, dest)
            print("copied", src.name)

    print("Data JSON lives in public/data/. Edit those files or re-run the portfolio prep notebook/script from the audit phase.")
    print("Existing:", sorted(p.name for p in OUT.glob("*.json")))


if __name__ == "__main__":
    main()
