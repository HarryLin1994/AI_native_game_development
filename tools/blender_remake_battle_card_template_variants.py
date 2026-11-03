from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE_TEMPLATE = ROOT / "godot" / "art" / "reference" / "ui" / "battle-card-dokkan-style-blank-template.png"
EXPORT_DIR = ROOT / "godot" / "art" / "exports" / "card-frame"
SOURCE_DIR = ROOT / "godot" / "art" / "source" / "card-frame" / "blender"
BLEND_FILE = SOURCE_DIR / "battle_card_template_variants.blend"

WIDTH = 1024
HEIGHT = 1536

RARITY_PALETTES = {
    "n": {
        "cyan": (0.90, 0.45, 0.18),
        "magenta": (0.98, 0.58, 0.26),
        "gold": (1.0, 0.72, 0.34),
        "name": "bronze copper",
    },
    "r": {
        "cyan": (0.70, 0.78, 0.88),
        "magenta": (0.92, 0.95, 1.0),
        "gold": (0.82, 0.86, 0.92),
        "name": "silver",
    },
    "sr": {
        "cyan": (1.0, 0.70, 0.08),
        "magenta": (1.0, 0.52, 0.06),
        "gold": (1.0, 0.92, 0.22),
        "name": "gold",
    },
    "ssr": {
        "cyan": (0.74, 0.22, 1.0),
        "magenta": (1.0, 0.10, 0.86),
        "gold": (0.95, 0.72, 1.0),
        "name": "purple",
    },
    "ur": {
        "cyan": None,
        "magenta": None,
        "gold": None,
        "name": "original cyan magenta gold",
    },
}


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def is_art_hole(x: int, y: int) -> bool:
    if x < 44 or x > 982 or y < 128 or y > 804:
        return False
    if x < 700 and y < 232:
        return False
    if x > 660 and y < 246:
        return False
    if x > 720 and y < 182:
        return False
    if x > 804 and y < 365:
        return False
    return True


def is_rarity_tint_zone(x: int, y: int) -> bool:
    if x < 76 or x > 948 or y < 80 or y > 1454:
        return True
    if x < 710 and y < 238:
        return True
    if x > 708 and y < 190:
        return True
    if x > 792 and y < 380:
        return True
    if y > 1400 and (x < 130 or x > 894):
        return True
    return False


def color_family(r: float, g: float, b: float) -> str:
    if b >= r and b >= g:
        return "cyan"
    if r >= g and b >= g:
        return "magenta"
    return "gold"


def recolor_pixel(r: float, g: float, b: float, palette: dict) -> tuple[float, float, float]:
    if palette["cyan"] is None:
        return r, g, b
    saturation = max(r, g, b) - min(r, g, b)
    value = max(r, g, b)
    if saturation < 0.12 and value < 0.58:
        return r, g, b
    family = color_family(r, g, b)
    target = palette[family]
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    preserve = 0.18 if saturation > 0.2 else 0.38
    return (
        clamp(target[0] * (0.50 + luma * 0.75) * (1.0 - preserve) + r * preserve),
        clamp(target[1] * (0.50 + luma * 0.75) * (1.0 - preserve) + g * preserve),
        clamp(target[2] * (0.50 + luma * 0.75) * (1.0 - preserve) + b * preserve),
    )


def make_variant(source_pixels: list[float], rarity_key: str, palette: dict) -> None:
    output = bpy.data.images.new(f"battle_card_template_{rarity_key}_overlay", WIDTH, HEIGHT, alpha=True, float_buffer=False)
    pixels = [0.0] * (WIDTH * HEIGHT * 4)

    for y in range(HEIGHT):
        src_y = HEIGHT - 1 - y
        for x in range(WIDTH):
            index = (src_y * WIDTH + x) * 4
            r = source_pixels[index]
            g = source_pixels[index + 1]
            b = source_pixels[index + 2]
            a = source_pixels[index + 3] if len(source_pixels) > index + 3 else 1.0

            if is_art_hole(x, y):
                a = 0.0
            elif is_rarity_tint_zone(x, y):
                r, g, b = recolor_pixel(r, g, b, palette)

            pixels[index] = r
            pixels[index + 1] = g
            pixels[index + 2] = b
            pixels[index + 3] = a

    output.pixels[:] = pixels
    output.filepath_raw = str(EXPORT_DIR / f"battle_card_template_{rarity_key}_overlay.png")
    output.file_format = "PNG"
    output.save()


def make_debug_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.context.scene.render.resolution_x = WIDTH
    bpy.context.scene.render.resolution_y = HEIGHT
    bpy.context.scene.render.film_transparent = True
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_FILE))


def main() -> None:
    if not SOURCE_TEMPLATE.exists():
        raise FileNotFoundError(SOURCE_TEMPLATE)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    source_image = bpy.data.images.load(str(SOURCE_TEMPLATE))
    if source_image.size[0] != WIDTH or source_image.size[1] != HEIGHT:
        raise ValueError(f"Expected {WIDTH}x{HEIGHT}, got {source_image.size[0]}x{source_image.size[1]}")
    source_pixels = list(source_image.pixels[:])
    for rarity_key, palette in RARITY_PALETTES.items():
        make_variant(source_pixels, rarity_key, palette)
    make_debug_scene()


if __name__ == "__main__":
    main()
