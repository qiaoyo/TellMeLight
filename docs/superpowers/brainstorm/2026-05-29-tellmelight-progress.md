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

## Execution Checkpoint - 2026-05-29

- User selected Subagent-Driven execution.
- Corrected the local simulation plan so `cleared` removes a slot, shifts later visible sessions left, and leaves the newest-side slot idle.
- Next step is an isolated implementation worktree for the local software/simulator milestone.

## Implementation Checkpoint - 2026-05-29

- Created `feature/local-simulation-foundation` in `.worktrees/local-simulation-foundation`.
- Completed and pushed the project skeleton with a Windows Node runner.
- Completed and pushed the six-slot FIFO model:
  - New sessions enter the newest/right slot.
  - Full queues evict the oldest/leftmost slot.
  - `cleared` shifts later sessions left and leaves the newest side idle.
  - History records effective states for defaulted transitions.
- Completed and pushed the local event schema:
  - External payload uses `session_id`.
  - Internal model uses `sessionId`.
  - Explicit `state: null` is rejected instead of silently defaulted.
- Completed and pushed the 64-byte HID display frame encoder:
  - Six 8-byte slot records.
  - Idle/unknown slots fail closed to idle rendering.
  - Empty slots carry zero label hash bytes.
- Current verification count before simulator work: 24 host tests passing.

## Simulator Interaction Checkpoint - 2026-05-29

- User selected simulator option A: click any of the six visible slots, then apply a state action to the selected slot.
- The simulator now keeps a selected slot index and exposes it in the rendered JSON state.
- State controls now operate on the selected slot instead of always operating on the newest/rightmost session:
  - `Set Running`
  - `Set Approval`
  - `Set Done`
  - `Set Error`
  - `Clear Selected`
- `Clear Selected` removes the selected visible session, shifts later sessions left, and leaves the newest-side slot idle.
- Focusable slots also support keyboard selection with Enter or Space.

## Core Display Panel Checkpoint - 2026-05-29

- The core display panel was adjusted toward the user-provided reference image:
  - Near-square display area.
  - Four lightly slanted vertical strips.
  - Rounded strip corners.
  - Left long strip slightly shorter than right long strip.
  - Two middle strips remain shorter and staggered.
- The six-session mapping is preserved:
  - Left long strip contains two slots.
  - Each middle strip contains one slot.
  - Right long strip contains two slots.

## Core Display Refinement Checkpoint - 2026-05-29

- User confirmed the simulator button logic works.
- Core display strips were refined from shared parallelogram geometry to per-strip irregular trapezoids:
  - Left long strip: short edge faces right.
  - Right long strip: short edge faces right.
  - Left middle short strip: short edge faces right.
  - Right middle short strip: short edge faces left.
- The strips were made thicker, longer, and visually softer with larger rounded radii and multi-point clipped corners.
- The change remains limited to the simulator's core display panel; session logic and controls are unchanged.

## Core Display Correction Checkpoint - 2026-05-29

- User caught that the right middle short strip was visually crooked.
- Root cause:
  - The strip had an explicit `rotate(1deg)`.
  - Its short-left trapezoid points also shifted the top and bottom centers.
- Correction:
  - Removed rotation from the right middle short strip.
  - Rebalanced the short-left trapezoid points so the strip stays upright while preserving a left-facing short edge.
  - Added a simulator style regression test for the upright right middle strip.

## Host Bridge Checkpoint - 2026-05-29

- User approved Host Bridge option A as the next milestone.
- Added a local dependency-free Node Host Bridge:
  - `POST /v1/events` accepts normalized session events.
  - `GET /v1/slots` returns the current six-slot snapshot.
  - `GET /v1/stream` streams slot snapshots with Server-Sent Events.
- Added CORS headers so the static `file://` simulator can talk to `localhost:8787`.
- Added CLI entry points:
  - `host/src/server-cli.js` starts the service on `127.0.0.1:8787`.
  - `host/src/demo-client.js` sends a repeatable demo event sequence.
- Updated the simulator:
  - It listens to the Host Bridge stream when available.
  - Manual buttons post events to the Host Bridge when connected.
  - If the service is unavailable, the existing in-browser manual logic remains available.
- Still out of scope:
  - Real USB HID writing.
  - Real AI-tool adapters.
  - Firmware and PCB work.

## Adapter Foundation Checkpoint - 2026-05-29

- User approved Adapter Foundation option A.
- Added a reusable event client for sending normalized events to the Host Bridge.
- Added a dependency-free event CLI:
  - `started` sends a running `started` event.
  - `running` and `approval` send `state_changed`.
  - `done` sends `ended` with `outcome: success`.
  - `error` sends `ended` with `outcome: error`.
  - `cleared` sends `cleared`.
- Added `docs/adapters/contract.md` so future Codex, Claude, Cursor, or local-agent adapters share one event contract.
- This milestone still avoids parsing real tool logs; it creates the stable adapter input surface first.

## Process Adapter Checkpoint - 2026-05-30

- User approved generic process adapter option A as the next local-only integration step.
- Added a dependency-free process runner:
  - Sends `started` before child process launch.
  - Sends `ended` with `outcome: success` for exit code `0`.
  - Sends `ended` with `outcome: error` for non-zero exits or spawn failure.
  - Keeps the child command running even if TellMeLight event delivery fails.
- Added `host/src/process-cli.js` as the `tml-run` command surface:
  - Wrapper flags are parsed before `--`.
  - Child command and arguments are passed after `--`.
  - `--source`, `--id`, `--title`, `--url`, and `--cwd` are supported.
- This creates a practical bridge for local commands before any tool-specific Codex, Claude, Cursor, or IDE log parser exists.

## Windows Codex Integration Checkpoint - 2026-05-30

- User requested direct local Windows Codex integration instead of another generic wrapper layer.
- Verified the installed Codex CLI:
  - `codex-cli 0.133.0-alpha.1`.
  - VS Code ChatGPT extension Windows binary.
  - `codex doctor` passes with proxy `http://127.0.0.1:7892`.
- Verified a real Codex request:
  - `codex exec --json -C . --sandbox read-only "Reply with exactly: TellMeLight codex smoke ok"`.
  - Observed real `thread.started` JSONL with a Codex `thread_id`.
  - Observed final agent message `TellMeLight codex smoke ok`.
- Added `tml-codex`:
  - Runs `codex exec --json` for new turns.
  - Runs `codex exec resume --json` for recorded session continuation.
  - Uses Codex `thread_id` as TellMeLight `session_id`.
  - Maps Codex JSONL turn lifecycle to `running`, `approval`, `done`, and `error`.
  - Supports `TELLMELIGHT_CODEX_PROXY` and `--tml-proxy` for the Windows proxy setup.
