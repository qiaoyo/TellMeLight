# Rev A Power Budget Simulation

Date: 2026-05-30

This is a local engineering current budget for the KiCad Rev A baseline. It is not a SPICE model.

| Scenario | 3V3 load | LED channels on | LED current/channel | LED rail current | Approx USB current | LDO dissipation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Idle off | 38 mA | 0 | 0 mA | 0 mA | 38 mA | 65 mW |
| Typical visible load | 45 mA | 18 | 5 mA | 90 mA | 135 mA | 77 mW |
| Breathing peak | 50 mA | 18 | 10 mA | 180 mA | 230 mA | 85 mW |
| Worst-case all channels | 70 mA | 18 | 20 mA | 360 mA | 430 mA | 119 mW |

## Interpretation

- Typical visible load keeps the device comfortably inside a 500 mA USB current budget.
- Worst-case all channels still fits the target budget on paper, but firmware should cap default brightness well below that state.
- The AP2112K-class LDO only supplies 3V3 logic current; LED current is budgeted on the USB VBUS LED rail.
- The RGB LED part remains a sample-and-review item because optical output and diffuser losses will drive the final current limit.
