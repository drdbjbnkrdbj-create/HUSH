/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

export interface GodotFileEntry {
  path: string;
  category: 'config' | 'scripts' | 'scenes' | 'docs' | 'vscode';
  content: string;
}

export const GODOT_PROJECT_FILES: GodotFileEntry[] = [
  // 1. project.godot
  {
    path: 'project.godot',
    category: 'config',
    content: `; Engine configuration file for HUSH! - Offline 3D Co-op Horror Game Foundation
; Compatible with Godot 4.2+ and 4.3+ for Android

config_version=5

[application]

config/name="HUSH! - 3D Stealth Horror"
config/description="3D stealth horror game set in a supermarket at night with real-time microphone noise detection and guard AI."
run/main_scene="res://scenes/main_menu.tscn"
config/features=PackedStringArray("4.3", "Mobile")
boot_splash/bg_color=Color(0.0196, 0.0275, 0.0588, 1)

[autoload]

NoiseManager="*res://scripts/noise_manager.gd"
GameManager="*res://scripts/game_manager.gd"
MicInput="*res://scripts/mic_input.gd"

[display]

window/size/viewport_width=1280
window/size/viewport_height=720
window/size/mode=3
window/stretch/mode="canvas_items"
window/stretch/aspect="expand"
window/handheld/orientation=6

[rendering]

renderer/rendering_method="mobile"
textures/vram_compression/import_etc2_astc=true
environment/defaults/default_clear_color=Color(0.0196, 0.0275, 0.0588, 1)
anti_aliasing/quality/msaa_3d=1

[audio]

buses/default_bus_layout="res://default_bus_layout.tres"
driver/enable_input=true
`,
  },

  // 2. default_bus_layout.tres
  {
    path: 'default_bus_layout.tres',
    category: 'config',
    content: `[gd_resource type="AudioBusLayout" load_steps=2 format=3 uid="uid://c87123buslayout"]

[sub_resource type="AudioEffectRecord" id="AudioEffectRecord_1"]
resource_name = "Record"

[resource]
bus/1/name = &"Record"
bus/1/solo = false
bus/1/mute = true
bus/1/bypass_fx = false
bus/1/volume_db = 0.0
bus/1/send = &"Master"
bus/1/effect/0/effect = SubResource("AudioEffectRecord_1")
bus/1/effect/0/enabled = true
`,
  },

  // 3. export_presets.cfg
  {
    path: 'export_presets.cfg',
    category: 'config',
    content: `[preset.0]

name="Android"
platform="Android"
runnable=true
advanced_options=false
dedicated_server=false
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="./builds/hush_android.apk"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.0.options]

custom_template/debug=""
custom_template/release=""
gradle_build/use_gradle_build=false
architectures/arm64-v8a=true
architectures/armeabi-v7a=false
architectures/x86_64=false
package/unique_name="com.gamecraft.hush"
package/name="HUSH!"
package/signed=false
version/code=1
version/name="1.0.0"
package/orientation=1
permissions/record_audio=true
permissions/modify_audio_settings=true
permissions/internet=false
permissions/access_network_state=false
`,
  },

  // 4. scripts/noise_manager.gd
  {
    path: 'scripts/noise_manager.gd',
    category: 'scripts',
    content: `extends Node

# Global NoiseManager singleton
# Accepts noise events and informs listeners (Guard AI) within spatial radius.

signal noise_emitted(pos: Vector3, intensity: float, type: String, radius: float)

class NoiseEvent:
	var position: Vector3
	var intensity: float
	var type: String
	var radius: float
	var timestamp: float

var recent_events: Array[NoiseEvent] = []

func emit_noise(world_pos: Vector3, noise_type: String, intensity: float = 1.0) -> void:
	var base_radius: float = 12.0
	match noise_type:
		"mic":
			base_radius = 28.0
		"walk":
			base_radius = 6.0
		"sprint":
			base_radius = 16.0
		"drop":
			base_radius = 20.0
		"interact":
			base_radius = 10.0
		"door":
			base_radius = 24.0

	var effective_radius = base_radius * clamp(intensity, 0.2, 2.0)
	var event = NoiseEvent.new()
	event.position = world_pos
	event.intensity = intensity
	event.type = noise_type
	event.radius = effective_radius
	event.timestamp = Time.get_ticks_msec() / 1000.0

	recent_events.append(event)
	noise_emitted.emit(world_pos, intensity, noise_type, effective_radius)

func _process(_delta: float) -> void:
	var current_time = Time.get_ticks_msec() / 1000.0
	recent_events = recent_events.filter(func(e): return (current_time - e.timestamp) < 2.0)
`,
  },

  // 5. scripts/mic_input.gd
  {
    path: 'scripts/mic_input.gd',
    category: 'scripts',
    content: `extends Node

# Microphone input capture and amplitude meter for Godot 4.x Android
# Uses AudioServer Record effect locally. No audio is ever recorded or uploaded.

signal amplitude_changed(current: float, peak: float, category: String)
signal noise_triggered(intensity: float, category: String)

var effect_record: AudioEffectRecord
var record_bus_index: int = -1

var is_mic_active: boolean = false
var smoothed_amplitude: float = 0.0
var peak_amplitude: float = 0.0
var smoothing: float = 0.25

# Thresholds
var whisper_thresh: float = 0.15
var normal_thresh: float = 0.35
var shout_thresh: float = 0.65
var min_duration_sec: float = 0.12

var sustained_time: float = 0.0
var has_triggered_for_sound: boolean = false

func _ready() -> void:
	record_bus_index = AudioServer.get_bus_index("Record")
	if record_bus_index != -1:
		for i in range(AudioServer.get_bus_effect_count(record_bus_index)):
			var eff = AudioServer.get_bus_effect(record_bus_index, i)
			if eff is AudioEffectRecord:
				effect_record = eff
				break

	request_android_microphone_permission()

func request_android_microphone_permission() -> void:
	if OS.get_name() == "Android":
		var perms = OS.get_granted_permissions()
		if not perms.has("android.permission.RECORD_AUDIO"):
			OS.request_permissions()

func start_capture() -> void:
	if effect_record and not is_mic_active:
		effect_record.set_recording_active(true)
		is_mic_active = true

func stop_capture() -> void:
	if effect_record and is_mic_active:
		effect_record.set_recording_active(false)
		is_mic_active = false

func _process(delta: float) -> void:
	if not is_mic_active or record_bus_index == -1:
		return

	# Retrieve audio peak magnitude from bus
	var peak_lr = AudioServer.get_bus_peak_volume_left_db(record_bus_index, 0)
	var linear_vol = db_to_linear(peak_lr) * 2.5
	var raw_amp = clamp(linear_vol, 0.0, 1.0)

	smoothed_amplitude = lerp(smoothed_amplitude, raw_amp, smoothing)
	if smoothed_amplitude > peak_amplitude:
		peak_amplitude = smoothed_amplitude
	else:
		peak_amplitude = max(0.0, peak_amplitude - delta * 0.4)

	var category = "silent"
	if smoothed_amplitude >= shout_thresh:
		category = "shout"
	elif smoothed_amplitude >= normal_thresh:
		category = "normal"
	elif smoothed_amplitude >= whisper_thresh:
		category = "whisper"

	amplitude_changed.emit(smoothed_amplitude, peak_amplitude, category)

	if smoothed_amplitude >= whisper_thresh:
		sustained_time += delta
		if sustained_time >= min_duration_sec and not has_triggered_for_sound:
			has_triggered_for_sound = true
			noise_triggered.emit(smoothed_amplitude, category)
	else:
		sustained_time = 0.0
		has_triggered_for_sound = false
`,
  },

  // 6. scripts/player.gd
  {
    path: 'scripts/player.gd',
    category: 'scripts',
    content: `extends CharacterBody3D

# First-person player controller for HUSH!
# Supports Android virtual joystick and touch camera, plus desktop WASD + mouse.

@export var walk_speed: float = 3.2
@export var sprint_speed: float = 5.5
@export var crouch_speed: float = 1.6

@export var standing_height: float = 1.7
@export var crouching_height: float = 0.9

@onready var camera: Camera3D = $Camera3D
@onready var flashlight: SpotLight3D = $Camera3D/Flashlight
@onready var interaction_ray: RayCast3D = $Camera3D/InteractionRay

var is_crouching: boolean = false
var is_sprinting: boolean = false
var stamina: float = 100.0
var max_stamina: float = 100.0
var is_exhausted: boolean = false

# Touch input deltas
var touch_look_delta: Vector2 = Vector2.ZERO
var virtual_move_vector: Vector2 = Vector2.ZERO

var mouse_sensitivity: float = 0.0025
var distance_traveled: float = 0.0

func _ready() -> void:
	MicInput.noise_triggered.connect(_on_mic_noise)
	if OS.get_name() != "Android":
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * mouse_sensitivity)
		camera.rotate_x(-event.relative.y * mouse_sensitivity)
		camera.rotation.x = clamp(camera.rotation.x, deg_to_rad(-80), deg_to_rad(80))

	if event.is_action_pressed("toggle_flashlight"):
		flashlight.visible = not flashlight.visible

	if event.is_action_pressed("interact"):
		try_interact()

func _physics_process(delta: float) -> void:
	# Look input from touch drag
	if touch_look_delta != Vector2.ZERO:
		rotate_y(-touch_look_delta.x * mouse_sensitivity)
		camera.rotate_x(-touch_look_delta.y * mouse_sensitivity)
		camera.rotation.x = clamp(camera.rotation.x, deg_to_rad(-80), deg_to_rad(80))
		touch_look_delta = Vector2.ZERO

	# Sprint / Crouch toggles
	var sprint_input = Input.is_action_pressed("sprint")
	var crouch_input = Input.is_action_pressed("crouch")

	is_crouching = crouch_input
	var target_h = crouching_height if is_crouching else standing_height
	camera.position.y = lerp(camera.position.y, target_h, delta * 10.0)

	if sprint_input and not is_crouching and not is_exhausted and velocity.length() > 0.5:
		is_sprinting = true
		stamina = max(0.0, stamina - delta * 25.0)
		if stamina <= 0:
			is_exhausted = true
			is_sprinting = false
	else:
		is_sprinting = false
		stamina = min(max_stamina, stamina + delta * 15.0)
		if is_exhausted and stamina >= 25.0:
			is_exhausted = false

	var current_speed = crouch_speed if is_crouching else (sprint_speed if is_sprinting else walk_speed)

	# Movement vector from keyboard or virtual joystick
	var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	if virtual_move_vector != Vector2.ZERO:
		input_dir = virtual_move_vector

	var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	if direction:
		velocity.x = direction.x * current_speed
		velocity.z = direction.z * current_speed

		distance_traveled += velocity.length() * delta
		var step_stride = 1.3 if is_sprinting else (2.0 if is_crouching else 1.7)
		if distance_traveled >= step_stride:
			distance_traveled = 0.0
			var intensity = 0.9 if is_sprinting else (0.15 if is_crouching else 0.45)
			var type = "sprint" if is_sprinting else "walk"
			NoiseManager.emit_noise(global_position, type, intensity)
	else:
		velocity.x = move_toward(velocity.x, 0, current_speed)
		velocity.z = move_toward(velocity.z, 0, current_speed)

	move_and_slide()

func _on_mic_noise(intensity: float, _category: String) -> void:
	NoiseManager.emit_noise(global_position, "mic", intensity)

func try_interact() -> void:
	if interaction_ray.is_colliding():
		var col = interaction_ray.get_collider()
		if col and col.has_method("interact"):
			col.interact(self)
`,
  },

  // 7. scripts/guard_ai.gd
  {
    path: 'scripts/guard_ai.gd',
    category: 'scripts',
    content: `extends CharacterBody3D

# Finite State Machine for Supermarket Security Guard AI
# States: PATROL, INVESTIGATE, SEARCH, CHASE, CAPTURE, RETURN

enum State { PATROL, INVESTIGATE, SEARCH, CHASE, CAPTURE, RETURN }

@export var patrol_speed: float = 2.0
@export var investigate_speed: float = 2.8
@export var chase_speed: float = 3.9

@export var vision_distance: float = 14.0
@export var vision_fov_deg: float = 80.0
@export var capture_distance: float = 1.6

@export var waypoints: Array[NodePath] = []
var waypoint_nodes: Array[Node3D] = []
var current_wp_idx: int = 0

var current_state: State = State.PATROL
var target_pos: Vector3 = Vector3.ZERO
var search_timer: float = 0.0
var search_duration: float = 4.5

@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D
@onready var vision_ray: RayCast3D = $VisionRay
@onready var flashlight: SpotLight3D = $Flashlight
@onready var player_node: Node3D = null

func _ready() -> void:
	NoiseManager.noise_emitted.connect(_on_noise_heard)
	for wp_path in waypoints:
		var node = get_node_or_null(wp_path)
		if node is Node3D:
			waypoint_nodes.append(node)

	player_node = get_tree().get_first_node_in_group("player")
	if waypoint_nodes.size() > 0:
		target_pos = waypoint_nodes[0].global_position

func _on_noise_heard(noise_pos: Vector3, _intensity: float, _type: String, radius: float) -> void:
	if current_state == State.CHASE or current_state == State.CAPTURE:
		return

	if global_position.distance_to(noise_pos) <= radius:
		target_pos = noise_pos
		current_state = State.INVESTIGATE

func _physics_process(delta: float) -> void:
	if current_state == State.CAPTURE:
		return

	var has_visual = check_vision_line_of_sight()
	if has_visual:
		current_state = State.CHASE
		target_pos = player_node.global_position
	elif current_state == State.CHASE:
		current_state = State.SEARCH
		search_timer = 0.0

	var move_speed: float = 0.0
	match current_state:
		State.PATROL:
			flashlight.light_color = Color(1.0, 0.95, 0.7)
			move_speed = patrol_speed
			if global_position.distance_to(target_pos) < 1.3:
				current_wp_idx = (current_wp_idx + 1) % waypoint_nodes.size()
				target_pos = waypoint_nodes[current_wp_idx].global_position

		State.INVESTIGATE:
			flashlight.light_color = Color(1.0, 0.85, 0.4)
			move_speed = investigate_speed
			if global_position.distance_to(target_pos) < 1.4:
				current_state = State.SEARCH
				search_timer = 0.0

		State.SEARCH:
			move_speed = 0.0
			search_timer += delta
			rotation.y += sin(search_timer * 2.5) * delta * 2.0
			if search_timer >= search_duration:
				current_state = State.RETURN
				find_nearest_waypoint()

		State.CHASE:
			flashlight.light_color = Color(1.0, 0.2, 0.2)
			move_speed = chase_speed
			if global_position.distance_to(player_node.global_position) <= capture_distance:
				current_state = State.CAPTURE
				GameManager.trigger_game_over()
				return

		State.RETURN:
			flashlight.light_color = Color(1.0, 0.95, 0.7)
			move_speed = patrol_speed
			if global_position.distance_to(target_pos) < 1.3:
				current_state = State.PATROL

	if move_speed > 0:
		nav_agent.target_position = target_pos
		var next_path_pos = nav_agent.get_next_path_position()
		var dir = (next_path_pos - global_position).normalized()
		dir.y = 0
		velocity = dir * move_speed
		if dir.length() > 0.1:
			look_at(global_position + dir, Vector3.UP)
		move_and_slide()

func find_nearest_waypoint() -> void:
	var nearest_idx = 0
	var min_dist = INF
	for i in range(waypoint_nodes.size()):
		var d = global_position.distance_to(waypoint_nodes[i].global_position)
		if d < min_dist:
			min_dist = d
			nearest_idx = i
	current_wp_idx = nearest_idx
	target_pos = waypoint_nodes[nearest_idx].global_position

func check_vision_line_of_sight() -> boolean:
	if not player_node:
		return false

	var to_player = player_node.global_position - global_position
	var dist = to_player.length()

	var is_crouched = player_node.get("is_crouching") if "is_crouching" in player_node else false
	var effective_max_dist = vision_distance * 0.55 if is_crouched else vision_distance
	if dist > effective_max_dist:
		return false

	var forward = -global_transform.basis.z
	var angle = forward.angle_to(to_player.normalized())
	if angle > deg_to_rad(vision_fov_deg / 2.0):
		return false

	vision_ray.target_position = vision_ray.to_local(player_node.global_position + Vector3(0, 1.0, 0))
	vision_ray.force_raycast_update()
	if vision_ray.is_colliding():
		var col = vision_ray.get_collider()
		return col == player_node

	return true
`,
  },

  // 8. scripts/game_manager.gd
  {
    path: 'scripts/game_manager.gd',
    category: 'scripts',
    content: `extends Node

# Global game session and objective progression manager
signal items_updated(collected: int, total: int)
signal exit_unlocked()
signal game_won()
signal game_lost()

var items_collected: int = 0
var total_items: int = 5
var is_door_open: boolean = false

func register_item_collected(item_name: String) -> void:
	items_collected += 1
	items_updated.emit(items_collected, total_items)
	if items_collected >= total_items:
		is_door_open = true
		exit_unlocked.emit()

func trigger_game_over() -> void:
	game_lost.emit()
	get_tree().change_scene_to_file("res://scenes/game_over.tscn")

func trigger_victory() -> void:
	game_won.emit()
	get_tree().change_scene_to_file("res://scenes/victory.tscn")
`,
  },

  // 9. scripts/virtual_joystick.gd
  {
    path: 'scripts/virtual_joystick.gd',
    category: 'scripts',
    content: `extends Control

# Touch virtual joystick for Godot 4 Android
signal joystick_moved(output_vector: Vector2)

@export var radius: float = 64.0
@onready var handle: Control = $Handle

var touch_id: int = -1
var start_pos: Vector2 = Vector2.ZERO
var output: Vector2 = Vector2.ZERO

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and touch_id == -1 and get_global_rect().has_point(event.position):
			touch_id = event.index
			start_pos = event.position
		elif not event.pressed and event.index == touch_id:
			touch_id = -1
			output = Vector2.ZERO
			handle.position = Vector2.ZERO
			joystick_moved.emit(output)

	elif event is InputEventScreenDrag and event.index == touch_id:
		var delta = event.position - start_pos
		if delta.length() > radius:
			delta = delta.normalized() * radius
		handle.position = delta
		output = delta / radius
		joystick_moved.emit(output)
`,
  },

  // 10. scenes/main_menu.tscn
  {
    path: 'scenes/main_menu.tscn',
    category: 'scenes',
    content: `[gd_scene load_steps=2 format=3 uid="uid://mainmenu001"]

[node name="MainMenu" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2

[node name="Background" type="ColorRect" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
color = Color(0.02, 0.03, 0.06, 1)

[node name="VBoxContainer" type="VBoxContainer" parent="."]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -160.0
offset_top = -140.0
offset_right = 160.0
offset_bottom = 140.0
grow_horizontal = 2
grow_vertical = 2
theme_override_constants/separation = 16

[node name="Title" type="Label" parent="VBoxContainer"]
layout_mode = 2
theme_override_colors/font_color = Color(0.9, 0.15, 0.15, 1)
theme_override_font_sizes/font_size = 48
text = "HUSH!"
horizontal_alignment = 1

[node name="Subtitle" type="Label" parent="VBoxContainer"]
layout_mode = 2
theme_override_colors/font_color = Color(0.6, 0.65, 0.75, 1)
theme_override_font_sizes/font_size = 18
text = "لعبة رعب وتسلل ثلاثية الأبعاد"
horizontal_alignment = 1

[node name="PlayBtn" type="Button" parent="VBoxContainer"]
custom_minimum_size = Vector2(0, 48)
layout_mode = 2
text = "بدء اللعبة (PLAY)"

[node name="SettingsBtn" type="Button" parent="VBoxContainer"]
custom_minimum_size = Vector2(0, 44)
layout_mode = 2
text = "الإعدادات (SETTINGS)"

[node name="HowToPlayBtn" type="Button" parent="VBoxContainer"]
custom_minimum_size = Vector2(0, 44)
layout_mode = 2
text = "طريقة اللعب (HOW TO PLAY)"

[node name="ExitBtn" type="Button" parent="VBoxContainer"]
custom_minimum_size = Vector2(0, 44)
layout_mode = 2
text = "خروج (EXIT)"
`,
  },

  // 11. README.md
  {
    path: 'README.md',
    category: 'docs',
    content: `# HUSH! — Offline 3D Co-op Horror Game Foundation
**محرك اللعبة: Godot Engine 4.3 (Mobile Renderer / Android)**

---

## نظرة عامة (Overview)
تدخل سوبرماركت صغير ليلاً؛ مهمتك جمع 5 عناصر غذائية أساسية وتفعيل بوابة الطوارئ للهروب دون أن يمسك بك حارس الأمن المتحكم به بواسطة الذكاء الاصطناعي (AI FSM).
الميزة الجوهرية: **كلما كان صوتك أعلى في الميكروفون الحقيقي أو حركتك، زادت خطورة اكتشافك!**

---

## متطلبات التشغيل والتطوير (Requirements)
- **Godot Engine 4.2+ أو 4.3+** (Standard Edition)
- **Android SDK & OpenJDK 17** (لتصدير APK للهواتف)
- **VS Code** مع إضافة \`godot-tools\` و \`gdscript-toolkit\`

---

## تعليمات فتح المشروع في VS Code و Godot Engine
1. فك ضغط مجلد المشروع \`hush_godot_project\`.
2. افتح Godot Engine واختر **Import** ثم حدد ملف \`project.godot\`.
3. لتعديل الأكواد في **VS Code**:
   - افتح مجلد المشروع في VS Code.
   - الإعدادات معدة مسبقاً في \`.vscode/settings.json\` للاتصال بخادم Godot Language Server على المنفذ \`6005\`.

---

## إعداد تصدير Android وأذونات الميكروفون (Android APK Export)
1. في Godot Engine: اذهب إلى **Project -> Export**.
2. اختر إعداد التصدير المرفق **Android**.
3. تأكد من تفعيل الصلاحية:
   \`android.permission.RECORD_AUDIO = true\`
4. اضغط على **Export Project** لإنشاء \`hush_android.apk\`.

---

## اختبار نظام الميكروفون
- تتم معالجة سعة الصوت محلياً (RMS Amplitude) بنسبة 100% داخل ذاكرة الهاتف بدون رفع أي تسجيلات إلى أي خادم خارجي.
- يوفر النظام حماية من التنبيهات الكاذبة عبر نافذة زمنية مؤكدة (EMA Smoothing + 120ms Threshold).
`,
  },

  // 12. .vscode/settings.json
  {
    path: '.vscode/settings.json',
    category: 'vscode',
    content: `{
  "godotTools.lsp.serverPort": 6005,
  "godotTools.editorPath": "godot",
  "files.associations": {
    "*.tscn": "gdscript",
    "*.godot": "ini"
  }
}
`,
  },
];

export async function generateGodotProjectZip(): Promise<Blob> {
  const zip = new JSZip();
  for (const file of GODOT_PROJECT_FILES) {
    zip.file(`hush_godot4_project/${file.path}`, file.content);
  }
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
