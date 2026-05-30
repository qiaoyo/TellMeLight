# TellMeLight Rev A3 JLC Preflight Package

Generated: 2026-05-30
Status: PREFLIGHT_NOT_FOR_ORDER

Do not pay for boards from this package. It is only for JLC part matching, rough cost discovery, and checking how the four Rev A3 protection additions appear in the BOM workflow.

## What This Package Is

- `assembly/rev_a3_jlc_bom_preflight.csv`: Rev A2 assembly BOM plus U6/R9/C17/R10 protection additions.
- `assembly/rev_a3_jlc_cpl_draft.csv`: Rev A2 CPL with draft-only rows for the four new protection parts.
- `tellmelight_rev_a3_jlc_assembly_preflight.zip`: convenience zip containing the assembly preflight CSV files.
- `review/`: copied Rev A3 protection notes and tonight's JLC checklist.

## What This Package Is Not

- It is not a final Rev A3 Gerber package.
- It is not a final Rev A3 CPL.
- The Rev A2 Gerber can still be used for PCB quote practice, but the Rev A3 protection rows are not physically present on that Rev A2 PCB.
- If JLC reports unmatched placements, extra components, or missing footprints for U6/R9/C17/R10, that is expected until the real Rev A3 KiCad PCB/Gerber/CPL is generated.

## Protection Additions To Check

| Ref | Function | JLC/LCSC candidate |
| --- | --- | --- |
| U6 | VLED TVS/ESD from VLED to GND | C436349 |
| R9 | USB-C shell bleed to GND | C22935 |
| C17 | USB-C shell RF shunt to GND | C57112 |
| R10 | VBUS-to-VLED 0R source link | C21189 |

Use this alongside the Rev A2 Gerber upload only to learn JLC's quote and matcher behavior. Stop before payment.
