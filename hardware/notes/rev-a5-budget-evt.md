# Rev A5 Budget EVT Guide

Date: 2026-06-02

Status: `BUDGET_EVT_READY_FOR_PURCHASE_REVIEW`

## Executive Decision

Do not buy the Rev A4 five-piece full-SMT PCBA. The quoted RMB 820.63 is outside the user's RMB 300 first-demo ceiling and is not the right risk profile for a personal demo.

Rev A5 uses commercial modules instead of a custom assembled PCB:

- Seeed Studio XIAO RP2040, preferably pre-soldered.
- Seeed 6x10 RGB WS2812 Matrix for XIAO.
- CircuitPython firmware from `firmware/rev_a5_budget_evt/code.py`.
- Windows serial smoke sender from `tools/rev_a5/send-serial-state.ps1`.
- Simple optical stack: diffuser plus black mask before any glass or formal enclosure.

## Why This Is The New Default

The light task is simple: receive six session states and show colors/animation. A custom RP2040 + LP5024 board adds QFN assembly, double-sided SMT, JLC setup, stencil, feeder/loading, and orientation risk before the product behavior is proven.

JLCPCB lists PCBA pricing categories including setup fee, stencil, solder joint fee, components, and feeder loading fee. The user's Rev A4 cart showed the same pattern: the fixed processing fees dominated the low component cost. Rev A5 therefore removes JLC PCBA from the first physical prototype.

## Buy-Now Cart

The checked buy-now cost model is `hardware/bom/rev_a5_budget_evt_bom.csv`.

| Item | Buy | Budget |
| --- | --- | ---: |
| Seeed Studio XIAO RP2040 pre-soldered | Required | RMB 45 |
| 6x10 RGB WS2812 Matrix for XIAO | Required | RMB 50 |
| USB-C data cable | Required if none on hand | RMB 15 |
| Frosted acrylic or translucent PC diffuser | Required | RMB 35 |
| Black mask material or black vinyl | Required | RMB 15 |
| M2 spacers, screws, foam tape, insulation | Required | RMB 25 |
| Shipping and price variance buffer | Required | RMB 50 |
| **Total guarded cart** |  | **RMB 235** |

Hard stop: if the real cart is above RMB 300, do not buy. If the real cart is above RMB 240, pause and check which line moved.

## Purchase Search Terms

Use these search terms in domestic stores or official Seeed channels:

- `Seeed Studio XIAO RP2040 预焊 排针 USB-C`
- `6x10 RGB WS2812 Matrix for XIAO 104030107`
- `磨砂亚克力 1mm 2mm 小片`
- `黑色遮光胶带 黑色乙烯基贴纸`
- `M2 铜柱 螺丝 尼龙垫片`
- `USB-C 数据线`

Avoid buying:

- Any Rev A4 PCBA / JLC SMT order.
- Un-soldered XIAO unless a soldering path is available.
- Full-white high-power LED strips for Rev A5.
- Decorative glass before the LED/diffuser brightness is tested.

## Optional Fallback

If the XIAO 6x10 matrix cannot be sourced quickly:

- Buy XIAO RP2040.
- Buy Grove Base for XIAO.
- Buy Grove RGB LED Stick (10 WS2813 Mini).

This fallback is still below the Rev A4 PCBA cost, but it is not the default because it needs more space and gives less control over the six trapezoid regions.

## Assembly

1. Mount the 6x10 matrix on the XIAO RP2040 according to the XIAO add-on orientation.
2. Connect the XIAO to Windows with a USB-C data cable.
3. Do not add the diffuser yet; first prove the bare matrix lights.
4. Flash CircuitPython for Seeed Studio XIAO RP2040.
5. Copy `firmware/rev_a5_budget_evt/code.py` to the `CIRCUITPY` drive as `code.py`.
6. After the board reboots, it should show a short color self-test and then wait for USB serial frames.
7. Send a smoke frame from Windows:

```powershell
powershell -ExecutionPolicy Bypass -File tools/rev_a5/send-serial-state.ps1 -Port COM7 -States running,approval,done,error,idle,running -Brightness 0.12
```

Replace `COM7` with the actual XIAO serial port.

## Optical Stack

The first optical prototype should be cheap and reversible:

1. LED matrix.
2. 1 mm to 3 mm spacer or foam tape gap.
3. Frosted acrylic / translucent PC diffuser.
4. Black mask with six trapezoid windows.
5. Temporary backing plate or 3D printed holder.

Do not use glass in Rev A5. Glass adds cost, cutting risk, edge safety work, and time before the light language is validated. After the diffuser/mask works, glass or coated acrylic can become Rev A6 industrial design work.

## Six-Slot Matrix Mapping

The firmware treats the 6x10 matrix as six logical regions:

- Slot 0: oldest left-long upper region.
- Slot 1: oldest left-long lower region.
- Slot 2: middle-left short region.
- Slot 3: middle-right short region.
- Slot 4: right-long upper region.
- Slot 5: newest right-long lower region.

The visible front mask can keep the ByteDance-inspired shape while the matrix underneath stays cheap and robust.

## State Language

- `idle`: off.
- `running`: blue breathing.
- `approval`: amber breathing.
- `done`: green steady.
- `error`: red persistent pulse.
- `cleared`: off.

The firmware keeps completed and error states visible until the host sends a new FIFO state frame.

## Reliability Gates

Before buying:

- Total cart is less than RMB 300.
- Controller is pre-soldered or soldering help is available.
- USB-C cable is known to transfer data.
- The matrix is the XIAO version using D0, not a random incompatible LED board.

Before enclosing:

- Bare matrix lights from the smoke command.
- Brightness `0.12` is visible through one diffuser layer.
- No reset occurs during running/approval breathing.
- The board does not become hot after 30 minutes at normal brightness.

Before spending on enclosure:

- The six windows are readable from the expected viewing distance.
- The diffuser does not merge adjacent session zones too much.
- The mask hides the raw square matrix enough to feel product-like.

## Host Integration Path

Short term:

- Existing host simulation remains the source of truth.
- A Windows script sends a complete six-slot state frame to the XIAO.

Next software step:

- Use `host/src/rev-a5-frame-cli.js` to turn the current Host Bridge `/v1/slots` snapshot into the same JSON-line frame accepted by the firmware.
- Add a direct serial transport later if the manual PowerShell sender is too clumsy after the hardware arrives.
- Keep the USB serial protocol stable so firmware does not need to track host internals.

## Sources

- JLCPCB PCBA cost categories: https://jlcpcb.com/help/article/pcb-assembly-price
- XIAO RP2040 product page: https://www.seeedstudio.com/XIAO-RP2040-v1-0-p-5026.html
- CircuitPython XIAO RP2040 page: https://circuitpython.org/board/seeeduino_xiao_rp2040/
- XIAO 6x10 RGB Matrix product page: https://www.seeedstudio.com/6x10-RGB-MATRIX-for-XIAO-p-5771.html
- XIAO 6x10 RGB Matrix wiki: https://wiki.seeedstudio.com/rgb_matrix_for_xiao/
- Grove RGB LED Stick fallback: https://www.seeedstudio.com/Grove-RGB-LED-Stick-10-WS2813-Mini.html
