"""Build About/marketing stills from a source frame (JPEG/PNG). Upscale for web hero."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from PIL import Image, ImageEnhance

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = REPO_ROOT / "public" / "marketing"
HERO_WIDTH = 1920


def upscale(img: Image.Image, target_width: int) -> Image.Image:
    if img.width >= target_width:
        return img
    scale = target_width / img.width
    size = (target_width, int(img.height * scale))
    out = img.resize(size, Image.Resampling.LANCZOS)
    out = ImageEnhance.Sharpness(out).enhance(1.08)
    out = ImageEnhance.Contrast(out).enhance(1.02)
    return out


def save_hero_pair(img: Image.Image, out_dir: Path, stem: str) -> None:
    jpg = out_dir / f"{stem}.jpg"
    webp = out_dir / f"{stem}.webp"
    img.save(jpg, quality=95, optimize=True, progressive=True)
    img.save(webp, quality=92, method=6)
    print("wrote", jpg.name, webp.name, img.size)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "source",
        nargs="?",
        default=str(DEFAULT_OUT / "source-frame.jpg"),
        help="Source still (place HD export as public/marketing/source-frame.jpg)",
    )
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    args = parser.parse_args()

    src = Path(args.source)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not src.is_file():
        raise SystemExit(f"Source not found: {src}")

    im = Image.open(src).convert("RGB")
    w, h = im.size
    print("source", im.size)

    banner = im.crop((0, int(h * 0.05), w, int(h * 0.95)))
    save_hero_pair(upscale(banner, HERO_WIDTH), out_dir, "yaddii-about-banner")

    still = upscale(im, HERO_WIDTH)
    save_hero_pair(still, out_dir, "yaddii-hero-still")

    box = (int(w * 0.08), int(h * 0.22), int(w * 0.92), int(h * 0.72))
    sign = ImageEnhance.Sharpness(im.crop(box)).enhance(1.15)
    sign.save(out_dir / "yaddii-3d-sign-crop.jpg", quality=92, optimize=True)

    box2 = (int(w * 0.06), int(h * 0.31), int(w * 0.94), int(h * 0.57))
    logo = im.crop(box2)
    pad = 20
    logo_padded = Image.new("RGB", (logo.width + pad * 2, logo.height + pad * 2), (249, 250, 251))
    logo_padded.paste(logo, (pad, pad))
    logo_padded.save(out_dir / "yaddii-3d-sign-on-white.jpg", quality=92, optimize=True)

    print("done ->", out_dir)


if __name__ == "__main__":
    main()
