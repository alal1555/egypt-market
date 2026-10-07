"""Build About/marketing stills from a source frame (JPEG/PNG). Upscale for web hero."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = REPO_ROOT / "public" / "marketing"
FALLBACK_SOURCE = (
    Path.home()
    / ".cursor"
    / "projects"
    / "c-Users-alal1-Desktop-egypt-market-public"
    / "assets"
    / "c__Users_alal1_AppData_Roaming_Cursor_User_workspaceStorage_0ce5efb3015f89bccf5ad09308cd3190_images_Gemini_Generated_Gif_okcu91okcu91okcu-bc3fb8f0-c284-4ac1-8c4e-e85dc25d02f1.jpg"
)
HERO_WIDTH = 1536


def reduce_grain(img: Image.Image) -> Image.Image:
    """Light speckle cleanup — avoid heavy blur (that made the hero look soft)."""
    return img.filter(ImageFilter.MedianFilter(size=3))


def finish_hero(img: Image.Image) -> Image.Image:
    """Sharpen edges after upscale; threshold skips flat/noisy dark regions."""
    sharp = img.filter(ImageFilter.UnsharpMask(radius=1.1, percent=118, threshold=4))
    return ImageEnhance.Contrast(sharp).enhance(1.015)


def upscale(img: Image.Image, target_width: int) -> Image.Image:
    img = reduce_grain(img)
    if img.width < target_width:
        scale = target_width / img.width
        size = (target_width, int(img.height * scale))
        img = img.resize(size, Image.Resampling.LANCZOS)
    return finish_hero(img)


def save_hero_pair(img: Image.Image, out_dir: Path, stem: str) -> None:
    jpg = out_dir / f"{stem}.jpg"
    webp = out_dir / f"{stem}.webp"
    png = out_dir / f"{stem}.png"
    img.save(jpg, quality=98, optimize=True, progressive=True, subsampling=0)
    img.save(webp, quality=95, method=6, lossless=False)
    img.save(png, optimize=True)
    print("wrote", jpg.name, webp.name, png.name, img.size)


def resolve_source(path: Path) -> Path:
    if path.is_file():
        return path
    if FALLBACK_SOURCE.is_file():
        return FALLBACK_SOURCE
    raise SystemExit(f"Source not found: {path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "source",
        nargs="?",
        default=str(DEFAULT_OUT / "source-frame.jpg"),
        help="Source still (HD export as public/marketing/source-frame.jpg)",
    )
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--width", type=int, default=HERO_WIDTH)
    args = parser.parse_args()

    src = resolve_source(Path(args.source))
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    im = Image.open(src).convert("RGB")
    w, h = im.size
    print("source", src.name, im.size)

    banner = im.crop((0, int(h * 0.05), w, int(h * 0.95)))
    save_hero_pair(upscale(banner, args.width), out_dir, "yaddii-about-banner")

    still = upscale(im, args.width)
    save_hero_pair(still, out_dir, "yaddii-hero-still")

    box = (int(w * 0.08), int(h * 0.22), int(w * 0.92), int(h * 0.72))
    sign = reduce_grain(im.crop(box))
    sign.save(out_dir / "yaddii-3d-sign-crop.jpg", quality=95, optimize=True, subsampling=0)

    box2 = (int(w * 0.06), int(h * 0.31), int(w * 0.94), int(h * 0.57))
    logo = im.crop(box2)
    pad = 20
    logo_padded = Image.new("RGB", (logo.width + pad * 2, logo.height + pad * 2), (249, 250, 251))
    logo_padded.paste(logo, (pad, pad))
    logo_padded.save(out_dir / "yaddii-3d-sign-on-white.jpg", quality=95, optimize=True, subsampling=0)

    print("done ->", out_dir)


if __name__ == "__main__":
    main()
