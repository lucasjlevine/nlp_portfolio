#!/usr/bin/env python3
"""Enrich HW5 map/neighbor JSON from saved outputs + embeddings."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
HW5 = ROOT / "hw5" / "hw5_outputs"
OUT = ROOT / "portfolio-site" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def main() -> None:
    points = pd.read_csv(HW5 / "points.csv")
    coords = pd.read_csv(HW5 / "map_coordinates.csv")
    nn = pd.read_csv(HW5 / "nearest_neighbors.csv")
    neigh = json.loads((HW5 / "neighborhood_summary.json").read_text())
    summary = json.loads((HW5 / "analysis_summary.json").read_text())
    emb = np.load(HW5 / "embeddings.npy")

    # L2 normalize just in case
    norms = np.linalg.norm(emb, axis=1, keepdims=True)
    emb_n = emb / np.clip(norms, 1e-12, None)

    merged = points.merge(coords[["point_id", "pca_x", "pca_y", "t_sne_x", "t_sne_y"]], on="point_id")
    id_to_idx = {pid: i for i, pid in enumerate(merged["point_id"])}

    neigh_of = {}
    for n in neigh:
        for pid in n["point_ids"]:
            neigh_of[pid] = n["name"]

    # anchors used in report + neighborhood exemplars
    anchors = ["L0004", "L0000", "L0001", "L0016", "L0014", "L0123", "L0173"]
    anchor_neighbors = {}
    for aid in anchors:
        if aid not in id_to_idx:
            continue
        i = id_to_idx[aid]
        sims = emb_n @ emb_n[i]
        order = np.argsort(-sims)
        rows = []
        for rank, j in enumerate(order):
            if j == i:
                continue
            pid = merged.iloc[j]["point_id"]
            rows.append(
                {
                    "id": pid,
                    "label": merged.iloc[j]["label"],
                    "song": merged.iloc[j]["song"],
                    "text": str(merged.iloc[j]["text"])[:220],
                    "cosine": float(sims[j]),
                }
            )
            if len(rows) >= 8:
                break
        anchor_neighbors[aid] = rows

    # map-neighbor comparison for L0014 if present
    map_comp = []
    comp_path = HW5 / "map_neighbor_comparison.csv"
    if comp_path.exists():
        map_comp = pd.read_csv(comp_path).to_dict(orient="records")

    records = []
    for _, r in merged.iterrows():
        records.append(
            {
                "id": r["point_id"],
                "label": r["label"],
                "text": str(r["text"])[:320],
                "song": r["song"],
                "album": r.get("album", ""),
                "pca_x": float(r["pca_x"]),
                "pca_y": float(r["pca_y"]),
                "t_sne_x": float(r["t_sne_x"]),
                "t_sne_y": float(r["t_sne_y"]),
                "neighborhood": neigh_of.get(r["point_id"]),
            }
        )

    payload = {
        "title": "Where the Wind, Hounds, and Birds Gather",
        "nPoints": len(records),
        "nAL": int((merged["label"] == "Adrianne Lenker").sum()),
        "nBT": int((merged["label"] == "Big Thief").sum()),
        "model": summary.get("model", "sentence-transformers/all-MiniLM-L6-v2"),
        "dims": int(summary.get("embedding_dimensions", 384)),
        "neighborhoods": neigh,
        "anchorMismatch": {
            "anchor": "L0014",
            "neighbor": "L0173",
            "fullSpaceCosine": 0.523,
            "note": "Closest full-space neighbor falls outside t-SNE five-nearest.",
        },
        "anchorNeighbors": anchor_neighbors,
        "reportNeighbors": nn.to_dict(orient="records"),
        "mapNeighborComparison": map_comp,
        "points": records,
        "keyFinding": "Cross-catalog nature imagery gathers here, but serves different purposes—and the map can still exile a true nearest neighbor.",
        "whatChanged": "Rebuilt the map from full coordinates + embeddings: live search/filter, neighborhood highlighting, and full-space neighbor inspector for anchors.",
    }
    (OUT / "hw5.json").write_text(json.dumps(payload))
    print("hw5 written", len(records), "anchors", list(anchor_neighbors))


if __name__ == "__main__":
    main()
