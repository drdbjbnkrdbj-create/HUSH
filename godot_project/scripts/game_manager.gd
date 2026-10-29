extends Node

# Global game session and objective progression manager for Godot 4.x
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
