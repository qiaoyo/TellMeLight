# Rev A2 Pinout And JLC Order Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Rev A2 hardware package with pin-level electrical mapping, JLC BOM/CPL preparation, and a clearer cost/order readiness model.

**Architecture:** Rev A2 is generated as a separate hardware revision, preserving Rev A1. The first pass creates reviewed pin maps and order-prep data files before attempting a stricter KiCad schematic/PCB export. Tests lock the visible deliverables so order blockers cannot be hidden by generated outputs.

**Tech Stack:** KiCad 10.0.3 CLI, KiCad `pcbnew` Python API, JavaScript ES modules, Node `node:test`, PowerShell runner, official datasheets and JLC part pages.

---

## File Structure

- Create `host/test/hardware-rev-a2-assets.test.js`: tests for Rev A2 pin maps, sourcing decisions, cost model, and order readiness.
- Create `hardware/notes/rev-a2-pin-map.md`: human-readable pin map with source links.
- Create `hardware/notes/rev-a2-order-readiness.md`: red/yellow/green checklist.
- Create `hardware/notes/rev-a2-sourcing-decisions.md`: sourcing changes from Rev A1, including flash stock risk.
- Create `hardware/bom/rev_a2_bom.csv`: design BOM.
- Create `hardware/bom/rev_a2_jlc_bom.csv`: JLC upload-oriented BOM draft.
- Create `hardware/bom/rev_a2_jlc_cpl.csv`: JLC upload-oriented CPL draft.
- Create `hardware/bom/rev_a2_cost_estimate.csv`: cost model with priced/unpriced separation.
- Create `hardware/kicad/tellmelight_rev_a2/`: Rev A2 KiCad project.
- Create `hardware/outputs/rev_a2/`: Rev A2 verification/export outputs.
- Create `tools/hardware/generate-rev-a2-order-package.mjs`: docs/BOM/cost generator.
- Create `tools/hardware/generate-rev-a2-kicad.mjs`: KiCad project generator.
- Create `tools/hardware/generate_rev_a2_board.py`: Rev A2 PCB generator.
- Modify `README.md`: add Rev A2 commands and preview paths.
- Modify `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: record Rev A2 checkpoint.

## Task 1: Rev A2 Tests

- [ ] **Step 1: Add failing tests**

Create `host/test/hardware-rev-a2-assets.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

function literalPattern(text) {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('rev A2 pin map documents the main electrical interfaces', async () => {
  const pinMap = await readText('hardware/notes/rev-a2-pin-map.md');

  for (const token of [
    'RP2040',
    'LP5024RSMR',
    'USB-C',
    'QSPI flash',
    'RGB LED',
    'USB_DP',
    'USB_DM',
    'OUT0',
    'OUT17',
    'SWDIO',
    'SWCLK',
  ]) {
    assert.match(pinMap, literalPattern(token));
  }
});

test('rev A2 sourcing decisions expose flash and RGB LED risks', async () => {
  const sourcing = await readText('hardware/notes/rev-a2-sourcing-decisions.md');

  assert.match(sourcing, /C82344/);
  assert.match(sourcing, /C179173/);
  assert.match(sourcing, /stock risk/);
  assert.match(sourcing, /RGB LED pinout/);
});

test('rev A2 JLC package separates BOM, CPL, and cost model', async () => {
  const bom = await readText('hardware/bom/rev_a2_jlc_bom.csv');
  const cpl = await readText('hardware/bom/rev_a2_jlc_cpl.csv');
  const cost = await readText('hardware/bom/rev_a2_cost_estimate.csv');

  assert.match(bom, /Comment,Designator,Footprint,LCSC Part/);
  assert.match(bom, /C179173/);
  assert.match(cpl, /Designator,Mid X,Mid Y,Layer,Rotation/);
  assert.match(cost, /Known priced component subtotal/);
  assert.match(cost, /JLC quote upload required/);
});

test('rev A2 order readiness keeps unresolved items visible', async () => {
  const readiness = await readText('hardware/notes/rev-a2-order-readiness.md');

  assert.match(readiness, /RED/);
  assert.match(readiness, /YELLOW/);
  assert.match(readiness, /GREEN/);
  assert.match(readiness, /Do not order/);
});
```

- [ ] **Step 2: Run test to verify failure**

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-rev-a2-assets.test.js
```

Expected: FAIL because Rev A2 files do not exist yet.

## Task 2: Rev A2 Order-Package Generator

- [ ] **Step 1: Create `tools/hardware/generate-rev-a2-order-package.mjs`**

The generator writes the Rev A2 notes and CSV files. It must use deterministic text and no random IDs.

- [ ] **Step 2: Generate `hardware/notes/rev-a2-pin-map.md`**

The pin map must include sections:

```markdown
## RP2040 Pin Map
## LP5024RSMR Pin Map
## USB-C And ESD Pin Map
## QSPI Flash Pin Map
## RGB LED Channel Map
## Power And Test Pads
## Source Links
```

The first version may be a reviewed pin-plan table rather than a finished KiCad schematic, but every unresolved mapping must be marked `RED`.

- [ ] **Step 3: Generate `hardware/notes/rev-a2-sourcing-decisions.md`**

Required decisions:

- `C82344` remains visible as the Rev A1 selected flash part.
- `C179173` is the Rev A2 working flash alternate until stock is checked again.
- RGB LED pinout is a `RED` blocker until final datasheet/footprint matching is complete.
- LP5024 is kept unless a sourcing or DFM blocker appears.

- [ ] **Step 4: Generate JLC BOM/CPL/cost CSVs**

`rev_a2_jlc_bom.csv` header:

```csv
Comment,Designator,Footprint,LCSC Part
```

`rev_a2_jlc_cpl.csv` header:

```csv
Designator,Mid X,Mid Y,Layer,Rotation
```

`rev_a2_cost_estimate.csv` must include:

```csv
Item,Qty,JLC Candidate,Unit USD,Extended USD,Status,Notes
Known priced component subtotal,1,with C179173 alternate flash,,4.4812,estimate only,"PCB fabrication, SMT assembly, tooling, tax, and shipping are not included"
PCB fabrication and SMT assembly,1,JLC quote upload required,,,unpriced,JLC quote upload required
```

## Task 3: Rev A2 KiCad Baseline

- [ ] **Step 1: Create `tools/hardware/generate-rev-a2-kicad.mjs`**

Start from the Rev A1 generator path structure, but only generate Rev A2 paths.

- [ ] **Step 2: Create `tools/hardware/generate_rev_a2_board.py`**

Start from Rev A1 board placement, but update the title and revision to `TellMeLight Rev A2`.

- [ ] **Step 3: Generate Rev A2 KiCad project**

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a2-kicad.mjs
```

Expected: `hardware/kicad/tellmelight_rev_a2/` exists.

## Task 4: KiCad Verification And Exports

- [ ] **Step 1: Run ERC and DRC**

```powershell
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a2/erc.json hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_sch
& E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a2/drc.json hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb
```

- [ ] **Step 2: Export manufacturing review files**

```powershell
& E:\kicad\bin\kicad-cli.exe pcb export gerbers -o hardware/outputs/rev_a2/gerbers hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export drill -o hardware/outputs/rev_a2/drill hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export pos -o hardware/outputs/rev_a2/pos hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a2/tellmelight_rev_a2_top.png --side top --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a2/tellmelight_rev_a2_bottom.png --side bottom --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb
```

- [ ] **Step 3: Write `hardware/outputs/rev_a2/verification-summary.md`**

Include commands run, ERC/DRC status, export status, and remaining red blockers.

## Task 5: Docs And Final Verification

- [ ] **Step 1: Update README and progress log**

Add Rev A2 command paths and summarize the new pinout/order-package stage.

- [ ] **Step 2: Run targeted tests**

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-rev-a2-assets.test.js
```

Expected: PASS.

- [ ] **Step 3: Run all tests**

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Expected: all tests pass.

- [ ] **Step 4: Run whitespace check**

```powershell
git diff --check
```

Expected: no output.

- [ ] **Step 5: Commit and push**

```powershell
git add README.md docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md host/test/hardware-rev-a2-assets.test.js tools/hardware/generate-rev-a2-order-package.mjs tools/hardware/generate-rev-a2-kicad.mjs tools/hardware/generate_rev_a2_board.py hardware/notes/rev-a2-pin-map.md hardware/notes/rev-a2-order-readiness.md hardware/notes/rev-a2-sourcing-decisions.md hardware/bom/rev_a2_bom.csv hardware/bom/rev_a2_jlc_bom.csv hardware/bom/rev_a2_jlc_cpl.csv hardware/bom/rev_a2_cost_estimate.csv hardware/kicad/tellmelight_rev_a2 hardware/outputs/rev_a2
git commit -m "feat: add rev a2 pinout jlc order package"
git push origin feature/local-simulation-foundation
```
