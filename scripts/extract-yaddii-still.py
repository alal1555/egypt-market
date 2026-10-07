from PIL import Image, ImageEnhance
import os

src = r"C:\Users\alal1\.cursor\projects\c-Users-alal1-Desktop-egypt-market-public\assets\c__Users_alal1_AppData_Roaming_Cursor_User_workspaceStorage_0ce5efb3015f89bccf5ad09308cd3190_images_Gemini_Generated_Gif_okcu91okcu91okcu-bc3fb8f0-c284-4ac1-8c4e-e85dc25d02f1.jpg"
out_dir = r"c:\Users\alal1\Desktop\egypt-market\public\marketing"
os.makedirs(out_dir, exist_ok=True)

im = Image.open(src).convert("RGB")
w, h = im.size
print("size", w, h)

still = im.copy()
still = ImageEnhance.Contrast(still).enhance(1.05)
still = ImageEnhance.Sharpness(still).enhance(1.15)
still.save(os.path.join(out_dir, "yaddii-hero-still.jpg"), quality=92, optimize=True)

box = (int(w * 0.08), int(h * 0.22), int(w * 0.92), int(h * 0.72))
sign = im.crop(box)
sign = ImageEnhance.Sharpness(sign).enhance(1.2)
sign.save(os.path.join(out_dir, "yaddii-3d-sign-crop.jpg"), quality=92, optimize=True)

# Sign row only (icon + Yaddii wordmark; minimal face)
box2 = (int(w * 0.06), int(h * 0.31), int(w * 0.94), int(h * 0.57))
logo = im.crop(box2)
pad = 20
logo_padded = Image.new("RGB", (logo.width + pad * 2, logo.height + pad * 2), (249, 250, 251))
logo_padded.paste(logo, (pad, pad))
logo_padded.save(os.path.join(out_dir, "yaddii-3d-sign-on-white.jpg"), quality=92, optimize=True)

# Wide banner crop for About hero (16:9 feel, no extra sharpening on background)
banner = im.crop((0, int(h * 0.05), w, int(h * 0.95)))
banner = ImageEnhance.Contrast(banner).enhance(1.03)
banner.save(os.path.join(out_dir, "yaddii-about-banner.jpg"), quality=90, optimize=True)

print("saved to", out_dir)
