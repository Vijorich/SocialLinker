from PIL import Image, ImageDraw, ImageFont
import os, math

BASE = r"C:\Users\progr\Documents\SocialLinker"
OUT = os.path.join(BASE, "assets", "og-cover.png")

# site colors from style.css
BG = (13, 7, 6)
BG_CARD = (48, 21, 18)
FG = (238, 228, 224)
FG_MUTED = (177, 160, 157)
ACCENT = (209, 67, 60)

W, H = 1200, 630
PAD = 72
RADIUS = 28
AVATAR = 190
GAP = 40

img = Image.new("RGBA", (W, H), BG)
d = ImageDraw.Draw(img)

# soft card surface, left/right centered block
card = (PAD, PAD, W - PAD, H - PAD)
d.rounded_rectangle(card, radius=RADIUS * 2, fill=BG_CARD)

fonts_dir = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
font_display = os.path.join(fonts_dir, "Unbounded-Bold.ttf")
font_body = os.path.join(fonts_dir, "Rubik-Regular.ttf")

try:
    f_nick = ImageFont.truetype(font_display, 132)
    f_tag = ImageFont.truetype(font_body, 34)
    f_url = ImageFont.truetype(font_body, 28)
except Exception:
    f_nick = f_tag = f_url = ImageFont.load_default()

NICK = "Vijor"
TAG = "Кодер, немного стример"
URL = "vijorich.github.io/SocialLinker"

# measure
nb = d.textbbox((0, 0), NICK, font=f_nick)
tb = d.textbbox((0, 0), TAG, font=f_tag)
ub = d.textbbox((0, 0), URL, font=f_url)

# vertical stack centered
stack_h = (nb[3] - nb[1]) + 28 + (tb[3] - tb[1]) + 64 + (ub[3] - ub[1])
y0 = (H - stack_h) // 2

x0 = PAD + 104  # left inset from card inner edge

# avatar
avatar_path = os.path.join(BASE, "assets", "avatar.webp")
av_x = x0
av_y = y0 + 8
if os.path.exists(avatar_path):
    avatar_img = Image.open(avatar_path).convert("RGBA").resize((AVATAR, AVATAR), Image.Resampling.LANCZOS)
    mask = Image.new("L", (AVATAR, AVATAR), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, AVATAR, AVATAR), radius=RADIUS, fill=255)
    img.paste(avatar_img, (av_x, av_y), mask)
else:
    d.rounded_rectangle((av_x, av_y, av_x + AVATAR, av_y + AVATAR), radius=RADIUS, fill=ACCENT)

tx = x0 + AVATAR + GAP
ty = y0

d.text((tx, ty - nb[1]), NICK, font=f_nick, fill=FG)
d.text((tx, ty + (nb[3] - nb[1]) + 28 - tb[1]), TAG, font=f_tag, fill=FG_MUTED)
d.text((tx, ty + (nb[3] - nb[1]) + 64 + (tb[3] - tb[1]) - ub[1]), URL, font=f_url, fill=ACCENT)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "PNG", optimize=True)
print("saved", OUT, img.size)
