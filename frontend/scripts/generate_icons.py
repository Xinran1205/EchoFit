from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\AAA\Desktop\icon.png")
OUTPUT = ROOT / "public"
BACKGROUND = (246, 239, 227)


def resized(source: Image.Image, size: int) -> Image.Image:
    image = source.copy()
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), BACKGROUND)
    x = (size - image.width) // 2
    y = (size - image.height) // 2
    canvas.paste(image, (x, y))
    return canvas.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=2))


def maskable(source: Image.Image, size: int) -> Image.Image:
    image = source.resize((int(size * 0.8), int(size * 0.8)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), BACKGROUND)
    x = (size - image.width) // 2
    y = (size - image.height) // 2
    canvas.paste(image, (x, y))
    return canvas.filter(ImageFilter.UnsharpMask(radius=1.2, percent=115, threshold=2))


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")

    resized(source, 120).save(OUTPUT / "apple-touch-icon-120x120.png", quality=95)
    resized(source, 152).save(OUTPUT / "apple-touch-icon-152x152.png", quality=95)
    resized(source, 167).save(OUTPUT / "apple-touch-icon-167x167.png", quality=95)
    resized(source, 180).save(OUTPUT / "apple-touch-icon-180x180.png", quality=95)
    resized(source, 180).save(OUTPUT / "apple-touch-icon.png", quality=95)
    resized(source, 192).save(OUTPUT / "pwa-192x192.png", quality=95)
    resized(source, 512).save(OUTPUT / "pwa-512x512.png", quality=95)
    maskable(source, 512).save(OUTPUT / "pwa-512x512-maskable.png", quality=95)
    resized(source, 32).save(OUTPUT / "favicon-32x32.png", quality=95)
    resized(source, 16).save(OUTPUT / "favicon-16x16.png", quality=95)
    resized(source, 48).save(OUTPUT / "favicon-48x48.png", quality=95)

    icon_16 = resized(source, 16)
    icon_32 = resized(source, 32)
    icon_48 = resized(source, 48)
    icon_32.save(
        OUTPUT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[icon_16, icon_48],
    )


if __name__ == "__main__":
    main()
