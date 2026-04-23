"""Recorta márgenes transparentes (canal alpha) de los PNG en public/branding.

Uso (desde la raíz del repo):
  py -3 scripts/trim-branding-png.py

Requiere: pip install pillow
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "branding"
FILES = ("cersik-logo-full.png", "cersik-mark.png")
PAD = 2


def trim_rgba(path: Path, pad: int = PAD) -> tuple[tuple[int, int], tuple[int, int]]:
    im = Image.open(path).convert("RGBA")
    before = im.size
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return before, before
    left, top, right, bottom = bbox
    w, h = im.size
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w, right + pad)
    bottom = min(h, bottom + pad)
    im.crop((left, top, right, bottom)).save(path, "PNG", optimize=True)
    im2 = Image.open(path)
    return before, im2.size


def main() -> None:
    for name in FILES:
        path = BRAND / name
        if not path.is_file():
            print(f"skip (missing): {path}")
            continue
        before, after = trim_rgba(path)
        print(f"{name}: {before} -> {after}")


if __name__ == "__main__":
    main()
