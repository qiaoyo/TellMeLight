# Rev A5 Budget EVT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Rev A5 first physical light-up demo plan under RMB 300 using off-the-shelf modules instead of JLC PCBA.

**Architecture:** Rev A5 uses a Seeed XIAO RP2040 plus a XIAO 6x10 WS2812 matrix, CircuitPython firmware, and a Windows PowerShell serial sender. Cost control is enforced by a checked CSV model and explicit stop gates.

**Tech Stack:** CircuitPython, WS2812/NeoPixel protocol, Windows PowerShell `System.IO.Ports.SerialPort`, Node `node:test`, CSV cost model.

---

## File Structure

- `hardware/bom/rev_a5_budget_evt_bom.csv`: buy-now cost model with required items and hard budget gate inputs.
- `hardware/notes/rev-a5-budget-evt.md`: human-readable procurement, assembly, optical, and verification guide.
- `hardware/notes/rev-a5-order-checklist.md`: short order checklist for the user before buying anything.
- `firmware/rev_a5_budget_evt/code.py`: CircuitPython firmware for XIAO RP2040 and 6x10 matrix.
- `firmware/rev_a5_budget_evt/README.md`: flashing and wiring instructions.
- `tools/rev_a5/send-serial-state.ps1`: Windows COM-port sender for firmware smoke tests.
- `tools/hardware/check-rev-a5-budget.mjs`: budget guard for the CSV.
- `host/test/hardware-rev-a5-budget.test.js`: regression tests for budget, docs, and firmware artifacts.
- `README.md`: project index update.
- `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: Superpowers progress checkpoint.

### Task 1: Cost Model And Guard

**Files:**
- Create: `hardware/bom/rev_a5_budget_evt_bom.csv`
- Create: `tools/hardware/check-rev-a5-budget.mjs`
- Test: `host/test/hardware-rev-a5-budget.test.js`

- [ ] **Step 1: Add a test that requires a buy-now total below RMB 300**

Create a Node test that reads the CSV, sums rows where `BuyNow` is `YES`, and asserts the total is less than or equal to 300.

- [ ] **Step 2: Add the cost CSV**

Write rows for XIAO RP2040, 6x10 matrix, USB-C cable, diffuser, mask, spacers, tape, and shipping buffer. Keep the buy-now total under RMB 300.

- [ ] **Step 3: Add the budget guard**

Implement `tools/hardware/check-rev-a5-budget.mjs` to parse the CSV, print the buy-now total, and exit non-zero if it exceeds RMB 300.

- [ ] **Step 4: Verify**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/check-rev-a5-budget.mjs
```

Expected: prints the Rev A5 buy-now total and exits 0.

### Task 2: Hardware Guide

**Files:**
- Create: `hardware/notes/rev-a5-budget-evt.md`
- Create: `hardware/notes/rev-a5-order-checklist.md`
- Modify: `README.md`

- [ ] **Step 1: Write the full guide**

Document the recommended module architecture, cart terms, assembly layers, firmware bring-up, Windows smoke test, and explicit stop gates.

- [ ] **Step 2: Write the short checklist**

Create a one-page checklist with `buy`, `do not buy`, and `verify before checkout` sections.

- [ ] **Step 3: Link from README**

Add Rev A5 files to the milestone and command sections.

### Task 3: Firmware And Host Smoke Sender

**Files:**
- Create: `firmware/rev_a5_budget_evt/code.py`
- Create: `firmware/rev_a5_budget_evt/README.md`
- Create: `tools/rev_a5/send-serial-state.ps1`

- [ ] **Step 1: Add CircuitPython firmware**

Use `board.D0`, `digitalio`, and `neopixel_write` to drive 60 WS2812 LEDs. Parse JSON lines from USB serial and render six persistent session slots with brightness limiting.

- [ ] **Step 2: Add firmware README**

Explain how to flash CircuitPython, copy `code.py`, connect the XIAO matrix, identify the COM port, and send a smoke frame.

- [ ] **Step 3: Add PowerShell sender**

Use `System.IO.Ports.SerialPort` to send one JSON line to the selected COM port.

### Task 4: Verification And Commit

**Files:**
- Test all changed assets.

- [ ] **Step 1: Run Rev A5 budget guard**

Run the budget guard and record the total.

- [ ] **Step 2: Run all Node tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Expected: all tests pass.

- [ ] **Step 3: Commit and push**

Commit all Rev A5 files with:

```powershell
git add README.md docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md docs/superpowers/specs/2026-06-02-rev-a5-budget-evt-design.md docs/superpowers/plans/2026-06-02-rev-a5-budget-evt.md hardware/bom/rev_a5_budget_evt_bom.csv hardware/notes/rev-a5-budget-evt.md hardware/notes/rev-a5-order-checklist.md firmware/rev_a5_budget_evt tools/rev_a5/send-serial-state.ps1 tools/hardware/check-rev-a5-budget.mjs host/test/hardware-rev-a5-budget.test.js
git commit -m "design: add rev a5 budget evt plan"
git push origin feature/local-simulation-foundation
```

## Self-Review

- The plan has an explicit RMB 300 stop gate.
- The plan avoids JLC PCBA for Rev A5.
- The plan produces a real firmware and host smoke sender rather than only prose.
- The plan keeps Rev A4 available as reference but stops it as a paid prototype.

