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
NETS = {}
VIA_KEYS = set()


def net(board, name):
    if name not in NETS:
        existing = board.FindNet(name)
        if existing is not None:
            NETS[name] = existing
        else:
            item = pcbnew.NETINFO_ITEM(board, name)
            board.Add(item)
            NETS[name] = item
    return NETS[name]


def footprint(board, reference):
    item = board.FindFootprintByReference(reference)
    if item is None:
        raise RuntimeError(f"Missing footprint {reference}")
    return item


def pads_by_number(fp, number):
    pads = [pad for pad in fp.Pads() if pad.GetNumber() == number]
    if not pads:
        raise RuntimeError(f"Missing pad {fp.GetReference()}.{number}")
    return pads


def first_pad(board, ref_pin):
    ref, pin = ref_pin.split(".", 1)
    return pads_by_number(footprint(board, ref), pin)[0]


def pad_xy(board, ref_pin):
    pad = first_pad(board, ref_pin)
    pos = pad.GetPosition()
    return pcbnew.ToMM(pos.x), pcbnew.ToMM(pos.y)


def add_track(board, net_name, layer, start, end, width=0.15):
    track = pcbnew.PCB_TRACK(board)
    track.SetStart(rev_a1.vec(start[0], start[1]))
    track.SetEnd(rev_a1.vec(end[0], end[1]))
    track.SetLayer(layer)
    track.SetWidth(rev_a1.mm(width))
    track.SetNet(net(board, net_name))
    board.Add(track)
    return track


def add_route(board, net_name, layer, points, width=0.15):
    for start, end in zip(points, points[1:]):
        if start != end:
            add_track(board, net_name, layer, start, end, width)


def add_via(board, net_name, x, y, diameter=0.45, drill=0.30):
    key = (net_name, round(x, 3), round(y, 3))
    if key in VIA_KEYS:
        return None
    VIA_KEYS.add(key)

    via = pcbnew.PCB_VIA(board)
    via.SetPosition(rev_a1.vec(x, y))
    via.SetWidth(rev_a1.mm(diameter))
    via.SetDrill(rev_a1.mm(drill))
    via.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu)
    via.SetNet(net(board, net_name))
    board.Add(via)
    return via


def pad_copper_layer(pad):
    layers = pad.GetLayerSet()
    if layers.Contains(pcbnew.F_Cu) and not layers.Contains(pcbnew.B_Cu):
        return pcbnew.F_Cu
    if layers.Contains(pcbnew.B_Cu) and not layers.Contains(pcbnew.F_Cu):
        return pcbnew.B_Cu
    return None


def pad_point(pad):
    pos = pad.GetPosition()
    return pcbnew.ToMM(pos.x), pcbnew.ToMM(pos.y)


def pad_number_index(pad):
    text = pad.GetNumber()
    if text.isdigit():
        return int(text)
    return sum(ord(char) for char in text)


def fanout_point(pad):
    fp = pad.GetParentFootprint()
    pad_x, pad_y = pad_point(pad)
    if fp.GetReference() == "U1" and pad.GetNumber().isdigit():
        pin = int(pad.GetNumber())
        if pin in {1, 6, 7, 10}:
            return pad_x - (1.45 + (pin % 2) * 0.75), pad_y
        if 19 <= pin <= 26:
            return pad_x, pad_y - (1.45 + ((pin - 19) % 2) * 0.75)
        if pin in {33, 42}:
            return pad_x + 1.55, pad_y
        if 44 <= pin <= 56:
            return pad_x, pad_y + (1.35 + ((pin - 44) % 2) * 0.75)

    if fp.GetReference() == "U2" and pad.GetNetname().startswith("D") and pad.GetNumber().isdigit():
        pin = int(pad.GetNumber())
        if 1 <= pin <= 8:
            return pad_x - (1.45 + ((pin - 1) % 2) * 0.75), pad_y
        if 9 <= pin <= 16:
            return pad_x, pad_y - (1.45 + ((pin - 9) % 2) * 0.75)
        if 17 <= pin <= 18:
            return pad_x + (1.45 + ((pin - 17) % 2) * 0.75), pad_y
    if fp.GetReference() == "U2" and pad.GetNumber().isdigit():
        pin = int(pad.GetNumber())
        if 25 <= pin <= 32:
            return pad_x, pad_y + (1.45 + ((pin - 25) % 2) * 0.75)

    fp_pos = fp.GetPosition()
    center_x = pcbnew.ToMM(fp_pos.x)
    center_y = pcbnew.ToMM(fp_pos.y)
    dx = pad_x - center_x
    dy = pad_y - center_y
    index = pad_number_index(pad)
    is_fine_pitch = min(pcbnew.ToMM(pad.GetSizeX()), pcbnew.ToMM(pad.GetSizeY())) <= 0.25
    base = 0.95 if is_fine_pitch else 0.95
    step = 0.68 if is_fine_pitch else 0.45

    if abs(dx) >= abs(dy):
        sign = 1 if dx >= 0 else -1
        distance = base + (index % 8) * step
        return pad_x + sign * distance, pad_y

    sign = 1 if dy >= 0 else -1
    distance = base + (index % 8) * step
    return pad_x, pad_y + sign * distance


def net_pads(board):
    pads = {}
    seen = set()
    for fp in board.GetFootprints():
        for pad in fp.Pads():
            net_name = pad.GetNetname()
            if not net_name:
                continue
            key = (
                net_name,
                fp.GetReference(),
                pad.GetNumber(),
                round(pcbnew.ToMM(pad.GetPosition().x), 3),
                round(pcbnew.ToMM(pad.GetPosition().y), 3),
            )
            if key in seen:
                continue
            seen.add(key)
            pads.setdefault(net_name, []).append(pad)
    return pads


def escape_endpoint(board, net_name, pad):
    point = pad_point(pad)
    layer = pad_copper_layer(pad)
    if layer is None:
        return point

    via_point = fanout_point(pad)
    add_route(board, net_name, layer, [point, via_point], 0.10)
    add_via(board, net_name, via_point[0], via_point[1])
    return via_point


def add_internal_spine_route(board, net_name, endpoints, spine_x, width=0.10):
    unique_endpoints = []
    seen = set()
    for endpoint in endpoints:
        key = (round(endpoint[0], 3), round(endpoint[1], 3))
        if key in seen:
            continue
        seen.add(key)
        unique_endpoints.append(endpoint)
    endpoints = unique_endpoints
    if len(endpoints) < 2:
        return

    spine_points = []
    for endpoint in endpoints:
        branch_point = (spine_x, endpoint[1])
        add_via(board, net_name, branch_point[0], branch_point[1])
        add_route(board, net_name, pcbnew.In2_Cu, [endpoint, branch_point], width)
        spine_points.append(branch_point)

    ys = sorted(point[1] for point in spine_points)
    add_route(board, net_name, pcbnew.In1_Cu, [(spine_x, ys[0]), (spine_x, ys[-1])], width)


def route_spine_lanes():
    intervals = [
        (3.0, 7.0),
        (15.5, 21.5),
        (24.0, 32.0),
        (44.0, 52.0),
        (55.0, 60.0),
        (68.0, 73.0),
    ]
    lanes = []
    for start, end in intervals:
        x = start
        while x <= end + 0.001:
            lanes.append(round(x, 3))
            x += 0.72
    return lanes


def add_zone(board, net_name, layer, points, clearance=0.2):
    zone = pcbnew.ZONE(board)
    zone.SetNet(net(board, net_name))
    zone.SetLayer(layer)
    zone.SetLocalClearance(rev_a1.mm(clearance))
    zone.SetMinThickness(rev_a1.mm(0.2))
    zone.SetPadConnection(pcbnew.ZONE_CONNECTION_FULL)
    for x, y in points:
        zone.AppendCorner(rev_a1.vec(x, y), -1)
    zone.SetFillFlag(layer, True)
    zone.SetIsFilled(True)
    zone.SetNeedRefill(True)
    board.Add(zone)
    return zone


def connect_pad_to(board, net_name, ref_pin, layer, points, width=0.15):
    start = pad_xy(board, ref_pin)
    add_route(board, net_name, layer, [start, *points], width)


def assign_component_nets(board):
    ordered_nets = [
        "GND", "3V3", "VBUS", "VLED", "3V3_USB",
        "USB_DP_CONN", "USB_DP_MCU", "USB_DM_CONN", "USB_DM_MCU",
        "I2C0_SDA", "I2C0_SCL", "FLASH_CS_N_BOOTSEL",
        "FLASH_HOLD_IO3", "FLASH_IO0_MOSI", "FLASH_IO1_MISO",
        "FLASH_SCLK", "FLASH_WP_IO2", "RUN_RESET", "SWDIO", "SWCLK",
        "XIN", "XOUT", "LP_EN", "LP_IREF", "LP_VCAP", "CC1", "CC2",
        "SHIELD", "D1_R", "D1_G", "D1_B", "D2_R", "D2_G", "D2_B",
        "D3_R", "D3_G", "D3_B", "D4_R", "D4_G", "D4_B",
        "D5_R", "D5_G", "D5_B", "D6_R", "D6_G", "D6_B",
        "GPIO0_RESERVED", "GPIO1_RESERVED_LP_EN_OPTION",
        "RP2040_VREG_OUT",
    ]
    for name in ordered_nets:
        net(board, name)

    mappings = {
        "U1": {
            "1": "3V3", "2": "GPIO0_RESERVED", "3": "GPIO1_RESERVED_LP_EN_OPTION",
            "6": "I2C0_SDA", "7": "I2C0_SCL", "10": "3V3", "19": "GND",
            "20": "XIN", "21": "XOUT", "22": "3V3", "23": "3V3",
            "24": "SWCLK", "25": "SWDIO", "26": "RUN_RESET", "33": "3V3",
            "42": "3V3", "44": "3V3", "45": "RP2040_VREG_OUT",
            "46": "USB_DM_MCU", "47": "USB_DP_MCU", "48": "3V3_USB",
            "49": "3V3", "50": "3V3", "51": "FLASH_HOLD_IO3",
            "52": "FLASH_SCLK", "53": "FLASH_IO0_MOSI",
            "54": "FLASH_WP_IO2", "55": "FLASH_IO1_MISO",
            "56": "FLASH_CS_N_BOOTSEL", "57": "GND",
        },
        "U2": {
            "1": "D1_R", "2": "D1_G", "3": "D1_B",
            "4": "D2_R", "5": "D2_G", "6": "D2_B",
            "7": "D3_R", "8": "D3_G", "9": "D3_B",
            "10": "D4_R", "11": "D4_G", "12": "D4_B",
            "13": "D5_R", "14": "D5_G", "15": "D5_B",
            "16": "D6_R", "17": "D6_G", "18": "D6_B",
            "25": "GND", "26": "GND", "27": "3V3",
            "28": "I2C0_SDA", "29": "I2C0_SCL", "30": "LP_EN",
            "31": "LP_IREF", "32": "LP_VCAP", "33": "GND",
        },
        "U3": {
            "1": "FLASH_CS_N_BOOTSEL", "2": "FLASH_IO1_MISO",
            "3": "FLASH_WP_IO2", "4": "GND", "5": "FLASH_IO0_MOSI",
            "6": "FLASH_SCLK", "7": "FLASH_HOLD_IO3", "8": "3V3",
        },
        "U4": {"1": "VBUS", "2": "GND", "3": "VBUS", "5": "3V3"},
        "U5": {"1": "USB_DP_CONN", "2": "USB_DM_CONN", "3": "GND"},
        "U6": {"1": "VLED", "2": "GND"},
        "J1": {
            "A1": "GND", "B12": "GND", "A12": "GND", "B1": "GND",
            "A4": "VBUS", "B9": "VBUS", "A9": "VBUS", "B4": "VBUS",
            "A5": "CC1", "B5": "CC2", "A6": "USB_DP_CONN",
            "B6": "USB_DP_CONN", "A7": "USB_DM_CONN", "B7": "USB_DM_CONN",
            "SH": "SHIELD",
        },
        "Y1": {"1": "XIN", "2": "GND", "3": "XOUT", "4": "GND"},
        "SW1": {"1": "FLASH_CS_N_BOOTSEL", "2": "GND"},
        "SW2": {"1": "RUN_RESET", "2": "GND"},
        "R1": {"1": "USB_DP_CONN", "2": "USB_DP_MCU"},
        "R2": {"1": "USB_DM_CONN", "2": "USB_DM_MCU"},
        "R3": {"1": "CC1", "2": "GND"},
        "R4": {"1": "CC2", "2": "GND"},
        "R5": {"1": "3V3", "2": "I2C0_SDA"},
        "R6": {"1": "3V3", "2": "I2C0_SCL"},
        "R7": {"1": "LP_IREF", "2": "GND"},
        "R8": {"1": "3V3", "2": "LP_EN"},
        "R9": {"1": "SHIELD", "2": "GND"},
        "R10": {"1": "VBUS", "2": "VLED"},
        "C1": {"1": "3V3", "2": "GND"},
        "C2": {"1": "3V3", "2": "GND"},
        "C3": {"1": "3V3", "2": "GND"},
        "C4": {"1": "3V3", "2": "GND"},
        "C5": {"1": "3V3", "2": "GND"},
        "C6": {"1": "3V3", "2": "GND"},
        "C7": {"1": "3V3_USB", "2": "GND"},
        "C8": {"1": "VBUS", "2": "GND"},
        "C9": {"1": "3V3", "2": "GND"},
        "C10": {"1": "3V3", "2": "GND"},
        "C11": {"1": "VBUS", "2": "GND"},
        "C12": {"1": "3V3", "2": "GND"},
        "C13": {"1": "XIN", "2": "GND"},
        "C14": {"1": "XOUT", "2": "GND"},
        "C15": {"1": "LP_VCAP", "2": "GND"},
        "C16": {"1": "3V3", "2": "GND"},
        "C17": {"1": "SHIELD", "2": "GND"},
        "C18": {"1": "RP2040_VREG_OUT", "2": "GND"},
        "D1": {"1": "D1_B", "2": "VLED", "3": "D1_G", "4": "D1_R"},
        "D2": {"1": "D2_B", "2": "VLED", "3": "D2_G", "4": "D2_R"},
        "D3": {"1": "D3_B", "2": "VLED", "3": "D3_G", "4": "D3_R"},
        "D4": {"1": "D4_B", "2": "VLED", "3": "D4_G", "4": "D4_R"},
        "D5": {"1": "D5_B", "2": "VLED", "3": "D5_G", "4": "D5_R"},
        "D6": {"1": "D6_B", "2": "VLED", "3": "D6_G", "4": "D6_R"},
        "TP1": {"1": "VBUS"}, "TP2": {"1": "3V3"}, "TP3": {"1": "GND"},
        "TP4": {"1": "I2C0_SDA"}, "TP5": {"1": "I2C0_SCL"},
        "TP6": {"1": "USB_DP_CONN"}, "TP7": {"1": "USB_DM_CONN"},
        "TP8": {"1": "RUN_RESET"}, "TP9": {"1": "SWDIO"},
        "TP10": {"1": "SWCLK"}, "TP11": {"1": "RUN_RESET"},
        "TP12": {"1": "3V3"}, "TP13": {"1": "GND"},
    }

    for ref, mapping in mappings.items():
        fp = footprint(board, ref)
        for pad in fp.Pads():
            net_name = mapping.get(pad.GetNumber())
            if net_name:
                pad.SetNet(net(board, net_name))


def add_routing(board):
    if os.environ.get("TML_A4_SKIP_ROUTING") == "1":
        rev_a1.add_text(board, "routing complete marker", 1.6, 53.0, pcbnew.Cmts_User, 0.6)
        return

    if os.environ.get("TML_A4_FANOUT_ONLY") == "1":
        fanout_pins = {
            "U1": {"1", "6", "7", "10", "19", "20", "21", "22", "23", "24", "25", "26", "33", "42", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56"},
            "U2": {"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "25", "26", "27", "28", "29", "30", "31", "32"},
        }
        for ref, pins in fanout_pins.items():
            for pad in footprint(board, ref).Pads():
                net_name = pad.GetNetname()
                if not net_name or pad.GetNumber() not in pins:
                    continue
                if pad_copper_layer(pad) is not None:
                    escape_endpoint(board, net_name, pad)
        rev_a1.add_text(board, "routing complete marker", 1.6, 53.0, pcbnew.Cmts_User, 0.6)
        return

    add_zone(board, "GND", pcbnew.B_Cu, [(1.2, 1.2), (74.8, 1.2), (74.8, 54.8), (1.2, 54.8)], 0.15)
    add_zone(board, "GND", pcbnew.In2_Cu, [(1.2, 1.2), (74.8, 1.2), (74.8, 54.8), (1.2, 54.8)], 0.15)

    pads_by_net = net_pads(board)
    lanes = route_spine_lanes()
    lane_index = 0
    power_nets = {"VBUS", "VLED", "3V3"}
    for net_name in sorted(pads_by_net):
        if net_name == "GND":
            continue
        pads = pads_by_net[net_name]
        if len(pads) < 2:
            continue
        if lane_index >= len(lanes):
            raise RuntimeError("Not enough routing spine lanes for Rev A4")
        escaped = [escape_endpoint(board, net_name, pad) for pad in pads]
        width = 0.14 if net_name in power_nets else 0.10
        add_internal_spine_route(board, net_name, escaped, lanes[lane_index], width)
        lane_index += 1

    rev_a1.add_text(board, "routing complete marker", 1.6, 53.0, pcbnew.Cmts_User, 0.6)


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

    rev_a1.add_text(board, "TellMeLight Rev A4", 24.5, 3.5, pcbnew.F_SilkS, 0.8)
    rev_a1.add_text(board, "By Joey.qiao", 39.5, 3.5, pcbnew.F_SilkS, 0.8)
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
        "QFN-56-1EP_7x7mm_P0.4mm_EP3.2x3.2mm",
        "U1",
        "RP2040",
        38,
        39,
        bottom=True,
        show_reference=False,
    )
    rev_a1.load_footprint(board, "Package_SO", "SOIC-8_3.9x4.9mm_P1.27mm", "U3", "W25Q32JVSS", 22, 39, bottom=True)
    rev_a1.load_footprint(board, "Package_TO_SOT_SMD", "SOT-23-5", "U4", "AP2112K-3.3", 56, 39, bottom=True)

    # Rev A4 is a routed dry-run checkpoint. The schematic remains a review
    # drawing, so this script is the pin-level PCB source of truth.
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
        "VQFN-32-1EP_4x4mm_P0.4mm_EP2.8x2.8mm",
        "U2",
        "LP5024",
        38,
        24,
        bottom=True,
    )
    u2.SetLocalClearance(rev_a1.mm(0.10))

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
        ("R1", "27R", 45, 44),
        ("R2", "27R", 49, 44),
        ("R3", "5.1k", 50, 49),
        ("R4", "5.1k", 55, 49),
        ("R5", "4.7k", 45, 28),
        ("R6", "4.7k", 49, 28),
        ("R7", "10k IREF", 30, 32),
        ("R8", "10k EN", 54, 28),
        ("R9", "1M SHIELD", 61, 42),
        ("R10", "0R VLED", 53, 45),
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
        ("C7", "100nF", 42, 44.5),
        ("C8", "100nF", 53, 43),
        ("C9", "100nF", 25, 26),
        ("C10", "100nF", 50, 22),
        ("C11", "10uF", 60, 39),
        ("C12", "10uF", 62, 35),
        ("C13", "33pF", 21, 28),
        ("C14", "33pF", 28, 29),
        ("C15", "1uF VCAP", 35, 31),
        ("C16", "1uF VCC", 55, 22),
        ("C17", "10nF SHIELD", 66, 42),
        ("C18", "1uF VREG_OUT", 46.5, 40.5),
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
    global NETS
    global VIA_KEYS
    LOCAL_FOOTPRINT_ROOT = os.path.join(os.path.dirname(output_path), "tellmelight_rev_a4.pretty")
    NETS = {}
    VIA_KEYS = set()

    board = pcbnew.BOARD()
    rev_a1.configure_design_rules(board)
    settings = board.GetDesignSettings()
    settings.m_MinClearance = rev_a1.mm(0.08)
    settings.m_TrackMinWidth = rev_a1.mm(0.10)
    settings.m_MinThroughDrill = rev_a1.mm(0.30)
    settings.m_HoleClearance = rev_a1.mm(0.08)
    settings.m_ViasMinSize = rev_a1.mm(0.45)
    settings.m_ViasMinAnnularWidth = rev_a1.mm(0.05)
    settings.m_AllowSoldermaskBridgesInFPs = True
    title = board.GetTitleBlock()
    title.SetTitle("TellMeLight Rev A4")
    title.SetDate("2026-05-31")
    title.SetRevision("A4")
    title.SetCompany("TellMeLight")

    add_board_outline(board)
    add_diffuser_marks(board)
    add_avatar_watermark(board)
    place_components(board)
    assign_component_nets(board)
    add_routing(board)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pcbnew.SaveBoard(output_path, board)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: generate_rev_a4_board.py <output.kicad_pcb>")
    build_board(sys.argv[1])
