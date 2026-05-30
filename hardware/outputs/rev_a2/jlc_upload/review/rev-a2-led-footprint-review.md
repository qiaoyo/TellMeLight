# Rev A2 RGB LED Footprint Review

Date: 2026-05-30

## Part

- JLC/LCSC code: C2827321.
- Manufacturer/listing name: TUOZHAN / S4-3528RGBTA-A.
- Package in datasheet: SMD3528-4P, 3.5 mm x 2.8 mm.
- LED type: Common Anode RGB.
- Datasheet: https://datasheet.lcsc.com/datasheet/pdf/341ab1a3675a770275b38577ba3ea83d.pdf
- JLC part page: https://jlcpcb.com/partdetail/OPSCOOptoelectronics-S4_3528RGBTA_A/C2827321

## Datasheet Pinout

The datasheet mechanical drawing shows pin 1 on the left/top pad when the package marking is viewed in the drawing orientation. The equivalent-circuit drawing maps the pins as:

- Pin 1 = blue cathode.
- Pin 2 = common anode.
- Pin 3 = green cathode.
- Pin 4 = red cathode.

## KiCad Footprint Decision

Rev A1 used the stock KiCad Wurth PLCC4 footprint. That footprint marks pad 1 on the right/top side, which is opposite the TUOZHAN datasheet orientation. Rev A2 therefore uses a local project footprint:

`TellMeLight_Rev_A2:LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm`

Local pad locations:

| Pad | Local coordinate | Electrical role |
| --- | --- | --- |
| 1 | x -1.55 mm, y -0.70 mm | Blue cathode |
| 2 | x -1.55 mm, y +0.70 mm | Common anode to VLED |
| 3 | x +1.55 mm, y -0.70 mm | Green cathode |
| 4 | x +1.55 mm, y +0.70 mm | Red cathode |

## LP5024 Channel Mapping

Each session RGB group uses OUTn red, OUTn+1 green, OUTn+2 blue:

- Red channel -> LED pad 4.
- Green channel -> LED pad 3.
- Blue channel -> LED pad 1.
- Common anode -> LED pad 2 -> VLED.

## Remaining Manufacturing Gate

The pinout/footprint mapping is now resolved locally. JLC orientation preview remains RED before order because the SMT viewer must show D1-D6 rotated the same way as the datasheet footprint orientation.
