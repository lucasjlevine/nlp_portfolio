#!/usr/bin/env python3
"""Recompute HW4 similarity artifacts for the portfolio site."""
from __future__ import annotations

import json
import math
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ROOT = Path(__file__).resolve().parents[2]
HW4 = ROOT / "hw4"
OUT = ROOT / "portfolio-site" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])


def normalize(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    return " ".join(s.split())


def tokens(doc, lemmatize: bool) -> list[str]:
    out = []
    for t in doc:
        if t.is_space or t.is_punct:
            continue
        tok = (t.lemma_ if lemmatize else t.text).lower()
        if tok and tok != " ":
            out.append(tok)
    return out


def main() -> None:
    raw = json.loads((HW4 / "adrianne_lenker_lyrics.json").read_text())
    songs = raw["songs"] if isinstance(raw, dict) else raw

    lines = []
    for song in songs:
        title = song.get("title") or song.get("full_title") or "unknown"
        lyrics = song.get("lyrics") or ""
        for line in lyrics.splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("[") and line.endswith("]"):
                continue
            lines.append({"line": normalize(line), "song": title})

    # exact dedupe after normalize
    seen = {}
    unique = []
    for row in lines:
        key = row["line"]
        if key in seen:
            continue
        seen[key] = True
        unique.append(row)

    docs = list(nlp.pipe([u["line"] for u in unique]))
    for u, d in zip(unique, docs):
        u["tok_raw"] = tokens(d, False)
        u["tok_lemma"] = tokens(d, True)

    # merge identical token sequences
    by_tok = {}
    merged = []
    for u in unique:
        key = tuple(u["tok_lemma"])
        if key in by_tok:
            continue
        by_tok[key] = True
        merged.append(u)
    unique = merged
    n = len(unique)

    def matrix(field: str):
        corpus = [" ".join(u[field]) for u in unique]
        vec = TfidfVectorizer(token_pattern=r"(?u)\S+")
        X = vec.fit_transform(corpus)
        return cosine_similarity(X)

    S_lemma = matrix("tok_lemma")
    S_raw = matrix("tok_raw")

    # pair table (upper triangle)
    iu, ju = np.triu_indices(n, k=1)
    lemma_scores = S_lemma[iu, ju]
    raw_scores = S_raw[iu, ju]

    pairs_df = pd.DataFrame(
        {
            "i": iu,
            "j": ju,
            "lemma": lemma_scores,
            "raw": raw_scores,
            "a": [unique[i]["line"] for i in iu],
            "b": [unique[j]["line"] for j in ju],
            "song_a": [unique[i]["song"] for i in iu],
            "song_b": [unique[j]["song"] for j in ju],
        }
    )
    pairs_df["within"] = pairs_df["song_a"] == pairs_df["song_b"]

    T = 0.88
    # histogram bins
    bins = np.linspace(0, 1, 41)
    nonzero = pairs_df[pairs_df["lemma"] > 0]
    hist_all, _ = np.histogram(nonzero["lemma"], bins=bins)
    hist_within, _ = np.histogram(nonzero.loc[nonzero["within"], "lemma"], bins=bins)
    hist_cross, _ = np.histogram(nonzero.loc[~nonzero["within"], "lemma"], bins=bins)

    # top pairs for explorer
    top = pairs_df.nlargest(150, "lemma")[
        ["lemma", "raw", "a", "b", "song_a", "song_b", "within"]
    ].to_dict(orient="records")

    # network edges
    solid = pairs_df[pairs_df["lemma"] >= T]
    dashed = pairs_df[(pairs_df["lemma"] >= 0.6) & (pairs_df["lemma"] < T) & (~pairs_df["within"])]
    node_ids = sorted(set(solid["i"]).union(solid["j"]).union(dashed["i"]).union(dashed["j"]))
    nodes = [
        {
            "id": int(i),
            "line": unique[i]["line"],
            "song": unique[i]["song"],
        }
        for i in node_ids
    ]
    # simple circular layout by song clusters
    songs_order = sorted({n["song"] for n in nodes})
    song_angle = {s: (2 * math.pi * k) / max(len(songs_order), 1) for k, s in enumerate(songs_order)}
    song_counts = {s: 0 for s in songs_order}
    for node in nodes:
        s = node["song"]
        k = song_counts[s]
        song_counts[s] += 1
        base = song_angle[s]
        r = 0.35 + 0.08 * (k % 5)
        node["x"] = 0.5 + r * math.cos(base + 0.12 * k)
        node["y"] = 0.5 + r * math.sin(base + 0.12 * k)

    edges = []
    for _, r in solid.iterrows():
        edges.append(
            {
                "source": int(r.i),
                "target": int(r.j),
                "score": float(r.lemma),
                "kind": "solid",
                "within": bool(r.within),
            }
        )
    for _, r in dashed.iterrows():
        edges.append(
            {
                "source": int(r.i),
                "target": int(r.j),
                "score": float(r.lemma),
                "kind": "dashed",
                "within": False,
            }
        )

    # ablation flips at T
    flips = pairs_df[
        ((pairs_df["lemma"] >= T) & (pairs_df["raw"] < T))
        | ((pairs_df["lemma"] < T) & (pairs_df["raw"] >= T))
    ][["lemma", "raw", "a", "b"]].to_dict(orient="records")

    # zipf
    from collections import Counter

    lemma_counts = Counter(t for u in unique for t in u["tok_lemma"])
    zipf = [{"token": w, "count": c, "rank": i + 1} for i, (w, c) in enumerate(lemma_counts.most_common(40))]

    # scatter sample for ablation viz (downsample)
    rng = np.random.default_rng(2026)
    sample_idx = rng.choice(len(pairs_df), size=min(8000, len(pairs_df)), replace=False)
    scatter = [
        {"lemma": float(pairs_df.iloc[i].lemma), "raw": float(pairs_df.iloc[i].raw)}
        for i in sample_idx
        if pairs_df.iloc[i].lemma > 0 or pairs_df.iloc[i].raw > 0
    ][:4000]

    payload = {
        "title": "Where Does Alike Stop?",
        "nSongs": len({u["song"] for u in unique}),
        "nLines": n,
        "nPairs": int(len(pairs_df)),
        "threshold": T,
        "zeroShare": float((pairs_df["lemma"] == 0).mean()),
        "vocab": {
            "raw": len({t for u in unique for t in u["tok_raw"]}),
            "lemma": len(lemma_counts),
            "hapaxShare": float(sum(1 for c in lemma_counts.values() if c == 1) / len(lemma_counts)),
        },
        "histogram": {
            "bins": bins.tolist(),
            "all": hist_all.tolist(),
            "within": hist_within.tolist(),
            "cross": hist_cross.tolist(),
        },
        "topPairs": top,
        "network": {"nodes": nodes, "edges": edges},
        "flips": flips,
        "zipf": zipf,
        "scatter": scatter,
        "stats": {
            "pairsGe06": int((pairs_df["lemma"] >= 0.6).sum()),
            "solidEdges": int(len(solid)),
            "dashedEdges": int(len(dashed)),
            "withinShareOfGe06": float(
                pairs_df.loc[pairs_df["lemma"] >= 0.6, "within"].mean()
            )
            if (pairs_df["lemma"] >= 0.6).any()
            else 0.0,
            "crossSongSolid": int(((solid["song_a"] != solid["song_b"]).sum()) if len(solid) else 0),
        },
        "falsePositive": {
            "a": "Fly make flea, make haste, make waste, eight makes infinity",
            "b": "Fly make flea, make haste, make taste, eight makes infinity",
            "score": 0.931,
        },
        "keyFinding": "Repeated lines live inside songs; different songs connect only through shared frames—\"Show me\" is the only word-for-word cross-song repeat.",
        "whatChanged": "Recomputed the full 184k-pair matrix from the notebook pipeline and rebuilt interactive threshold, histogram, network, and ablation views from that data.",
    }
    (OUT / "hw4.json").write_text(json.dumps(payload))
    print("hw4 written", n, "lines", len(pairs_df), "pairs", "flips", len(flips), "edges", len(edges))


if __name__ == "__main__":
    main()
