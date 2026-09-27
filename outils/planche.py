import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
d = Path(sys.argv[1]); out = sys.argv[2]
fs = sorted(d.glob('*.jpg'))
W = 640; ims = []
for f in fs:
    im = Image.open(f); im = im.resize((W, int(im.height * W / im.width))); ims.append((f.stem, im))
cols = 3; rows = (len(ims) + cols - 1) // cols; h = max(i.height for _, i in ims) + 28
sheet = Image.new('RGB', (cols * W, rows * h), 'white'); dr = ImageDraw.Draw(sheet)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 20)
for k, (n, im) in enumerate(ims):
    x, y = (k % cols) * W, (k // cols) * h; sheet.paste(im, (x, y + 28)); dr.text((x + 6, y + 4), n, fill='black', font=font)
sheet.save(out, quality=85)
