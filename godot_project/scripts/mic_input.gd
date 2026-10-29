extends Node

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
