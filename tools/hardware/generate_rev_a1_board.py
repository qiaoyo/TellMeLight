import os
import sys

import pcbnew


KICAD_ROOT = os.environ.get("KICAD_ROOT", r"E:\kicad")
FOOTPRINT_ROOT = os.path.join(KICAD_ROOT, "share", "kicad", "footprints")


def mm(value):
    return pcbnew.FromMM(float(value))


def vec(x, y):
    return pcbnew.VECTOR2I(mm(x), mm(y))


def load_footprint(board, lib, name, reference, value, x, y, rotation=0, bottom=False, show_reference=True):
    lib_path = os.path.join(FOOTPRINT_ROOT, f"{lib}.pretty")
    footprint = pcbnew.FootprintLoad(lib_path, name)
    if footprint is None:
        raise FileNotFoundError(f"Unable to load footprint {lib}:{name} from {lib_path}")

    position = vec(x, y)
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


def configure_design_rules(board):
    board.SetCopperLayerCount(4)
    settings = board.GetDesignSettings()
    settings.m_MinClearance = mm(0.15)
    settings.m_CopperEdgeClearance = mm(0.15)
    settings.m_MinThroughDrill = mm(0.15)
    settings.m_SolderMaskMinWidth = mm(0.05)
    settings.m_SilkClearance = mm(0.08)


def ensure_net(board, nets, name):
    if name not in nets:
        net = pcbnew.NETINFO_ITEM(board, name)
        board.Add(net)
        nets[name] = net
    return nets[name]


def assign_pad_nets(board, footprint, mapping):
    nets = {}
    for pad in footprint.Pads():
        pad_number = pad.GetNumber()
        net_name = mapping.get(pad_number)
        if net_name is None and pad_number == "":
            net_name = mapping.get("<blank>")
        if net_name is None:
            continue
        pad.SetNet(ensure_net(board, nets, net_name))


def add_line(board, layer, x1, y1, x2, y2, width=0.15):
    shape = pcbnew.PCB_SHAPE(board)
    shape.SetShape(pcbnew.SHAPE_T_SEGMENT)
    shape.SetStart(vec(x1, y1))
    shape.SetEnd(vec(x2, y2))
    shape.SetLayer(layer)
    shape.SetWidth(mm(width))
    board.Add(shape)
    return shape


def add_polyline(board, layer, points, width=0.15):
    for start, end in zip(points, points[1:] + points[:1]):
        add_line(board, layer, start[0], start[1], end[0], end[1], width)


def add_text(board, text, x, y, layer=pcbnew.F_SilkS, size=1.0, rotation=0):
    item = pcbnew.PCB_TEXT(board)
    item.SetText(text)
    item.SetPosition(vec(x, y))
    item.SetLayer(layer)
    item.SetTextSize(pcbnew.VECTOR2I(mm(size), mm(size)))
    item.SetTextThickness(mm(max(size * 0.12, 0.12)))
    item.SetTextAngleDegrees(rotation)
    if layer in {pcbnew.B_SilkS, pcbnew.B_Fab, pcbnew.B_Cu, pcbnew.B_Mask, pcbnew.B_Paste}:
        item.SetMirrored(True)
    board.Add(item)
    return item


def add_board_outline(board):
    # 96 mm x 74 mm near-square module, with chamfered visual corners for Rev A1.
    outline = [
        (2.0, 0.0),
        (94.0, 0.0),
        (96.0, 2.0),
        (96.0, 72.0),
        (94.0, 74.0),
        (2.0, 74.0),
        (0.0, 72.0),
        (0.0, 2.0),
    ]
    add_polyline(board, pcbnew.Edge_Cuts, outline, 0.1)


def add_diffuser_marks(board):
    # Four soft trapezoid guide outlines. These are diffuser/mechanical marks, not copper.
    bars = [
        ("S1/S2", [(10, 8), (23, 11), (23, 53), (10, 58)]),
        ("S3", [(32, 29), (43, 31), (43, 48), (32, 51)]),
        ("S4", [(53, 27), (64, 23), (64, 45), (53, 43)]),
        ("S5/S6", [(75, 6), (89, 10), (89, 55), (75, 62)]),
    ]

    for label, points in bars:
        add_polyline(board, pcbnew.Dwgs_User, points, 0.25)
        add_polyline(board, pcbnew.F_SilkS, points, 0.18)
        center_x = sum(point[0] for point in points) / len(points)
        center_y = sum(point[1] for point in points) / len(points)
        add_text(board, label, center_x - 2.5, center_y, pcbnew.Dwgs_User, 0.8)

    add_text(board, "FIFO oldest", 8, 65, pcbnew.Dwgs_User, 0.9)
    add_text(board, "newest", 77, 65, pcbnew.Dwgs_User, 0.9)
    add_text(board, "TellMeLight Rev A1", 35, 5, pcbnew.F_SilkS, 1.1)
    add_text(board, "JLC SMT review", 36, 69, pcbnew.B_SilkS, 0.9)
    add_text(board, "No hand solder", 36, 66, pcbnew.B_SilkS, 0.9)


def place_components(board):
    # Front optical emitters following the approved four-bar core display.
    led_positions = [
        ("D1", 16.5, 19.5),
        ("D2", 16.5, 44.5),
        ("D3", 37.5, 40.0),
        ("D4", 58.5, 34.0),
        ("D5", 82.0, 20.0),
        ("D6", 82.0, 46.5),
    ]
    for reference, x, y in led_positions:
        load_footprint(
            board,
            "LED_SMD",
            "LED_RGB_Wuerth-PLCC4_3.2x2.8mm_150141M173100",
            reference,
            "S4-3528RGBTA-A",
            x,
            y,
            rotation=90,
        )

    # Back-side logic and support components leave the front mostly optical.
    load_footprint(
        board,
        "Package_DFN_QFN",
        "QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm_ThermalVias",
        "U1",
        "RP2040",
        46,
        50,
        bottom=True,
    )
    load_footprint(board, "Package_SO", "SOIC-8_3.9x4.9mm_P1.27mm", "U3", "W25Q32JVSS", 26, 50, bottom=True)
    load_footprint(board, "Package_TO_SOT_SMD", "SOT-23-5", "U4", "AP2112K-3.3", 65, 51, bottom=True)
    load_footprint(board, "Package_TO_SOT_SMD", "SOT-23-6", "U5", "TPD2EUSB30", 37, 61, bottom=True)
    u2 = load_footprint(
        board,
        "Package_DFN_QFN",
        "VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm_ThermalVias",
        "U2",
        "LP5024",
        46,
        27,
        bottom=True,
    )
    u2.SetLocalClearance(mm(0.15))
    usb = load_footprint(
        board,
        "Connector_USB",
        "USB_C_Receptacle_HRO_TYPE-C-31-M-12",
        "J1",
        "USB_C",
        48,
        66,
        rotation=180,
        bottom=True,
    )
    assign_pad_nets(
        board,
        usb,
        {
            "A1": "GND_USB_A",
            "B12": "GND_USB_A",
            "A12": "GND_USB_B",
            "B1": "GND_USB_B",
            "A4": "VBUS_USB_A",
            "B9": "VBUS_USB_A",
            "A9": "VBUS_USB_B",
            "B4": "VBUS_USB_B",
        },
    )
    load_footprint(board, "Crystal", "Crystal_SMD_TXC_7M-4Pin_3.2x2.5mm", "Y1", "12MHz", 29, 42, bottom=True)
    debug_points = [
        ("TP9", "TP_SWDIO", 10, 55),
        ("TP10", "TP_SWCLK", 10, 59),
        ("TP11", "TP_RUN", 10, 63),
        ("TP12", "TP_3V3", 15, 55),
        ("TP13", "TP_GND", 15, 59),
    ]
    for reference, value, x, y in debug_points:
        load_footprint(board, "TestPoint", "TestPoint_Pad_D1.0mm", reference, value, x, y, bottom=True)
    load_footprint(
        board,
        "Button_Switch_SMD",
        "SW_SPST_EVQP2_ShortPushTravel_H2.1mm",
        "SW1",
        "BOOT",
        78,
        57,
        bottom=True,
    )
    load_footprint(
        board,
        "Button_Switch_SMD",
        "SW_SPST_EVQP2_ShortPushTravel_H2.1mm",
        "SW2",
        "RESET",
        87,
        57,
        bottom=True,
    )

    resistor_positions = [
        ("R1", "27R", 39, 56),
        ("R2", "27R", 43, 56),
        ("R3", "5.1k", 67, 62),
        ("R4", "5.1k", 72, 62),
        ("R5", "4.7k", 54, 31),
        ("R6", "4.7k", 58, 31),
    ]
    for reference, value, x, y in resistor_positions:
        load_footprint(board, "Resistor_SMD", "R_0603_1608Metric", reference, value, x, y, bottom=True, show_reference=False)

    capacitor_positions = [
        ("C1", "100nF", 40, 44),
        ("C2", "100nF", 52, 44),
        ("C3", "100nF", 40, 23),
        ("C4", "100nF", 52, 23),
        ("C5", "100nF", 24, 45),
        ("C6", "100nF", 68, 47),
        ("C7", "100nF", 35, 58),
        ("C8", "100nF", 61, 56),
        ("C9", "100nF", 31, 36),
        ("C10", "100nF", 61, 36),
        ("C11", "10uF", 69, 56),
        ("C12", "10uF", 68, 60),
        ("C13", "CL", 26, 38),
        ("C14", "CL", 32, 38),
    ]
    for reference, value, x, y in capacitor_positions:
        load_footprint(board, "Capacitor_SMD", "C_0603_1608Metric", reference, value, x, y, bottom=True, show_reference=False)

    test_points = [
        ("TP1", "VBUS", 8, 8),
        ("TP2", "3V3", 8, 13),
        ("TP3", "GND", 8, 18),
        ("TP4", "SDA", 8, 23),
        ("TP5", "SCL", 8, 28),
        ("TP6", "D+", 8, 33),
        ("TP7", "D-", 8, 38),
        ("TP8", "RUN", 8, 43),
    ]
    for reference, value, x, y in test_points:
        load_footprint(board, "TestPoint", "TestPoint_Pad_D1.0mm", reference, value, x, y, bottom=True)

    mounting_holes = [("H1", 5, 5), ("H2", 91, 5), ("H3", 5, 69), ("H4", 91, 69)]
    for reference, x, y in mounting_holes:
        load_footprint(board, "MountingHole", "MountingHole_2.2mm_M2", reference, "M2", x, y)


def build_board(output_path):
    board = pcbnew.BOARD()
    configure_design_rules(board)
    title = board.GetTitleBlock()
    title.SetTitle("TellMeLight Rev A1")
    title.SetDate("2026-05-30")
    title.SetRevision("A1")
    title.SetCompany("TellMeLight")

    add_board_outline(board)
    add_diffuser_marks(board)
    place_components(board)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pcbnew.SaveBoard(output_path, board)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate_rev_a_board.py <output.kicad_pcb>")
    build_board(sys.argv[1])
