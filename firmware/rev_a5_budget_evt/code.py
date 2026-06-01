import json
import math
import sys
import time

import board
import digitalio
import neopixel_write
import supervisor

PIXEL_COUNT = 60
MATRIX_WIDTH = 10
MATRIX_HEIGHT = 6
MAX_BRIGHTNESS = 0.18
DEFAULT_BRIGHTNESS = 0.12

STATE_COLORS = {
    "idle": (0, 0, 0),
    "cleared": (0, 0, 0),
    "running": (0, 70, 255),
    "approval": (255, 125, 0),
    "done": (0, 180, 45),
    "error": (255, 0, 0),
}

SLOT_PIXELS = [
    [(0, 0), (1, 0), (0, 1), (1, 1), (0, 2), (1, 2)],
    [(0, 3), (1, 3), (0, 4), (1, 4), (0, 5), (1, 5)],
    [(3, 3), (4, 3), (3, 4), (4, 4), (3, 5), (4, 5)],
    [(5, 2), (6, 2), (5, 3), (6, 3), (5, 4), (6, 4)],
    [(8, 0), (9, 0), (8, 1), (9, 1), (8, 2), (9, 2)],
    [(8, 3), (9, 3), (8, 4), (9, 4), (8, 5), (9, 5)],
]

try:
    pixel_pin = digitalio.DigitalInOut(board.D0)
except AttributeError:
    pixel_pin = digitalio.DigitalInOut(board.A0)

pixel_pin.direction = digitalio.Direction.OUTPUT
pixel_buffer = bytearray(PIXEL_COUNT * 3)
slots = ["idle", "idle", "idle", "idle", "idle", "idle"]
brightness = DEFAULT_BRIGHTNESS
line_buffer = ""


def clamp(value, low, high):
    return max(low, min(high, value))


def xy_to_index(x, y):
    return y * MATRIX_WIDTH + x


def set_pixel(index, rgb, scale):
    red = int(clamp(rgb[0] * scale, 0, 255))
    green = int(clamp(rgb[1] * scale, 0, 255))
    blue = int(clamp(rgb[2] * scale, 0, 255))
    base = index * 3
    pixel_buffer[base] = green
    pixel_buffer[base + 1] = red
    pixel_buffer[base + 2] = blue


def clear_buffer():
    for i in range(len(pixel_buffer)):
        pixel_buffer[i] = 0


def show():
    neopixel_write.neopixel_write(pixel_pin, pixel_buffer)


def breathing(now, period, low=0.35, high=1.0):
    phase = (math.sin((now / period) * math.pi * 2) + 1) / 2
    return low + (high - low) * phase


def state_scale(state, now):
    if state == "running":
        return breathing(now, 2.6, 0.30, 1.0)
    if state == "approval":
        return breathing(now, 1.8, 0.45, 1.0)
    if state == "error":
        return breathing(now, 1.2, 0.25, 1.0)
    return 1.0


def render():
    clear_buffer()
    now = time.monotonic()
    for slot_index, state in enumerate(slots[:6]):
        color = STATE_COLORS.get(state, STATE_COLORS["error"])
        scale = brightness * state_scale(state, now)
        for x, y in SLOT_PIXELS[slot_index]:
            set_pixel(xy_to_index(x, y), color, scale)
    show()


def apply_command(command):
    global brightness
    if "brightness" in command:
        brightness = clamp(float(command["brightness"]), 0.0, MAX_BRIGHTNESS)

    incoming_slots = None
    if isinstance(command.get("slots"), list):
        incoming_slots = command["slots"]
    elif isinstance(command.get("sessions"), list):
        incoming_slots = [item.get("state", "idle") for item in command["sessions"]]
    elif command.get("clear"):
        incoming_slots = []

    if incoming_slots is not None:
        normalized = [str(state).lower() for state in incoming_slots[:6]]
        while len(normalized) < 6:
            normalized.append("idle")
        for index, state in enumerate(normalized):
            slots[index] = state if state in STATE_COLORS else "error"


def poll_serial():
    global line_buffer
    while supervisor.runtime.serial_bytes_available:
        char = sys.stdin.read(1)
        if char in ("\n", "\r"):
            line = line_buffer.strip()
            line_buffer = ""
            if line:
                try:
                    apply_command(json.loads(line))
                except Exception as exc:
                    print("TellMeLight parse error:", repr(exc))
        else:
            line_buffer += char
            if len(line_buffer) > 512:
                line_buffer = ""


def self_test():
    demo = ["running", "approval", "done", "error", "idle", "running"]
    for index, state in enumerate(demo):
        slots[index] = state
    deadline = time.monotonic() + 2.0
    while time.monotonic() < deadline:
        render()
        time.sleep(0.035)
    for index in range(6):
        slots[index] = "idle"
    render()


print("TellMeLight Rev A5 Budget EVT ready")
self_test()

while True:
    poll_serial()
    render()
    time.sleep(0.035)

