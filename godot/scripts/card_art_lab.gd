extends Control

const CARD_SIZE := Vector2(1024.0, 1536.0)
const FRAME_BLEED := Vector2(48.0, 48.0)
const FRAME_TEXTURE_SIZE := Vector2(1120.0, 1632.0)
const FRAME_OVERLAY_PATH := ""
const TEMPLATE_OVERLAY_PATHS: Dictionary = {
	"N": "res://art/exports/card-frame/battle_card_template_n_overlay.png",
	"R": "res://art/exports/card-frame/battle_card_template_r_overlay.png",
	"SR": "res://art/exports/card-frame/battle_card_template_sr_overlay.png",
	"SSR": "res://art/exports/card-frame/battle_card_template_ssr_overlay.png",
	"UR": "res://art/exports/card-frame/battle_card_template_ur_overlay.png"
}
const SOURCE_IMAGE_CANDIDATES: Array[String] = [
	"res://art/source/generated-card-art/latest.png",
	"res://art/source/generated-card-art/latest.jpg",
	"res://art/source/generated-card-art/latest.jpeg",
	"res://art/source/generated-card-art/latest.webp",
	"res://art/source/source-photo-test/user-img-5027.jpg",
	"res://art/source/source-photo-test/current.png",
	"res://art/source/source-photo-test/current.jpg",
	"res://art/source/source-photo-test/current.jpeg",
	"res://art/source/source-photo-test/current.webp"
]
const UI_FONT_CANDIDATES: Array[String] = [
	"/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
	"/System/Library/Fonts/Hiragino Sans GB.ttc",
	"/System/Library/Fonts/STHeiti Medium.ttc",
	"/System/Library/Fonts/Supplemental/Songti.ttc"
]

@export_enum("N", "R", "SR", "SSR", "UR") var rarity: String = "UR"

var _font: Font
var _frame_overlay: Texture2D
var _template_overlay: Texture2D
var _source_texture: Texture2D
var _source_label: String = "waiting for source photo"


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_font = _load_ui_font()
	_frame_overlay = _load_texture_resource(FRAME_OVERLAY_PATH)
	_template_overlay = _load_texture_resource(_template_overlay_path())
	_source_texture = _load_first_source_photo()
	queue_redraw()


func _draw() -> void:
	var stage_rect: Rect2 = Rect2(Vector2.ZERO, size)
	draw_rect(stage_rect, Color(0.006, 0.007, 0.012, 1.0))
	_draw_stage_backdrop(stage_rect)

	var scale_factor: float = min(size.x / FRAME_TEXTURE_SIZE.x, size.y / (FRAME_TEXTURE_SIZE.y + 28.0))
	var card_size: Vector2 = CARD_SIZE * scale_factor
	var card_rect: Rect2 = Rect2((size - card_size) * 0.5, card_size)
	var rarity_palette: Dictionary = _rarity_palette()

	_draw_card_shadow(card_rect, scale_factor)
	_draw_full_card_art(card_rect, scale_factor)
	if _template_overlay:
		draw_texture_rect(_template_overlay, card_rect, false)
	else:
		_draw_edge_burst(card_rect, scale_factor, rarity_palette)
		_draw_template_frame(card_rect, scale_factor, rarity_palette)

	if _frame_overlay:
		var frame_rect: Rect2 = Rect2(card_rect.position - FRAME_BLEED * scale_factor, FRAME_TEXTURE_SIZE * scale_factor)
		draw_texture_rect(_frame_overlay, frame_rect, false)
	_draw_battle_card_content(card_rect, scale_factor, rarity_palette)


func _draw_stage_backdrop(stage_rect: Rect2) -> void:
	for i in range(18):
		var t: float = float(i) / 17.0
		var y: float = stage_rect.position.y + stage_rect.size.y * t
		draw_rect(
			Rect2(stage_rect.position.x, y, stage_rect.size.x, stage_rect.size.y / 17.0 + 1.0),
			Color(0.005 + t * 0.013, 0.007 + t * 0.010, 0.014 + t * 0.022, 1.0)
		)
	for i in range(12):
		var x: float = 58.0 + float(i) * 92.0
		draw_line(Vector2(x, 0), Vector2(x - 310.0, size.y), Color(0.08, 0.24, 0.35, 0.14), 2.0)


func _draw_card_shadow(card_rect: Rect2, scale_factor: float) -> void:
	_draw_box(card_rect.grow(38.0 * scale_factor), Color(0.0, 0.0, 0.0, 0.66), Color.TRANSPARENT, 0.0, 28.0 * scale_factor)
	_draw_box(card_rect.grow(9.0 * scale_factor), Color(0.0, 0.0, 0.0, 0.42), Color.TRANSPARENT, 0.0, 16.0 * scale_factor)


func _draw_full_card_art(card_rect: Rect2, scale_factor: float) -> void:
	_draw_box(card_rect, Color(0.012, 0.015, 0.022, 1.0), Color(0.0, 0.0, 0.0, 1.0), 2.0 * scale_factor, 12.0 * scale_factor)
	var art_rect: Rect2 = _local_rect(card_rect, Rect2(40, 72, 944, 742), scale_factor)
	if _source_texture:
		_draw_texture_cover(_source_texture, art_rect, 1.03, Vector2(0.02, -0.03))
	else:
		_draw_photo_placeholder(art_rect, scale_factor)
	draw_rect(art_rect, Color(0.0, 0.0, 0.0, 0.03))


func _draw_vignette(card_rect: Rect2, scale_factor: float) -> void:
	draw_rect(Rect2(card_rect.position, Vector2(card_rect.size.x, 150.0 * scale_factor)), Color(0.0, 0.0, 0.0, 0.28))
	draw_rect(Rect2(card_rect.position + Vector2(0, 820.0) * scale_factor, Vector2(card_rect.size.x, 716.0 * scale_factor)), Color(0.0, 0.0, 0.0, 0.66))
	draw_rect(Rect2(card_rect.position, Vector2(78.0 * scale_factor, card_rect.size.y)), Color(0.0, 0.0, 0.0, 0.24))
	draw_rect(Rect2(card_rect.end - Vector2(78.0 * scale_factor, card_rect.size.y), Vector2(78.0 * scale_factor, card_rect.size.y)), Color(0.0, 0.0, 0.0, 0.24))


func _draw_edge_burst(card_rect: Rect2, scale_factor: float, palette: Dictionary) -> void:
	var primary: Color = palette.get("primary", Color(0.02, 0.86, 1.0, 1.0))
	var secondary: Color = palette.get("secondary", Color(1.0, 0.05, 0.92, 1.0))
	var tertiary: Color = palette.get("tertiary", Color(1.0, 0.92, 0.24, 1.0))
	var left_color: Color = secondary
	left_color.a = 0.16
	var right_color: Color = primary
	right_color.a = 0.14
	var star_color: Color = tertiary
	star_color.a = 0.34
	var left_origin: Vector2 = card_rect.position + Vector2(86, 538) * scale_factor
	var right_origin: Vector2 = card_rect.position + Vector2(940, 398) * scale_factor
	_draw_ray_fan(left_origin, -0.60, 0.34, 11, 520.0 * scale_factor, left_color, scale_factor)
	_draw_ray_fan(right_origin, 2.54, 3.56, 11, 500.0 * scale_factor, right_color, scale_factor)
	for i in range(10):
		var p: Vector2 = card_rect.position + Vector2(72 + _noise01(i * 4) * 850, 120 + _noise01(i * 4 + 1) * 650) * scale_factor
		_draw_star(p, (14.0 + 16.0 * _noise01(i * 4 + 2)) * scale_factor, star_color)


func _draw_template_frame(card_rect: Rect2, scale_factor: float, palette: Dictionary) -> void:
	var primary: Color = palette.get("primary", Color(0.02, 0.78, 1.0, 0.74))
	var tertiary: Color = palette.get("tertiary", Color(1.0, 0.86, 0.18, 0.84))
	var highlight: Color = palette.get("highlight", Color(0.0, 0.88, 1.0, 0.84))
	_draw_box(card_rect.grow(10.0 * scale_factor), Color.TRANSPARENT, primary, 5.0 * scale_factor, 0.0)
	_draw_box(card_rect.grow(-18.0 * scale_factor), Color.TRANSPARENT, tertiary, 4.0 * scale_factor, 0.0)
	_draw_box(card_rect.grow(-30.0 * scale_factor), Color.TRANSPARENT, highlight, 3.0 * scale_factor, 0.0)
	draw_line(card_rect.position + Vector2(28, 844) * scale_factor, card_rect.position + Vector2(996, 844) * scale_factor, tertiary.lightened(0.08), 5.0 * scale_factor)
	draw_line(card_rect.position + Vector2(28, 870) * scale_factor, card_rect.position + Vector2(996, 870) * scale_factor, primary.lightened(0.08), 4.0 * scale_factor)


func _draw_ray_fan(origin: Vector2, start_angle: float, end_angle: float, count: int, length: float, color: Color, scale_factor: float) -> void:
	for i in range(count):
		var t: float = 0.0 if count <= 1 else float(i) / float(count - 1)
		var angle: float = lerpf(start_angle, end_angle, t)
		var dir: Vector2 = Vector2(cos(angle), sin(angle))
		var normal: Vector2 = Vector2(-dir.y, dir.x)
		var width: float = (7.0 + 11.0 * _noise01(i + 17)) * scale_factor
		var start: Vector2 = origin + dir * (44.0 * scale_factor)
		var end: Vector2 = origin + dir * (length * (0.62 + 0.38 * _noise01(i + 31)))
		_draw_poly(PackedVector2Array([
			start - normal * width,
			end - normal * width * 0.12,
			end + normal * width * 0.12,
			start + normal * width
		]), color)


func _draw_battle_card_content(card_rect: Rect2, scale_factor: float, palette: Dictionary) -> void:
	_draw_top_badges(card_rect, scale_factor, palette)
	_draw_vertical_name(card_rect, scale_factor)
	_draw_bottom_hud(card_rect, scale_factor, palette)


func _draw_top_badges(card_rect: Rect2, scale_factor: float, palette: Dictionary) -> void:
	_draw_text_outline("街機霓虹勇者", card_rect.position + Vector2(76, 130) * scale_factor, 59.0 * scale_factor, Color(1.0, 1.0, 1.0, 1.0), Color(0.0, 0.0, 0.0, 1.0), 520.0 * scale_factor, 4.0 * scale_factor)

	var rarity_rect: Rect2 = _local_rect(card_rect, Rect2(760, 38, 224, 104), scale_factor)
	_draw_slanted_panel(rarity_rect, palette.get("badge_fill", Color(0.38, 0.16, 0.0, 0.96)), palette.get("badge_border", Color(1.0, 0.85, 0.18, 1.0)), 6.0 * scale_factor, 34.0 * scale_factor)
	_draw_slanted_panel(rarity_rect.grow(-12.0 * scale_factor), palette.get("badge_inner", Color(1.0, 0.60, 0.08, 0.28)), palette.get("badge_highlight", Color(1.0, 0.96, 0.55, 1.0)), 3.0 * scale_factor, 24.0 * scale_factor)
	var badge_font_size: float = 58.0 if rarity.length() >= 3 else 70.0
	var badge_x: float = 38.0 if rarity.length() >= 3 else 55.0
	_draw_text_outline(rarity, rarity_rect.position + Vector2(badge_x, 78) * scale_factor, badge_font_size * scale_factor, palette.get("badge_text", Color(1.0, 0.96, 0.72, 1.0)), palette.get("badge_shadow", Color(0.18, 0.06, 0.0, 1.0)), 168.0 * scale_factor, 4.0 * scale_factor)

	var type_center: Vector2 = card_rect.position + Vector2(896, 202) * scale_factor
	_draw_hex_badge(type_center, 76.0 * scale_factor, Color(0.0, 0.12, 0.23, 0.98), Color(0.02, 0.92, 1.0, 0.98))
	_draw_text_outline("AGI", type_center + Vector2(-46, 62) * scale_factor, 39.0 * scale_factor, Color(0.86, 1.0, 1.0, 1.0), Color(0.0, 0.0, 0.0, 1.0), 110.0 * scale_factor, 3.0 * scale_factor)


func _draw_vertical_name(card_rect: Rect2, scale_factor: float) -> void:
	pass


func _draw_bottom_hud(card_rect: Rect2, scale_factor: float, palette: Dictionary) -> void:
	_draw_template_stat_tiles(card_rect, scale_factor)
	_draw_template_level_row(card_rect, scale_factor)
	_draw_template_skill_rows(card_rect, scale_factor)


func _draw_title_plate(rect: Rect2, scale_factor: float) -> void:
	_draw_slanted_panel(rect, Color(0.02, 0.04, 0.025, 0.98), Color(0.10, 0.98, 0.50, 0.88), 2.0 * scale_factor, 18.0 * scale_factor)
	draw_rect(Rect2(rect.position + Vector2(18, rect.size.y - 10.0 * scale_factor), Vector2(rect.size.x - 36.0 * scale_factor, 4.0 * scale_factor)), Color(1.0, 0.82, 0.12, 0.90))
	_draw_text_outline("街機霓虹勇者", rect.position + Vector2(22, 40) * scale_factor, 34.0 * scale_factor, Color(1.0, 0.94, 0.34, 1.0), Color(0.0, 0.0, 0.0, 1.0), rect.size.x - 44.0 * scale_factor, 3.0 * scale_factor)


func _draw_template_stat_tiles(card_rect: Rect2, scale_factor: float) -> void:
	var gap: float = 17.0 * scale_factor
	var tile_y: float = card_rect.position.y + 846.0 * scale_factor
	var tile_w: float = 217.0 * scale_factor
	var x0: float = card_rect.position.x + 58.0 * scale_factor
	_draw_template_stat_value("HP", 18200, Rect2(x0, tile_y, tile_w, 92.0 * scale_factor), Color(0.12, 1.0, 0.24, 1.0), 0.73, scale_factor)
	_draw_template_stat_value("ATK", 15680, Rect2(x0 + (tile_w + gap), tile_y, tile_w, 92.0 * scale_factor), Color(1.0, 0.18, 0.12, 1.0), 0.63, scale_factor)
	_draw_template_stat_value("DEF", 10420, Rect2(x0 + (tile_w + gap) * 2.0, tile_y, tile_w, 92.0 * scale_factor), Color(0.06, 0.72, 1.0, 1.0), 0.42, scale_factor)
	_draw_template_stat_value("AGI", 22850, Rect2(x0 + (tile_w + gap) * 3.0, tile_y, tile_w, 92.0 * scale_factor), Color(0.94, 0.12, 1.0, 1.0), 0.91, scale_factor)


func _draw_template_stat_value(label: String, value: int, rect: Rect2, accent: Color, fill_ratio: float, scale_factor: float) -> void:
	_draw_text_outline(str(value), rect.position + Vector2(42, 44) * scale_factor, 35.0 * scale_factor, Color.WHITE, Color(0.0, 0.0, 0.0, 1.0), rect.size.x - 44.0 * scale_factor, 2.8 * scale_factor)
	var bar_rect: Rect2 = Rect2(rect.position + Vector2(9, 79) * scale_factor, Vector2(143.0, 13.0) * scale_factor)
	var fill_rect: Rect2 = Rect2(bar_rect.position, Vector2(bar_rect.size.x * clamp(fill_ratio, 0.0, 1.0), bar_rect.size.y))
	draw_rect(fill_rect, accent.lightened(0.25))


func _draw_template_level_row(card_rect: Rect2, scale_factor: float) -> void:
	_draw_text_outline("1 / 80", card_rect.position + Vector2(178, 1004) * scale_factor, 39.0 * scale_factor, Color.WHITE, Color(0.0, 0.0, 0.0, 1.0), 190.0 * scale_factor, 2.6 * scale_factor)
	var bar_rect: Rect2 = _local_rect(card_rect, Rect2(319, 980, 584, 15), scale_factor)
	draw_rect(Rect2(bar_rect.position, Vector2(40.0 * scale_factor, bar_rect.size.y)), Color(1.0, 0.90, 0.12, 1.0))


func _draw_template_skill_rows(card_rect: Rect2, scale_factor: float) -> void:
	_draw_text_outline("影子步伐", card_rect.position + Vector2(250, 1120) * scale_factor, 34.0 * scale_factor, Color.WHITE, Color(0.0, 0.0, 0.0, 1.0), 360.0 * scale_factor, 2.8 * scale_factor)
	_draw_text_outline("人物速度變快，更容易搶到有利位置。", card_rect.position + Vector2(251, 1169) * scale_factor, 24.0 * scale_factor, Color(0.94, 0.98, 1.0, 1.0), Color(0.0, 0.0, 0.0, 0.95), 670.0 * scale_factor, 1.8 * scale_factor)
	_draw_text_outline("怒吼狂奔", card_rect.position + Vector2(250, 1282) * scale_factor, 34.0 * scale_factor, Color.WHITE, Color(0.0, 0.0, 0.0, 1.0), 360.0 * scale_factor, 2.8 * scale_factor)
	_draw_text_outline("人物血量增加，但也更容易受傷。", card_rect.position + Vector2(251, 1331) * scale_factor, 24.0 * scale_factor, Color(0.94, 0.98, 1.0, 1.0), Color(0.0, 0.0, 0.0, 0.95), 670.0 * scale_factor, 1.8 * scale_factor)
	_draw_text_outline("霓虹燈下反應極快的街機玩家。", card_rect.position + Vector2(340, 1463) * scale_factor, 25.0 * scale_factor, Color(1.0, 1.0, 0.96, 1.0), Color(0.0, 0.0, 0.0, 0.95), 440.0 * scale_factor, 2.0 * scale_factor)


func _draw_stat_tiles(hud: Rect2, scale_factor: float) -> void:
	var gap: float = 18.0 * scale_factor
	var tile_y: float = hud.position.y + 16.0 * scale_factor
	var tile_w: float = (hud.size.x - 36.0 * scale_factor - gap * 3.0) / 4.0
	var tile_h: float = 126.0 * scale_factor
	var x0: float = hud.position.x + 18.0 * scale_factor
	_draw_stat_tile("HP", 18200, Rect2(x0, tile_y, tile_w, tile_h), Color(0.03, 0.85, 0.15, 1.0), scale_factor)
	_draw_stat_tile("ATK", 15680, Rect2(x0 + (tile_w + gap), tile_y, tile_w, tile_h), Color(1.0, 0.12, 0.06, 1.0), scale_factor)
	_draw_stat_tile("DEF", 10420, Rect2(x0 + (tile_w + gap) * 2.0, tile_y, tile_w, tile_h), Color(0.02, 0.55, 1.0, 1.0), scale_factor)
	_draw_stat_tile("AGI", 22850, Rect2(x0 + (tile_w + gap) * 3.0, tile_y, tile_w, tile_h), Color(0.80, 0.06, 1.0, 1.0), scale_factor)


func _draw_stat_tile(label: String, value: int, rect: Rect2, accent: Color, scale_factor: float) -> void:
	_draw_slanted_panel(rect, Color(0.012, 0.014, 0.020, 1.0), accent, 3.0 * scale_factor, 20.0 * scale_factor)
	_draw_slanted_panel(Rect2(rect.position + Vector2(6, 6) * scale_factor, rect.size - Vector2(12, 52) * scale_factor), accent.darkened(0.20), accent.lightened(0.08), 1.5 * scale_factor, 16.0 * scale_factor)
	_draw_text_outline(str(value), rect.position + Vector2(36, 56) * scale_factor, 38.0 * scale_factor, Color(1.0, 1.0, 1.0, 1.0), Color(0.0, 0.0, 0.0, 1.0), rect.size.x - 52.0 * scale_factor, 3.0 * scale_factor)
	_draw_text_outline(label, rect.position + Vector2(96, 92) * scale_factor, 29.0 * scale_factor, Color(1.0, 1.0, 1.0, 1.0), Color(0.0, 0.0, 0.0, 1.0), rect.size.x - 100.0 * scale_factor, 2.2 * scale_factor)
	var bar_rect: Rect2 = Rect2(rect.position + Vector2(14, rect.size.y - 30.0 * scale_factor), Vector2(rect.size.x - 28.0 * scale_factor, 18.0 * scale_factor))
	_draw_slanted_panel(bar_rect, Color(0.0, 0.0, 0.0, 0.82), Color(0.80, 0.94, 1.0, 0.42), 1.2 * scale_factor, 8.0 * scale_factor)
	var fill_rect: Rect2 = Rect2(bar_rect.position + Vector2(4, 4) * scale_factor, Vector2((bar_rect.size.x - 8.0 * scale_factor) * clamp(float(value) / 25000.0, 0.0, 1.0), bar_rect.size.y - 8.0 * scale_factor))
	draw_rect(fill_rect, accent.lightened(0.25))


func _draw_level_row(hud: Rect2, scale_factor: float) -> void:
	var rect: Rect2 = Rect2(hud.position + Vector2(22, 154) * scale_factor, Vector2(hud.size.x - 44.0 * scale_factor, 92.0 * scale_factor))
	_draw_slanted_panel(rect, Color(0.010, 0.014, 0.024, 0.98), Color(0.08, 0.55, 1.0, 0.88), 2.0 * scale_factor, 18.0 * scale_factor)
	_draw_text_outline("Lv.", rect.position + Vector2(26, 66) * scale_factor, 52.0 * scale_factor, Color(1.0, 0.72, 0.08, 1.0), Color(0.0, 0.0, 0.0, 1.0), 110.0 * scale_factor, 3.0 * scale_factor)
	_draw_text_outline("1 / 80", rect.position + Vector2(130, 66) * scale_factor, 42.0 * scale_factor, Color(1.0, 1.0, 1.0, 1.0), Color(0.0, 0.0, 0.0, 1.0), 180.0 * scale_factor, 3.0 * scale_factor)
	var bar_rect: Rect2 = Rect2(rect.position + Vector2(318, 34) * scale_factor, Vector2(rect.size.x - 350.0 * scale_factor, 22.0 * scale_factor))
	_draw_slanted_panel(bar_rect, Color(0.02, 0.028, 0.034, 1.0), Color(0.92, 0.96, 1.0, 0.82), 2.0 * scale_factor, 10.0 * scale_factor)
	draw_rect(Rect2(bar_rect.position + Vector2(8, 6) * scale_factor, Vector2(34.0 * scale_factor, 10.0 * scale_factor)), Color(1.0, 0.90, 0.18, 1.0))


func _draw_skill_rows(hud: Rect2, scale_factor: float) -> void:
	var row1: Rect2 = Rect2(hud.position + Vector2(22, 264) * scale_factor, Vector2(hud.size.x - 44.0 * scale_factor, 136.0 * scale_factor))
	var row2: Rect2 = Rect2(hud.position + Vector2(22, 420) * scale_factor, Vector2(hud.size.x - 44.0 * scale_factor, 136.0 * scale_factor))
	var desc: Rect2 = Rect2(hud.position + Vector2(22, 578) * scale_factor, Vector2(hud.size.x - 44.0 * scale_factor, 74.0 * scale_factor))
	_draw_skill_slot(row1, "影子步伐", "人物速度變快，更容易搶到有利位置。", Color(0.02, 0.84, 1.0, 1.0), scale_factor)
	_draw_skill_slot(row2, "怒吼狂奔", "人物血量增加，但也更容易受傷。", Color(1.0, 0.08, 0.92, 1.0), scale_factor)
	_draw_slanted_panel(desc, Color(0.0, 0.0, 0.0, 0.88), Color(0.02, 0.86, 1.0, 0.82), 2.0 * scale_factor, 16.0 * scale_factor)
	_draw_text_outline("霓虹燈下反應極快的街機玩家。", desc.position + Vector2(292, 50) * scale_factor, 25.0 * scale_factor, Color(1.0, 1.0, 0.96, 1.0), Color(0.0, 0.0, 0.0, 0.95), desc.size.x - 340.0 * scale_factor, 2.0 * scale_factor)


func _draw_skill_slot(rect: Rect2, title: String, desc: String, accent: Color, scale_factor: float) -> void:
	_draw_slanted_panel(rect, Color(0.010, 0.014, 0.026, 0.98), accent, 2.4 * scale_factor, 18.0 * scale_factor)
	var icon_rect: Rect2 = Rect2(rect.position + Vector2(16, 14) * scale_factor, Vector2(108, 108) * scale_factor)
	_draw_hex_badge(icon_rect.get_center(), 60.0 * scale_factor, Color(0.0, 0.06, 0.13, 1.0), accent)
	_draw_skill_icon(icon_rect, accent, scale_factor)
	var text_rect: Rect2 = Rect2(rect.position + Vector2(142, 18) * scale_factor, Vector2(rect.size.x - 160.0 * scale_factor, 100.0 * scale_factor))
	_draw_slanted_panel(Rect2(text_rect.position, Vector2(330.0 * scale_factor, 42.0 * scale_factor)), accent.darkened(0.15), accent.lightened(0.12), 1.5 * scale_factor, 14.0 * scale_factor)
	_draw_text_outline(title, text_rect.position + Vector2(22, 38) * scale_factor, 35.0 * scale_factor, Color(1.0, 1.0, 1.0, 1.0), Color(0.0, 0.0, 0.0, 1.0), text_rect.size.x - 44.0 * scale_factor, 2.6 * scale_factor)
	_draw_text_outline(desc, text_rect.position + Vector2(22, 82) * scale_factor, 24.0 * scale_factor, Color(0.94, 0.98, 1.0, 1.0), Color(0.0, 0.0, 0.0, 0.92), text_rect.size.x - 44.0 * scale_factor, 1.8 * scale_factor)


func _draw_skill_icon(rect: Rect2, accent: Color, scale_factor: float) -> void:
	var center: Vector2 = rect.get_center()
	draw_line(center + Vector2(-34, 22) * scale_factor, center + Vector2(34, -22) * scale_factor, accent.lightened(0.30), 8.0 * scale_factor)
	draw_circle(center + Vector2(-14, -8) * scale_factor, 13.0 * scale_factor, Color(0.92, 1.0, 1.0, 1.0))
	draw_line(center + Vector2(-4, 4) * scale_factor, center + Vector2(-26, 30) * scale_factor, accent.lightened(0.30), 7.0 * scale_factor)
	draw_line(center + Vector2(2, 8) * scale_factor, center + Vector2(24, 24) * scale_factor, accent.lightened(0.30), 7.0 * scale_factor)


func _draw_photo_placeholder(rect: Rect2, scale_factor: float) -> void:
	draw_rect(rect, Color(0.045, 0.055, 0.082, 1.0))
	for i in range(16):
		var t: float = float(i) / 15.0
		draw_rect(Rect2(rect.position.x, rect.position.y + rect.size.y * t, rect.size.x, rect.size.y / 15.0 + 1.0), Color(0.02 + t * 0.04, 0.05 + t * 0.03, 0.12 + t * 0.12, 1.0))
	_draw_text_outline("SOURCE PHOTO", rect.position + Vector2(94, 420) * scale_factor, 40.0 * scale_factor, Color(1.0, 0.94, 0.36, 1.0), Color(0.0, 0.0, 0.0, 1.0), rect.size.x - 188.0 * scale_factor, 3.0 * scale_factor)
	_draw_text(_source_label, rect.position + Vector2(94, 464) * scale_factor, 20.0 * scale_factor, Color(0.88, 0.92, 1.0, 1.0), rect.size.x - 188.0 * scale_factor)


func _draw_slanted_panel(rect: Rect2, fill: Color, border: Color, border_width: float, cut: float) -> void:
	var points: PackedVector2Array = PackedVector2Array([
		rect.position + Vector2(cut, 0),
		rect.position + Vector2(rect.size.x, 0),
		rect.position + Vector2(rect.size.x - cut, rect.size.y),
		rect.position + Vector2(0, rect.size.y),
	])
	_draw_poly(points, fill)
	if border_width > 0.0:
		draw_polyline(points + PackedVector2Array([points[0]]), border, border_width)


func _draw_hex_badge(center: Vector2, radius: float, fill: Color, border: Color) -> void:
	var points: PackedVector2Array = PackedVector2Array()
	for i in range(6):
		var angle: float = PI / 6.0 + float(i) * TAU / 6.0
		points.append(center + Vector2(cos(angle), sin(angle)) * radius)
	_draw_poly(points, fill)
	draw_polyline(points + PackedVector2Array([points[0]]), border, radius * 0.08)


func _draw_star(center: Vector2, radius: float, color: Color) -> void:
	var points: PackedVector2Array = PackedVector2Array()
	for i in range(10):
		var r: float = radius if i % 2 == 0 else radius * 0.42
		var angle: float = -PI / 2.0 + float(i) * TAU / 10.0
		points.append(center + Vector2(cos(angle), sin(angle)) * r)
	_draw_poly(points, color)


func _draw_poly(points: PackedVector2Array, color: Color) -> void:
	var colors: PackedColorArray = PackedColorArray()
	for _i in range(points.size()):
		colors.append(color)
	draw_polygon(points, colors)


func _draw_vertical_text_outline(text: String, position: Vector2, width: float, font_size: float, color: Color, outline: Color, outline_size: float) -> void:
	if not _font:
		return
	var y: float = position.y + font_size
	for i in range(text.length()):
		var ch: String = text.substr(i, 1)
		for ox in [-outline_size, 0.0, outline_size]:
			for oy in [-outline_size, 0.0, outline_size]:
				if ox == 0.0 and oy == 0.0:
					continue
				draw_string(_font, Vector2(position.x + ox, y + oy), ch, HORIZONTAL_ALIGNMENT_CENTER, width, int(round(font_size)), outline)
		draw_string(_font, Vector2(position.x, y), ch, HORIZONTAL_ALIGNMENT_CENTER, width, int(round(font_size)), color)
		y += font_size * 1.08


func _draw_text_outline(text: String, position: Vector2, font_size: float, color: Color, outline: Color, width: float, outline_size: float) -> void:
	if not _font:
		return
	for ox in [-outline_size, 0.0, outline_size]:
		for oy in [-outline_size, 0.0, outline_size]:
			if ox == 0.0 and oy == 0.0:
				continue
			draw_string(_font, Vector2(position.x + ox, position.y + oy), text, HORIZONTAL_ALIGNMENT_LEFT, width, int(round(font_size)), outline)
	draw_string(_font, position, text, HORIZONTAL_ALIGNMENT_LEFT, width, int(round(font_size)), color)


func _draw_texture_cover(texture: Texture2D, target: Rect2, zoom: float, center_bias: Vector2) -> void:
	var texture_size: Vector2 = texture.get_size()
	if texture_size.x <= 0.0 or texture_size.y <= 0.0:
		return
	var cover_scale: float = max(target.size.x / texture_size.x, target.size.y / texture_size.y) * max(zoom, 1.0)
	var source_size: Vector2 = target.size / cover_scale
	var source_position: Vector2 = (texture_size - source_size) * 0.5 + texture_size * center_bias
	source_position.x = clamp(source_position.x, 0.0, max(texture_size.x - source_size.x, 0.0))
	source_position.y = clamp(source_position.y, 0.0, max(texture_size.y - source_size.y, 0.0))
	draw_texture_rect_region(texture, target, Rect2(source_position, source_size))


func _local_rect(card_rect: Rect2, rect: Rect2, scale_factor: float) -> Rect2:
	return Rect2(card_rect.position + rect.position * scale_factor, rect.size * scale_factor)


func _draw_box(rect: Rect2, fill: Color, border: Color, border_width: float, radius: float) -> void:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(int(round(border_width)))
	style.set_corner_radius_all(int(round(radius)))
	draw_style_box(style, rect)


func _draw_text(text: String, position: Vector2, font_size: float, color: Color, width: float) -> void:
	if not _font:
		return
	draw_string(_font, position, text, HORIZONTAL_ALIGNMENT_LEFT, width, int(round(font_size)), color)


func _template_overlay_path() -> String:
	return String(TEMPLATE_OVERLAY_PATHS.get(rarity, TEMPLATE_OVERLAY_PATHS.get("UR", "")))


func _rarity_palette() -> Dictionary:
	match rarity:
		"N":
			return {
				"primary": Color(0.72, 0.38, 0.16, 0.80),
				"secondary": Color(0.98, 0.54, 0.24, 0.70),
				"tertiary": Color(1.0, 0.72, 0.36, 0.84),
				"highlight": Color(0.94, 0.48, 0.22, 0.84),
				"badge_fill": Color(0.22, 0.10, 0.04, 0.96),
				"badge_border": Color(0.95, 0.60, 0.32, 1.0),
				"badge_inner": Color(0.92, 0.43, 0.16, 0.28),
				"badge_highlight": Color(1.0, 0.78, 0.48, 1.0),
				"badge_text": Color(1.0, 0.82, 0.58, 1.0),
				"badge_shadow": Color(0.10, 0.03, 0.0, 1.0)
			}
		"R":
			return {
				"primary": Color(0.78, 0.84, 0.90, 0.80),
				"secondary": Color(0.52, 0.60, 0.70, 0.70),
				"tertiary": Color(0.94, 0.97, 1.0, 0.84),
				"highlight": Color(0.66, 0.76, 0.90, 0.84),
				"badge_fill": Color(0.12, 0.15, 0.20, 0.96),
				"badge_border": Color(0.88, 0.94, 1.0, 1.0),
				"badge_inner": Color(0.72, 0.82, 0.94, 0.26),
				"badge_highlight": Color(1.0, 1.0, 1.0, 1.0),
				"badge_text": Color(0.96, 0.99, 1.0, 1.0),
				"badge_shadow": Color(0.02, 0.04, 0.08, 1.0)
			}
		"SR":
			return {
				"primary": Color(1.0, 0.74, 0.12, 0.84),
				"secondary": Color(1.0, 0.46, 0.04, 0.70),
				"tertiary": Color(1.0, 0.93, 0.32, 0.88),
				"highlight": Color(1.0, 0.66, 0.08, 0.86),
				"badge_fill": Color(0.34, 0.14, 0.0, 0.96),
				"badge_border": Color(1.0, 0.82, 0.16, 1.0),
				"badge_inner": Color(1.0, 0.58, 0.06, 0.30),
				"badge_highlight": Color(1.0, 0.97, 0.52, 1.0),
				"badge_text": Color(1.0, 0.96, 0.70, 1.0),
				"badge_shadow": Color(0.16, 0.05, 0.0, 1.0)
			}
		"SSR":
			return {
				"primary": Color(0.78, 0.18, 1.0, 0.84),
				"secondary": Color(1.0, 0.08, 0.86, 0.74),
				"tertiary": Color(0.93, 0.76, 1.0, 0.88),
				"highlight": Color(0.54, 0.16, 1.0, 0.86),
				"badge_fill": Color(0.16, 0.02, 0.28, 0.96),
				"badge_border": Color(0.92, 0.38, 1.0, 1.0),
				"badge_inner": Color(0.76, 0.18, 1.0, 0.32),
				"badge_highlight": Color(1.0, 0.72, 1.0, 1.0),
				"badge_text": Color(1.0, 0.90, 1.0, 1.0),
				"badge_shadow": Color(0.06, 0.0, 0.12, 1.0)
			}
	return {
		"primary": Color(0.02, 0.78, 1.0, 0.74),
		"secondary": Color(1.0, 0.07, 0.90, 0.76),
		"tertiary": Color(1.0, 0.86, 0.18, 0.84),
		"highlight": Color(0.0, 0.88, 1.0, 0.84),
		"badge_fill": Color(0.38, 0.16, 0.0, 0.96),
		"badge_border": Color(1.0, 0.85, 0.18, 1.0),
		"badge_inner": Color(1.0, 0.60, 0.08, 0.28),
		"badge_highlight": Color(1.0, 0.96, 0.55, 1.0),
		"badge_text": Color(1.0, 0.96, 0.72, 1.0),
		"badge_shadow": Color(0.18, 0.06, 0.0, 1.0)
	}


func _noise01(value: int) -> float:
	return fposmod(sin(float(value) * 12.9898 + 78.233) * 43758.5453, 1.0)


func _load_texture_resource(path: String) -> Texture2D:
	if not FileAccess.file_exists(path):
		return null
	var image: Image = Image.new()
	var error: Error = image.load(path)
	if error != OK:
		return null
	return ImageTexture.create_from_image(image)


func _load_first_source_photo() -> Texture2D:
	for path in SOURCE_IMAGE_CANDIDATES:
		if not FileAccess.file_exists(path):
			continue
		var image: Image = Image.new()
		var error: Error = image.load(path)
		if error == OK:
			_source_label = path.get_file()
			return ImageTexture.create_from_image(image)
		_source_label = "failed to load %s" % path.get_file()
	return null


func _load_ui_font() -> Font:
	for path in UI_FONT_CANDIDATES:
		if not FileAccess.file_exists(path):
			continue
		var font_file: FontFile = FontFile.new()
		var error: Error = font_file.load_dynamic_font(path)
		if error == OK:
			return font_file
	return get_theme_default_font()
