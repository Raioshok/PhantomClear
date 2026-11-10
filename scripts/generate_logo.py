import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

def create_phantomclear_logo(output_png="public/icon.png", output_ico="public/icon.ico"):
    S = 2048  # supersampled canvas
    cx, cy = S // 2, S // 2

    # Canvas
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # 1. Base Squircle Mask & Background
    # Generate superellipse (squircle) distance map
    y_coords, x_coords = np.ogrid[:S, :S]
    dx = (x_coords - cx) / 840.0
    dy = (y_coords - cy) / 840.0
    # Squircle equation: |x|^n + |y|^n <= 1 with n=4.4
    dist = np.abs(dx)**4.4 + np.abs(dy)**4.4
    squircle_mask_arr = np.clip((1.0 - (dist - 0.98) / 0.04) * 255, 0, 255).astype(np.uint8)
    squircle_mask = Image.fromarray(squircle_mask_arr, mode="L")

    # Dark background with rich gradient
    bg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    for y in range(S):
        t = y / S
        r = int(10 * (1 - t) + 4 * t)
        g = int(12 * (1 - t) + 5 * t)
        b = int(18 * (1 - t) + 8 * t)
        bg_draw.line([(0, y), (S, y)], fill=(r, g, b, 255))

    # Inner ambient radial lighting inside the squircle
    ambient = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    amb_draw = ImageDraw.Draw(ambient)
    amb_draw.ellipse([cx - 650, cy - 650, cx + 650, cy + 650], fill=(0, 245, 160, 45))
    amb_draw.ellipse([cx - 400, cy - 300, cx + 400, cy + 500], fill=(0, 180, 255, 55))
    ambient = ambient.filter(ImageFilter.GaussianBlur(180))

    bg = Image.alpha_composite(bg, ambient)

    # Apply squircle mask to background
    bg.putalpha(squircle_mask)

    # 2. Squircle Rim Bevel & Specular Highlight
    rim = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rim_draw = ImageDraw.Draw(rim)
    # Draw rim with subtle top light
    rim_dist_inner = np.abs(dx * 1.018)**4.4 + np.abs(dy * 1.018)**4.4
    rim_mask_arr = (np.clip((1.0 - (dist - 0.98) / 0.03) * 255, 0, 255) - 
                    np.clip((1.0 - (rim_dist_inner - 0.98) / 0.03) * 255, 0, 255)).astype(np.uint8)
    rim_mask = Image.fromarray(rim_mask_arr, mode="L")

    rim_grad = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rim_grad_draw = ImageDraw.Draw(rim_grad)
    for y in range(S):
        t = y / S
        if t < 0.4:
            alpha = int(140 * (1.0 - t / 0.4) + 40)
            rim_grad_draw.line([(0, y), (S, y)], fill=(255, 255, 255, alpha))
        elif t < 0.75:
            alpha = int(40 * (1.0 - (t - 0.4) / 0.35) + 20)
            rim_grad_draw.line([(0, y), (S, y)], fill=(0, 245, 180, alpha))
        else:
            rim_grad_draw.line([(0, y), (S, y)], fill=(0, 160, 255, 25))

    rim_grad.putalpha(rim_mask)
    bg = Image.alpha_composite(bg, rim_grad)

    # 3. Outer Drop Shadow around the squircle
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    shadow.paste(Image.new("RGBA", (S, S), (0, 0, 0, 160)), (0, 28), mask=squircle_mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(50))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas = Image.alpha_composite(canvas, bg)

    # 4. Neon Ethereal Glow behind the emblem
    glow_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)

    # Hood & wings contour for glow
    emblem_pts = [
        (cx, cy - 540),         # Top hood spike
        (cx + 260, cy - 360),
        (cx + 420, cy - 140),
        (cx + 490, cy + 90),    # Right wing tip
        (cx + 340, cy + 180),
        (cx + 240, cy + 90),
        (cx + 170, cy + 280),   # Lower right wing
        (cx + 90, cy + 340),
        (cx, cy + 560),         # Bottom crystal tip
        (cx - 90, cy + 340),
        (cx - 170, cy + 280),   # Lower left wing
        (cx - 240, cy + 90),
        (cx - 340, cy + 180),
        (cx - 490, cy + 90),    # Left wing tip
        (cx - 420, cy - 140),
        (cx - 260, cy - 360),
    ]

    glow_draw.polygon(emblem_pts, fill=(0, 245, 170, 130))
    glow_draw.ellipse([cx - 250, cy - 150, cx + 250, cy + 250], fill=(0, 210, 255, 160))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(90))
    canvas = Image.alpha_composite(canvas, glow_layer)

    # 5. Draw the Emblem Layers (Sharp, Faceted, Glassy)
    emblem_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(emblem_layer)

    # Left Dark Facet of Hood
    left_hood = [
        (cx, cy - 540),
        (cx - 260, cy - 360),
        (cx - 420, cy - 140),
        (cx - 490, cy + 90),
        (cx - 340, cy + 180),
        (cx - 240, cy + 90),
        (cx - 190, cy + 180),
        (cx, cy - 100),         # Center forehead
    ]
    draw.polygon(left_hood, fill=(18, 22, 32, 255))

    # Right Light Facet of Hood
    right_hood = [
        (cx, cy - 540),
        (cx + 260, cy - 360),
        (cx + 420, cy - 140),
        (cx + 490, cy + 90),
        (cx + 340, cy + 180),
        (cx + 240, cy + 90),
        (cx + 190, cy + 180),
        (cx, cy - 100),
    ]
    draw.polygon(right_hood, fill=(28, 36, 52, 255))

    # Center Crown Ridge & Forehead Diamond
    center_crest = [
        (cx, cy - 540),
        (cx + 90, cy - 360),
        (cx, cy - 220),
        (cx - 90, cy - 360),
    ]
    draw.polygon(center_crest, fill=(44, 56, 80, 255))

    # Forehead central diamond shard
    forehead_shard = [
        (cx, cy - 220),
        (cx + 50, cy - 140),
        (cx, cy - 70),
        (cx - 50, cy - 140),
    ]
    draw.polygon(forehead_shard, fill=(0, 245, 180, 240))

    # Left Lower Wing Facet
    left_lower = [
        (cx - 190, cy + 180),
        (cx - 240, cy + 90),
        (cx - 170, cy + 280),
        (cx - 80, cy + 330),
        (cx, cy + 220),
    ]
    draw.polygon(left_lower, fill=(15, 19, 28, 255))

    # Right Lower Wing Facet
    right_lower = [
        (cx + 190, cy + 180),
        (cx + 240, cy + 90),
        (cx + 170, cy + 280),
        (cx + 80, cy + 330),
        (cx, cy + 220),
    ]
    draw.polygon(right_lower, fill=(24, 30, 44, 255))

    # Lower Cleansing Shard / Purge Crystal (Bottom Center)
    # Left half of crystal
    crystal_left = [
        (cx, cy + 110),
        (cx - 90, cy + 310),
        (cx, cy + 560),
        (cx, cy + 280),
    ]
    draw.polygon(crystal_left, fill=(0, 220, 160, 230))

    # Right half of crystal (brighter cyan/emerald)
    crystal_right = [
        (cx, cy + 110),
        (cx + 90, cy + 310),
        (cx, cy + 560),
        (cx, cy + 280),
    ]
    draw.polygon(crystal_right, fill=(0, 250, 210, 255))

    # Inner core facet of crystal
    crystal_core = [
        (cx, cy + 160),
        (cx + 50, cy + 300),
        (cx, cy + 450),
        (cx - 50, cy + 300),
    ]
    draw.polygon(crystal_core, fill=(210, 255, 245, 230))

    # 6. Spectral Glowing Eyes / Visor (Iconic Phantom Mask Identity)
    # Left eye: sharp aggressive angular visor
    left_eye = [
        (cx - 220, cy - 20),
        (cx - 70, cy + 30),
        (cx - 60, cy + 70),
        (cx - 200, cy + 40),
    ]
    # Right eye: symmetric sharp visor
    right_eye = [
        (cx + 220, cy - 20),
        (cx + 70, cy + 30),
        (cx + 60, cy + 70),
        (cx + 200, cy + 40),
    ]

    draw.polygon(left_eye, fill=(0, 255, 170, 255))
    draw.polygon(right_eye, fill=(0, 255, 220, 255))

    # Inner high-intensity eye slits (hot white/cyan centers)
    left_eye_inner = [
        (cx - 200, cy - 5),
        (cx - 85, cy + 32),
        (cx - 80, cy + 52),
        (cx - 185, cy + 32),
    ]
    right_eye_inner = [
        (cx + 200, cy - 5),
        (cx + 85, cy + 32),
        (cx + 80, cy + 52),
        (cx + 185, cy + 32),
    ]
    draw.polygon(left_eye_inner, fill=(240, 255, 250, 255))
    draw.polygon(right_eye_inner, fill=(240, 255, 255, 255))

    # 7. Facet outlines, specular edges and neon line accents
    # Crisp specular line highlights on the crest
    draw.line([(cx, cy - 540), (cx, cy - 100)], fill=(255, 255, 255, 190), width=6)
    draw.line([(cx, cy - 540), (cx + 260, cy - 360)], fill=(0, 255, 200, 230), width=6)
    draw.line([(cx + 260, cy - 360), (cx + 420, cy - 140)], fill=(0, 230, 255, 220), width=5)
    draw.line([(cx + 420, cy - 140), (cx + 490, cy + 90)], fill=(0, 200, 255, 240), width=6)

    draw.line([(cx, cy - 540), (cx - 260, cy - 360)], fill=(0, 230, 160, 180), width=5)
    draw.line([(cx - 260, cy - 360), (cx - 420, cy - 140)], fill=(0, 200, 180, 160), width=4)
    draw.line([(cx - 420, cy - 140), (cx - 490, cy + 90)], fill=(0, 220, 180, 200), width=5)

    # Crystal ridge line
    draw.line([(cx, cy + 110), (cx, cy + 560)], fill=(255, 255, 255, 240), width=7)
    draw.line([(cx - 90, cy + 310), (cx, cy + 560)], fill=(0, 255, 190, 200), width=5)
    draw.line([(cx + 90, cy + 310), (cx, cy + 560)], fill=(0, 255, 240, 230), width=5)

    # 8. Celestial sparkle / lens glint at top peak and crystal tip
    def draw_glint(x, y, r_h, r_v, color=(255, 255, 255, 255)):
        glint = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        g_draw = ImageDraw.Draw(glint)
        g_draw.ellipse([x - r_h, y - 6, x + r_h, y + 6], fill=color)
        g_draw.ellipse([x - 6, y - r_v, x + 6, y + r_v], fill=color)
        g_draw.ellipse([x - 24, y - 24, x + 24, y + 24], fill=(255, 255, 255, 255))
        return glint

    g1 = draw_glint(cx, cy - 540, 110, 110, (220, 255, 245, 230))
    g2 = draw_glint(cx, cy + 560, 120, 120, (200, 255, 255, 240))
    g3 = draw_glint(cx + 490, cy + 90, 70, 70, (0, 255, 230, 220))
    g4 = draw_glint(cx - 490, cy + 90, 70, 70, (0, 255, 170, 200))

    canvas = Image.alpha_composite(canvas, emblem_layer)
    canvas = Image.alpha_composite(canvas, g1)
    canvas = Image.alpha_composite(canvas, g2)
    canvas = Image.alpha_composite(canvas, g3)
    canvas = Image.alpha_composite(canvas, g4)

    # 9. Downsample with high-quality LANCZOS to target 1024x1024
    final_icon = canvas.resize((1024, 1024), Image.Resampling.LANCZOS)
    final_icon.save(output_png, format="PNG", optimize=True)
    print(f"Saved PNG logo: {output_png} (1024x1024)")

    # 10. Generate crisp multi-size Windows .ico file
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    final_icon.save(output_ico, format="ICO", sizes=ico_sizes)
    print(f"Saved multi-resolution ICO: {output_ico} {ico_sizes}")

if __name__ == "__main__":
    create_phantomclear_logo()
