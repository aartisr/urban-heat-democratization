"""Check local Markdown links in maintained repository documentation.

Historical snapshots under docs/archive are intentionally excluded: their old
links remain part of the record, not a promise of current navigation.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"(?<!!)\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)")
SKIP_SCHEMES = {"http", "https", "mailto", "tel", "data"}


def maintained_pages() -> list[Path]:
    pages = [ROOT / "README.md", ROOT / "CONTRIBUTING.md"]
    pages.extend(p for p in (ROOT / "docs").rglob("*.md") if "archive" not in p.relative_to(ROOT).parts)
    pages.append(ROOT / "docs/archive/README.md")
    return sorted(set(pages))


def missing_links(page: Path) -> list[str]:
    missing = []
    for match in LINK.finditer(page.read_text(encoding="utf-8")):
        destination = match.group(1).strip("<>")
        parsed = urlsplit(destination)
        if parsed.scheme.lower() in SKIP_SCHEMES or destination.startswith("//"):
            continue
        if parsed.scheme:
            continue
        if not parsed.path:
            continue
        target = (page.parent / unquote(parsed.path)).resolve()
        if not target.is_relative_to(ROOT) or not target.exists():
            missing.append(destination)
    return missing


def main() -> int:
    failures = [(p, link) for p in maintained_pages() for link in missing_links(p)]
    for page, link in failures:
        print(f"{page.relative_to(ROOT)}: missing local link {link}")
    print(f"Checked {len(maintained_pages())} maintained Markdown pages; {len(failures)} broken local links.")
    return bool(failures)


if __name__ == "__main__":
    sys.exit(main())
