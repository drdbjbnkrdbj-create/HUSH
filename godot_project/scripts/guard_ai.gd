extends CharacterBody3D

# Finite State Machine for Supermarket Security Guard AI in Godot 4.x
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
