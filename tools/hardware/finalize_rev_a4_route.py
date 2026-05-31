import sys
from pathlib import Path

import pcbnew


UNUSED_FANOUT_VIAS = {
    ("3V3", 32.8000, 41.6000),
    ("3V3_USB", 38.6000, 44.7000),
    ("LP_VCAP", 36.6000, 28.5000),
}


def mm(value):
    return round(pcbnew.ToMM(value), 4)


def import_ses(board, ses_path):
    if ses_path is not None:
        pcbnew.ImportSpecctraSES(board, str(ses_path))


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
    removed = remove_unused_fanout_vias(board)
    pcbnew.SaveBoard(str(board_path), board)

    print(f"Finalized Rev A4 route: removed {len(removed)} unused fanout vias.")
    for net_name, x, y in removed:
        print(f"- {net_name} via at {x:.4f},{y:.4f}")


if __name__ == "__main__":
    main()
