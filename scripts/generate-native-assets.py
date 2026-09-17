#!/usr/bin/env python3
"""
Generate the iOS AppIcon/splash and Android mipmap/splash assets from
build/icon.png (built by generate-app-icon.py).

Capacitor's `cap add ios` / `cap add android` scaffold these files as blank
white placeholders; this script overwrites them in place with renders of the
real app icon, at the exact filenames and pixel sizes Xcode/Android already
expect (so no Contents.json / adaptive-icon XML needs to change).

Run after generate-app-icon.py, whenever build/icon.png changes:
    python3 scripts/generate-native-assets.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE_ICON = ROOT / "build" / "icon.png"

# Matches capacitor.config.ts (ios.backgroundColor / android.backgroundColor /
# plugins.SplashScreen.backgroundColor) and the Electron main window's
# backgroundColor, and generate-app-icon.py's gradient start color.
BRAND_BG = (30, 58, 95)  # #1e3a5f


def load_source():
    if not SOURCE_ICON.exists():
        raise SystemExit(
            f"{SOURCE_ICON} not found — run scripts/generate-app-icon.py first"
        )
    return Image.open(SOURCE_ICON).convert("RGBA")


def resized(source, size):
    return source.resize((size, size), Image.LANCZOS)


def flatten_on(source, size, bg_rgb):
    """Composite onto an opaque background and drop alpha (Apple's App Store
    icon must not carry a transparency channel)."""
    canvas = Image.new("RGB", (size, size), bg_rgb)
    icon = resized(source, size)
    canvas.paste(icon, (0, 0), icon)
    return canvas


def circular_mask(img):
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def centered_on_transparent(source, canvas_size, content_frac):
    """Foreground layer for an Android adaptive icon: the icon content
    occupies `content_frac` of the canvas, centered, with the rest
    transparent so the OS-applied mask has padding to work with."""
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    content_size = round(canvas_size * content_frac)
    icon = resized(source, content_size)
    offset = (canvas_size - content_size) // 2
    canvas.paste(icon, (offset, offset), icon)
    return canvas


def splash_image(source, width, height, icon_frac=0.34):
    canvas = Image.new("RGB", (width, height), BRAND_BG)
    icon_size = round(min(width, height) * icon_frac)
    icon = resized(source, icon_size)
    offset = ((width - icon_size) // 2, (height - icon_size) // 2)
    canvas.paste(icon, offset, icon)
    return canvas


def write(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")
    print(f"  {path.relative_to(ROOT)} ({img.size[0]}x{img.size[1]})")


def generate_ios(source):
    print("iOS AppIcon + Splash:")
    ios_root = ROOT / "ios" / "App" / "App" / "Assets.xcassets"

    # AppIcon: one 1024x1024 "universal" entry (modern single-size iconset),
    # no alpha channel per Apple's App Store submission requirement.
    write(
        flatten_on(source, 1024, BRAND_BG),
        ios_root / "AppIcon.appiconset" / "AppIcon-512@2x.png",
    )

    # Splash: one 2732x2732 storyboard image reused at 1x/2x/3x scale (the
    # storyboard itself, not this file, does the actual point-size scaling).
    splash = splash_image(source, 2732, 2732)
    for name in (
        "splash-2732x2732.png",
        "splash-2732x2732-1.png",
        "splash-2732x2732-2.png",
    ):
        write(splash, ios_root / "Splash.imageset" / name)


# density -> (legacy launcher px, adaptive foreground px)
ANDROID_DENSITIES = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}

# density -> (portrait width, portrait height)
ANDROID_SPLASH_SIZES = {
    "mdpi": (320, 480),
    "hdpi": (480, 800),
    "xhdpi": (720, 1280),
    "xxhdpi": (960, 1600),
    "xxxhdpi": (1280, 1920),
}


def generate_android(source):
    print("Android mipmaps + splash:")
    res = ROOT / "android" / "app" / "src" / "main" / "res"

    for density, (launcher_px, fg_px) in ANDROID_DENSITIES.items():
        mipmap_dir = res / f"mipmap-{density}"

        square = resized(source, launcher_px)
        write(square, mipmap_dir / "ic_launcher.png")
        write(circular_mask(square), mipmap_dir / "ic_launcher_round.png")

        # Adaptive-icon foreground: content inset to the ~66/108 safe zone,
        # transparent padding around it (the flat `ic_launcher_background`
        # color — currently white — shows through in the masked corners).
        write(
            centered_on_transparent(source, fg_px, content_frac=66 / 108),
            mipmap_dir / "ic_launcher_foreground.png",
        )

    # `drawable/splash.png` (default/no-qualifier fallback, shown briefly via
    # AppTheme.NoActionBarLaunch before Android resolves the orientation-
    # specific drawable-port-*/drawable-land-* resource) matches land-mdpi —
    # the orientation the file has shipped in since this project's first
    # commit; swapping it to portrait here would silently change an asset the
    # generator is supposed to reproduce byte-for-byte in dimensions.
    write(splash_image(source, 480, 320), res / "drawable" / "splash.png")

    for density, (w, h) in ANDROID_SPLASH_SIZES.items():
        write(splash_image(source, w, h), res / f"drawable-port-{density}" / "splash.png")
        write(splash_image(source, h, w), res / f"drawable-land-{density}" / "splash.png")


def main():
    source = load_source()
    generate_ios(source)
    generate_android(source)


if __name__ == "__main__":
    main()
