# TellMeLight Host Bridge Design

Date: 2026-05-29

## Goal

Build a local-only Host Bridge service that turns normalized AI session events into the six-slot TellMeLight model and streams the current slots to the browser simulator.

This milestone still does not touch real PCB, firmware, or USB hardware.

## Scope

Included:

- Local HTTP service using Node built-in modules.
- `POST /v1/events` for normalized session events.
- `GET /v1/slots` for the current six-slot state.
- `GET /v1/stream` using Server-Sent Events for live simulator updates.
- A small manual event client for local demos.
- Simulator support for connecting to the Host Bridge, while keeping manual buttons as a fallback.

Excluded:

- Real USB HID device writing.
- WebSocket support.
- Real Codex, Claude, Cursor, or local-agent adapters.
- Persistence across process restarts.

## Architecture

The Host Bridge is a thin service layer around the existing tested core:

- `host/src/schema.js` validates and normalizes external event payloads.
- `host/src/fifo.js` owns session ordering and state transitions.
- A new bridge state module owns the mutable in-memory model and subscriber notification.
- A new HTTP server module maps routes to bridge operations.
- A demo client sends example events to the service.
- The simulator first tries the service stream. If unavailable, it stays usable in manual mode.

This keeps adapter work separate from the core display model. Future tool adapters can send the same event payloads to `POST /v1/events`.

## API

`GET /v1/slots`

- Returns HTTP 200 JSON.
- Body contains `revision` and `slots`.
- Each slot includes `slot`, `id`, `source`, `title`, `state`, and `updatedAt`.
- Empty slots are represented as `id: null`, `state: "idle"`.

`POST /v1/events`

- Accepts JSON with `source`, `session_id`, `event`, optional `state`, optional `title`, optional `time`, and optional `outcome`.
- Uses the existing normalizer and FIFO core.
- Returns HTTP 202 JSON containing the updated slot snapshot.
- Invalid JSON or invalid event payloads return HTTP 400 JSON with an `error` field.

`GET /v1/stream`

- Returns `text/event-stream`.
- Sends the current snapshot immediately.
- Sends another snapshot whenever `POST /v1/events` changes the model.
- Uses event name `slots`.

## Simulator Behavior

On load, the simulator opens `/v1/stream` against `http://localhost:8787`.

- If the stream connects, incoming slot snapshots drive the light display and JSON panel.
- Manual controls remain available and send events to `POST /v1/events`.
- If the service is unavailable or a POST fails, the simulator falls back to the existing in-browser manual state.
- Selected-slot UI remains local to the simulator; the Host Bridge only owns session state.

## Manual Demo

A new demo script sends a repeatable sequence:

1. Start session A.
2. Start session B.
3. Change A to approval.
4. End B as done.
5. Start enough extra sessions to demonstrate FIFO movement.

The script targets `http://localhost:8787` by default.

## Testing

Tests cover:

- Slot snapshot shape from the bridge state module.
- Event application and subscriber notification.
- HTTP `GET /v1/slots`.
- HTTP `POST /v1/events` success and invalid-payload failure.
- SSE stream sends the current snapshot and updates.
- Simulator assets contain the Host Bridge connection and fallback hooks.

Full verification remains:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```
