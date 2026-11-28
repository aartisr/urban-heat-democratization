"""Build a visual companion to the Final Paper's nine-cell experiment.

Run from the repository root:
    .venv/bin/python scripts/build_experiment_checkpoints_guide.py
"""

from __future__ import annotations

import os
import sys
from itertools import combinations
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/urban-heat-guide-mpl")
os.environ.setdefault("XDG_CACHE_HOME", "/tmp/urban-heat-guide-cache")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import networkx as nx
import numpy as np
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

from core.graph import build_weighted_grid
from core.raster import normalize
from core.spectra import lambda2_and_fiedler, sweep_conductance


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs/experiment_checkpoints_guide_assets"
OUTPUT = ROOT / "docs/Experiment_Checkpoints_Illustrated_Guide.pdf"
ASSETS.mkdir(exist_ok=True)

GRIDS = {
    "Smooth": np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]], dtype=float),
    "Scattered": np.array([[1, 8, 3], [6, 5, 4], [7, 2, 9]], dtype=float),
}
ALPHAS = (1, 3, 5)
NAVY = "#173044"
TEAL = "#08796f"
ORANGE = "#c35e39"
PALE = "#e8f4f2"


def exact_cut(graph: nx.Graph, nodes: list[int], degree: np.ndarray):
    """Enumerate one representative of each nonempty cut, for illustration."""
    total = float(degree.sum())
    degree_by_node = dict(zip(nodes, degree))
    best = (float("inf"), set(), 0.0, 0.0)
    count = 0
    for size in range(1, len(nodes)):
        for group in combinations(nodes[1:], size):
            selected = set(group)  # The first node stays outside the set.
            crossing = sum(
                data["w"] for u, v, data in graph.edges(data=True)
                if (u in selected) != (v in selected)
            )
            volume = sum(degree_by_node[u] for u in selected)
            denominator = min(volume, total - volume)
            score = crossing / denominator
            count += 1
            if score < best[0]:
                best = (score, selected, crossing, denominator)
    assert count == 255
    return best


def run():
    assert all(sorted(grid.ravel()) == list(range(1, 10)) for grid in GRIDS.values())
    assert all(grid.mean() == 5 for grid in GRIDS.values())
    rows = []
    for alpha in ALPHAS:
        for name, raw in GRIDS.items():
            graph, _ = build_weighted_grid(
                normalize(raw), None, connect8=False, alpha=alpha, beta=0
            )
            assert graph.number_of_nodes() == 9 and graph.number_of_edges() == 12
            eigenvalue, vector, nodes, degree = lambda2_and_fiedler(graph)
            sweep_score, sweep_set = sweep_conductance(graph, vector, nodes, degree)
            exact_score, exact_set, exact_crossing, exact_denominator = exact_cut(graph, nodes, degree)
            assert exact_score <= sweep_score + 1e-9
            rows.append(dict(name=name, alpha=alpha, graph=graph, nodes=nodes,
                             degree=degree, eigenvalue=eigenvalue, vector=vector,
                             sweep_score=sweep_score, sweep_set=sweep_set,
                             exact_score=exact_score, exact_set=exact_set,
                             exact_crossing=exact_crossing,
                             exact_denominator=exact_denominator))
    return rows


def grid_chart(path: Path, values: dict[str, np.ndarray], fmt: str, cmap="YlOrRd"):
    fig, axes = plt.subplots(1, 2, figsize=(9, 3.25), constrained_layout=True)
    for ax, (name, matrix) in zip(axes, values.items()):
        ax.imshow(matrix, cmap=cmap, vmin=np.min(list(values.values())),
                  vmax=np.max(list(values.values())))
        for (r, c), value in np.ndenumerate(matrix):
            ax.text(c, r, format(value, fmt), ha="center", va="center",
                    fontsize=17, fontweight="bold", color=NAVY,
                    bbox=dict(facecolor="white", alpha=.78, edgecolor="none", pad=2))
        ax.set_title(name, fontsize=14, color=NAVY, fontweight="bold")
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_xticks(np.arange(-.5, 3, 1), minor=True)
        ax.set_yticks(np.arange(-.5, 3, 1), minor=True)
        ax.grid(which="minor", color="white", linewidth=3)
        ax.tick_params(which="minor", bottom=False, left=False)
    fig.savefig(path, dpi=170, facecolor="white")
    plt.close(fig)


def graph_chart(path: Path, rows: list[dict]):
    fig, axes = plt.subplots(1, 2, figsize=(9, 3.5), constrained_layout=True)
    for ax, row in zip(axes, [r for r in rows if r["alpha"] == 3]):
        graph = row["graph"]
        pos = {n: (n % 3, 2 - n // 3) for n in graph.nodes}
        weights = [graph[u][v]["w"] for u, v in graph.edges]
        nx.draw_networkx_edges(graph, pos, ax=ax, edge_color=TEAL,
                               width=[1 + 8 * weight for weight in weights], alpha=.8)
        nx.draw_networkx_nodes(graph, pos, ax=ax, node_color="#fff3c4",
                               edgecolors=NAVY, node_size=700)
        nx.draw_networkx_labels(graph, pos, labels={n: str(int(GRIDS[row['name']].flat[n]))
                                                    for n in graph.nodes}, ax=ax,
                                font_size=13, font_weight="bold", font_color=NAVY)
        ax.set_title(f"{row['name']} graph at alpha = 3", color=NAVY, fontsize=13,
                     fontweight="bold")
        ax.set_xlim(-.4, 2.4)
        ax.set_ylim(-.4, 2.4)
        ax.axis("off")
    fig.savefig(path, dpi=170, facecolor="white")
    plt.close(fig)


def alpha_chart(path: Path, rows: list[dict]):
    fig, ax = plt.subplots(figsize=(8.6, 3.5), constrained_layout=True)
    for name, color in (("Smooth", TEAL), ("Scattered", ORANGE)):
        selected = [r for r in rows if r["name"] == name]
        weights = [r["graph"][0][1]["w"] for r in selected]
        ax.plot(ALPHAS, weights, marker="o", markersize=8, linewidth=2.5,
                color=color, label=f"{name} grid")
        for alpha, weight in zip(ALPHAS, weights):
            ax.annotate(f"{weight:.3f}", (alpha, weight), xytext=(0, 9),
                        textcoords="offset points", ha="center", fontsize=10, color=color)
    ax.axvspan(2.75, 3.25, color="#fff3c4", alpha=.75, zorder=0)
    ax.set_xticks(ALPHAS)
    ax.set_xlabel("Alpha setting (model dial)")
    ax.set_ylabel("Strength of one example link\n(1 = stronger, 0 = weaker)")
    ax.set_ylim(0, .82)
    ax.grid(axis="y", alpha=.2)
    ax.legend(frameon=False, loc="upper right")
    fig.savefig(path, dpi=170, facecolor="white")
    plt.close(fig)


def cut_chart(path: Path, rows: list[dict]):
    selected_rows = [r for r in rows if r["alpha"] == 3]
    fig, axes = plt.subplots(2, 2, figsize=(8.6, 6.0), constrained_layout=True)
    for col, row in enumerate(selected_rows):
        for row_index, kind in enumerate(("sweep", "exact")):
            ax = axes[row_index, col]
            subset = row[f"{kind}_set"]
            image = np.array([[1 if (r * 3 + c) in subset else 0
                               for c in range(3)] for r in range(3)])
            ax.imshow(image, vmin=0, vmax=1, cmap="BrBG")
            for (r, c), _ in np.ndenumerate(image):
                ax.text(c, r, str(int(GRIDS[row['name']][r, c])), ha="center",
                        va="center", fontsize=17, fontweight="bold", color=NAVY,
                        bbox=dict(facecolor="white", alpha=.75, edgecolor="none", pad=1))
            ax.set_title(f"{row['name']}: {kind} = {row[f'{kind}_score']:.4f}",
                         color=NAVY, fontsize=12, fontweight="bold")
            ax.set_xticks([])
            ax.set_yticks([])
            ax.set_xticks(np.arange(-.5, 3, 1), minor=True)
            ax.set_yticks(np.arange(-.5, 3, 1), minor=True)
            ax.grid(which="minor", color="white", linewidth=3)
            ax.tick_params(which="minor", bottom=False, left=False)
    fig.savefig(path, dpi=170, facecolor="white")
    plt.close(fig)


def split_chart(path: Path, row: dict):
    graph = row["graph"]
    group = row["sweep_set"]
    pos = {n: (n % 3, 2 - n // 3) for n in graph.nodes}
    fig, ax = plt.subplots(figsize=(8.4, 3.1), constrained_layout=True)
    inside = [(u, v) for u, v in graph.edges if (u in group) == (v in group)]
    crossing = [(u, v) for u, v in graph.edges if (u in group) != (v in group)]
    nx.draw_networkx_edges(graph, pos, edgelist=inside, ax=ax,
                           edge_color="#96a7af", width=3)
    nx.draw_networkx_edges(graph, pos, edgelist=crossing, ax=ax,
                           edge_color=ORANGE, width=6)
    nx.draw_networkx_nodes(graph, pos, nodelist=sorted(group), ax=ax,
                           node_color="#a8dcd1", edgecolors=NAVY, node_size=1000)
    nx.draw_networkx_nodes(graph, pos, nodelist=sorted(set(graph.nodes) - group), ax=ax,
                           node_color="#f5d6ae", edgecolors=NAVY, node_size=1000)
    nx.draw_networkx_labels(graph, pos,
                            labels={n: str(int(GRIDS["Smooth"].flat[n])) for n in graph.nodes},
                            ax=ax, font_size=16, font_weight="bold", font_color=NAVY)
    ax.text(2.85, 1.75, "Green = one group\nTan = the other group\nOrange = crossing links",
            fontsize=12, color=NAVY, va="top")
    ax.set_xlim(-.4, 5.2)
    ax.set_ylim(-.4, 2.4)
    ax.axis("off")
    fig.savefig(path, dpi=170, facecolor="white")
    plt.close(fig)


def sweep_chart(path: Path, row: dict):
    graph, nodes, degree = row["graph"], row["nodes"], row["degree"]
    order_indices = np.argsort(row["vector"])
    if nodes[order_indices[0]] != 0:
        order_indices = order_indices[::-1]
    order = [nodes[i] for i in order_indices]
    scores = []
    for stop in range(1, 9):
        selected = set(order[:stop])
        crossing = sum(data["w"] for u, v, data in graph.edges(data=True)
                       if (u in selected) != (v in selected))
        volume = sum(degree[nodes.index(u)] for u in selected)
        scores.append(crossing / min(volume, sum(degree) - volume))
    assert order == [0, 3, 1, 6, 4, 2, 7, 5, 8]
    assert np.argmin(scores) == 4  # Divider after the fifth card.
    fig = plt.figure(figsize=(9, 4.5), constrained_layout=True)
    grid = fig.add_gridspec(2, 1, height_ratios=[1, 2.2])
    cards = fig.add_subplot(grid[0])
    for index, node in enumerate(order):
        color = "#a8dcd1" if index < 5 else "#f5d6ae"
        cards.add_patch(Rectangle((index + .08, .17), .84, .65,
                                  facecolor=color, edgecolor=NAVY, linewidth=1.3))
        cards.text(index + .5, .49, str(int(GRIDS["Smooth"].flat[node])),
                   ha="center", va="center", fontsize=17, color=NAVY, fontweight="bold")
    cards.plot([5, 5], [.03, .96], color=ORANGE, linewidth=4)
    cards.text(5, 1.02, "chosen divider", ha="center", va="bottom", color=ORANGE, fontsize=11)
    cards.set_xlim(0, 9)
    cards.set_ylim(0, 1.3)
    cards.axis("off")
    bars = fig.add_subplot(grid[1])
    bars.bar(range(1, 9), scores,
             color=[ORANGE if stop == 5 else TEAL for stop in range(1, 9)])
    bars.set_xticks(range(1, 9))
    bars.set_xlabel("Divider after this many cards")
    bars.set_ylabel("Split score\n(conductance)")
    bars.set_ylim(0, 1.1)
    bars.grid(axis="y", alpha=.2)
    bars.set_axisbelow(True)
    fig.savefig(path, dpi=170, facecolor="white")
    plt.close(fig)


def difference_chart(path: Path, rows: list[dict]):
    fig, ax = plt.subplots(figsize=(8.6, 2.6), constrained_layout=True)
    smooth = {r["alpha"]: r for r in rows if r["name"] == "Smooth"}
    scattered = {r["alpha"]: r for r in rows if r["name"] == "Scattered"}
    x = np.arange(len(ALPHAS))
    sweep = [scattered[a]["sweep_score"] - smooth[a]["sweep_score"] for a in ALPHAS]
    exact = [scattered[a]["exact_score"] - smooth[a]["exact_score"] for a in ALPHAS]
    ax.bar(x - .18, sweep, width=.36, color=TEAL, label="Quick sweep")
    ax.bar(x + .18, exact, width=.36, color=ORANGE, label="Best of all splits")
    ax.axhline(0, color=NAVY, linewidth=.8)
    ax.set_xticks(x, [str(a) for a in ALPHAS])
    ax.set_xlabel("Alpha setting")
    ax.set_ylabel("Scattered minus smooth\nsplit score")
    ax.set_ylim(0, .15)
    ax.grid(axis="y", alpha=.2)
    ax.set_axisbelow(True)
    ax.legend(frameon=False, ncol=2, loc="upper left")
    fig.savefig(path, dpi=170, facecolor="white")
    plt.close(fig)


def draw_paragraph(pdf, text: str, x: float, y: float, width: float,
                   size: float = 11.4, leading: float = 16, color=NAVY,
                   bold=False, align=None) -> float:
    style = ParagraphStyle("p", fontName="Helvetica-Bold" if bold else "Helvetica",
                           fontSize=size, leading=leading, textColor=colors.HexColor(color),
                           alignment=TA_CENTER if align == "center" else 0)
    item = Paragraph(text, style)
    _, height = item.wrap(width, 1000)
    item.drawOn(pdf, x, y - height)
    return y - height


def page_header(pdf, number: int, title: str, subtitle: str):
    pdf.setFillColor(colors.white)
    pdf.rect(0, 0, 612, 792, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor(TEAL))
    pdf.rect(0, 758, 612, 34, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(38, 771, "ILLUSTRATED EXPERIMENT GUIDE")
    pdf.setFillColor(colors.HexColor(NAVY))
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(38, 720, title)
    draw_paragraph(pdf, subtitle, 38, 702, 536, size=11, leading=15)
    pdf.setStrokeColor(colors.HexColor("#c5d8d5"))
    pdf.line(38, 42, 574, 42)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawString(38, 28, "Companion to Final_Paper.pdf | Unitless teaching experiment")
    pdf.drawRightString(574, 28, f"Page {number} of 14")


def image(pdf, path: Path, y: float, width: float, height: float):
    x = (612 - width) / 2
    pdf.drawImage(str(path), x, y - height, width=width, height=height,
                  preserveAspectRatio=True, anchor="c", mask="auto")
    return y - height


def label(pdf, text: str, y: float):
    return draw_paragraph(pdf, text, 38, y, 536, size=13, leading=18,
                          color=TEAL, bold=True)


def body(pdf, text: str, y: float):
    return draw_paragraph(pdf, text, 38, y, 536)


def box(pdf, text: str, y: float, height=66):
    style = ParagraphStyle("box_measure", fontName="Helvetica", fontSize=10.8, leading=15)
    _, text_height = Paragraph(text, style).wrap(512, 1000)
    assert text_height <= height - 18, f"Box needs {text_height + 18} points, has {height}: {text[:70]}"
    pdf.setFillColor(colors.HexColor(PALE))
    pdf.roundRect(38, y - height, 536, height, 7, fill=1, stroke=0)
    draw_paragraph(pdf, text, 50, y - 11, 512, size=10.8, leading=15)
    return y - height


def build_pdf(rows: list[dict]):
    pdf = canvas.Canvas(str(OUTPUT), pagesize=(612, 792))
    pdf.setTitle("Pictures and Experiment Checkpoints: Illustrated Step-by-Step Guide")
    pdf.setAuthor("Urban Heat Democratization")

    # Page 1: the experimental question and exact inputs.
    page_header(pdf, 1, "1. Start with two input grids",
                "No graph theory needed. Follow the pictures to see what changes when numbers move.")
    y = label(pdf, "Draw the inputs", 665) - 8
    y = body(pdf, "The left grid increases gradually. The right grid rearranges the same values. "
             "The colored squares are computer drawings of numbers, not satellite pixels or photographs.", y) - 8
    y = image(pdf, ASSETS / "inputs.png", y, 536, 216) - 12
    y = label(pdf, "Checkpoint A: verify the fair comparison", y) - 8
    y = body(pdf, "Both grids contain 1, 2, 3, 4, 5, 6, 7, 8, 9 exactly once. "
             "Their sum is 45, so their average (mean) is 45 / 9 = 5. Their histograms "
             "(counts of each number) are identical. "
             "Only the positions change.", y) - 12
    y = box(pdf, "<b>What stays the same?</b> Grid size (3 by 3), the nine values, "
            "which cells count as neighbors, and the computer rules. The optional "
            "vegetation adjustment is off. The numbers are invented teaching values, "
            "not degrees of temperature.", y, 75) - 15
    box(pdf, "<b>Reading key:</b> A <i>cell</i> is one square. A <i>graph</i> is a drawing "
        "of cells as dots with links between neighbors. A <i>checkpoint</i> is a place "
        "where we verify an input or result. None of the colored squares represents "
        "a real place.", y, 77)
    pdf.showPage()

    # Page 2: normalization.
    page_header(pdf, 2, "2. Scale the numbers",
                "Scaling changes the number labels without changing where the values sit.")
    y = label(pdf, "Why scale?", 665) - 8
    y = body(pdf, "The later rules use numbers between 0 and 1. The smallest input becomes "
             "0, the middle value 5 becomes 0.5, and the largest becomes 1. Values "
             "between them land between 0 and 1. This is called <b>normalizing</b>.", y) - 8
    y = image(pdf, ASSETS / "normalized.png", y, 536, 216) - 10
    y = box(pdf, "<b>Optional calculation:</b> The code uses low and high reference "
            "points called the 2nd and 98th percentiles: 1.16 and 8.84. For 5, it "
            "computes (5 - 1.16) / (8.84 - 1.16) = 0.500. Results below 0 are set to 0; "
            "results above 1 are set to 1. This last step is called clipping.", y, 82) - 15
    y = label(pdf, "Checkpoint B: compare the scaled values", y) - 8
    body(pdf, "Both grids still have the same nine values after scaling, in different "
         "places. The new labels are relative numbers: 0.5 is not 0.5 degrees or a "
         "measured temperature.", y)
    pdf.showPage()

    # Page 3: graph.
    page_header(pdf, 3, "3. Connect neighboring cells",
                "A graph is simply dots for cells and lines for neighboring pairs.")
    y = label(pdf, "Build a picture of which cells touch", 665) - 8
    y = body(pdf, "Each square becomes a dot (called a <b>node</b>). A line (called a "
             "<b>link</b> or <b>edge</b>) joins cells that share a side: up, down, left, "
             "or right. Diagonals do not count. There are 9 dots and 12 lines. "
             "Thicker lines below mean stronger model links at alpha 3.", y) - 8
    y = image(pdf, ASSETS / "graphs.png", y, 536, 218) - 12
    y = label(pdf, "Give each link a strength", y) - 8
    y = body(pdf, "First, the computer measures how sharply the numbers change around each "
             "cell, horizontally and vertically. Their combined size is called that "
             "cell's <b>gradient magnitude</b>. "
             "For a pair of neighbors, the code averages these amounts. A sharper "
             "change usually gives a weaker link. This is a chosen rule, not an "
             "observed physical connection.", y) - 10
    box(pdf, "<b>Optional calculation, alpha 3, top-left to top-middle:</b> Smooth gradients "
        "are about 0.386 and 0.409, so g = 0.398 and exp(-3 x 0.398) = 0.3038. "
        "Scattered gradients are about 1.091 and 0.409, so g = 0.750 and "
        "exp(-3 x 0.750) = 0.1055. These are model weights, not measured heat flow.", y, 80)
    pdf.showPage()

    # Page 4: explain alpha directly before showing all six runs.
    page_header(pdf, 4, "4. What does alpha = 3 mean?",
                "Alpha is a setting we choose for the model, like a sensitivity dial.")
    y = label(pdf, "What the dial controls", 665) - 8
    y = body(pdf, "The code gives each link a strength. When nearby values change "
             "sharply, a higher alpha makes that link weaker. <b>Alpha = 3</b> means "
             "the dial is set to 3 for this calculation. It does not mean 3 degrees, "
             "three times hotter, or a measured property of a neighborhood.", y) - 10
    y = image(pdf, ASSETS / "alpha.png", y, 500, 215) - 10
    y = label(pdf, "Follow the same example link", y) - 8
    y = body(pdf, "This chart tracks the link between the top-left and top-middle cells. "
             "In the smooth grid, its strength falls from 0.672 at alpha 1 to 0.304 "
             "at alpha 3 and 0.137 at alpha 5. In the scattered grid, the same "
             "positions give 0.472, 0.105, and 0.024. Smaller strength means "
             "the model treats that local connection as weaker.", y) - 12
    y = box(pdf, "<b>Why 1, 3, and 5?</b> The code already uses 3 as its default. "
            "The experiment adds a lower setting (1) and a higher setting (5), equally "
            "spaced around 3, to see whether the result changes when the dial moves. "
            "This is a simple sensitivity check, not evidence that these are the best "
            "settings. Other nonnegative values could be tried. For a real city, "
            "researchers should state their choice in advance, test several values, "
            "and compare the results with independent local evidence.", y, 120)
    assert y > 58, f"Alpha explanation overlaps footer: y={y}"
    pdf.showPage()

    # Page 5: alpha runs and lambda.
    page_header(pdf, 5, "5. Repeat at three alpha settings",
                "Think of alpha as a sensitivity dial for the link-strength rule.")
    y = label(pdf, "Run both grids at alpha = 1, 3, and 5", 665) - 8
    y = body(pdf, "A higher alpha makes a sharp local change weaken a link more strongly. "
             "The code rebuilds both grids at alpha 1, 3, and 5: six runs total. "
             "These checkpoints are different settings, not later days or new measurements.", y) - 13
    # Data table.
    headers = ["Grid", "Alpha", "lambda 2", "Sweep", "Exact"]
    x_positions = [48, 165, 251, 354, 459]
    pdf.setFillColor(colors.HexColor(TEAL))
    pdf.roundRect(38, y - 27, 536, 31, 5, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 10)
    for x, header in zip(x_positions, headers):
        pdf.drawString(x, y - 16, header)
    y -= 29
    for index, row in enumerate(rows):
        if index % 2 == 0:
            pdf.setFillColor(colors.HexColor("#f0f6f5"))
            pdf.rect(38, y - 28, 536, 29, fill=1, stroke=0)
        pdf.setFillColor(colors.HexColor(NAVY))
        pdf.setFont("Helvetica", 10)
        cells = [row["name"], str(row["alpha"]), f"{row['eigenvalue']:.4f}",
                 f"{row['sweep_score']:.4f}", f"{row['exact_score']:.4f}"]
        for x, cell in zip(x_positions, cells):
            pdf.drawString(x, y - 18, cell)
        y -= 29
    y -= 14
    y = label(pdf, "What do the columns mean?", y) - 8
    y = body(pdf, "<b>Lambda 2</b> is one number summarizing how tightly this weighted "
             "network holds together; the later theory page explains its math. "
             "<b>Sweep conductance</b> is the score of the best split found by the quick "
             "sweep. <b>Exact conductance</b> is the lowest score after checking every split. "
             "Lower division scores mean a weaker link between the groups under "
             "these model rules. None is a temperature.", y) - 12
    box(pdf, "<b>Checkpoint C:</b> At every alpha, compare the smooth and scattered rows. "
        "The same input values produce different graph scores. No single score is promised "
        "to change in the same direction for every rearrangement.", y, 70)
    pdf.showPage()

    # Page 6: define a split before discussing how to search for one.
    page_header(pdf, 6, "6. What is a split?",
                "A split simply puts the nine cells into two groups.")
    y = label(pdf, "Think of dividing a small set of linked blocks", 665) - 8
    y = body(pdf, "Choose some cells for Group A. All remaining cells are Group B. "
             "The <b>split</b> is that division. Links joining a cell in A to a cell in B "
             "<b>cross the split</b>. In the picture, the orange links cross; the gray "
             "links stay within a group.", y) - 8
    y = image(pdf, ASSETS / "split.png", y, 500, 190) - 10
    y = label(pdf, "Why look for a split?", y) - 8
    y = body(pdf, "A division with relatively little connection between its groups can "
             "reveal a <b>bottleneck in the model</b>: two parts of the grid are joined "
             "less strongly than the rest. That is more specific than saying the whole "
             "grid's average is 5. It gives someone a boundary and an explanation to "
             "inspect or challenge. In this project, it points to a place to compare "
             "with real shade, streets, and local knowledge before any decision.", y) - 11
    y = label(pdf, "How is a split scored?", y) - 8
    y = body(pdf, "Add the strengths of the orange crossing links. Then compare that sum "
             "with the total link strength attached to the smaller group. The resulting "
             "ratio is called <b>conductance</b>. A lower ratio means a weaker division "
             "<i>in this chosen graph</i>. The ratio has no temperature unit.", y) - 12
    box(pdf, "<b>Important limit:</b> A split is a mathematical grouping of cells. It is "
        "not a wall, a street boundary, a safe route, or proof that one side is hotter. "
        "Real-world meaning would need local observations.", y, 69)
    pdf.showPage()

    # Page 7: plain-language explanation of the sweep search.
    page_header(pdf, 7, "7. What does 'sweep' mean?",
                "A sweep searches quickly for a weak division in a much larger set of possibilities.")
    y = label(pdf, "Why do a sweep?", 665) - 8
    y = body(pdf, "We want to find two groups joined relatively weakly in the model. "
             "Checking every possible division gets hard fast: each added cell roughly "
             "doubles the possibilities. Nine cells already have 255 distinct splits. "
             "A sweep checks only eight carefully ordered splits here, giving a quick "
             "candidate. On a large grid, that shortcut matters much more.", y) - 8
    y = label(pdf, "How does it work?", y) - 8
    y = body(pdf, "The graph's link strengths give the cells an order. For the smooth grid "
             "at alpha 3 it is 1, 4, 2, 7, 5, 3, 8, 6, 9, not coldest to hottest. "
             "Imagine sliding a divider through this row, stopping after each card. "
             "Score the split at each stop and keep the lowest score. That is the sweep.", y) - 7
    y = image(pdf, ASSETS / "sweep.png", y, 516, 225) - 9
    y = box(pdf, "<b>What happened here?</b> At alpha 3, the chosen divider is after "
            "five cards: {1, 4, 2, 7, 5} versus {3, 8, 6, 9}. Its score is 0.3927. "
            "Stops 4 and 5 look tied when rounded; full precision picks stop 5.", y, 69) - 12
    y = box(pdf, "<b>Why check it?</b> The sweep tries eight splits in this one order. "
        "There are 255 distinct splits altogether, so the sweep is a quick proposal, "
        "not proof of the best possible split. The exact check comes next.", y, 66)
    assert y > 58, f"Sweep explanation overlaps footer: y={y}"
    pdf.showPage()

    # Page 8: sweep and exact cut pictures.
    page_header(pdf, 8, "8. See the candidate and exact splits",
                "Compare the quick proposal with the best split found by checking every option.")
    y = label(pdf, "Read the four pictures", 665) - 8
    y = body(pdf, "The top row shows the split chosen by the quick sweep. The bottom "
             "row shows the lowest-scoring split after checking all 255 possibilities. "
             "The left column uses the smooth grid; the right uses the scattered grid. "
             "At alpha 3, the numbers in each square are the original teaching values.", y) - 8
    y = image(pdf, ASSETS / "cuts.png", y, 470, 335) - 8
    y = body(pdf, "Green squares identify one group; brown squares identify the other. "
             "Those colors do not mean hot or cool. For the smooth grid's sweep split, "
             "crossing links total 1.1715 and the smaller side's link strength totals "
             "2.9831. <b>Sweep conductance = 1.1715 / 2.9831 = 0.3927.</b> It is the "
             "score of the split the sweep chose, not a temperature.", y) - 8
    y = box(pdf, "<b>Checkpoint D:</b> A sweep split is a candidate. It need not be the best "
            "split among all possible groups of cells.", y, 54)
    assert y > 58, f"Sweep comparison overlaps footer: y={y}"
    pdf.showPage()

    # Page 9: exact comparison.
    page_header(pdf, 9, "9. Check every distinct split",
                "The tiny grid lets us check the sweep against every possible two-group division.")
    y = label(pdf, "Count the possible splits", 665) - 8
    y = body(pdf, "Calling the green cells Group A and the brown cells Group B describes "
             "the same boundary as swapping those names. To avoid counting twice, "
             "keep the first cell in Group B. Each of the other eight cells has a yes/no "
             "choice: 2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 = 256 choices. Exclude the choice "
             "with no cells in Group A. That leaves "
             "<b>255 distinct nonempty splits</b>.", y) - 16
    y = label(pdf, "Score each split with conductance", y) - 8
    y = body(pdf, "Add the strengths of links crossing the split. Divide by the smaller "
             "side's <b>volume</b>, meaning the total strength of all links attached to "
             "the cells on that side. "
             "The lowest result over all 255 splits is the exact minimum for this graph.", y) - 12
    smooth = next(r for r in rows if r["name"] == "Smooth" and r["alpha"] == 3)
    scattered = next(r for r in rows if r["name"] == "Scattered" and r["alpha"] == 3)
    y = box(pdf, f"<b>Worked smooth-grid example, alpha 3:</b> The exact split has crossing "
            f"weight {smooth['exact_crossing']:.4f} and smaller-side volume "
            f"{smooth['exact_denominator']:.4f}. Their ratio is "
            f"{smooth['exact_score']:.4f}. The sweep gives "
            f"{smooth['sweep_score']:.4f}, so its full-precision gap is "
            f"{smooth['sweep_score'] - smooth['exact_score']:.4f}.", y, 95) - 16
    y = label(pdf, "Checkpoint E: compare the proposal with the best score", y) - 8
    y = body(pdf, f"For the scattered grid at alpha 3, sweep = {scattered['sweep_score']:.4f} "
             f"and exact = {scattered['exact_score']:.4f}. Using full precision, the gap "
             f"rounds to {scattered['sweep_score'] - scattered['exact_score']:.4f}. "
             "The best score from all 255 options must be no higher than the "
             "sweep's score, because the sweep's choice is one of those options.", y) - 12
    box(pdf, "<b>Why only nine cells?</b> The number of possible groups grows very quickly. "
        "The exact check audits this teaching graph; it is not the method used to search "
        "an entire city raster.", y, 66)
    pdf.showPage()

    # Page 10: conclusions and reproducibility.
    page_header(pdf, 10, "10. Verify and interpret the result",
                "What the pictures and checkpoints support, and what they do not.")
    y = label(pdf, "The result", 665) - 8
    y = body(pdf, "At alpha 3, both grids have mean 5, but their sweep conductances are "
             "0.3927 (smooth) and 0.4396 (scattered). Their exact minima also differ: "
             "0.3290 and 0.3941. Arrangement changed the graph's answer while the mean "
             "and histogram stayed fixed.", y) - 16
    y = label(pdf, "How the pictures and paper were made", y) - 8
    y = body(pdf, "A Python program stored the two 3-by-3 number grids. A drawing library "
             "colored the squares and printed their numbers. The program then ran the "
             "same graph calculations for all six cases, saved the unrounded results, "
             "and checked that Table 1 in the paper matched before making the PDF.", y) - 16
    y = label(pdf, "Optional: repeat it with Python", y) - 8
    y = box(pdf, "From the repository root, run:<br/><br/>"
            "<font name='Courier'>.venv/bin/python scripts/build_final_paper.py</font><br/><br/>"
            "Read <font name='Courier'>docs/final_paper_assets/results.json</font> "
            "and compare the six rows with Table 1.", y, 100) - 16
    y = label(pdf, "Limits", y) - 8
    y = body(pdf, "This is a controlled computation with invented, unitless values. There "
             "was no site visit, sensor reading, human participant, or observed cooling "
             "outcome. The graphs describe the chosen model; they do not prove a real "
             "neighborhood boundary or a useful intervention.", y)
    pdf.showPage()

    # Page 11: mathematical argument and its scope.
    page_header(pdf, 11, "Theory: why position can matter",
                "The first two steps use ordinary reasoning. The formula in step 3 is optional.")
    y = label(pdf, "1. The average and number counts cannot tell the grids apart", 665) - 8
    y = body(pdf, "A rearrangement leaves the nine values unchanged. Any statistic that "
             "depends only on the list of values, including the mean and histogram, must "
             "therefore be identical. Both means are 5. Because normalization uses the "
             "same value distribution, it also produces the same list of scaled values "
             "in different positions.", y) - 13
    y = label(pdf, "2. The link strengths do tell the grids apart", y) - 8
    y = body(pdf, "A link's strength depends on how sharply nearby values change. "
             "Moving the values changes which numbers are close, and therefore can "
             "change the link strengths. We can see one changed link on page 3: "
             "0.3038 in the smooth grid versus 0.1055 in the scattered grid. "
             "Averages do not contain this neighbor information.", y) - 13
    y = label(pdf, "3. The answers use those link strengths", y) - 8
    y = body(pdf, "The graph's overall-connection score and split scores are calculated "
             "from its link strengths. Change the links, and those answers can change "
             "even though the average stays 5. This is why the experiment makes sense "
             "before we look at the six measured results.", y) - 13
    y = box(pdf, "<b>Optional math:</b> The program's link rule is "
            "w(i,j) = max(10<super>-9</super>, exp(-alpha x g(i,j))), where g is the "
            "average local change around two neighboring cells. It computes lambda 2 "
            "from D<super>-1/2</super>(D - A)D<super>-1/2</super>, where A stores link "
            "strengths and D stores each dot's total link strength. "
            "Conductance = crossing strength / smaller side's total link strength.", y, 100) - 13
    y = box(pdf, "<b>Logical chain:</b> Same nine values and same average  ->  different positions "
            "-> different local gradients  ->  different graph weights  ->  potentially "
            "different connection and split scores.", y, 65) - 13
    y = label(pdf, "What is demonstrated, rather than assumed", y) - 8
    y = body(pdf, "The reasoning explains why a difference is possible. The six computed runs "
         "show that it actually occurs for these two grids. They do not prove that every "
         "rearrangement changes every score. The 255-cut check verifies the best "
         "split score for each nine-cell graph, separately from the sweep.", y)
    assert y > 58, f"Theory text overlaps footer: y={y}"
    pdf.showPage()

    # Page 12: evidence-linked conclusion and project value.
    page_header(pdf, 12, "Conclusion: what this adds",
                "The strongest conclusion is about inspectable spatial structure in this model.")
    y = label(pdf, "The controlled result", 665) - 8
    y = body(pdf, "For these grids, the average and number counts are identical, yet both the "
             "sweep's proposed split and the best split found by checking all options "
             "have different scores at every tested alpha. "
             "At alpha 3, scattered minus smooth conductance is 0.0469 for the sweep "
             "and 0.0652 for the best split. This is direct evidence that the chosen "
             "graph rules capture information about position that an average omits.", y) - 7
    y = image(pdf, ASSETS / "differences.png", y, 488, 153) - 5
    y = body(pdf, "Each bar compares the same two grids at one alpha. The larger gap at "
             "higher alpha shows how changing the sensitivity dial matters for this "
             "pair; it is not a rule for every possible grid.", y) - 13
    y = label(pdf, "Why it is useful in this project", y) - 8
    y = body(pdf, "The project can show a <b>specific, checkable clue</b> beside a heat "
             "image: which cells the model groups together, where its links are weak, "
             "and how the answer changes when alpha changes. The all-options check "
             "also shows how far the quick sweep is from the best split on this small "
             "grid. A resident, teacher, or reviewer can inspect and question the rule "
             "behind the colored result.", y) - 13
    y = box(pdf, "<b>Value for the project:</b> a repeatable, inspectable way to show "
            "one kind of position-based pattern and how much a shortcut missed. "
            "It helps people ask why a map highlighted an area before trusting it.", y, 72) - 12
    y = label(pdf, "What would establish real-world value", y) - 8
    y = body(pdf, "This experiment does not yet show that the graph helps people make "
         "better real decisions than a simple heat map. That would require real data "
         "for the same places, local reviewers, a fair comparison with a simple map, "
         "and a record of what decisions or outcomes followed. These nine invented "
         "cells cannot prove that a neighborhood is cooler or an intervention works.", y)
    assert y > 58, f"Conclusion text overlaps footer: y={y}"
    pdf.showPage()

    # Page 13: civic purpose and the exact scope of this experiment.
    page_header(pdf, 13, "So what does this add to the project?",
                "It tests whether one proposed map explanation is more than an average.")
    y = label(pdf, "Imagine someone asking about a hot bus stop", 665) - 8
    y = body(pdf, "A citywide average cannot show whether high and low values sit "
             "together or are scattered. A normal heat map does show their positions. "
             "Urban Heat Democratization aims to add a stated rule for highlighting "
             "possible weak connections between areas, so people can ask <i>why did "
             "the tool mark this place?</i>", y) - 14
    y = box(pdf, "<b>1. What this experiment tested:</b> The two little grids have the "
            "same values and average. After the values move, the project's graph "
            "scores change. So the graph calculation responds to the pattern of "
            "neighboring values, not just the overall average.", y, 79) - 13
    y = box(pdf, "<b>2. Why the exact check matters:</b> The quick sweep proposes a "
            "division. Checking every division on this tiny grid shows how far that "
            "proposal is from the best score. The project can report the shortcut's "
            "limits instead of asking people to trust it blindly.", y, 79) - 13
    y = box(pdf, "<b>3. How this could help someone later:</b> With real, properly "
            "prepared data, a resident could inspect the highlighted area, ask which "
            "values and settings produced it, and compare it with shade, access, and "
            "local experience. That public-checking step is the aim of "
            "<i>democratization</i>; it was not tested by the nine-cell experiment.", y, 93) - 17
    y = label(pdf, "The honest takeaway", y) - 8
    y = body(pdf, "This is a successful <b>method check</b>: the graph adds a measurable "
             "description of position and its proposed split can be audited. It is not "
             "evidence that the graph is better than an ordinary heat map for a real "
             "decision, or that a marked place needs a particular intervention. "
             "Those claims require real data and people checking the result on the ground.", y)
    assert y > 58, f"Civic value page overlaps footer: y={y}"
    pdf.showPage()

    # Page 14: one-page glossary and comprehension check.
    page_header(pdf, 14, "Plain-words guide to the terms",
                "Use this page whenever a technical word interrupts the story.")
    y = box(pdf, "<b>The whole experiment in one sentence:</b> We moved the same numbers "
            "around, turned neighboring squares into linked dots, looked for a weak "
            "division, and checked the quick answer against every possible division.",
            665, 70) - 19
    y = label(pdf, "Quick dictionary", y) - 12
    left = [
        ("Grid / cell", "A grid is a set of squares; a cell is one square."),
        ("Graph", "A drawing of dots and links that records which cells are neighbors."),
        ("Node / link", "A node is one cell's dot; a link joins two neighboring dots."),
        ("Weight", "A number assigned to a link to show its strength in this model."),
        ("Gradient", "How sharply values change around a cell."),
        ("Alpha", "A dial controlling how strongly sharp changes weaken links."),
        ("Split", "A way to put all cells into two groups."),
    ]
    right = [
        ("Crossing link", "A link joining cells in different groups."),
        ("Conductance", "A ratio that scores how weak a split is in the chosen graph."),
        ("Sweep", "Moving a divider through a graph-based list and scoring each stop."),
        ("Exact check", "Scoring every different split to find the best one here."),
        ("Lambda 2", "A single number summarizing the chosen graph's connectivity."),
        ("Checkpoint", "A place to verify inputs, results, or a model setting."),
        ("Unitless", "A number that is not degrees or another physical unit."),
    ]
    for x, terms in ((38, left), (314, right)):
        item_y = y
        for term, meaning in terms:
            item_y = draw_paragraph(pdf, f"<b>{term}:</b> {meaning}", x, item_y,
                                    260, size=10.6, leading=14.5) - 11
    y = 178
    y = label(pdf, "Three checks for yourself", y) - 6
    y = body(pdf, "<b>What changed?</b> Only where the nine values sit. "
             "<b>Why sweep?</b> To get a quick candidate without checking every split. "
             "<b>What is proved?</b> Under these declared rules, positions can change "
             "the graph scores even when the average stays 5.", y)
    assert y > 58, f"Glossary text overlaps footer: y={y}"
    pdf.showPage()
    pdf.save()


def main():
    rows = run()
    grid_chart(ASSETS / "inputs.png", GRIDS, ".0f")
    grid_chart(ASSETS / "normalized.png", {name: normalize(raw) for name, raw in GRIDS.items()}, ".3f", "YlGnBu")
    graph_chart(ASSETS / "graphs.png", rows)
    alpha_chart(ASSETS / "alpha.png", rows)
    split_chart(ASSETS / "split.png", next(r for r in rows if r["alpha"] == 3 and r["name"] == "Smooth"))
    sweep_chart(ASSETS / "sweep.png", next(r for r in rows if r["alpha"] == 3 and r["name"] == "Smooth"))
    cut_chart(ASSETS / "cuts.png", rows)
    difference_chart(ASSETS / "differences.png", rows)
    build_pdf(rows)
    print(OUTPUT)


if __name__ == "__main__":
    main()
