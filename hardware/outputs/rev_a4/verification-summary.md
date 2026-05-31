# TellMeLight Rev A4 Verification Summary

Date: 2026-05-31

Status: `NOT_FOR_PAYMENT`

## KiCad DRC

- Command: `E:\kicad\bin\kicad-cli.exe pcb drc --format json --refill-zones --save-board -o hardware/outputs/rev_a4/drc.json hardware/kicad/tellmelight_rev_a4/tellmelight_rev_a4.kicad_pcb`
- Result: `0 violations`
- Unconnected items: `28`

This is not an order-ready result. The copper geometry is clean after autoroute import, but the board is still electrically incomplete because DRC reports unconnected items.

## Autoroute Experiment

- KiCad exported `hardware/outputs/rev_a4/tellmelight_rev_a4_fanout.dsn`.
- Freerouting v2.2.3 generated `hardware/outputs/rev_a4/tellmelight_rev_a4_autorouted.ses`.
- KiCad imported the SES and refilled zones.

## Payment Gate

Do not pay for Rev A4 at JLC until a later revision reaches:

- `DRC: 0 violations and 0 unconnected items`
- JLC Gerber preview correct
- JLC SMT orientation preview manually checked
