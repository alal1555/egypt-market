from pathlib import Path

from PIL import Image, ImageFilter

SRC = Path(
    r"C:\Users\alal1\.cursor\projects\c-Users-alal1-Desktop-egypt-market-public\assets"
    r"\c__Users_alal1_AppData_Roaming_Cursor_User_workspaceStorage_0ce5efb3015f89bccf5ad09308cd3190_images"
    r"_log-6c53825b-e665-4e33-a26d-ae46cec92528.jpg"
)
OUT = Path(__file__).resolve().parents[1] / "public" / "marketing"
TARGET_W = 1536


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    im = Image.open(SRC).convert("RGB")
    im.save(OUT / "source-frame.jpg", quality=98, subsampling=0)

    if im.width < TARGET_W:
        scale = TARGET_W / im.width
        hero = im.resize((TARGET_W, int(im.height * scale)), Image.Resampling.LANCZOS)
    else:
        hero = im

    hero = hero.filter(ImageFilter.UnsharpMask(radius=0.8, percent=105, threshold=3))

    for stem in ("yaddii-about-banner", "yaddii-hero-still"):
        hero.save(OUT / f"{stem}.jpg", quality=98, optimize=True, progressive=True, subsampling=0)
        hero.save(OUT / f"{stem}.webp", quality=95, method=6)
        hero.save(OUT / f"{stem}.png", optimize=True)

    print("hero", hero.size, "->", OUT)


if __name__ == "__main__":
    main()
