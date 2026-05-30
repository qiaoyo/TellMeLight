# TellMeLight Rev A2 Verification Summary

Date: 2026-05-30

## Commands Run

- `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a2-order-package.mjs`
- `powershell -ExecutionPolicy Bypass -File tools/run-node.ps1 tools/hardware/generate-rev-a2-kicad.mjs`
- `E:\kicad\bin\kicad-cli.exe sch erc --format json -o hardware/outputs/rev_a2/erc.json hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_sch`
- `E:\kicad\bin\kicad-cli.exe pcb drc --format json -o hardware/outputs/rev_a2/drc.json hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe pcb export gerbers -o hardware/outputs/rev_a2/gerbers hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe pcb export drill -o hardware/outputs/rev_a2/drill hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe pcb export pos -o hardware/outputs/rev_a2/pos hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a2/tellmelight_rev_a2_top.png --side top --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe pcb render -o hardware/outputs/rev_a2/tellmelight_rev_a2_bottom.png --side bottom --width 1600 --height 1200 hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe sch export pdf -o hardware/outputs/rev_a2/tellmelight_rev_a2_schematic.pdf hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_sch`
- `E:\kicad\bin\kicad-cli.exe sch export svg -o hardware/outputs/rev_a2/schematic_svg hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_sch`
- `E:\kicad\bin\kicad-cli.exe pcb export pdf -o hardware/outputs/rev_a2/tellmelight_rev_a2_pcb.pdf --layers F.Cu,In1.Cu,In2.Cu,B.Cu,F.Silkscreen,B.Silkscreen,Edge.Cuts hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe pcb export svg -o hardware/outputs/rev_a2/tellmelight_rev_a2_pcb_top.svg --layers F.Cu,F.Silkscreen,Edge.Cuts hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe pcb export svg -o hardware/outputs/rev_a2/tellmelight_rev_a2_pcb_bottom.svg --layers B.Cu,B.Silkscreen,Edge.Cuts hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`
- `E:\kicad\bin\kicad-cli.exe pcb export step -o hardware/outputs/rev_a2/tellmelight_rev_a2.step hardware/kicad/tellmelight_rev_a2/tellmelight_rev_a2.kicad_pcb`

## Results

- ERC: 0 violations. Report: `hardware/outputs/rev_a2/erc.json`.
- DRC: 0 violations and 0 unconnected items. Report: `hardware/outputs/rev_a2/drc.json`.
- Gerbers exported under `hardware/outputs/rev_a2/gerbers/`.
- Drill file exported under `hardware/outputs/rev_a2/drill/`.
- Position file exported at `hardware/outputs/rev_a2/pos`.
- Top render exported: `hardware/outputs/rev_a2/tellmelight_rev_a2_top.png`.
- Bottom render exported: `hardware/outputs/rev_a2/tellmelight_rev_a2_bottom.png`.
- Schematic PDF/SVG, PCB PDF/SVG, and STEP review files were generated.

## Rev A2 CAD Corrections

- U5 uses `Package_TO_SOT_SMD:Texas_DRT-3` for `TPD2EUSB30DRTR`.
- D1-D6 use `TellMeLight_Rev_A2:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm`.
- R7 and R8 are added for LP5024 IREF and EN support.
- C15 and C16 are added for LP5024 VCAP and VCC local capacitors.
- RGB LED pinout is mapped to the TUOZHAN datasheet: pin 1 blue cathode, pin 2 common anode, pin 3 green cathode, pin 4 red cathode.
- The board silkscreen now marks Rev A2 and keeps the JLC orientation gate visible.

## Warnings And Remaining Blockers

- JLC orientation preview remains RED for D1-D6 and all other polarized/oriented parts. Do not order until the JLC SMT viewer confirms placement and rotation.
- STEP export created `hardware/outputs/rev_a2/tellmelight_rev_a2.step`, but KiCad reported missing stock 3D models for `J1` USB-C and `U2` LP5024 VQFN. This affects visual/mechanical preview only, not ERC/DRC.
- USB-C shell grounding is still YELLOW because it depends on enclosure/mechanical strategy.
- Crystal/load-cap values are still YELLOW and should be recalculated before release.
