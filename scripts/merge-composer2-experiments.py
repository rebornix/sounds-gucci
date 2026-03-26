#!/usr/bin/env python3
"""
Merge composer-2-YYYY-MM-DD experiment dirs into a single `composer-2` folder per PR.

When multiple dated dirs exist, prefer: (1) both proposed-fix.md and validation.md,
(2) lexicographically latest date suffix, (3) most non-hidden files.
"""
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

RE_DATED = re.compile(r"^composer-2-\d{4}-\d{2}-\d{2}$")


def score_dir(d: Path) -> tuple:
    pf = d / "proposed-fix.md"
    vf = d / "validation.md"
    complete = pf.is_file() and vf.is_file()
    nfiles = sum(1 for p in d.iterdir() if p.is_file())
    name = d.name
    date_key = name.split("composer-2-", 1)[-1] if RE_DATED.match(name) else ""
    return (complete, date_key, nfiles)


def pick_winner(candidates: list[Path]) -> Path | None:
    if not candidates:
        return None
    return max(candidates, key=lambda p: score_dir(p))


def main() -> int:
    root = Path(__file__).resolve().parent.parent / "data" / "analysis"
    if not root.is_dir():
        print("No data/analysis", file=sys.stderr)
        return 1

    merged = 0
    for pr_dir in sorted(root.iterdir(), key=lambda p: p.name):
        if not pr_dir.is_dir() or not pr_dir.name.isdigit():
            continue

        dated = [p for p in pr_dir.iterdir() if p.is_dir() and RE_DATED.match(p.name)]
        if not dated:
            continue

        winner = pick_winner(dated)
        has_artifacts = winner is not None and (
            any(winner.iterdir()) or score_dir(winner)[0]
        )

        if not has_artifacts:
            for d in dated:
                shutil.rmtree(d, ignore_errors=True)
            stale = pr_dir / "composer-2"
            if stale.exists():
                shutil.rmtree(stale, ignore_errors=True)
            print(f"{pr_dir.name}: removed empty composer-2-* (no proposed-fix/validation)")
            merged += 1
            continue

        target = pr_dir / "composer-2"
        if target.exists():
            shutil.rmtree(target)
        target.mkdir(parents=True)

        assert winner is not None
        for item in winner.iterdir():
            dest = target / item.name
            if item.is_file():
                shutil.copy2(item, dest)
            else:
                shutil.copytree(item, dest)

        for d in dated:
            shutil.rmtree(d, ignore_errors=True)

        merged += 1
        print(f"{pr_dir.name}: merged {len(dated)} dir(s) -> composer-2 (from {winner.name if winner else 'none'})")

    print(f"Done. PR directories touched: {merged}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
