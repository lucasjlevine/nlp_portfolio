#!/usr/bin/env python3
"""Generate HW6 n-gram portfolio data using the homework module."""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HW6 = ROOT / "hw6"
sys.path.insert(0, str(HW6))

from hw6_levine import (  # type: ignore
    CORE_ARTISTS,
    Ngram,
    TOKEN_RE,
    load_artist_songs,
    load_songs,
    longest_copied_run,
    make_units,
    mashup_units,
)

OUT = ROOT / "portfolio-site" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def next_dist(model: Ngram, context: list[str], top: int = 10):
    if model.n == 1:
        counter = model.followers.get((), {})
    else:
        key = ()
        for size in range(min(model.n - 1, len(context)), -1, -1):
            candidate = tuple(context[-size:]) if size else ()
            if model.followers.get(candidate):
                key = candidate
                break
        counter = model.followers.get(key, {})
    if not counter:
        return []
    total = sum(counter.values())
    return [{"token": w, "p": c / total} for w, c in counter.most_common(top)]


def main() -> None:
    songs = load_songs(CORE_ARTISTS)
    units = make_units(songs, "lines")
    tokens = sum(len(u) for u in units)

    models = {n: Ngram(n, units) for n in range(1, 5)}

    samples = []
    copy_avgs = []
    for n in range(1, 5):
        rng = random.Random(2026 + n)
        runs = []
        for k in range(8):
            text = models[n].generate(rng, limit=18 if n > 1 else 16)
            if not text.strip():
                continue
            copy = int(longest_copied_run(text, songs))
            runs.append(copy)
            samples.append({"n": n, "text": text, "copy": copy, "seed": 2026 + n, "k": k})
        copy_avgs.append({"n": n, "avg": (sum(runs) / len(runs)) if runs else 0.0, "runs": runs})

    prompts = ["i am", "you are", "i don't", "if you", "come back"]
    prompt_rows = []
    for p in prompts:
        toks = TOKEN_RE.findall(p.lower())
        rng = random.Random(abs(hash(p)) % 10000 + 7)
        continuation, used = models[2].continue_text(p, rng, limit=14)
        prompt_rows.append(
            {
                "prompt": p,
                "continuation": continuation,
                "usedContext": used,
                "nextTokenDist": next_dist(models[2], toks),
                "featured": p == "i don't",
            }
        )

    contexts = [["i", "don't"], ["summer"], ["my", "dog"], ["you", "are"], ["come", "back"]]
    explorer = []
    for ctx in contexts:
        row = {"context": " ".join(ctx), "byN": {}}
        for n in range(1, 5):
            row["byN"][str(n)] = next_dist(models[n], ctx)
        explorer.append(row)

    buck = load_artist_songs(("Buck Meek",)).get("Buck Meek", [])
    mash_samples = []
    if buck:
        mixed_units = mashup_units(songs, buck)
        m3 = Ngram(3, mixed_units)
        rng = random.Random(99)
        # for copy scoring against mashup source songs flattened is awkward; score vs interleaved units as fake songs
        mash_sources = [[u] for u in mixed_units]
        for _ in range(6):
            text = m3.generate(rng, limit=16)
            mash_samples.append(
                {
                    "text": text,
                    "copy": int(longest_copied_run(text, mash_sources)),
                }
            )

    payload = {
        "title": "Parrot or Poet?",
        "corpusTokens": tokens,
        "nUnits": len(units),
        "voice": "Adrianne Lenker + Big Thief",
        "copiedRunAverages": copy_avgs,
        "samples": samples,
        "prompts": prompt_rows,
        "explorer": explorer,
        "mashup": {
            "note": "Buck Meek lines interleaved with Lenker/Big Thief; trigram samples shift register without a seamless shared voice.",
            "samples": mash_samples,
        },
        "keyFinding": "The 4-gram sounds most like a song because it remembered the most; the mash-up shifts register without becoming a shared voice.",
        "whatChanged": "Re-ran the homework n-gram pipeline with fixed seeds to ship next-token distributions, a fuller sample ladder, and prompt continuations.",
    }
    (OUT / "hw6.json").write_text(json.dumps(payload, indent=2))
    print("hw6 ok tokens", tokens, "avgs", [{a['n']: round(a['avg'], 2) for a in copy_avgs}])


if __name__ == "__main__":
    main()
