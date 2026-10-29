extends CharacterBody3D

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
	if touch_look_delta != Vector2.ZERO:
		rotate_y(-touch_look_delta.x * mouse_sensitivity)
		camera.rotate_x(-touch_look_delta.y * mouse_sensitivity)
		camera.rotation.x = clamp(camera.rotation.x, deg_to_rad(-80), deg_to_rad(80))
		touch_look_delta = Vector2.ZERO

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
