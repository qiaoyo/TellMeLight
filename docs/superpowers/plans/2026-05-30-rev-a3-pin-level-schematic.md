# Rev A3 Pin-Level Schematic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Rev A3 machine-readable pin netlist into a first KiCad pin-level schematic draft with local LP5024 and TUOZHAN RGB LED symbols.

**Architecture:** Rev A3 should preserve Rev A2 as the latest JLC quote/review bundle and create a separate `hardware/kicad/tellmelight_rev_a3/` project. The generator should read `hardware/netlists/rev_a3_pin_netlist.json`, write local symbols for missing parts, place stock and local symbols into a schematic, and keep all order blockers visible. This plan deliberately targets a schematic draft first; final routing and JLC payment release remain later gates.

**Tech Stack:** KiCad 10.0 CLI, KiCad schematic S-expression files, JavaScript ES modules, Node `node:test`, PowerShell runner.

---

## File Structure

- Create `host/test/hardware-rev-a3-kicad.test.js`: tests for Rev A3 local symbols, schematic contents, and verification summary.
- Create `tools/hardware/generate-rev-a3-kicad.mjs`: reads the Rev A3 netlist and emits the KiCad project/schematic assets.
- Create `hardware/kicad/tellmelight_rev_a3/`: Rev A3 KiCad project directory.
- Create `hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sym`: local schematic symbols.
- Create `hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sch`: pin-level schematic draft.
- Create `hardware/outputs/rev_a3/verification-summary.md`: Rev A3 ERC/export evidence and remaining blockers.
- Modify `README.md`: add Rev A3 generation and verification commands.
- Modify `docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md`: record the Rev A3 schematic checkpoint.

## Task 1: Rev A3 KiCad Asset Tests

- [ ] **Step 1: Add failing tests**

Create `host/test/hardware-rev-a3-kicad.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function readText(path) {
  return readFile(path, 'utf8');
}

test('rev A3 local symbols include LP5024 and exact TUOZHAN RGB LED', async () => {
  const symbols = await readText('hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sym');

  assert.match(symbols, /symbol "LP5024RSMR"/);
  assert.match(symbols, /pin output line/);
  assert.match(symbols, /OUT17/);
  assert.match(symbols, /symbol "LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A"/);
  assert.match(symbols, /Blue cathode/);
  assert.match(symbols, /Common anode/);
  assert.match(symbols, /Red cathode/);
});

test('rev A3 schematic draft contains pin-level nets and order warning', async () => {
  const schematic = await readText('hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sch');

  for (const token of [
    'TellMeLight Rev A3 pin-level schematic draft',
    'NOT_FOR_ORDER',
    'MCU_RaspberryPi:RP2040',
    'TellMeLight_Rev_A3:LP5024RSMR',
    'TellMeLight_Rev_A3:LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A',
    'USB_DP_MCU',
    'USB_DM_CONN',
    'FLASH_CS_N_BOOTSEL',
    'D6_B',
    'LP_IREF',
    'LP_VCAP',
    'VLED',
  ]) {
    assert.match(schematic, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('rev A3 verification summary keeps remaining release blockers visible', async () => {
  const summary = await readText('hardware/outputs/rev_a3/verification-summary.md');

  assert.match(summary, /ERC:/);
  assert.match(summary, /Rev A3 schematic draft/);
  assert.match(summary, /JLC orientation preview remains RED/);
  assert.match(summary, /USB-C shell grounding/);
  assert.match(summary, /crystal load-cap/);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-rev-a3-kicad.test.js
```

Expected: FAIL because Rev A3 KiCad files do not exist yet.

## Task 2: Local Symbol Generation

- [ ] **Step 1: Create `tools/hardware/generate-rev-a3-kicad.mjs` skeleton**

Start with these responsibilities:

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const repoRoot = process.cwd();
const projectDir = join(repoRoot, 'hardware', 'kicad', 'tellmelight_rev_a3');
const outputsDir = join(repoRoot, 'hardware', 'outputs', 'rev_a3');
const netlist = JSON.parse(await readFile(join(repoRoot, 'hardware', 'netlists', 'rev_a3_pin_netlist.json'), 'utf8'));

await Promise.all([
  mkdir(projectDir, { recursive: true }),
  mkdir(outputsDir, { recursive: true }),
]);
```

- [ ] **Step 2: Write local LP5024 symbol**

The generated symbol must include pins 1-32 and `EP`. Pin names must match the Rev A3 netlist: `OUT0` through `OUT23`, `ADDR0`, `ADDR1`, `VCC`, `SDA`, `SCL`, `EN`, `IREF`, `VCAP`, and exposed pad `GND`.

- [ ] **Step 3: Write local LED symbol**

The generated LED symbol must encode the TUOZHAN `S4-3528RGBTA-A` order:

```text
1 Blue cathode
2 Common anode
3 Green cathode
4 Red cathode
```

- [ ] **Step 4: Write `sym-lib-table`**

Use local project library name `TellMeLight_Rev_A3` pointing at `${KIPRJMOD}/tellmelight_rev_a3.kicad_sym`.

## Task 3: Pin-Level Schematic Draft

- [ ] **Step 1: Generate `tellmelight_rev_a3.kicad_pro`**

Copy Rev A2 project settings and replace project/revision names with Rev A3. Keep this as a separate KiCad project so Rev A2 outputs remain untouched.

- [ ] **Step 2: Generate schematic draft from netlist**

Place symbols in logical sheets or grouped areas:

```text
USB and power: J1, U5, R1-R4, U4, C11, C12
MCU and flash: U1, U3, Y1, C13, C14, SW1, SW2, debug pads
LED driver: U2, R5-R8, C15, C16
Emitters: D1-D6 and VLED anode rail
```

Use global labels from `hardware/netlists/rev_a3_pin_netlist.json` for every named net. Add a visible text warning: `Rev A3 schematic draft - NOT_FOR_ORDER`.

- [ ] **Step 3: Run the generator**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a3-kicad.mjs
```

Expected: `hardware/kicad/tellmelight_rev_a3/` and `hardware/outputs/rev_a3/verification-summary.md` exist.

## Task 4: KiCad ERC And Export

- [ ] **Step 1: Run schematic ERC**

Run:

```powershell
& E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a3/erc.json hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sch
```

Expected: ideally 0 violations. If ERC warnings remain because the draft uses label-only review wiring, record each warning in `hardware/outputs/rev_a3/verification-summary.md` instead of hiding it.

- [ ] **Step 2: Export schematic PDF/SVG**

Run:

```powershell
& E:\kicad\bin\kicad-cli.exe sch export pdf -o hardware/outputs/rev_a3/tellmelight_rev_a3_schematic.pdf hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sch
& E:\kicad\bin\kicad-cli.exe sch export svg -o hardware/outputs/rev_a3/schematic_svg hardware/kicad/tellmelight_rev_a3/tellmelight_rev_a3.kicad_sch
```

Expected: schematic exports exist for review.

## Task 5: Docs, Verification, Commit

- [ ] **Step 1: Update README and progress log**

Add the Rev A3 KiCad generation command, ERC command, and output paths.

- [ ] **Step 2: Run targeted tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/hardware-rev-a3-netlist.test.js host/test/hardware-rev-a3-kicad.test.js
```

Expected: all Rev A3 tests pass.

- [ ] **Step 3: Run all tests**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 --test host/test/*.test.js
```

Expected: all tests pass.

- [ ] **Step 4: Run whitespace check**

Run:

```powershell
git diff --check
```

Expected: no output.

- [ ] **Step 5: Commit and push**

Run:

```powershell
git add README.md docs/superpowers/brainstorm/2026-05-29-tellmelight-progress.md host/test/hardware-rev-a3-kicad.test.js tools/hardware/generate-rev-a3-kicad.mjs hardware/kicad/tellmelight_rev_a3 hardware/outputs/rev_a3
git commit -m "feat: add rev a3 pin-level schematic draft"
git push origin feature/local-simulation-foundation
```
