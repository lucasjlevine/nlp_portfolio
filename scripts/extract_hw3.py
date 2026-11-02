#!/usr/bin/env python3
"""Extract/recompute HW3 OCR comparison data. Tries Tesseract locally; keeps TrOCR scores from notebook."""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
HW3 = ROOT / "hw3"
OUT = ROOT / "portfolio-site" / "public" / "data"
FIG = ROOT / "portfolio-site" / "public" / "figures"
PAGES = ROOT / "portfolio-site" / "public" / "ocr-pages"
OUT.mkdir(parents=True, exist_ok=True)
FIG.mkdir(parents=True, exist_ok=True)
PAGES.mkdir(parents=True, exist_ok=True)


def lev(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            ins, delete, sub = cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (ca != cb)
            cur.append(min(ins, delete, sub))
        prev = cur
    return prev[-1]


def cer(ref: str, hyp: str) -> float:
    ref = re.sub(r"\s+", " ", ref.strip())
    hyp = re.sub(r"\s+", " ", hyp.strip())
    if not ref:
        return 0.0
    return lev(ref, hyp) / len(ref)


def wer(ref: str, hyp: str) -> float:
    r = re.sub(r"\s+", " ", ref.strip()).split()
    h = re.sub(r"\s+", " ", hyp.strip()).split()
    if not r:
        return 0.0
    # word-level levenshtein
    prev = list(range(len(h) + 1))
    for i, rw in enumerate(r, 1):
        cur = [i]
        for j, hw in enumerate(h, 1):
            cur.append(min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (rw != hw)))
        prev = cur
    return prev[-1] / len(r)


REGEXES = {
    "hyphen_linebreak": (re.compile(r"([A-Za-z]+)-\n([a-zA-Z]+)"), r"\1\2"),
    "running_header": (re.compile(r"(?im)^[^\n]*ROLLING\s*STONE[^\n]*\d{4}[^\n]*\n?"), ""),
    "toc_dot_garbage": (re.compile(r"\.{2,}[0-9.oeEO\s]{2,}"), "..."),
    "curly_quotes": (re.compile(r"[“”]"), '"'),
    "separator_line": (re.compile(r"(?m)^[eEaAcC\s.=\~_-]{8,}$\n?"), ""),
    "stray_edge_char": (re.compile(r"(?m)^[a-zA-Z_]\s*$\n?"), ""),
}


def apply_regex(text: str) -> str:
    for _, (pat, repl) in REGEXES.items():
        text = pat.sub(repl, text)
    return text


def main() -> None:
    import shutil

    from PIL import Image
    import pytesseract

    gt = {
        "page_07": (HW3 / "ground_truth" / "page_07.txt").read_text(encoding="utf-8"),
        "page_29": (HW3 / "ground_truth" / "page_29.txt").read_text(encoding="utf-8"),
    }

    # copy page images into public for the site
    for name in ("page_07", "page_29"):
        src = HW3 / "data" / "pages" / f"{name}.png"
        if src.exists():
            shutil.copy2(src, PAGES / f"{name}.png")

    for src in (HW3 / "figures").glob("*.png"):
        shutil.copy2(src, FIG / src.name)

    tess = {}
    line_errors = {}
    for name, path in {
        "page_07": HW3 / "data" / "pages" / "page_07.png",
        "page_29": HW3 / "data" / "pages" / "page_29.png",
    }.items():
        img = Image.open(path)
        text = pytesseract.image_to_string(img)
        tess[name] = text
        repaired = apply_regex(text)
        # per-line CER vs GT lines (aligned by index, truncated)
        ref_lines = [ln for ln in gt[name].splitlines() if ln.strip()]
        hyp_lines = [ln for ln in text.splitlines() if ln.strip()]
        pairs = []
        for i, ref in enumerate(ref_lines[:40]):
            hyp = hyp_lines[i] if i < len(hyp_lines) else ""
            pairs.append({"i": i, "ref": ref[:120], "hyp": hyp[:120], "cer": cer(ref, hyp)})
        line_errors[name] = pairs

        (OUT / f"hw3_{name}_tesseract.txt").write_text(text)
        (OUT / f"hw3_{name}_repaired.txt").write_text(repaired)

    # TrOCR scores from notebook (cannot re-run without heavy model download reliably)
    trocr_scores = {
        "page_07": {"CER": 1.410419, "WER": 2.012766},
        "page_29": {"CER": 2.877867, "WER": 2.689150},
    }

    engines = []
    for name in ("page_07", "page_29"):
        raw = tess[name]
        rep = apply_regex(raw)
        engines.append(
            {
                "page": name,
                "tesseract": {"CER": cer(gt[name], raw), "WER": wer(gt[name], raw)},
                "tesseract_repaired": {"CER": cer(gt[name], rep), "WER": wer(gt[name], rep)},
                "trocr": trocr_scores[name],
            }
        )

    # scale dictionary hit rates if wordfreq available
    dict_rates = []
    try:
        from wordfreq import zipf_frequency

        scale_dir = HW3 / "data" / "pages" / "scale"
        for p in sorted(scale_dir.glob("page_*.png")):
            text = apply_regex(pytesseract.image_to_string(Image.open(p)))
            toks = re.findall(r"[A-Za-z]+", text.lower())
            if not toks:
                continue
            hits = sum(zipf_frequency(t, "en") >= 3.0 for t in toks)
            dict_rates.append({"page": p.stem, "rate": hits / len(toks), "tokens": len(toks)})
        # also test pages
        for name in ("page_07", "page_29"):
            text = apply_regex(tess[name])
            toks = re.findall(r"[A-Za-z]+", text.lower())
            hits = sum(zipf_frequency(t, "en") >= 3.0 for t in toks) if toks else 0
            dict_rates.insert(
                0,
                {"page": name, "rate": (hits / len(toks) if toks else 0), "tokens": len(toks), "test": True},
            )
    except Exception as e:
        print("dictionary rates skipped:", e)

    # artist mentions on scale pages
    artists = {
        "The Who": re.compile(r"\bwho\b", re.I),
        "Stones": re.compile(r"stones|rolling stones", re.I),
        "Dylan": re.compile(r"\bdylan\b", re.I),
        "Townshend": re.compile(r"townshend", re.I),
    }
    mentions = {k: 0 for k in artists}
    scale_dir = HW3 / "data" / "pages" / "scale"
    for p in sorted(scale_dir.glob("page_*.png")):
        text = apply_regex(pytesseract.image_to_string(Image.open(p)))
        for name, pat in artists.items():
            mentions[name] += len(pat.findall(text))

    # snippets for UI
    snippets = {
        name: {
            "gt": gt[name][:900],
            "tesseract": tess[name][:900],
            "repaired": apply_regex(tess[name])[:900],
        }
        for name in ("page_07", "page_29")
    }

    payload = {
        "title": "Like a Rolling Stone",
        "document": "Rolling Stone Magazine #382, November 11, 1982",
        "pages": {
            "page_07": {"label": "Table of Contents", "gtWords": len(gt["page_07"].split()), "image": "/ocr-pages/page_07.png"},
            "page_29": {"label": "The Who feature", "gtWords": len(gt["page_29"].split()), "image": "/ocr-pages/page_29.png"},
        },
        "scores": engines,
        "lineErrors": line_errors,
        "snippets": snippets,
        "dictionaryHitRate": dict_rates,
        "artistMentions": [{"name": k, "count": v} for k, v in mentions.items()],
        "trocrNote": "TrOCR CER/WER kept from the original notebook run (microsoft/trocr-base-printed on Tesseract line boxes). Tesseract + regex recomputed locally for the portfolio.",
        "worstLines": [
            {
                "engine": "Tesseract",
                "page": "page_07",
                "cer": max((x["cer"] for x in line_errors["page_07"]), default=0),
                "example": next(
                    (x for x in line_errors["page_07"] if "Kurt Loder" in x["ref"] or "Loder" in x["ref"]),
                    line_errors["page_07"][0] if line_errors["page_07"] else None,
                ),
            }
        ],
        "keyFinding": "Even deep in the issue, The Who still dominate the cleaned text—and layout, not brand loyalty, decides which OCR engine wins a page.",
        "whatChanged": "Re-ran Tesseract + regex repair on the original page renders, exposed scan↔text with live CER, and kept TrOCR notebook scores with an explicit source note.",
    }
    (OUT / "hw3.json").write_text(json.dumps(payload, indent=2))
    print("hw3 written", json.dumps(engines, indent=2)[:500])
    print("artists", mentions)
    print("dict pages", len(dict_rates))


if __name__ == "__main__":
    main()
