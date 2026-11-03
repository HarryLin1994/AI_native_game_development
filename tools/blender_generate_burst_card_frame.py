import math
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
EXPORT_DIR = ROOT / "godot" / "art" / "exports" / "card-frame"
SOURCE_DIR = ROOT / "godot" / "art" / "source" / "card-frame" / "blender"
EXPORT_DIR.mkdir(parents=True, exist_ok=True)
SOURCE_DIR.mkdir(parents=True, exist_ok=True)

FRAME_PNG = EXPORT_DIR / "burst_frame_overlay.png"
BLEND_FILE = SOURCE_DIR / "burst_card_frame.blend"

CARD_WIDTH = 852
CARD_HEIGHT = 1136
FRAME_BLEED = 56
RENDER_WIDTH = CARD_WIDTH + FRAME_BLEED * 2
RENDER_HEIGHT = CARD_HEIGHT + FRAME_BLEED * 2
CAMERA_ORTHO_SCALE = 12.48
CAMERA_HALF_HEIGHT = CAMERA_ORTHO_SCALE * 0.5
CAMERA_HALF_WIDTH = CAMERA_HALF_HEIGHT * (RENDER_WIDTH / RENDER_HEIGHT)
CARD_HALF_WIDTH = (CARD_WIDTH / RENDER_WIDTH) * CAMERA_HALF_WIDTH
CARD_HALF_HEIGHT = (CARD_HEIGHT / RENDER_HEIGHT) * CAMERA_HALF_HEIGHT


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def make_mat(name: str, color: tuple[float, float, float, float], emission: float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    mat.show_transparent_back = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Alpha"].default_value = color[3]
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = color
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission
    return mat


def add_poly(name: str, verts: list[tuple[float, float, float]], mat: bpy.types.Material) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], [tuple(range(len(verts)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def add_quad(name: str, x1: float, y1: float, x2: float, y2: float, z: float, mat: bpy.types.Material) -> None:
    add_poly(name, [(x1, y1, z), (x2, y1, z), (x2, y2, z), (x1, y2, z)], mat)


def add_ring(prefix: str, outer: tuple[float, float, float, float], inner: tuple[float, float, float, float], z: float, mat: bpy.types.Material) -> None:
    ox1, oy1, ox2, oy2 = outer
    ix1, iy1, ix2, iy2 = inner
    add_quad(f"{prefix}_top", ox1, iy2, ox2, oy2, z, mat)
    add_quad(f"{prefix}_bottom", ox1, oy1, ox2, iy1, z, mat)
    add_quad(f"{prefix}_left", ox1, iy1, ix1, iy2, z, mat)
    add_quad(f"{prefix}_right", ix2, iy1, ox2, iy2, z, mat)


def add_burst_rays(mat_red: bpy.types.Material, mat_cyan: bpy.types.Material) -> None:
    for i in range(40):
        angle = (math.tau / 40.0) * i
        width = 0.028 + (0.016 if i % 5 == 0 else 0.0)
        inner = CARD_HALF_HEIGHT - 0.2 + (0.08 if i % 2 == 0 else 0.0)
        outer = CAMERA_HALF_HEIGHT + (0.38 if i % 7 == 0 else 0.0)
        mat = mat_cyan if i % 9 == 0 else mat_red
        a1 = angle - width
        a2 = angle + width
        verts = [
            (math.cos(a1) * inner * 0.76, math.sin(a1) * inner, -0.08),
            (math.cos(angle) * outer * 0.76, math.sin(angle) * outer, -0.08),
            (math.cos(a2) * inner * 0.76, math.sin(a2) * inner, -0.08),
        ]
        add_poly(f"burst_ray_{i:02}", verts, mat)


def add_corner_plates(mat_gold: bpy.types.Material, mat_shadow: bpy.types.Material) -> None:
    corners = [
        (-CARD_HALF_WIDTH, CARD_HALF_HEIGHT, -1, 1),
        (CARD_HALF_WIDTH, CARD_HALF_HEIGHT, 1, 1),
        (-CARD_HALF_WIDTH, -CARD_HALF_HEIGHT, -1, -1),
        (CARD_HALF_WIDTH, -CARD_HALF_HEIGHT, 1, -1),
    ]
    for idx, (cx, cy, sx, sy) in enumerate(corners):
        w = 0.72
        h = 0.58
        add_quad(f"corner_shadow_{idx}", cx - sx * 0.06 - sx * w, cy - sy * 0.06 - sy * h, cx - sx * 0.06, cy - sy * 0.06, 0.06, mat_shadow)
        verts = [
            (cx, cy - sy * h, 0.16),
            (cx - sx * w, cy, 0.16),
            (cx - sx * 0.38, cy - sy * 0.1, 0.16),
            (cx - sx * 0.1, cy - sy * 0.38, 0.16),
        ]
        add_poly(f"corner_plate_{idx}", verts, mat_gold)


def build_frame() -> None:
    clear_scene()

    mat_shadow = make_mat("transparent smoked frame shadow", (0.0, 0.0, 0.0, 0.72), 0.0)
    mat_outer = make_mat("charged black card rim", (0.01, 0.012, 0.02, 0.86), 0.0)
    mat_red = make_mat("gold aura burst", (1.0, 0.74, 0.05, 0.54), 0.85)
    mat_gold = make_mat("rarity gold bevel shards", (1.0, 0.84, 0.2, 0.86), 0.55)
    mat_cyan = make_mat("blue electric arc flash", (0.02, 0.88, 1.0, 0.48), 1.1)

    outer = (-CARD_HALF_WIDTH, -CARD_HALF_HEIGHT, CARD_HALF_WIDTH, CARD_HALF_HEIGHT)
    shadow = (
        -CARD_HALF_WIDTH - 0.28,
        -CARD_HALF_HEIGHT - 0.28,
        CARD_HALF_WIDTH + 0.28,
        CARD_HALF_HEIGHT + 0.28,
    )
    outer_inner = (
        -CARD_HALF_WIDTH + 0.33,
        -CARD_HALF_HEIGHT + 0.33,
        CARD_HALF_WIDTH - 0.33,
        CARD_HALF_HEIGHT - 0.33,
    )
    gold_outer = (
        -CARD_HALF_WIDTH + 0.18,
        -CARD_HALF_HEIGHT + 0.18,
        CARD_HALF_WIDTH - 0.18,
        CARD_HALF_HEIGHT - 0.18,
    )
    gold_inner = (
        -CARD_HALF_WIDTH + 0.36,
        -CARD_HALF_HEIGHT + 0.36,
        CARD_HALF_WIDTH - 0.36,
        CARD_HALF_HEIGHT - 0.36,
    )
    cyan_outer = (
        -CARD_HALF_WIDTH + 0.42,
        -CARD_HALF_HEIGHT + 0.42,
        CARD_HALF_WIDTH - 0.42,
        CARD_HALF_HEIGHT - 0.42,
    )
    cyan_inner = (
        -CARD_HALF_WIDTH + 0.5,
        -CARD_HALF_HEIGHT + 0.5,
        CARD_HALF_WIDTH - 0.5,
        CARD_HALF_HEIGHT - 0.5,
    )

    add_burst_rays(mat_red, mat_cyan)
    add_ring("drop_shadow", shadow, outer_inner, -0.02, mat_shadow)
    add_ring("outer_energy_rim", outer, outer_inner, 0.02, mat_outer)
    add_ring("charged_gold", gold_outer, gold_inner, 0.08, mat_red)
    add_ring("cyan_inner_edge", cyan_outer, cyan_inner, 0.12, mat_cyan)
    add_corner_plates(mat_gold, mat_shadow)

    camera_data = bpy.data.cameras.new("CardFrameCamera")
    camera = bpy.data.objects.new("CardFrameCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.0, 0.0, 10.0)
    camera.rotation_euler = (0.0, 0.0, 0.0)
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = CAMERA_ORTHO_SCALE
    bpy.context.scene.camera = camera

    available_engines = {item.identifier for item in bpy.context.scene.render.bl_rna.properties["engine"].enum_items}
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in available_engines else "BLENDER_EEVEE"
    if hasattr(bpy.context.scene, "eevee") and hasattr(bpy.context.scene.eevee, "taa_render_samples"):
        bpy.context.scene.eevee.taa_render_samples = 64
    bpy.context.scene.render.film_transparent = True
    bpy.context.scene.render.resolution_x = RENDER_WIDTH
    bpy.context.scene.render.resolution_y = RENDER_HEIGHT
    bpy.context.scene.render.resolution_percentage = 100
    bpy.context.scene.view_settings.view_transform = "Standard"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.image_settings.color_mode = "RGBA"
    bpy.context.scene.render.filepath = str(FRAME_PNG)

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_FILE))
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    build_frame()
