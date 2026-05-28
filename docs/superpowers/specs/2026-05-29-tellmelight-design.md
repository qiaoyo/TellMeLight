# TellMeLight Design

Date: 2026-05-29

## Summary

TellMeLight is a USB-connected AI hardware device that visualizes local AI sessions through a persistent six-slot light queue. The physical design uses a four-bar, ByteDance-style top-face rhythm while preserving six independent RGB light zones by splitting both long bars into two zones.

The first product direction is an integrated PCB with a USB-C interface, RP2040-class MCU, LP5024-class I2C RGB LED driver, six RGB light zones, a local Host Bridge service, firmware-side light rendering, and a browser simulator for pre-hardware validation.

## Goals

- Design an integrated PCB hardware product, not a breadboard or development-board MVP.
- Connect local AI tools to a small desk light display over USB.
- Show up to six AI sessions as a FIFO queue.
- Keep completed and errored sessions visible until cleared or evicted.
- Build an automation-friendly repo structure where specs, host software, firmware, hardware, and verification can evolve together.
- Use AI-assisted design with explicit verification gates rather than blind one-click hardware generation.

## Non-Goals

- No Wi-Fi or wireless mode in the first hardware target.
- No FPGA or HDL-based implementation unless the architecture changes later.
- No PCB layout before the six-slot logic and simulator are executable and testable.
- No direct dependency on a single AI tool's log format in the core state machine.

## Visual Design

The device is a compact desk puck with a rounded rectangular body and four vertical diffuser bars on the top face.

The final silhouette:

- Left long bar is slightly shorter than the right long bar.
- The two middle bars are the same size.
- Left middle bar sits lower.
- Right middle bar sits only slightly higher than the left middle bar.
- The visual style intentionally follows a ByteDance-style four-bar rhythm.

The four visible bars represent six internal light zones:

- Left long bar: two internal zones.
- Left middle short bar: one zone.
- Right middle short bar: one zone.
- Right long bar: two internal zones.

## Session Queue

The six light zones form a FIFO queue.

- New sessions enter the rightmost slot.
- Existing sessions shift left by one slot when a new session starts.
- If a seventh new session arrives, slot 1, the top of the left long bar, is evicted.
- Evicted sessions can remain in host-side history but are no longer displayed.
- Completed and errored sessions remain visible until evicted or explicitly cleared.
- `cleared` removes a target session, compacts remaining visible sessions left, and leaves the newest-side empty slot idle.

## State Language

Each visible slot has one state:

- `running`: cyan/blue, continuous slow breathing.
- `approval`: amber, continuous attention pulse.
- `done`: green, persistent steady light.
- `error`: red, persistent steady light or slow warning pulse.
- `idle`: off.

Animation is persistent for active states; it is not a one-time notification. Done and error states must remain visible so the user can notice them later.

## Hardware Architecture

The confirmed first hardware target:

- USB-C for power and data.
- RP2040-class USB MCU.
- LP5024-class I2C RGB LED driver.
- Six RGB light zones using 18 LED driver channels.
- Integrated PCB.

The LED driver route is preferred over addressable RGB LEDs because it is more maintainable and product-like:

- MCU writes stable I2C commands instead of timing-sensitive one-wire LED data.
- LED current and color behavior are controlled by a dedicated driver.
- Firmware and hardware tests can isolate the driver, channels, and zones.
- The architecture leaves channel headroom with a 24-channel driver.

Open hardware decision:

- Decide whether each light zone uses one RGB LED or multiple LEDs under the same diffuser zone. If each zone needs multiple LEDs for smoother diffusion, the design may use more driver channels or parallel same-color LEDs with careful current design.

## Software Boundary

TellMeLight is split into host software, device firmware, and hardware output.

Host Bridge owns:

- Local AI tool integration.
- Session discovery.
- Normalized event ingestion.
- Session registry.
- FIFO queue state machine.
- Persistence and history.
- Slot output to simulator and USB device.

Device firmware owns:

- USB HID frame receive.
- Frame validation.
- State-to-light rendering.
- Breathing and pulse curves.
- Global brightness limits.
- I2C updates to the LP5024-class LED driver.

The LED driver owns:

- PWM/current output for the RGB channels.

## Local API

The Host Bridge exposes a local API for adapters and debugging:

- `POST /v1/events`: receive normalized session events.
- `GET /v1/slots`: return the current six-slot state.
- `WS /v1/stream`: stream slot updates to simulator or dashboard clients.

Minimal event payload:

```json
{
  "source": "codex",
  "session_id": "abc123",
  "event": "started",
  "state": "running",
  "title": "optional short label",
  "time": "2026-05-29T00:00:00+08:00"
}
```

Event semantics:

- `started`: if `session_id` is new, shift FIFO left and insert into slot 6 as `running`; if known, update in place.
- `state_changed`: update known sessions in place; create unknown sessions to keep adapters forgiving.
- `ended`: does not remove the session; sets state to `done` unless outcome is `error`.
- `cleared`: removes a visible session, compacts remaining sessions left, and sets the empty newest-side slot to idle.
- `evicted`: internal Host Bridge log/UI event when a seventh new session pushes slot 1 out.

## USB Device Protocol

Host-side APIs remain JSON-based. The product device protocol is USB HID.

Product path:

- USB HID output report.
- Fixed-size binary frame, initially 64 bytes.
- No user-facing serial port required.

Development path:

- Optional USB CDC serial debug console in development firmware.
- CDC is for logs and manual testing, not the primary product protocol.

Proposed 64-byte display frame:

- `magic[2]`: `TL`.
- `version`: protocol version.
- `seq`: incrementing frame number.
- `brightness`: global brightness, `0..255`.
- `flags`: global display options.
- `slots[6]`: each slot carries `state`, `anim`, `intensity`, `age`, `label_hash`, and reserved bytes.
- `crc8`: lightweight frame check.

The firmware owns the default state palette. Host-side RGB overrides can be added later as an extension, but the first protocol should send display intent rather than raw colors.

## Firmware Rendering

Host Bridge sends slot states only when FIFO or session status changes. It does not stream every animation frame.

Firmware computes animations locally:

- Keeps the last valid frame.
- Renders breathing and pulse curves on the device.
- Updates the LED driver at a steady frame rate.
- Ignores invalid frames.

Failsafe behavior:

- USB connected but no recent update: keep the last valid frame.
- Host heartbeat lost for a longer timeout: optionally dim all active slots to show stale data.
- Invalid frame: ignore it and keep the previous valid frame.

## Host Bridge Modules

Recommended internal structure:

- Inputs:
  - HTTP event API.
  - Manual test client.
  - Tool-specific adapters for Codex, Claude, Cursor, and future local agents.
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

## Repository Structure

Initial repo areas:

- `docs/`: design specs, progress logs, decisions, checklists.
- `host/`: Bridge service, API, FIFO core, adapters, simulator connection.
- `firmware/`: RP2040 firmware, HID receive, animation renderer, LP5024-class driver.
- `hardware/`: PCB, symbols/footprints, enclosure notes, manufacturing outputs.
- `simulator/`: browser-visible light simulator and visual validation tools.
- `tools/`: automation scripts for checks, generated outputs, and design support.

## Automation Pipeline

The automation goal is AI-assisted design with repeatable checks.

Pipeline stages:

- Spec: requirements, state semantics, six-slot mapping, selected components.
- Schematic: USB-C input, RP2040-class MCU, LP5024-class RGB LED driver, power, ESD/protection, debug/programming pads.
- PCB: board outline, LED placement, diffuser and light-isolation assumptions, routing, DRC.
- Firmware: HID receive, renderer, LP5024-class driver.
- Host: local API, FIFO model, simulator, USB HID writer.

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

## First Implementation Milestone

Create a repo skeleton and executable software simulation before starting PCB layout.

Milestone scope:

- Host FIFO core with tests.
- Local event API schema.
- Browser simulator showing the refined four-bar, six-zone layout.
- HID frame encoder tests.
- Hardware component decision record.
- Initial hardware notes for USB-C, RP2040-class MCU, LP5024-class LED driver, diffuser zones, and PCB constraints.

PCB layout is intentionally deferred until the six-slot logic and simulator are testable.

## Risks And Open Questions

- Legal/brand risk: the visual language intentionally follows a ByteDance-style four-bar rhythm because the user is a ByteDance designer. The design should still be handled carefully if the project becomes public or commercial.
- Diffuser risk: long bars with two internal zones require good light isolation to avoid confusing session boundaries.
- LED count risk: one RGB LED per zone may not diffuse evenly enough; multiple LEDs per zone may change driver/channel planning.
- USB HID details need exact report descriptor and host library choice.
- The first real adapter target is not yet selected.

## Acceptance Criteria

The design is ready for implementation planning when:

- The user approves this spec.
- The first milestone is limited to repo skeleton, host FIFO logic, simulator, protocol encoder tests, and hardware notes.
- No PCB layout work starts before software simulation and design checks exist.
