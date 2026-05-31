# TellMeLight Rev A4 Verification Summary

Date: 2026-06-01

Status: `READY_FOR_JLC_PREVIEW_NOT_PAYMENT`

## KiCad DRC

- Command: `E:\kicad\bin\kicad-cli.exe pcb drc --format json --refill-zones --save-board -o hardware/outputs/rev_a4/drc.json hardware/kicad/tellmelight_rev_a4/tellmelight_rev_a4.kicad_pcb`
- DRC: 0 error violations, 0 unconnected items, and 10 via_dangling warnings.
- Ordinary JLC via rule: 0.45 mm outer diameter / 0.25 mm drill; no 0.10 mm drill microvias are used.
- Routing class: 0.10 mm trace / 0.10 mm clearance for the compact QFN fanout.
- Report: `hardware/outputs/rev_a4/drc.json`.

## Routing Flow

- Generated Rev A4 fanout board with `TML_A4_FANOUT_ONLY=1`.
- Exported `hardware/outputs/rev_a4/tellmelight_rev_a4_fanout.dsn`.
- Routed with Freerouting v2.2.3 to `hardware/outputs/rev_a4/tellmelight_rev_a4_autorouted.ses`.
- Imported the SES and added the manual D5_R completion route with `tools/hardware/finalize_rev_a4_route.py`.

## Manufacturing Exports

- Gerbers: 27 files under `hardware/outputs/rev_a4/gerbers/`.
- Drill: `hardware/outputs/rev_a4/drill/tellmelight_rev_a4.drl`.
- Position export: `hardware/outputs/rev_a4/pos/tellmelight_rev_a4.pos`.
- Review files: PDF, top SVG, bottom SVG, STEP, top PNG render, and bottom PNG render under `hardware/outputs/rev_a4/`.
- STEP export completed, with missing KiCad 3D model warnings for J1, U2, and U6 only. This affects visual 3D completeness, not Gerber copper/drill export.

## Payment Gate

Do not pay for Rev A4 until JLC preview confirms:

- Gerber/drill upload correct.
- 4 layers and 76 mm x 56 mm board size recognized.
- JLC DFM accepts ordinary 0.45 mm outer / 0.25 mm drill vias and 0.10 mm trace/clearance without advanced/HDI pricing.
- KiCad's remaining `via_dangling` items are warnings only; confirm JLC DFM does not treat them as fabrication blockers.
- SMT orientation preview checked for D1-D6, U2, U5, U6, J1, Y1, SW1, and SW2.
