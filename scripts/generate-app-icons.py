"""从根目录 applogo.png 生成 Android 桌面应用图标（ic_launcher）。"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "applogo.png"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"

# Android launcher（legacy）与 adaptive foreground 尺寸
ANDROID_LAUNCHER = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
ANDROID_FOREGROUND = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

def resize_square(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.Resampling.LANCZOS)


def adaptive_foreground(img: Image.Image, canvas: int) -> Image.Image:
    """Android adaptive icon 前景：留安全边距，避免不同机型裁切关键内容。"""
    safe = int(canvas * 0.82)
    logo = resize_square(img, safe)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    offset = (canvas - safe) // 2
    out.paste(logo, (offset, offset), logo)
    return out


def save_png(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"缺少源图: {SOURCE}")

    src = Image.open(SOURCE).convert("RGBA")

    for folder, size in ANDROID_LAUNCHER.items():
        base = ANDROID_RES / folder
        icon = resize_square(src, size)
        save_png(base / "ic_launcher.png", icon)
        save_png(base / "ic_launcher_round.png", icon)

    for folder, size in ANDROID_FOREGROUND.items():
        fg = adaptive_foreground(src, size)
        save_png(ANDROID_RES / folder / "ic_launcher_foreground.png", fg)

    print(f"已从 {SOURCE.name} 生成 Android 桌面应用图标")


if __name__ == "__main__":
    main()
