#!/usr/bin/env python3
"""Compare a fresh Google Scholar reading against data/scholar.json.

Usage:
    tools/scholar-diff.py new.json          # show what changed
    tools/scholar-diff.py new.json --save   # show, then update the snapshot

`new.json` needs only the numbers that were read off the profile:

    {
      "snapshot_date": "2026-10-01",
      "totals": {"citations": 130, "h_index": 8, "i10_index": 6},
      "papers": {"pinns-unsteady-maxwell": 17, "jfm-area-expansion": 8}
    }

Keys are the slugs in data/scholar.json. A slug that isn't there yet is
reported as a new paper; pass its title/venue/year as an object instead of a
bare number to have it recorded properly:

    "papers": {"new-slug": {"citations": 1, "title": "...", "venue": "...", "year": 2026}}

Scholar blocks plain scrapers, so the reading itself is done by hand or by an
agent that can render the page.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAPSHOT = os.path.join(ROOT, "data", "scholar.json")


def as_entry(value):
    """Accept either a bare citation count or a full paper object."""
    if isinstance(value, dict):
        return dict(value)
    return {"citations": int(value)}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    save = "--save" in sys.argv[1:]
    if len(args) != 1:
        sys.exit(__doc__)

    with open(SNAPSHOT) as f:
        old = json.load(f)
    with open(args[0]) as f:
        new = json.load(f)

    date = new.get("snapshot_date", "unknown")
    print("Scholar diff: %s -> %s\n" % (old["snapshot_date"], date))

    ot, nt = old["totals"], new.get("totals", {})
    delta = nt.get("citations", ot["citations"]) - ot["citations"]
    print("Total citations: %d -> %d (%+d)" % (ot["citations"], nt.get("citations", ot["citations"]), delta))
    for field, label in (("h_index", "h-index"), ("i10_index", "i10-index")):
        if field in nt and nt[field] != ot[field]:
            print("%s: %d -> %d" % (label, ot[field], nt[field]))

    gained, added = [], []
    for slug, value in new.get("papers", {}).items():
        entry = as_entry(value)
        count = entry["citations"]
        if slug not in old["papers"]:
            added.append((slug, entry))
        elif count != old["papers"][slug]["citations"]:
            gained.append((slug, old["papers"][slug], count))

    if gained:
        print("\nCitations moved:")
        for slug, prev, count in sorted(gained, key=lambda g: g[1]["citations"] - g[2]):
            print("  %+d  %s (%d -> %d)" % (count - prev["citations"], prev["title"], prev["citations"], count))
    if added:
        print("\nNot in the snapshot yet:")
        for slug, entry in added:
            print("  %s — %s (%d citations)" % (slug, entry.get("title", "title not given"), entry["citations"]))
    if not gained and not added:
        print("\nNo per-paper changes.")

    accounted = sum(c - p["citations"] for _, p, c in gained) + sum(e["citations"] for _, e in added)
    if delta and accounted != delta:
        print("\nNote: %+d on the profile total but %+d accounted for per paper —"
              " %d citation(s) landed on a paper not in this reading."
              % (delta, accounted, abs(delta - accounted)))

    if not save:
        print("\n(re-run with --save to record this as the new baseline)")
        return

    for slug, value in new.get("papers", {}).items():
        entry = as_entry(value)
        if slug in old["papers"]:
            old["papers"][slug]["citations"] = entry["citations"]
        else:
            old["papers"][slug] = {
                "title": entry.get("title", slug),
                "venue": entry.get("venue", ""),
                "year": entry.get("year"),
                "citations": entry["citations"],
            }
    old["snapshot_date"] = date
    old["totals"].update({k: v for k, v in nt.items() if k in old["totals"]})
    old.setdefault("history", []).append({
        "date": date,
        "citations": old["totals"]["citations"],
        "h_index": old["totals"]["h_index"],
        "i10_index": old["totals"]["i10_index"],
        "note": new.get("note", "snapshot update (%+d)" % delta),
    })
    with open(SNAPSHOT, "w") as f:
        json.dump(old, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("\nSaved to data/scholar.json")


if __name__ == "__main__":
    main()
