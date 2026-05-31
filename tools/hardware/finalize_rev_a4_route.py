import sys
from pathlib import Path

import pcbnew


UNUSED_FANOUT_VIAS = {
}


def mm(value):
    return round(pcbnew.ToMM(value), 4)


def import_ses(board, ses_path):
    if ses_path is not None:
        pcbnew.ImportSpecctraSES(board, str(ses_path))


def vec(x, y):
    return pcbnew.VECTOR2I(pcbnew.FromMM(x), pcbnew.FromMM(y))


def find_net(board, net_name):
    item = board.FindNet(net_name)
    if item is None:
        raise RuntimeError(f"Missing net {net_name}")
    return item


def has_track(board, net_name, layer, start, end):
    rounded = {
        (round(start[0], 4), round(start[1], 4)),
        (round(end[0], 4), round(end[1], 4)),
    }
    for item in board.GetTracks():
        if item.Type() == pcbnew.PCB_VIA_T or item.GetNetname() != net_name:
            continue
        if item.GetLayer() != layer:
            continue
        item_points = {
            (mm(item.GetStart().x), mm(item.GetStart().y)),
            (mm(item.GetEnd().x), mm(item.GetEnd().y)),
        }
        if item_points == rounded:
            return True
    return False


def add_track(board, net_name, layer, start, end, width=0.10):
    if start == end or has_track(board, net_name, layer, start, end):
        return
    track = pcbnew.PCB_TRACK(board)
    track.SetStart(vec(*start))
    track.SetEnd(vec(*end))
    track.SetLayer(layer)
    track.SetWidth(pcbnew.FromMM(width))
    track.SetNet(find_net(board, net_name))
    board.Add(track)


def has_via(board, net_name, point):
    rounded = (round(point[0], 4), round(point[1], 4))
    for item in board.GetTracks():
        if item.Type() != pcbnew.PCB_VIA_T or item.GetNetname() != net_name:
            continue
        pos = item.GetPosition()
        if (mm(pos.x), mm(pos.y)) == rounded:
            return True
    return False


def add_via(board, net_name, point, diameter=0.45, drill=0.25):
    if has_via(board, net_name, point):
        return
    via = pcbnew.PCB_VIA(board)
    via.SetPosition(vec(*point))
    via.SetWidth(pcbnew.FromMM(diameter))
    via.SetDrill(pcbnew.FromMM(drill))
    via.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu)
    via.SetNet(find_net(board, net_name))
    board.Add(via)


def add_route(board, net_name, layer, points, width=0.10):
    for start, end in zip(points, points[1:]):
        add_track(board, net_name, layer, start, end, width)


def add_manual_completion_routes(board):
    add_via(board, "D5_R", (64.7, 12.85))
    add_route(
        board,
        "D5_R",
        pcbnew.In1_Cu,
        [
            (38.2, 20.5625),
            (38.2, 19.2),
            (43.0, 12.85),
            (64.7, 12.85),
        ],
    )
    add_route(board, "D5_R", pcbnew.F_Cu, [(64.7, 12.85), (64.7, 13.95)])


def remove_unused_fanout_vias(board):
    removed = []
    for item in list(board.GetTracks()):
        if item.Type() != pcbnew.PCB_VIA_T:
            continue

        pos = item.GetPosition()
        key = (item.GetNetname(), mm(pos.x), mm(pos.y))
        if key in UNUSED_FANOUT_VIAS:
            board.Remove(item)
            removed.append(key)

    return removed


def main():
    if len(sys.argv) not in (2, 3):
        raise SystemExit(
            "usage: finalize_rev_a4_route.py <board.kicad_pcb> [autorouted.ses]"
        )

    board_path = Path(sys.argv[1])
    ses_path = Path(sys.argv[2]) if len(sys.argv) == 3 else None
    board = pcbnew.LoadBoard(str(board_path))

    import_ses(board, ses_path)
    add_manual_completion_routes(board)
    removed = remove_unused_fanout_vias(board)
    pcbnew.SaveBoard(str(board_path), board)

    print(f"Finalized Rev A4 route: removed {len(removed)} unused fanout vias.")
    for net_name, x, y in removed:
        print(f"- {net_name} via at {x:.4f},{y:.4f}")


if __name__ == "__main__":
    main()
