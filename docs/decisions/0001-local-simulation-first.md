# 0001: Build Local Simulation Before PCB Layout

## Status

Accepted

## Context

TellMeLight is intended to become integrated PCB hardware, but no physical prototype exists yet. The six-session FIFO behavior, state language, and USB display protocol can be verified locally before schematic or PCB layout begins.

## Decision

Build the local software foundation first:

- FIFO state-machine tests.
- Local API event schema tests.
- HID frame encoder tests.
- Browser simulator for the refined four-bar, six-zone layout.
- Hardware architecture notes.

No PCB layout starts until these local pieces are executable and testable.

## Consequences

- We reduce the chance of changing PCB assumptions because of late software model changes.
- The simulator gives immediate visual feedback without waiting for hardware.
- Hardware automation can later use a more stable spec and test suite.
