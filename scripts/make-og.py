"""Generate the Open Graph card from the repository's current data.

Usage:
    python scripts/make-og.py
    python scripts/make-og.py --root /path/to/checkout

The script is intentionally dependency-light: Pillow is the only external
requirement and is documented in scripts/requirements.txt.
"""
from argparse import ArgumentParser
from pathlib import Path
import os
import re
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAD = 72
RADIUS = 56
AVATAR = 190
GAP = 40


def scalar(path: Path, key: str, default: str = "") -> str:
    """Read a simple YAML scalar without adding a PyYAML dependency."""
    pattern = re.compile(rf"^\s*{re.escape(key)}\s*:\s*(.*?)\s*$")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if not match:
            continue
        value = match.group(1).strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        return value
    return default


def font(candidates, size):
    for candidate in candidates:
        if candidate.exists():
            try:
                return ImageFont.truetype(str(candidate), size)
            except OSError:
                pass
    return ImageFont.load_default()


def fit_text(draw, value, candidates, size, max_width):
    chosen = font(candidates, size)
    while size > 18 and draw.textbbox((0, 0), value, font=chosen)[2] > max_width:
        size -= 2
        chosen = font(candidates, size)
    return chosen


def main():
    parser = ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    out = root / "assets" / "og-cover.png"
    profile = root / "_data" / "profile.yml"
    config = root / "_config.yml"

    # Current palette from assets/style.css.
    bg = (10, 23, 24)
    card = (48, 21, 18)
    fg = (238, 228, 224)
    muted = (214, 201, 197)
    accent = (216, 14, 5)
    accent_text = (255, 180, 166)

    nick = scalar(profile, "nick", "Vijor")
    tagline = scalar(profile, "tagline", "Кодер, немного стример")
    site_url = scalar(config, "url", "https://vijorich.github.io").replace("https://", "")
    baseurl = scalar(config, "baseurl", "").strip("/")
    public_url = f"{site_url}/{baseurl}" if baseurl else site_url

    image = Image.new("RGBA", (W, H), bg)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((PAD, PAD, W - PAD, H - PAD), radius=RADIUS, fill=card)

    windows_fonts = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
    system_fonts = Path("/usr/share/fonts/truetype")
    display_candidates = [
        windows_fonts / "Unbounded-Bold.ttf",
        system_fonts / "unbounded/Unbounded-Bold.ttf",
        system_fonts / "dejavu/DejaVuSans-Bold.ttf",
        windows_fonts / "arialbd.ttf",
    ]
    body_candidates = [
        windows_fonts / "Rubik-Regular.ttf",
        system_fonts / "rubik/Rubik-Regular.ttf",
        system_fonts / "dejavu/DejaVuSans.ttf",
        system_fonts / "liberation2/LiberationSans-Regular.ttf",
        windows_fonts / "segoeui.ttf",
        windows_fonts / "arial.ttf",
    ]
    f_nick = fit_text(draw, nick, display_candidates, 132, 650)
    f_tag = fit_text(draw, tagline, body_candidates, 34, 650)
    f_url = font(body_candidates, 28)

    nb = draw.textbbox((0, 0), nick, font=f_nick)
    tb = draw.textbbox((0, 0), tagline, font=f_tag)
    ub = draw.textbbox((0, 0), public_url, font=f_url)
    stack_h = (nb[3] - nb[1]) + 28 + (tb[3] - tb[1]) + 64 + (ub[3] - ub[1])
    y0 = (H - stack_h) // 2
    x0 = PAD + 104

    avatar_path = root / "assets" / "avatar.webp"
    av_x, av_y = x0, y0 + 8
    if avatar_path.exists():
        avatar = Image.open(avatar_path).convert("RGBA").resize((AVATAR, AVATAR), Image.Resampling.LANCZOS)
        mask = Image.new("L", (AVATAR, AVATAR), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, AVATAR, AVATAR), radius=RADIUS, fill=255)
        image.paste(avatar, (av_x, av_y), mask)
    else:
        draw.rounded_rectangle((av_x, av_y, av_x + AVATAR, av_y + AVATAR), radius=RADIUS, fill=accent)

    tx, ty = x0 + AVATAR + GAP, y0
    draw.text((tx, ty - nb[1]), nick, font=f_nick, fill=fg)
    draw.text((tx, ty + (nb[3] - nb[1]) + 28 - tb[1]), tagline, font=f_tag, fill=muted)
    draw.text((tx, ty + (nb[3] - nb[1]) + 64 + (tb[3] - tb[1]) - ub[1]), public_url, font=f_url, fill=accent_text)

    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out, "PNG", optimize=True)
    print(f"saved {out} {image.size}")


if __name__ == "__main__":
    main()
