# Rev A3 JLC Tonight Checklist

Date: 2026-05-30

## Tonight goal

今晚的目标是做 JLC 可制造性/报价/器件匹配验证，不是付款下单。Do not pay for boards from the current package yet.

原因很简单：Rev A2 的 Gerber/BOM/CPL 已经可以用于上传流程练习和报价验证，但你刚决定的 Rev A3 保护电路还没有进入新的 KiCad PCB/Gerber/CPL。因此今晚可以验证“JLC 能否识别当前板子和主要器件”，以及“新增保护器件在 JLC 里是否能匹配”，但不要把当前包当最终生产资料。

## Files to open first

1. Open `hardware/outputs/rev_a2/preview.html`.
2. Keep this file open as the index page for renders, JLC bundle, Rev A3 netlist, and open risks.
3. Open `hardware/notes/rev-a3-protection-decisions.md` if you want to see the exact VLED TVS and USB-C shell RC decision.

## JLC quote upload practice

1. Go to JLCPCB/JLC and start a PCB quote.
2. Upload `hardware/outputs/rev_a2/jlc_upload/tellmelight_rev_a2_jlc_gerber_drill.zip`.
3. Confirm JLC recognizes the board as a 4-layer PCB.
4. Record the displayed PCB size, layer count, minimum quantity, and approximate PCB cost.
5. Stop before payment.

## JLC SMT BOM/CPL matching practice

1. Use the current draft package only for matching practice:
   - `hardware/outputs/rev_a2/jlc_upload/tellmelight_rev_a2_jlc_assembly_bom_cpl.zip`
2. If JLC asks separately for BOM and CPL, use:
   - `hardware/bom/rev_a2_jlc_bom.csv`
   - `hardware/bom/rev_a2_jlc_cpl.csv`
3. Confirm whether the main Rev A2 parts match:
   - RP2040 `C2040`
   - LP5024RSMR `C427525`
   - W25Q32JVSSIQ alternate `C179173`
   - AP2112K-3.3TRG1 `C51118`
   - TPD2EUSB30DRTR `C94934`
   - TYPE-C-31-M-12 `C165948`
   - S4-3528RGBTA-A `C2827321`
4. Do not use the current SMT preview for final orientation approval. You already said JLC orientation preview can wait; this is still a later RED gate.

## Rev A3 protection part search

Search these manually in the JLC/LCSC part search or BOM matcher. The file is `hardware/bom/rev_a3_protection_bom_delta.csv`.

| Ref | Function | Candidate | What to check |
| --- | --- | --- | --- |
| U6 | VLED TVS | `TPD1E05U06DPY`, candidate `C436349` | Confirm it is a single-line 5V-class ESD/TVS part, package matches `Texas_DPY0002A_0.6x1mm_P0.65mm`, pin 1 can connect to VLED and pin 2 to GND. |
| R9 | USB-C shell bleed | `1M`, candidate `C22935` | Confirm 0603 resistor availability. |
| C17 | USB-C shell RF shunt | `10nF`, candidate `C57112` | Confirm 0603 capacitor availability, 50V or higher preferred. |
| R10 | VBUS-to-VLED source link | `0R`, candidate `C21189` | Confirm 0603 0R jumper availability. |

## Current electrical decisions

- VLED TVS: add U6 between VLED and GND. This is the lightweight protection path for the LED anode rail.
- VBUS to VLED: add R10 0R so VLED is explicitly sourced from USB VBUS while still easy to isolate or measure.
- USB-C shell RC: use R9 1M and C17 10nF in parallel from shell SHIELD to board GND.
- Crystal: keep C9002 with C13/C14 33pF for now. C9002 is a 20pF-load 12MHz crystal candidate; with about 3pF stray capacitance, the rough external capacitor target is about 34pF, so 33pF is a reasonable working value.

## What to send back to me

1. Screenshot or text of the PCB quote page after Gerber upload.
2. Screenshot or text of any BOM matching failures.
3. Whether JLC finds U6/R9/C17/R10 candidates from `hardware/bom/rev_a3_protection_bom_delta.csv`.
4. Any warning JLC shows about board outline, drill, layer count, or CPL coordinate format.

## Stop conditions

- Do not pay.
- Do not approve JLC orientation preview tonight unless you decide to explicitly do that later.
- If JLC asks for a final corrected BOM/CPL including U6/R9/C17/R10, stop and send me the warning. That means the next task is to generate the Rev A3 KiCad PCB/Gerber/BOM/CPL package with the protection parts included.
