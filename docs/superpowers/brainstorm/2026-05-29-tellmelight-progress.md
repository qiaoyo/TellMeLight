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

## Rev A KiCad Hardware Checkpoint - 2026-05-30

- User installed KiCad at `E:\kicad` and requested automatic local hardware progress while away.
- Confirmed local KiCad CLI:
  - `E:\kicad\bin\kicad-cli.exe`
  - KiCad version `10.0.3`.
  - KiCad Python `pcbnew` API version `10.0`.
- Rev A hardware baseline scope:
  - USB-C wired integrated PCB.
  - RP2040-class USB MCU.
  - LP5024-class 24-channel I2C RGB LED driver in the 32-pin 4 x 4 mm VQFN/WQFN footprint class.
  - Six common-anode RGB LED zones behind four rounded trapezoid diffuser bars.
  - AP2112K-3.3-class 3V3 regulator.
  - W25Q32JVSS-class QSPI flash.
  - TPD2EUSB30-class USB ESD protection.
- The KiCad milestone must generate project files, a block-level schematic/net plan, PCB floorplan with real footprints, Rev A BOM, power-budget simulation, and KiCad CLI reports.
- Remaining review items before fabrication:
  - Pin-by-pin schematic signoff.
  - Final routing and USB layout review.
  - Exact RGB LED optical sample decision.
  - Enclosure and diffuser CAD.
  - PCB vendor DFM rules for QFN/VQFN assembly.

## Rev A1 JLC Fabrication Candidate Checkpoint - 2026-05-30

- User wants the next hardware phase to target likely JLC/JLCPCB fabrication and assembly.
- User does not have soldering tools, so Rev A1 should avoid any assumed hand-soldering.
- User prefers a more integrated, polished, technology-forward hardware approach.
- Rev A1 selected the high-integration path:
  - 4-layer PCB by default.
  - Double-sided SMT assembly by default.
  - Front side kept mostly optical with six RGB emitters.
  - Back side carries RP2040, LP5024, USB-C, flash, regulator, ESD, passives, and debug pads.
  - SWD header direction changes from visible pin header to pogo/test pads.
- Component direction remains RP2040 + LP5024 because it is still the most product-like architecture.
- JLC candidate parts were recorded for the main active/mechanical components:
  - RP2040: `C2040`.
  - LP5024RSMR: `C427525`.
  - W25Q32JVSSIQ: `C82344`.
  - AP2112K-3.3TRG1: `C51118`.
  - TPD2EUSB30DRTR: `C94934`.
  - HRO TYPE-C-31-M-12: `C165948`.
  - S4-3528RGBTA-A common-anode RGB LED: `C2827321`.
- Next work item is a Rev A1 implementation plan and generated KiCad/BOM artifacts.

## Rev A1 Generated Hardware Checkpoint - 2026-05-30

- Added the Rev A1 implementation plan and generated hardware assets.
- Created `hardware/kicad/tellmelight_rev_a1/` as a separate KiCad project so Rev A remains preserved.
- Generated a 4-layer PCB floorplan:
  - Front side holds the six RGB emitters and diffuser alignment marks.
  - Back side holds RP2040, LP5024, flash, regulator, USB-C, ESD, passives, buttons, and test pads.
  - SWD moved from a through-hole header direction to pogo/test pads.
- Generated Rev A1 manufacturing documents:
  - `hardware/bom/rev_a1_bom.csv`.
  - `hardware/bom/rev_a1_jlc_sourcing.csv`.
  - `hardware/notes/rev-a1-jlc-readiness.md`.
  - `hardware/simulation/rev_a1_power_budget.md`.
- KiCad checks passed:
  - ERC: 0 violations.
  - DRC: 0 violations and 0 unconnected items.
- Exported Rev A1 Gerbers, drill, position data, STEP, PCB PDF/SVG, schematic PDF/SVG, and top/bottom PNG renders.
- Remaining order blockers:
  - Pin-by-pin schematic still needs fabrication signoff.
  - RGB LED pinout must be verified against the final JLC selected part.
  - USB-C mechanical/shell grounding and LP5024 exposed-pad stencil need review before ordering.

## Rev A2 Pinout And JLC Order Package Checkpoint - 2026-05-30

- User requested Rev A2 with JLC-searchable small components where possible and clear substitutions/risks when parts are not resolved.
- Added Rev A2 order package assets:
  - `hardware/notes/rev-a2-pin-map.md`.
  - `hardware/notes/rev-a2-sourcing-decisions.md`.
  - `hardware/notes/rev-a2-order-readiness.md`.
  - `hardware/notes/rev-a2-circuit-explanation.md`.
  - `hardware/bom/rev_a2_bom.csv`.
  - `hardware/bom/rev_a2_jlc_bom.csv`.
  - `hardware/bom/rev_a2_jlc_cpl.csv`.
  - `hardware/bom/rev_a2_cost_estimate.csv`.
- Rev A2 sourcing decisions:
  - Use `C179173` as the working `W25Q32JVSSIQ` flash alternate while Rev A1 `C82344` has stock risk.
  - Keep `LP5024RSMR` / `C427525` as the 24-channel current-sink LED driver.
  - Correct `TPD2EUSB30DRTR` / `C94934` to the KiCad `Texas_DRT-3` footprint direction instead of the Rev A1 `SOT-23-6` placeholder.
  - Resolve `S4-3528RGBTA-A` / `C2827321` electrical pinout from the TUOZHAN datasheet:
    - Pin 1 = blue cathode.
    - Pin 2 = common anode.
    - Pin 3 = green cathode.
    - Pin 4 = red cathode.
  - Use JLC-searchable small-component candidates for 27R, 5.1k, 4.7k, 10k, 100nF, 1uF, 10uF, 33pF, 12MHz crystal, and service switches.
- Added the Rev A2 KiCad project at `hardware/kicad/tellmelight_rev_a2/`.
- Added a local Rev A2 LED footprint at `hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.pretty/LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm.kicad_mod` because the Rev A1 stock Wurth PLCC4 footprint had pad 1 on the opposite side.
- Rev A2 PCB placement adds LP5024 support passives:
  - `R7` IREF.
  - `R8` EN pull-up.
  - `C15` VCAP.
  - `C16` VCC local capacitor.
- KiCad Rev A2 verification passed locally:
  - ERC: 0 violations.
  - DRC: 0 violations and 0 unconnected items.
  - Gerbers, drill, position data, schematic PDF/SVG, PCB PDF/SVG, STEP, and top/bottom PNG renders were exported.
- Remaining order blockers:
  - JLC orientation preview must be manually reviewed for polarized/oriented parts, especially D1-D6.
  - JLC BOM/CPL upload must confirm the local LED footprint and C2827321 rotation before payment.
  - USB-C shell grounding and the crystal/load-cap pair remain YELLOW review items.

## Rev A2 JLC Upload Review Bundle Checkpoint - 2026-05-30

- Added `tools/hardware/package-rev-a2-jlc.mjs`.
- Generated `hardware/outputs/rev_a2/jlc_upload/` as a quote/review bundle, not a payment-ready release.
- Bundle contents:
  - `tellmelight_rev_a2_jlc_gerber_drill.zip` for PCB quote upload practice.
  - `tellmelight_rev_a2_jlc_assembly_bom_cpl.zip` for SMT BOM/CPL matching practice.
  - `manifest.json` with SHA-256 hashes for copied/generated review files.
  - `assembly/` copies of Rev A2 JLC BOM, CPL, and cost-estimate CSVs.
  - `review/` copies of order readiness, LED footprint review, circuit explanation, KiCad verification summary, and top/bottom renders.
- The package status is `NOT_FOR_ORDER` because JLC's orientation preview still needs manual review before any payment.

## Rev A3 Pin-Level Netlist Foundation Checkpoint - 2026-05-30

- Added `tools/hardware/generate-rev-a3-pin-netlist.mjs`.
- Generated a machine-readable pin-level netlist before attempting a full KiCad schematic:
  - `hardware/netlists/rev_a3_pin_netlist.json`.
  - `hardware/netlists/rev_a3_pin_netlist.csv`.
  - `hardware/notes/rev-a3-pin-level-schematic-feasibility.md`.
- The Rev A3 netlist records:
  - LP5024 OUT0..OUT17 to D1..D6 RGB cathodes.
  - TUOZHAN `S4-3528RGBTA-A` pin mapping: pad 1 blue cathode, pad 2 common anode, pad 3 green cathode, pad 4 red cathode.
  - USB-C D+/D- through 27R series resistors and connector-side `TPD2EUSB30DRTR`.
  - QSPI flash, BOOTSEL, RESET, I2C pull-ups, LP5024 IREF/VCAP/EN, power rails, and bring-up test pads.
- Local KiCad library probe result:
  - Stock symbols are available for RP2040, W25Q32JVSS, AP2112K-3.3, TPD2EUSB30, and USB-C USB2.0 receptacle.
  - Local symbols are still required for `LP5024RSMR` and the exact common-anode TUOZHAN RGB LED.
- Rev A2 remains `NOT_FOR_ORDER`; Rev A3 is a schematic-generation foundation, not a fabrication release.

## Rev A3 Local Symbol Library Checkpoint - 2026-05-30

- Added `tools/hardware/generate-rev-a3-symbols.mjs`.
- Generated `hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sym`.
- Added local KiCad symbols:
  - `LP5024RSMR`: 32 pins plus exposed-pad `GND_EP`, with OUT0..OUT23, ADDR0/ADDR1, VCC, SDA, SCL, EN, IREF, and VCAP.
  - `LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A`: exact C2827321 / `S4-3528RGBTA-A` common-anode pin mapping.
- Added `hardware/notes/rev-a3-symbol-library-review.md`.
- Ran `kicad-cli sym upgrade` as a local symbol syntax/format check and recorded `hardware/outputs/rev_a3/symbol-upgrade-check.log`.
- This checkpoint removes the missing-symbol blocker for a future Rev A3 pin-level schematic draft; it still does not make Rev A2 or Rev A3 order-ready.

## Rev A3 Netlist Lint Checkpoint - 2026-05-30

- Added `tools/hardware/lint-rev-a3-netlist.mjs`.
- Generated:
  - `hardware/outputs/rev_a3/netlist-lint.json`.
  - `hardware/notes/rev-a3-netlist-lint.md`.
- Lint checks:
  - Required nets: `GND`, `3V3`, `VBUS`, `VLED`, I2C, USB D+/D-, flash CS, reset, `LP_IREF`, and `LP_VCAP`.
  - Expected single-pin review nets: reserved GPIO, no-connect outputs, RP2040 internal regulator output, and USB-C shield.
  - Unexpected single-pin nets: currently none.
- Lint produced review findings:
  - `VLED_SOURCE_MODEL`: `VLED` currently touches only RGB LED common-anode pads; the Rev A3 schematic must explicitly model whether it is directly the `VBUS` rail, a renamed source rail, or a separate rail tied through a deliberate element.
  - `JLC_ORIENTATION_PREVIEW_OUT_OF_SCOPE`: JLC orientation preview still must be done manually before payment.

## Rev A2 Hardware Preview Page Checkpoint - 2026-05-30

- Added `tools/hardware/generate-rev-a2-preview.mjs`.
- Generated `hardware/outputs/rev_a2/preview.html`.
- The page links:
  - Rev A2 top and bottom PCB renders.
  - Rev A2 JLC Gerber/drill zip, BOM/CPL zip, and checksum manifest.
  - Rev A2 BOM/CPL CSVs.
  - Rev A3 pin-level netlist JSON/CSV, local symbol library, netlist lint JSON, and lint note.
- The page keeps `NOT_FOR_ORDER`, JLC orientation preview, VLED source model, USB-C shell grounding, and crystal load-cap review visible.

## Rev A3 Protection And JLC Tonight Checkpoint - 2026-05-30

- User selected the protection direction:
  - Add VLED-to-GND ESD/TVS protection.
  - Defer JLC orientation preview.
  - Use USB-C shell `1M // 10nF` RC to board GND.
  - Keep crystal decision understandable and avoid random capacitor changes.
- Updated `tools/hardware/generate-rev-a3-pin-netlist.mjs`.
- Added Rev A3 netlist parts:
  - `U6` `TPD1E05U06DPY` from `VLED` to `GND`.
  - `R10` `0R` from `VBUS` to `VLED`.
  - `R9` `1M` and `C17` `10nF` from `SHIELD` to `GND`.
- Updated netlist lint:
  - `VLED_SOURCE_MODEL_RESOLVED` is now GREEN via R10.
  - `USB_C_SHELL_RC_MODEL` is now GREEN via R9/C17.
  - JLC orientation preview remains RED and manual.
- Added:
  - `hardware/notes/rev-a3-protection-decisions.md`.
  - `hardware/notes/rev-a3-jlc-tonight-checklist.md`.
  - `hardware/bom/rev_a3_protection_bom_delta.csv`.
- Crystal note: keep `C9002` with C13/C14 `33pF` as the working candidate because C9002 is a 20pF-load 12MHz crystal candidate; with roughly 3pF stray capacitance, the target external capacitor is about 34pF.

## Rev A3 JLC Assembly Preflight Checkpoint - 2026-05-30

- Added `tools/hardware/generate-rev-a3-jlc-preflight.mjs`.
- Generated `hardware/outputs/rev_a3/jlc_preflight/` as a part-matching and rough-cost package, not a payment-ready order package.
- Generated:
  - `hardware/bom/rev_a3_jlc_bom_preflight.csv`.
  - `hardware/bom/rev_a3_jlc_cpl_draft.csv`.
  - `hardware/outputs/rev_a3/jlc_preflight/tellmelight_rev_a3_jlc_assembly_preflight.zip`.
  - `hardware/outputs/rev_a3/jlc_preflight/manifest.json`.
- The Rev A3 preflight BOM carries the Rev A2 assembly list plus U6/R9/C17/R10:
  - U6 `TPD1E05U06DPY`, JLC/LCSC candidate `C436349`.
  - R9 `1M`, candidate `C22935`.
  - C17 `10nF`, candidate `C57112`.
  - R10 `0R`, candidate `C21189`.
- The CPL is explicitly marked `DRAFT_ONLY` for the four new protection parts because the real Rev A3 PCB/Gerber/CPL has not been generated yet.
- Status remains `PREFLIGHT_NOT_FOR_ORDER`; stop before payment.

## Rev A3 Formal JLC Review Package Checkpoint - 2026-05-31

- Added a compact Rev A3 KiCad/JLC review package:
  - Board size reduced to 76 mm x 56 mm.
  - U6 `TPD1E05U06DPY`, R9 `1M`, C17 `10nF`, and R10 `0R` are now placed on the actual Rev A3 PCB and included in the JLC BOM/CPL.
  - The USB-C shell model remains `1M // 10nF` to GND; VLED is explicitly sourced through R10.
  - The top-side silkscreen includes a small A1-style separated line-art avatar watermark based on the user's black/white image.
  - The top-side title includes the persistent `By Joey.qiao` attribution.
- Generated:
  - `hardware/kicad/tellmelight_rev_a3/` KiCad project.
  - `hardware/bom/rev_a3_bom.csv`.
  - `hardware/bom/rev_a3_jlc_bom.csv`.
  - `hardware/bom/rev_a3_jlc_cpl.csv`.
  - `hardware/outputs/rev_a3/jlc_upload/tellmelight_rev_a3_jlc_gerber_drill.zip`.
  - `hardware/outputs/rev_a3/jlc_upload/tellmelight_rev_a3_jlc_assembly_bom_cpl.zip`.
  - Rev A3 top/bottom renders, PDF/SVG exports, STEP, Gerbers, drill, and manifest files.
- Local verification:
  - KiCad ERC: 0 violations.
  - KiCad DRC: 0 violations and 0 unconnected items.
  - Node test suite: 128/128 passing.
- Boundary remains explicit:
  - Rev A3 is `ORDER_REVIEW_NOT_FOR_PAYMENT`.
  - It is suitable for JLC board-size, DFM, BOM/CPL matching, placement, orientation, and silkscreen review.
  - Paid-order electrical routing remains the next hardware step after JLC orientation review.
