# TellMeLight Rev A4 JLC Upload Package

Generated: 2026-06-01
Status: READY_FOR_JLC_PREVIEW_NOT_PAYMENT

This is the compact 76 mm x 56 mm Rev A4 routing and JLC-preview package. It includes U6/R9/C17/R10, C18 for RP2040 VREG_VOUT, the top-side A1-style separated avatar watermark, and the persistent By Joey.qiao attribution. KiCad DRC reports 0 error violations, 0 unconnected items, and 10 via_dangling warnings.

This bundle is for JLC size, DFM, BOM/CPL matching, placement, orientation, and silkscreen review. It is not a paid-order release until JLC DFM and orientation preview pass.

## Upload Files

- `tellmelight_rev_a4_jlc_gerber_drill.zip`: Gerber + drill package for PCB quote upload.
- `tellmelight_rev_a4_jlc_assembly_bom_cpl.zip`: JLC BOM + CPL package for SMT matching.
- `assembly/rev_a4_jlc_bom.csv`: JLC BOM.
- `assembly/rev_a4_jlc_cpl.csv`: JLC CPL.

## Manual Gates Before Payment

- Confirm board size is 76 mm x 56 mm and layer count is 4.
- Confirm D1-D6 are RGB C2827321 and orientation is correct.
- Confirm U2 LP5024 pin 1, U5 USB ESD, U6 VLED TVS, J1 USB-C, Y1 passive crystal, SW1, and SW2 orientation.
- Confirm the top-side A1-style separated avatar watermark is on silkscreen and does not overlap pads or the optical diffuser zones.
- Confirm the top-side title includes By Joey.qiao.
- Confirm KiCad DRC has 0 error violations and 0 unconnected items before payment.
- Confirm JLC accepts the ordinary 0.45 mm outer / 0.25 mm drill vias plus 0.10 mm trace/clearance before payment; if it quotes as HDI/advanced, stop and revise via rules.
