# Rev A1 JLC Fabrication Candidate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and verify a Rev A1 KiCad/BOM/manufacturing baseline aimed at JLC/JLCPCB SMT assembly.

**Architecture:** Keep Rev A as the preserved exploratory baseline and create a separate Rev A1 project tree. A Node generator writes deterministic docs, BOM, sourcing, schematic symbol assets, and power tables. A KiCad Python generator creates the 4-layer PCB floorplan using stock footprints, JLC-oriented component choices, and front/back assembly separation.

**Tech Stack:** KiCad 10.0.3 CLI, KiCad `pcbnew` Python API, JavaScript ES modules, Node `node:test`, PowerShell runner.

---

## File Structure

- Create `hardware/kicad/tellmelight_rev_a1/`: Rev A1 KiCad project, schematic, board, symbol table, and local README.
- Create `hardware/bom/rev_a1_bom.csv`: design BOM with selected footprints and JLC candidate part codes.
- Create `hardware/bom/rev_a1_jlc_sourcing.csv`: order-prep sourcing table with C-codes and risk status.
- Create `hardware/simulation/rev_a1_power_budget.csv`: machine-readable Rev A1 current budget.
- Create `hardware/simulation/rev_a1_power_budget.md`: readable Rev A1 power notes.
- Create `hardware/outputs/rev_a1/`: ERC, DRC, Gerbers, drill, position, STEP, PDF/SVG, PNG, and summary output.
- Create `hardware/notes/rev-a1-jlc-readiness.md`: human review checklist for JLC assembly readiness.
- Create `tools/hardware/generate-rev-a1-kicad.mjs`: deterministic Rev A1 project/document generator.
- Create `tools/hardware/generate_rev_a1_board.py`: KiCad `pcbnew` board generator.
- Create `host/test/hardware-rev-a1-assets.test.js`: tests for Rev A1 decisions and generated artifacts.
- Modify `README.md`: add Rev A1 generation and verification commands.
- Modify `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: record generated Rev A1 checkpoint after verification.

## Task 1: Rev A1 Tests

- [ ] **Step 1: Add failing tests**

Create `host/test/hardware-rev-a1-assets.test.js` with these assertions:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

test('rev A1 spec records JLC-oriented manufacturing decisions', async () => {
  const spec = await readText('docs/superpowers/specs/2026-05-30-rev-a1-jlc-fabrication-candidate-design.md');

  assert.match(spec, /4-layer PCB/);
  assert.match(spec, /double-sided SMT/);
  assert.match(spec, /pogo\/test pads/);
  assert.match(spec, /C427525/);
  assert.match(spec, /C2827321/);
});
```

Add more tests in the same file for BOM, sourcing table, board, readiness note, and power budget:

```js
test('rev A1 generated files contain the required JLC candidate components', async () => {
  const bom = await readText('hardware/bom/rev_a1_bom.csv');
  const sourcing = await readText('hardware/bom/rev_a1_jlc_sourcing.csv');

  for (const token of ['RP2040', 'LP5024RSMR', 'W25Q32JVSSIQ', 'AP2112K-3.3TRG1', 'TPD2EUSB30DRTR', 'TYPE-C-31-M-12', 'S4-3528RGBTA-A']) {
    assert.match(bom, new RegExp(token.replaceAll('.', '\\.')));
  }

  for (const code of ['C2040', 'C427525', 'C82344', 'C51118', 'C94934', 'C165948', 'C2827321']) {
    assert.match(sourcing, new RegExp(code));
  }
});
```

```js
test('rev A1 KiCad PCB reflects 4-layer JLC productization direction', async () => {
  const pcb = await readText('hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb');

  for (const ref of ['U1', 'U2', 'U3', 'U4', 'U5', 'J1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'TP_SWDIO', 'TP_SWCLK']) {
    assert.match(pcb, new RegExp(`\\b${ref}\\b`));
  }

  assert.match(pcb, /In1\.Cu/);
  assert.match(pcb, /In2\.Cu/);
  assert.match(pcb, /LED_RGB_Wuerth-PLCC4_3\.2x2\.8mm/);
  assert.doesNotMatch(pcb, /PinHeader_1x05/);
});
```

```js
test('rev A1 readiness and power notes capture no-hand-solder review gates', async () => {
  const readiness = await readText('hardware/notes/rev-a1-jlc-readiness.md');
  const power = await readText('hardware/simulation/rev_a1_power_budget.md');

  assert.match(readiness, /No assumed user hand-soldering/);
  assert.match(readiness, /JLC DFM review/);
  assert.match(readiness, /double-sided SMT/);
  assert.match(power, /Typical visible load/);
  assert.match(power, /USB current target/);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-rev-a1-assets.test.js
```

Expected: FAIL because the Rev A1 generated files do not exist yet.

## Task 2: Rev A1 Document Generator

- [ ] **Step 1: Create `tools/hardware/generate-rev-a1-kicad.mjs`**

Copy the useful deterministic helpers from `tools/hardware/generate-rev-a-kicad.mjs`, then change the constants to Rev A1 paths:

```js
const projectDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a1');
const outputsDir = join(repoRoot, 'hardware', 'outputs', 'rev_a1');
const projectPath = join(projectDir, 'tellmelight_rev_a1.kicad_pro');
const schematicPath = join(projectDir, 'tellmelight_rev_a1.kicad_sch');
const boardPath = join(projectDir, 'tellmelight_rev_a1.kicad_pcb');
```

The generator must write:

- `tellmelight_rev_a1.kicad_pro`
- `tellmelight_rev_a1.kicad_sch`
- `tellmelight_rev_a1.kicad_sym`
- `sym-lib-table`
- `README.md`
- `hardware/bom/rev_a1_bom.csv`
- `hardware/bom/rev_a1_jlc_sourcing.csv`
- `hardware/simulation/rev_a1_power_budget.csv`
- `hardware/simulation/rev_a1_power_budget.md`
- `hardware/notes/rev-a1-jlc-readiness.md`

- [ ] **Step 2: Add Rev A1 BOM rows**

The BOM header must be:

```csv
Designator,Qty,Kind,Value,Footprint,Preferred Part,JLC Candidate,Assembly Side,Notes,Status
```

Required rows:

```csv
U1,1,MCU,RP2040,Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias,Raspberry Pi RP2040,C2040,Bottom,USB device controller; QFN-56 7x7 mm,review
U2,1,LED_DRIVER,LP5024RSMR,Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias,TI LP5024RSMR,C427525,Bottom,24-channel I2C RGB LED driver; 18 channels used,review
D1-D6,6,RGB_LED,S4-3528RGBTA-A,LED_SMD:LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100,OPSCO S4-3528RGBTA-A,C2827321,Top,Common-anode RGB emitters under diffuser bars,review
```

- [ ] **Step 3: Add sourcing table rows**

The sourcing table header must be:

```csv
Designator,Preferred Part,JLC Candidate,Library Status,Assembly Risk,Action Before Order
```

The main active/mechanical rows must include `C2040`, `C427525`, `C82344`, `C51118`, `C94934`, `C165948`, and `C2827321`.

- [ ] **Step 4: Add readiness note**

`hardware/notes/rev-a1-jlc-readiness.md` must include these exact review gates:

```markdown
- No assumed user hand-soldering.
- JLC DFM review before ordering.
- Double-sided SMT assembly pricing and capability check.
- LP5024 VQFN exposed-pad paste and thermal-pad review.
- RGB LED pinout verification against the final JLC selected part.
- USB-C connector footprint and shell grounding review.
```

## Task 3: Rev A1 Board Generator

- [ ] **Step 1: Create `tools/hardware/generate_rev_a1_board.py`**

Start from `tools/hardware/generate_rev_a_board.py`, then change:

- Board title to `TellMeLight Rev A1`.
- Revision to `A1`.
- LED footprint to `LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100`.
- SWD header footprint to individual `TestPoint:TestPoint_Pad_D1.0mm` pads named `TP_SWDIO`, `TP_SWCLK`, `TP_RUN`, `TP_3V3`, and `TP_GND`.

- [ ] **Step 2: Configure 4-layer stack**

Add internal copper layers before saving the board. The board file must include these layer names:

```text
In1.Cu
In2.Cu
```

If the `pcbnew` API call is not stable for layer-count setup, post-process the generated board text to insert the 4-layer `(layers ...)` block while preserving KiCad readability.

- [ ] **Step 3: Keep front/back product placement**

Placement requirements:

- D1-D6 on the front.
- U1, U2, U3, U4, U5, J1, passives, service buttons, and test pads on the back.
- Mounting holes remain mechanical and unassembled.

- [ ] **Step 4: Add JLC-oriented board markings**

Add front/back text:

```text
TellMeLight Rev A1
JLC SMT review
No hand solder
```

## Task 4: Generate Rev A1 Assets

- [ ] **Step 1: Run generator**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a1-kicad.mjs
```

Expected: `Generated Rev A1 KiCad hardware baseline` appears.

- [ ] **Step 2: Run Rev A1 tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-rev-a1-assets.test.js
```

Expected: PASS.

## Task 5: KiCad CLI Verification And Exports

- [ ] **Step 1: Run schematic checks**

```powershell
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a1/erc.json hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
& E:\kicad\bin\kicad-cli.exe sch export bom -o hardware/outputs/rev_a1/bom_from_kicad.csv hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
& E:\kicad\bin\kicad-cli.exe sch export netlist -o hardware/outputs/rev_a1/netlist.xml hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_sch
```

- [ ] **Step 2: Run PCB checks and exports**

```powershell
& E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a1/drc.json hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export gerbers -o hardware/outputs/rev_a1/gerbers hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export drill -o hardware/outputs/rev_a1/drill hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export pos -o hardware/outputs/rev_a1/pos hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb export step -o hardware/outputs/rev_a1/tellmelight_rev_a1.step hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a1/tellmelight_rev_a1_top.png --side top --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
& E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a1/tellmelight_rev_a1_bottom.png --side bottom --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a1/tellmelight_rev_a1.kicad_pcb
```

- [ ] **Step 3: Write verification summary**

Create `hardware/outputs/rev_a1/verification-summary.md` recording:

- Commands run.
- ERC result.
- DRC result.
- STEP/render warnings.
- Remaining order blockers.

## Task 6: Repository Docs And Final Verification

- [ ] **Step 1: Update `README.md`**

Add the Rev A1 generator command and output paths near the Rev A hardware commands.

- [ ] **Step 2: Update progress log**

Append a Rev A1 generated-assets checkpoint to `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`.

- [ ] **Step 3: Run all repository tests**

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
git add README.md docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md host/test/hardware-rev-a1-assets.test.js tools/hardware/generate-rev-a1-kicad.mjs tools/hardware/generate_rev_a1_board.py hardware/bom/rev_a1_bom.csv hardware/bom/rev_a1_jlc_sourcing.csv hardware/kicad/tellmelight_rev_a1 hardware/notes/rev-a1-jlc-readiness.md hardware/simulation/rev_a1_power_budget.csv hardware/simulation/rev_a1_power_budget.md hardware/outputs/rev_a1
git commit -m "feat: add rev a1 jlc hardware baseline"
git push origin feature/local-simulation-foundation
```
