# TellMeLight Brainstorm Progress

Date: 2026-05-29

This is a running brainstorm log. It records intermediate decisions before the final Superpowers design spec is written.

## Confirmed Direction

- TellMeLight is an AI hardware device that visualizes local AI sessions through light.
- The first physical target is an integrated PCB, not a breadboard or development-board MVP.
- USB wired connection is the first connectivity mode.
- Hardware simulation and software simulation are acceptable before physical boards exist.
- HDL is not the default simulation route because the product is MCU-based, not FPGA-based.

## Visual Design

- Form factor: desk puck.
- Top-face language: four vertical bars inspired by a ByteDance-style rhythm.
- Final silhouette:
  - Left long bar is slightly shorter than the right long bar.
  - Two middle bars have the same size.
  - Left middle bar sits lower.
  - Right middle bar sits only slightly higher than the left middle bar.
- The device still represents six sessions:
  - Left long bar has two internal zones.
  - Left middle short bar has one zone.
  - Right middle short bar has one zone.
  - Right long bar has two internal zones.

## Session Display Logic

- The six light zones form a FIFO queue.
- New sessions enter the rightmost slot.
- Existing sessions shift left by one slot when a new session starts.
- If more than six sessions exist, the leftmost top slot is evicted.
- Completed and errored sessions remain visible until evicted or explicitly cleared.
- Idle means the zone is off.

## State Language

- Running: cyan/blue, optionally slow breathing.
- Approval: amber, optionally continuous attention pulse.
- Done: green, persistent.
- Error: red, persistent.
- Idle: off.

Resolved:
- Breathing and pulse behavior should be firmware-controlled.

## Hardware Architecture

Confirmed recommendation:
- USB-C.
- RP2040-class USB MCU.
- LP5024-class I2C RGB LED driver.
- Six RGB light zones, requiring 18 LED driver channels.
- LED driver route is preferred over addressable RGB LEDs because it is more maintainable and product-like.

Open point:
- Decide whether each light zone uses one RGB LED or multiple LEDs under the same diffuser zone.

## Software Boundary

Recommended split:
- Host Bridge owns local AI integration, session discovery, FIFO ordering, and persistence.
- Device firmware owns USB receive, state rendering, breathing curves, brightness limits, and LED driver updates.
- LED driver owns PWM/current output.

Recommended local API:
- `POST /v1/events`: receive normalized session events.
- `GET /v1/slots`: return current six-slot state.
- `WS /v1/stream`: stream slot updates to simulator or dashboard.

Next design topic:
- Define event semantics for `started`, `state_changed`, `ended`, `cleared`, and eviction.

## Proposed Event Semantics

Proposed on 2026-05-29 for review:

- `started`
  - If `session_id` is new, shift the FIFO left and insert the session into slot 6 as `running`.
  - If `session_id` already exists, update the existing slot instead of duplicating it.
- `state_changed`
  - If `session_id` exists, update that slot in place.
  - If `session_id` is unknown, create it as a new session so adapters can be forgiving.
- `ended`
  - Does not remove the session from the queue.
  - Sets state to `done` unless the payload says the outcome is `error`.
- `cleared`
  - Explicitly removes a session from the visible queue.
  - Remaining sessions compact left and the newest-side empty slot becomes idle.
  - Confirmed by user.
- Eviction
  - When a seventh new session arrives, slot 1 is evicted from the visible queue.
  - Evicted sessions can remain in host-side history.
  - `evicted` is an internal Host Bridge log/UI event, not something adapters need to send.

## Proposed USB Device Protocol

Proposed on 2026-05-29 and accepted by user:

- Host Bridge keeps the local API JSON-based for humans and adapters.
- Device protocol should be USB HID fixed-size reports.
- Product path:
  - USB HID output report.
  - Fixed-size binary frame, initially 64 bytes.
  - No user-facing serial port required.
- Development path:
  - Optional USB CDC serial debug console in development firmware.
  - CDC is for logs/manual testing, not the primary product protocol.
- Avoid vendor-specific bulk endpoints for the first version because six status lights do not need that complexity.

Proposed 64-byte display frame:

- `magic[2]`: `TL`.
- `version`: protocol version.
- `seq`: incrementing frame number.
- `brightness`: global brightness, `0..255`.
- `flags`: bitfield for global display options.
- `slots[6]`: each slot carries `state`, `anim`, `intensity`, `age`, `label_hash`, and reserved bytes.
- `crc8`: lightweight frame check.
- The firmware owns the default state palette. Host-side RGB overrides can be added later as an extension.

Rationale:

- HID avoids COM-port naming and serial-driver friction.
- Fixed binary reports are simple for firmware.
- The Host Bridge can still expose human-readable JSON over HTTP/WebSocket.

## Proposed Firmware Rendering Model

Proposed on 2026-05-29 and accepted by user:

- Host Bridge sends slot states when the FIFO or session status changes.
- Host Bridge does not stream every animation frame.
- Firmware calculates animation curves locally.
- Firmware updates the LED driver at a steady frame rate.

State behaviors:

- `running`: cyan/blue, continuous slow breathing.
- `approval`: amber, continuous attention pulse.
- `done`: green, persistent steady light.
- `error`: red, persistent steady light or slow warning pulse.
- `idle`: off.

Failsafe behavior:

- USB connected but no recent update: keep the last valid frame.
- Host heartbeat lost for a longer timeout: optionally dim all active slots to show stale data.
- Invalid frame: ignore it and keep the previous valid frame.

## Proposed Host Bridge Module Structure

Proposed on 2026-05-29 and accepted by user:

- Host Bridge should be a small local service.
- Inputs:
  - Local HTTP event API.
  - Manual test client.
  - Tool-specific adapters such as Codex, Claude, Cursor, and future local agents.
- Core:
  - Event validation.
  - Session registry.
  - FIFO queue state machine.
  - Persistence and history.
- Outputs:
  - USB HID device writer.
  - Web simulator stream.
  - Debug REST API.
  - Logs.

Design rules:

- Adapters are disposable and translate tool-specific signals into normalized events.
- FIFO core is durable and tested independently.
- Outputs are replaceable, so the same six-slot model can drive a simulator before hardware exists.

Suggested repository areas:

- `host/`: Bridge service, API, FIFO core, adapters, and simulator connection.
- `firmware/`: RP2040 firmware, HID receive, animation renderer, and LED driver code.
- `hardware/`: PCB, symbols/footprints, enclosure notes, and manufacturing outputs.

## Proposed Automation Pipeline

Proposed on 2026-05-29 and accepted by user:

Goal:

- Build an AI-assisted design pipeline with repeatable checks.
- Avoid treating hardware generation as blind one-click output.
- Every generated artifact must pass a verification gate before it becomes a design baseline.

Pipeline stages:

- Spec:
  - Requirements.
  - State semantics.
  - Six-slot mapping.
  - Selected components.
- Schematic:
  - USB-C input.
  - RP2040-class MCU.
  - LP5024-class RGB LED driver.
  - Power, ESD/protection, debug/programming pads.
- PCB:
  - Board outline.
  - LED placement.
  - Diffuser and light-isolation assumptions.
  - Routing and DRC.
- Firmware:
  - HID receive.
  - Renderer.
  - LP5024-class driver.
- Host:
  - Local API.
  - FIFO model.
  - Simulator.
  - USB HID writer.

Verification gates:

- Hardware:
  - Electrical rule check.
  - PCB design rule check.
  - BOM completeness.
  - Footprint presence.
  - USB/power review checklist.
- Software:
  - FIFO state-machine tests.
  - API schema tests.
  - HID frame encoder tests.
  - Firmware renderer tests.
  - Simulator screenshot checks.

Proposed first automation milestone:

- Create a repo skeleton with docs, host model tests, browser simulator, hardware notes, and component decision records.
- Do not start PCB layout until the six-slot logic and simulator are executable and testable.
