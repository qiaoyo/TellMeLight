# Rev A5 Budget EVT Firmware

Target hardware:

- Seeed Studio XIAO RP2040.
- Seeed 6x10 RGB WS2812 Matrix for XIAO.
- Matrix signal on XIAO D0.

## Flash

1. Download CircuitPython for Seeed Studio XIAO RP2040:
   https://circuitpython.org/board/seeeduino_xiao_rp2040/
2. Hold BOOT, plug the XIAO into USB, and wait for the `RPI-RP2` drive.
3. Copy the CircuitPython `.uf2` file to `RPI-RP2`.
4. Wait for the `CIRCUITPY` drive.
5. Copy `firmware/rev_a5_budget_evt/code.py` to `CIRCUITPY/code.py`.

## Smoke Test

Find the COM port in Windows Device Manager, then run from the repository:

```powershell
powershell -ExecutionPolicy Bypass -File tools/rev_a5/send-serial-state.ps1 -Port COM7 -States running,approval,done,error,idle,running -Brightness 0.12
```

Replace `COM7` with the real port.

## Serial Protocol

Send one JSON line:

```json
{"slots":["idle","running","approval","done","error","running"],"brightness":0.12}
```

Supported states:

- `idle`
- `running`
- `approval`
- `done`
- `error`
- `cleared`

Brightness is clamped in firmware to protect USB power and eyes.

