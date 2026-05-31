# TellMeLight Rev A4 Enclosure, Glass, and Industrial Design Concept

Date: 2026-06-01

Status: concept draft after Rev A4 routing signoff. Current PCB reference size is 76 mm x 56 mm, and the visible language is the four-bar TellMeLight optical panel.

## Design Direction

Rev A4 should treat the PCB as the hidden electronics layer and make the front face feel like a small AI-status object, not a dev board. The enclosure can use a thin rounded-rectangle body with a soft chamfer, a USB-C opening on one short side, and a separate front window for the four-bar light language.

Preferred stack:

- Front: smoked glass or hard-coated PMMA lens, slightly larger than the four-bar diffuser area.
- Optical layer: frosted diffuser film or milky PC insert under each bar, with enough mixing distance above D1-D6.
- Body: matte black or dark graphite plastic/aluminum enclosure, with internal bosses aligned to H1-H4.
- Back: service-side access for BOOT/RESET only if needed; otherwise keep buttons hidden behind pinholes.

## Four-Bar Optical Panel

The four-bar window should keep the current logo-inspired rhythm:

- Left long bar: D1 and D2, oldest session side.
- Left short bar: D3.
- Right short bar: D4.
- Right long bar: D5 and D6, newest session side.

Each bar should be an irregular rounded trapezoid rather than a plain rectangle. The optical diffuser should be one continuous hidden layer, but the visible mask should define four separated apertures so the product reads as a designed object when idle.

## Glass and Diffuser Notes

For the first industrial design sample, use smoked PMMA instead of real glass unless the vendor can cheaply supply CNC/tempered glass. PMMA is safer, easier to iterate, and can be laser cut or CNC milled. Real glass can come later for a premium version.

The diffuser should be far enough from the RGB LED emitters to avoid six obvious hotspots. If the enclosure height is tight, prefer deeper milky diffuser material over making the front lens too dark.

## Mechanical Constraints For Next Phase

- Keep USB-C centered on the side opening and leave cable clearance.
- Preserve H1-H4 access for M2 mounting or internal bosses.
- Do not expose the PCB edge unless it is intentionally framed.
- Leave at least a small gasket/lip between the lens and the enclosure shell to hide adhesive and tolerance.
- Keep the avatar watermark and `By Joey.qiao` as PCB silkscreen identity, not the primary exterior branding.

## Open Decisions

- A: injection-mold-like plastic body with smoked PMMA front, best for low cost and iteration.
- B: CNC aluminum frame with smoked PMMA/glass front, best for a more premium tech feel.
- C: transparent or translucent full-front shell, more experimental but riskier because internal LEDs and SMT parts may become visually noisy.

Recommended next concept: option A for first JLC prototype enclosure, with option B reserved for the beauty prototype after the PCB is electrically validated.
