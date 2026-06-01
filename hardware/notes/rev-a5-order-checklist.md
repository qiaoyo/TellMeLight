# Rev A5 Order Checklist

Date: 2026-06-02

## Buy

- Seeed Studio XIAO RP2040, pre-soldered preferred.
- 6x10 RGB WS2812 Matrix for XIAO, SKU 104030107 or exact equivalent.
- USB-C data cable if you do not already have one.
- Frosted acrylic or translucent PC diffuser sheet, 1 mm to 2 mm.
- Black mask material or black vinyl.
- M2 spacers, screws, nylon washers, foam tape.

## Do Not Buy

- Rev A4 JLC five-piece full-SMT PCBA.
- Any JLC SMT/PCBA order for Rev A5.
- Un-soldered boards unless soldering is solved.
- True glass before the LED/diffuser prototype is proven.
- High-current LED strips that need external power for the first demo.

## Verify Before Checkout

- Cart total including shipping is under RMB 300.
- If the cart is above RMB 240, identify the expensive line before buying.
- XIAO has USB-C and supports CircuitPython.
- Matrix is for XIAO and uses D0.
- Items ship quickly enough to avoid paying rush premiums.

## First Smoke Test After Arrival

1. Flash CircuitPython for Seeed Studio XIAO RP2040.
2. Copy `firmware/rev_a5_budget_evt/code.py` to the `CIRCUITPY` drive.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/rev_a5/send-serial-state.ps1 -Port COM7 -States running,approval,done,error,idle,running -Brightness 0.12
```

4. Replace `COM7` with the actual serial port.
5. Run for 30 minutes before adding enclosure layers.

