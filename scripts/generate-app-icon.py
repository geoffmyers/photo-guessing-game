#!/usr/bin/env python3
"""
Generate the macOS app icon for Photo Guessing Game.

Produces build/icon.png at 1024x1024 RGBA: a navy-to-blue gradient with macOS
squircle-rounded corners, a stylized white camera glyph, and a small overlay
question mark hinting "guess the photo."
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path

SIZE = 1024
RADIUS_FRAC = 0.225  # macOS app-icon squircle radius

BG_TOP_LEFT = (30, 58, 95)        # #1e3a5f
BG_BOTTOM_RIGHT = (74, 122, 175)  # lighter slate blue

CAMERA_FILL = (255, 255, 255, 245)
LENS_OUTER = (60, 90, 130)
LENS_INNER = (30, 58, 95)
LENS_GLINT = (200, 230, 255, 230)
ACCENT = (255, 215, 70)  # warm yellow for the spark


def gradient(w, h, c1, c2):
    img = Image.new("RGB", (w, h), c1)
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = (x + y) / (w + h - 2)
            r = round(c1[0] + (c2[0] - c1[0]) * t)
            g = round(c1[1] + (c2[1] - c1[1]) * t)
            b = round(c1[2] + (c2[2] - c1[2]) * t)
            px[x, y] = (r, g, b)
    return img


def main():
    out = Path(__file__).resolve().parent.parent / "build" / "icon.png"
    out.parent.mkdir(parents=True, exist_ok=True)

    # Composite onto a transparent canvas with a rounded-rect mask.
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    bg = gradient(SIZE, SIZE, BG_TOP_LEFT, BG_BOTTOM_RIGHT).convert("RGBA")

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, SIZE, SIZE), radius=int(SIZE * RADIUS_FRAC), fill=255
    )
    canvas.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(canvas, "RGBA")

    # Camera body - centered, slightly above center to leave room for the spark.
    cam_w = int(SIZE * 0.62)
    cam_h = int(SIZE * 0.44)
    cam_x = (SIZE - cam_w) // 2
    cam_y = int(SIZE * 0.34)
    cam_r = int(cam_h * 0.16)

    # Soft shadow under the body
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (cam_x, cam_y + 20, cam_x + cam_w, cam_y + cam_h + 20),
        radius=cam_r,
        fill=(0, 0, 0, 110),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    canvas.alpha_composite(shadow)

    # Top viewfinder bump (rectangle behind the body, peeking up)
    vf_w = int(cam_w * 0.34)
    vf_h = int(cam_h * 0.18)
    vf_x = cam_x + (cam_w - vf_w) // 2
    vf_y = cam_y - int(vf_h * 0.6)
    draw.rounded_rectangle(
        (vf_x, vf_y, vf_x + vf_w, vf_y + vf_h),
        radius=int(vf_h * 0.25),
        fill=CAMERA_FILL,
    )

    # Camera body
    draw.rounded_rectangle(
        (cam_x, cam_y, cam_x + cam_w, cam_y + cam_h),
        radius=cam_r,
        fill=CAMERA_FILL,
    )

    # Shutter button (small pill on top-right)
    sb_w = int(cam_w * 0.10)
    sb_h = int(vf_h * 0.55)
    sb_x = cam_x + cam_w - sb_w - int(cam_w * 0.05)
    sb_y = cam_y - int(sb_h * 0.55)
    draw.rounded_rectangle(
        (sb_x, sb_y, sb_x + sb_w, sb_y + sb_h),
        radius=int(sb_h * 0.5),
        fill=(40, 70, 110, 255),
    )

    # Lens (concentric circles for depth)
    lens_d = int(cam_h * 0.72)
    lens_cx = cam_x + cam_w // 2
    lens_cy = cam_y + cam_h // 2 + int(cam_h * 0.04)
    rings = [
        (lens_d, LENS_OUTER),
        (int(lens_d * 0.86), (40, 70, 110)),
        (int(lens_d * 0.74), LENS_INNER),
        (int(lens_d * 0.55), (20, 40, 70)),
    ]
    for d, color in rings:
        draw.ellipse(
            (lens_cx - d // 2, lens_cy - d // 2, lens_cx + d // 2, lens_cy + d // 2),
            fill=color,
        )

    # Lens glint (small highlight ellipse, upper-left of lens)
    glint_w = int(lens_d * 0.30)
    glint_h = int(lens_d * 0.18)
    glint_x = lens_cx - int(lens_d * 0.28)
    glint_y = lens_cy - int(lens_d * 0.26)
    draw.ellipse(
        (glint_x, glint_y, glint_x + glint_w, glint_y + glint_h),
        fill=LENS_GLINT,
    )

    # Question-mark / spark badge in the bottom-right of the icon, to hint "guess"
    spark_d = int(SIZE * 0.26)
    spark_cx = int(SIZE * 0.78)
    spark_cy = int(SIZE * 0.78)
    draw.ellipse(
        (spark_cx - spark_d // 2, spark_cy - spark_d // 2,
         spark_cx + spark_d // 2, spark_cy + spark_d // 2),
        fill=ACCENT,
    )
    # Draw "?" centered in the spark, falling back to a stroked path if no font.
    qmark = "?"
    font = None
    for candidate in (
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ):
        try:
            font = ImageFont.truetype(candidate, int(spark_d * 0.78))
            break
        except (OSError, IOError):
            continue
    if font is None:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), qmark, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (spark_cx - tw // 2 - bbox[0], spark_cy - th // 2 - bbox[1]),
        qmark,
        font=font,
        fill=(60, 30, 0, 255),
    )

    canvas.save(out, "PNG")
    print(f"Wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
