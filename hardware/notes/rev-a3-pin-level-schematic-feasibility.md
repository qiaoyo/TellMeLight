# Rev A3 Pin-Level Schematic Feasibility

Date: 2026-05-30

Rev A3 starts the transition from the Rev A2 block-level schematic/net plan toward a real pin-level KiCad schematic. This checkpoint creates a machine-readable pin netlist first, because it is easier to review and test before generating KiCad schematic geometry.

Rev A2 remains NOT_FOR_ORDER. The current Rev A2 Gerbers/BOM/CPL can be used for quote-upload practice, but not for payment or fabrication release.

## Generated Assets

- `hardware/netlists/rev_a3_pin_netlist.json`: structured component, pin, net, symbol-readiness, and status data.
- `hardware/netlists/rev_a3_pin_netlist.csv`: spreadsheet-friendly pin table for review.
- `hardware/notes/rev-a3-pin-level-schematic-feasibility.md`: this feasibility and next-step note.

## Stock KiCad Symbols Available

- `MCU_RaspberryPi:RP2040` for U1.
- `Memory_Flash:W25Q32JVSS` for U3.
- `Regulator_Linear:AP2112K-3.3` for U4.
- `Power_Protection:TPD2EUSB30` for U5.
- `Connector:USB_C_Receptacle_USB2.0_16P` for J1, with HRO footprint pin mapping still requiring review.

## Stock KiCad Footprints Available

- `Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias` for RP2040.
- `Package_DFN_QFN:VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias` for LP5024.
- `Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12` for USB-C.
- `Package_TO_SOT_SMD:Texas_DRT-3` for TPD2EUSB30DRTR.
- `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm` for W25Q32JVSSIQ.
- `Package_TO_SOT_SMD:SOT-23-5` for AP2112K-3.3.
- `Crystal:Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm` for the C9002 12MHz crystal candidate.
- `Button_Switch_SMD:SW_SPST_EVQP2_ShortPushTravel_H2.1mm` for BOOTSEL and RESET.

## Local Symbols Required

- `TellMeLight_Rev_A3:LP5024RSMR`: KiCad 10 stock symbols do not include LP5024; Rev A3 must create a local 32-pin + exposed-pad symbol and verify the TI pin order.
- `TellMeLight_Rev_A3:LED_RGB_CA_TUOZHAN_S4_3528RGBTA_A`: the generic `Device:LED_RGB` symbol does not encode the TUOZHAN S4-3528RGBTA-A common-anode pin mapping. Rev A3 should use a local symbol that matches C2827321 exactly.

## Electrical Review Notes

- LP5024 OUT0..OUT17 are mapped to D1..D6 RGB cathodes. OUT18..OUT23 remain reserved.
- Every RGB LED pad 2 connects to `VLED`; LP5024 sinks current on the color cathodes.
- USB D+/D- route through R1/R2 27R series resistors, with U5 on the connector side.
- BOOTSEL pulls `FLASH_CS_N_BOOTSEL` low; RESET pulls `RUN_RESET` low.
- C13/C14 33pF and Y1 C9002 remain YELLOW because the final crystal load-capacitance math still needs signoff.
- The USB-C shell `SHIELD` net remains YELLOW until the enclosure/ESD strategy is selected.

## Next Local Step

Generate a Rev A3 KiCad pin-level schematic draft from this netlist with local LP5024 and LED symbols, then run KiCad ERC. The draft should stay clearly marked as not order-ready until ERC, DRC, net parity, JLC orientation preview, USB shell grounding, and crystal review are complete.
