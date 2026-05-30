import importlib.util
import os
import sys
from pathlib import Path

import pcbnew


A1_SCRIPT = Path(__file__).with_name("generate_rev_a1_board.py")
SPEC = importlib.util.spec_from_file_location("rev_a1_board", A1_SCRIPT)
rev_a1 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(rev_a1)

LOCAL_FOOTPRINT_ROOT = None


def load_local_footprint(board, name, reference, value, x, y, rotation=0, bottom=False, show_reference=True):
    if LOCAL_FOOTPRINT_ROOT is None:
        raise RuntimeError("LOCAL_FOOTPRINT_ROOT is not configured")

    footprint = pcbnew.FootprintLoad(LOCAL_FOOTPRINT_ROOT, name)
    if footprint is None:
        raise FileNotFoundError(f"Unable to load local footprint {name} from {LOCAL_FOOTPRINT_ROOT}")

    position = rev_a1.vec(x, y)
    footprint.SetReference(reference)
    footprint.SetValue(value)
    footprint.SetPosition(position)
    footprint.SetOrientationDegrees(rotation)
    board.Add(footprint)
    if bottom:
        footprint.Flip(position, pcbnew.FLIP_DIRECTION_TOP_BOTTOM)
    footprint.Value().SetVisible(False)
    if not show_reference:
        footprint.Reference().SetVisible(False)
    return footprint


def add_board_outline(board):
    outline = [
        (2.0, 0.0),
        (74.0, 0.0),
        (76.0, 2.0),
        (76.0, 54.0),
        (74.0, 56.0),
        (2.0, 56.0),
        (0.0, 54.0),
        (0.0, 2.0),
    ]
    rev_a1.add_polyline(board, pcbnew.Edge_Cuts, outline, 0.1)


def add_diffuser_marks(board):
    bars = [
        ("S1/S2", [(6.5, 5.5), (16.5, 8.0), (16.5, 42.5), (6.5, 46.5)]),
        ("S3", [(24.5, 27.5), (33.0, 29.0), (33.0, 42.0), (24.5, 44.0)]),
        ("S4", [(43.0, 24.0), (52.0, 21.5), (52.0, 38.0), (43.0, 36.5)]),
        ("S5/S6", [(59.0, 4.5), (70.0, 7.5), (70.0, 44.0), (59.0, 49.0)]),
    ]

    for label, points in bars:
        rev_a1.add_polyline(board, pcbnew.Dwgs_User, points, 0.22)
        rev_a1.add_polyline(board, pcbnew.F_SilkS, points, 0.16)
        center_x = sum(point[0] for point in points) / len(points)
        center_y = sum(point[1] for point in points) / len(points)
        rev_a1.add_text(board, label, center_x - 2.1, center_y, pcbnew.Dwgs_User, 0.65)

    rev_a1.add_text(board, "TellMeLight Rev A3", 24.5, 3.5, pcbnew.F_SilkS, 0.8)
    rev_a1.add_text(board, "JLC ORIENT", 27.0, 4.5, pcbnew.B_SilkS, 0.8)


def add_avatar_watermark(board):
    layer = pcbnew.F_SilkS
    width = 0.15

    def line(x1, y1, x2, y2):
        rev_a1.add_line(board, layer, x1, y1, x2, y2, width)

    def poly(points):
        for start, end in zip(points, points[1:]):
            line(start[0], start[1], end[0], end[1])

    rev_a1.add_text(board, "Avatar watermark", 1.6, 55.0, pcbnew.Cmts_User, 0.6)
    rev_a1.add_text(board, "Avatar watermark A1 separated", 1.6, 54.0, pcbnew.Cmts_User, 0.6)

    top_x = 30.0
    top_y = 7.3
    lower_x = 30.0
    lower_y = 14.2
    scale = 0.08

    def top(point):
        return top_x + point[0] * scale, top_y + point[1] * scale

    def lower(point):
        return lower_x + point[0] * scale, lower_y + point[1] * scale

    def poly_mapped(points, mapper):
        poly([mapper(point) for point in points])

    def line_mapped(start, end, mapper):
        mapped_start = mapper(start)
        mapped_end = mapper(end)
        line(mapped_start[0], mapped_start[1], mapped_end[0], mapped_end[1])

    # A1-style separated avatar watermark: full image language, but scaled as
    # a quiet PCB signature instead of a main graphic.
    poly_mapped([(0, 25), (7, 16), (18, 12), (29, 15), (36, 24)], top)
    poly_mapped([(4, 37), (14, 29), (25, 28), (34, 34)], top)
    poly_mapped([(12, 48), (18, 44), (25, 44), (31, 48)], top)

    poly_mapped([(64, 16), (75, 6), (86, 16), (86, 41), (75, 49), (64, 41), (64, 16)], top)
    line_mapped((52, 29), (64, 29), top)
    line_mapped((52, 29), (57, 24), top)
    line_mapped((52, 29), (57, 34), top)
    line_mapped((75, 6), (75, 0), top)

    petals = [
        [(122, 10), (130, 2), (138, 10), (130, 18), (122, 10)],
        [(138, 10), (146, 18), (138, 26), (130, 18), (138, 10)],
        [(138, 26), (130, 34), (122, 26), (130, 18), (138, 26)],
        [(122, 26), (114, 18), (122, 10), (130, 18), (122, 26)],
    ]
    for points in petals:
        poly_mapped(points, top)
    line_mapped((125, 18), (135, 18), top)
    line_mapped((130, 13), (130, 23), top)

    face = [
        (4, 24), (2, 8), (14, 3), (29, 0),
        (40, 8), (48, 22), (39, 36), (26, 45),
        (10, 38), (4, 32), (4, 24),
    ]
    poly_mapped(face, lower)
    line_mapped((22, 10), (23.5, 10), lower)
    line_mapped((22.75, 9.25), (22.75, 10.75), lower)
    line_mapped((58, 25), (153, 25), lower)


def place_components(board):
    led_positions = [
        ("D1", 10.8, 14.0),
        ("D2", 10.8, 36.5),
        ("D3", 29.0, 34.0),
        ("D4", 45.5, 29.0),
        ("D5", 64.0, 15.5),
        ("D6", 64.0, 38.5),
    ]
    for reference, x, y in led_positions:
        load_local_footprint(
            board,
            "LED_RGB_TUOZHAN_S4-3528RGBTA-A_3.5x2.8mm",
            reference,
            "S4-3528RGBTA-A",
            x,
            y,
            rotation=90,
            show_reference=False,
        )

    rev_a1.load_footprint(
        board,
        "Package_DFN_QFN",
        "QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias",
        "U1",
        "RP2040",
        38,
        39,
        bottom=True,
        show_reference=False,
    )
    rev_a1.load_footprint(board, "Package_SO", "SOIC-8_3.9x4.9mm_P1.27mm", "U3", "W25Q32JVSS", 22, 39, bottom=True)
    rev_a1.load_footprint(board, "Package_TO_SOT_SMD", "SOT-23-5", "U4", "AP2112K-3.3", 56, 39, bottom=True)

    # Rev A3 is still an order-review/placement package. Pin-level nets live in
    # hardware/netlists/rev_a3_pin_netlist.json until the routed PCB release.
    rev_a1.load_footprint(
        board,
        "Package_TO_SOT_SMD",
        "Texas_DRT-3",
        "U5",
        "TPD2EUSB30",
        29,
        48,
        bottom=True,
        show_reference=False,
    )

    rev_a1.load_footprint(
        board,
        "Package_SON",
        "Texas_DPY0002A_0.6x1mm_P0.65mm",
        "U6",
        "TPD1E05U06DPY",
        24,
        48,
        bottom=True,
        show_reference=False,
    )

    u2 = rev_a1.load_footprint(
        board,
        "Package_DFN_QFN",
        "VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias",
        "U2",
        "LP5024",
        38,
        24,
        bottom=True,
    )
    u2.SetLocalClearance(rev_a1.mm(0.15))

    usb = rev_a1.load_footprint(
        board,
        "Connector_USB",
        "USB_C_Receptacle_HRO_TYPE-C-31-M-12",
        "J1",
        "USB_C",
        38,
        51,
        rotation=180,
        bottom=True,
    )
    rev_a1.assign_pad_nets(
        board,
        usb,
        {
            "A1": "USB_GND_DUP_1",
            "B12": "USB_GND_DUP_1",
            "A12": "USB_GND_DUP_2",
            "B1": "USB_GND_DUP_2",
            "A4": "USB_VBUS_DUP_1",
            "B9": "USB_VBUS_DUP_1",
            "A9": "USB_VBUS_DUP_2",
            "B4": "USB_VBUS_DUP_2",
        },
    )

    rev_a1.load_footprint(board, "Crystal", "Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm", "Y1", "12MHz", 24, 32, bottom=True)

    service_parts = [
        ("SW1", "BOOT", 61, 48),
        ("SW2", "RESET", 69, 48),
    ]
    for reference, value, x, y in service_parts:
        rev_a1.load_footprint(
            board,
            "Button_Switch_SMD",
            "SW_SPST_EVQP2_ShortPushTravel_H2.1mm",
            reference,
            value,
            x,
            y,
            bottom=True,
        )

    resistor_positions = [
        ("R1", "27R", 32, 44),
        ("R2", "27R", 36, 44),
        ("R3", "5.1k", 50, 49),
        ("R4", "5.1k", 55, 49),
        ("R5", "4.7k", 45, 28),
        ("R6", "4.7k", 49, 28),
        ("R7", "10k IREF", 34, 28),
        ("R8", "10k EN", 54, 28),
        ("R9", "1M SHIELD", 61, 42),
        ("R10", "0R VLED", 47, 45),
    ]
    for reference, value, x, y in resistor_positions:
        rev_a1.load_footprint(board, "Resistor_SMD", "R_0603_1608Metric", reference, value, x, y, bottom=True, show_reference=False)

    capacitor_positions = [
        ("C1", "100nF", 32, 36),
        ("C2", "100nF", 44, 36),
        ("C3", "100nF", 32, 20),
        ("C4", "100nF", 44, 20),
        ("C5", "100nF", 20, 34),
        ("C6", "100nF", 56, 34),
        ("C7", "100nF", 28, 44),
        ("C8", "100nF", 53, 43),
        ("C9", "100nF", 25, 26),
        ("C10", "100nF", 50, 22),
        ("C11", "10uF", 60, 39),
        ("C12", "10uF", 62, 35),
        ("C13", "33pF", 21, 28),
        ("C14", "33pF", 28, 29),
        ("C15", "1uF VCAP", 31, 28),
        ("C16", "1uF VCC", 55, 22),
        ("C17", "10nF SHIELD", 66, 42),
    ]
    for reference, value, x, y in capacitor_positions:
        rev_a1.load_footprint(board, "Capacitor_SMD", "C_0603_1608Metric", reference, value, x, y, bottom=True, show_reference=False)

    test_points = [
        ("TP1", "VBUS", 4, 9),
        ("TP2", "3V3", 4, 13),
        ("TP3", "GND", 4, 17),
        ("TP4", "SDA", 4, 21),
        ("TP5", "SCL", 4, 25),
        ("TP6", "D+", 4, 29),
        ("TP7", "D-", 4, 33),
        ("TP8", "RUN", 4, 37),
        ("TP9", "TP_SWDIO", 10, 50),
        ("TP10", "TP_SWCLK", 14, 50),
        ("TP11", "TP_RUN", 18, 50),
        ("TP12", "TP_3V3", 22, 52),
        ("TP13", "TP_GND", 26, 52),
    ]
    for reference, value, x, y in test_points:
        rev_a1.load_footprint(board, "TestPoint", "TestPoint_Pad_D1.0mm", reference, value, x, y, bottom=True, show_reference=False)

    mounting_holes = [("H1", 4, 4), ("H2", 72, 4), ("H3", 4, 52), ("H4", 72, 52)]
    for reference, x, y in mounting_holes:
        rev_a1.load_footprint(board, "MountingHole", "MountingHole_2.2mm_M2", reference, "M2", x, y)


def build_board(output_path):
    global LOCAL_FOOTPRINT_ROOT
    LOCAL_FOOTPRINT_ROOT = os.path.join(os.path.dirname(output_path), "tellmelight_rev_a3.pretty")

    board = pcbnew.BOARD()
    rev_a1.configure_design_rules(board)
    title = board.GetTitleBlock()
    title.SetTitle("TellMeLight Rev A3")
    title.SetDate("2026-05-31")
    title.SetRevision("A3")
    title.SetCompany("TellMeLight")

    add_board_outline(board)
    add_diffuser_marks(board)
    add_avatar_watermark(board)
    place_components(board)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pcbnew.SaveBoard(output_path, board)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate_rev_a3_board.py <output.kicad_pcb>")
    build_board(sys.argv[1])
