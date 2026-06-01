# Rev A5 Budget EVT Design

Date: 2026-06-02

## Goal

Rev A5 is the first real light-up TellMeLight hardware demo under a hard all-in prototype budget of RMB 300, excluding later decorative enclosure upgrades. The priority is reliable visible LEDs, USB connection to the Windows host, and enough optical/mechanical fidelity to evaluate the product direction.

## Hard Cost Gate

- Target buy-now electronics and first optical/mechanical kit: RMB 240 or less.
- Absolute stop: RMB 300. If a cart exceeds RMB 300, do not buy.
- Any JLC PCBA quote that includes setup, stencil, feeder/loading, or double-sided assembly is out of scope for Rev A5 unless the complete cart is still below RMB 300.
- Rev A4 remains an engineering reference, not the first paid prototype.

This corrects the Rev A4 failure mode: a low component subtotal did not represent total PCBA cost. JLCPCB documents PCBA pricing items such as setup fee, stencil, solder joint fee, components, and feeder loading fee. The user's Rev A4 quote also showed these fixed costs dominating a five-board order.

## Recommended Architecture

Use off-the-shelf modules:

- Controller: Seeed Studio XIAO RP2040, pre-soldered if possible.
- Display: Seeed 6x10 RGB WS2812 Matrix for XIAO.
- Firmware: CircuitPython on XIAO RP2040.
- Host link: Windows USB serial, JSON-lines frames.
- Optics: black mask plus frosted acrylic or PC diffuser; true glass is deferred.

The XIAO RP2040 is cheap, USB-C powered, and officially supports CircuitPython. The 6x10 matrix is a direct XIAO add-on with 60 WS2812 LEDs on D0. This removes the custom RP2040 board, LP5024, QFN fanout, JLC SMT setup cost, and orientation risk from the first physical demo.

## Visual Model

The visible product still uses the ByteDance-inspired six-session display language:

- Six logical slots are mapped onto the 6x10 LED matrix.
- Left and right long bars each contain two session regions.
- Middle short bars each contain one session region.
- New sessions enter on the newest/right side; older sessions shift left.
- `idle` is off, `running` is blue breathing, `approval` is amber breathing, `done` is green steady, `error` is red persistent pulse.

The first optical stack is:

1. XIAO + matrix module.
2. Thin non-conductive spacer or foam tape.
3. Diffuser: 1 mm to 2 mm frosted acrylic or translucent PC.
4. Black mask/front film with six trapezoid windows.
5. Temporary enclosure: 3D-printed or laser-cut plate with M2 spacers.

This prioritizes a believable front face without paying for custom glass or PCBA before the light language is validated.

## Budget Strategy

Buy-now default cart:

- XIAO RP2040 pre-soldered.
- 6x10 RGB WS2812 Matrix for XIAO.
- USB-C data cable if not already available.
- Frosted acrylic/PC diffuser sample.
- Black mask material or black vinyl.
- M2 spacers/screws and foam tape.
- Shipping and variance buffer.

Expected range: RMB 170 to RMB 260. The cost model lives in `hardware/bom/rev_a5_budget_evt_bom.csv` and is checked by `tools/hardware/check-rev-a5-budget.mjs`.

Fallback if the matrix is unavailable:

- XIAO RP2040.
- Grove Base for XIAO.
- Grove RGB LED Stick (10 WS2813 Mini).

This fallback is more physically spread out, but it costs more and gives less spatial freedom than the matrix.

## Safety And Reliability

- Use a pre-soldered XIAO or known-good module to avoid first-build soldering risk.
- Limit firmware brightness by default; 60 WS2812 LEDs must not run full white from USB.
- Use a real USB data cable, not a charge-only cable.
- Do not hot-plug the matrix while powered.
- Keep all metal spacers away from exposed module pads unless insulated.
- First demo uses software current limiting and low duty cycle rather than external high-current LED power.

## Software Contract

The host sends one JSON line over the XIAO USB serial port:

```json
{"slots":["idle","running","approval","done","error","running"],"brightness":0.12}
```

The firmware accepts `slots` as six state strings or `sessions` as objects with `state` fields. It keeps the last state persistent and animates `running`, `approval`, and `error` locally.

## What Is Out Of Scope

- No Rev A5 JLC PCBA order.
- No custom RP2040 board.
- No QFN assembly.
- No glass cutting in the first RMB 300 prototype.
- No battery.
- No wireless path.
- No fully integrated enclosure tooling.

## Sources Checked

- JLCPCB assembly cost categories: https://jlcpcb.com/help/article/pcb-assembly-price
- Seeed XIAO RP2040 product page: https://www.seeedstudio.com/XIAO-RP2040-v1-0-p-5026.html
- CircuitPython XIAO RP2040 support: https://circuitpython.org/board/seeeduino_xiao_rp2040/
- Seeed 6x10 RGB WS2812 Matrix product page: https://www.seeedstudio.com/6x10-RGB-MATRIX-for-XIAO-p-5771.html
- Seeed 6x10 RGB Matrix wiki: https://wiki.seeedstudio.com/rgb_matrix_for_xiao/
- Grove RGB LED Stick fallback: https://www.seeedstudio.com/Grove-RGB-LED-Stick-10-WS2813-Mini.html

