extends SceneTree

const SCENE_PATH := "res://scenes/battle_card_face_lab.tscn"
const OUTPUT_PATH := "res://art/exports/card-face/card_art_lab_latest.png"
const OUTPUT_SIZE := Vector2i(1080, 1920)


func _initialize() -> void:
	root.size = OUTPUT_SIZE
	var packed_scene: PackedScene = load(SCENE_PATH) as PackedScene
	if not packed_scene:
		push_error("Unable to load %s" % SCENE_PATH)
		quit(1)
		return
	var scene: Node = packed_scene.instantiate()
	root.add_child(scene)
	_render.call_deferred()


func _render() -> void:
	for _i in range(8):
		await process_frame
	var output_dir: String = ProjectSettings.globalize_path("res://art/exports/card-face")
	DirAccess.make_dir_recursive_absolute(output_dir)
	var image: Image = root.get_texture().get_image()
	var error: Error = image.save_png(OUTPUT_PATH)
	if error != OK:
		push_error("Unable to save %s: %s" % [OUTPUT_PATH, error])
		quit(1)
		return
	print("Saved card face render: %s" % ProjectSettings.globalize_path(OUTPUT_PATH))
	quit(0)
