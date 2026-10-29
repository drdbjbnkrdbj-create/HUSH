extends Node

# Global NoiseManager singleton for Godot 4.x
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
