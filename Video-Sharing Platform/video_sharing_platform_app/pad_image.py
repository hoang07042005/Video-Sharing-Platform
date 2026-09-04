import sys
from PIL import Image

img = Image.open("assets/logotrang.png")
W, H = img.size
C = int(max(W, H) * 1.6)
new_img = Image.new("RGBA", (C, C), (0, 0, 0, 0))
new_img.paste(img, ((C - W) // 2, (C - H) // 2))
new_img.save("assets/logotrang_padded.png")
