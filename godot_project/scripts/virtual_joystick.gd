extends Control

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
