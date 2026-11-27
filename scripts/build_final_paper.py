"""Reproduce the nine-cell experiment and render docs/Final_Paper.pdf.

Run from the repository root with .venv/bin/python scripts/build_final_paper.py.
The source manuscript is docs/Final_Paper.md; generated figures and full-precision
measurements live in docs/final_paper_assets/.
"""

from __future__ import annotations

import html
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

os.environ.setdefault("MPLCONFIGDIR", "/tmp/urban-heat-final-paper-mpl")
os.environ.setdefault("XDG_CACHE_HOME", "/tmp/urban-heat-final-paper-cache")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

from core.assurance import fiedler_exact_cut_benchmark
from core.graph import build_weighted_grid
from core.raster import normalize
from scripts.render_urban_heat_journal import MathImages, block_markup, inline_markup


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/Final_Paper.md"
OUTPUT = ROOT / "docs/Final_Paper.pdf"
ASSETS = ROOT / "docs/final_paper_assets"
PATTERNS = {
    "Smooth": np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]], dtype=float),
    "Scattered": np.array([[1, 8, 3], [6, 5, 4], [7, 2, 9]], dtype=float),
}
ALPHAS = (1, 3, 5)
INK = colors.HexColor("#173044")
TEAL = colors.HexColor("#08796f")
PALE = colors.HexColor("#e8f4f2")


def register_fonts() -> None:
    directory = Path("/System/Library/Fonts/Supplemental")
    files = {
        "Times": "Times New Roman.ttf",
        "Times-Bold": "Times New Roman Bold.ttf",
        "Times-Italic": "Times New Roman Italic.ttf",
        "Times-BoldItalic": "Times New Roman Bold Italic.ttf",
    }
    if all((directory / name).exists() for name in files.values()):
        for family, filename in files.items():
            pdfmetrics.registerFont(TTFont(family, str(directory / filename)))
    pdfmetrics.registerFontFamily(
        "Times", normal="Times", bold="Times-Bold", italic="Times-Italic", boldItalic="Times-BoldItalic"
    )


register_fonts()
BODY = ParagraphStyle(
    "Body", fontName="Times", fontSize=11, leading=16, textColor=INK,
    firstLineIndent=0, spaceAfter=9, alignment=TA_LEFT,
)
HEADING = ParagraphStyle(
    "Section", parent=BODY, fontName="Times-Bold", fontSize=15, leading=19,
    textColor=TEAL, spaceBefore=15, spaceAfter=7, keepWithNext=True,
)
CAPTION = ParagraphStyle(
    "Caption", parent=BODY, fontName="Times-Italic", fontSize=9.3,
    leading=12, spaceBefore=5, spaceAfter=13,
)
SMALL = ParagraphStyle("Small", parent=BODY, fontSize=8.4, leading=11, spaceAfter=0)
TABLE_HEAD = ParagraphStyle("TableHead", parent=SMALL, fontName="Times-Bold", textColor=colors.white)
TITLE = ParagraphStyle(
    "CoverTitle", parent=BODY, fontName="Times-Bold", fontSize=24,
    leading=30, textColor=INK, alignment=TA_CENTER, spaceAfter=18,
)
COVER = ParagraphStyle("CoverDetail", parent=BODY, fontSize=12, leading=20, alignment=TA_CENTER)
TOC_HEADING = ParagraphStyle("TOCHeading", parent=HEADING, fontSize=19, leading=24)
TOC_ENTRY = ParagraphStyle(
    "TOCEntry", parent=BODY, fontSize=10.4, leading=16, leftIndent=10,
    firstLineIndent=0, textColor=colors.HexColor("#075f78"),
)
BIBLIOGRAPHY = ParagraphStyle(
    "Bibliography", parent=BODY, fontSize=10.3, leading=14.5, spaceAfter=7,
)
MATH_BODY = ParagraphStyle("MathBody", parent=BODY, leading=17, spaceAfter=9)


def run_experiment() -> list[dict]:
    rows = []
    for alpha in ALPHAS:
        for name, raw in PATTERNS.items():
            graph, _ = build_weighted_grid(
                normalize(raw), None, connect8=False, alpha=float(alpha), beta=0.0
            )
            measured = fiedler_exact_cut_benchmark(graph)
            rows.append({
                "grid": name,
                "alpha": alpha,
                "mean_input": float(raw.mean()),
                "lambda2": measured["lambda2"],
                "sweep_conductance": measured["sweepConductance"],
                "exact_conductance": measured["exactConductance"],
                "approximation_gap": measured["approximationGap"],
            })
    for row in rows:
        assert row["exact_conductance"] <= row["sweep_conductance"] + 1e-9
    return rows


def verify_manuscript_data(rows: list[dict]) -> None:
    text = SOURCE.read_text(encoding="utf-8")
    for row in rows:
        expected = (
            f"| {row['grid']} | {row['alpha']} | {row['mean_input']:.1f} | "
            f"{row['lambda2']:.4f} | {row['sweep_conductance']:.4f} | "
            f"{row['exact_conductance']:.4f} |"
        )
        if expected not in text:
            raise ValueError(f"The manuscript data table is stale: {expected}")
    abstract_words = text.split("## Abstract", 1)[1].split("## Acknowledgements", 1)[0].split()
    if len(abstract_words) > 250:
        raise ValueError(f"Abstract exceeds the handout's 250-word limit: {len(abstract_words)}")
    print(f"Abstract: {len(abstract_words)} words")


def create_figures(rows: list[dict]) -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    (ASSETS / "results.json").write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")

    fig, axes = plt.subplots(1, 2, figsize=(9.4, 3.55), constrained_layout=True)
    for ax, (name, matrix) in zip(axes, PATTERNS.items()):
        ax.imshow(matrix, vmin=1, vmax=9, cmap="YlOrRd")
        for (row, col), value in np.ndenumerate(matrix):
            ax.text(col, row, str(int(value)), ha="center", va="center", fontsize=18,
                    fontweight="bold", color="#132b3d" if value < 7 else "white")
        ax.set_title(f"{name} grid · mean = 5", color="#173044", fontsize=14, weight="bold")
        ax.set_xticks([]); ax.set_yticks([])
        ax.set_xticks(np.arange(-.5, 3, 1), minor=True)
        ax.set_yticks(np.arange(-.5, 3, 1), minor=True)
        ax.grid(which="minor", color="white", linewidth=3)
        ax.tick_params(which="minor", bottom=False, left=False)
    fig.savefig(ASSETS / "grid_comparison.png", dpi=180, facecolor="white")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(9.4, 4.0), constrained_layout=True)
    palette = {"Smooth": "#096b65", "Scattered": "#c35e39"}
    for name in PATTERNS:
        selected = [row for row in rows if row["grid"] == name]
        x = [row["alpha"] for row in selected]
        ax.plot(x, [row["sweep_conductance"] for row in selected], marker="o",
                linewidth=2.3, color=palette[name], label=f"{name} · sweep")
        ax.plot(x, [row["exact_conductance"] for row in selected], marker="s",
                linestyle="--", linewidth=1.8, color=palette[name], label=f"{name} · exact")
    ax.set(xlabel="Alpha (model sensitivity)", ylabel="Conductance (unitless)", xticks=list(ALPHAS))
    ax.set_ylim(0.28, 0.52)
    ax.grid(axis="y", alpha=.25)
    ax.legend(ncol=2, frameon=False, fontsize=9, loc="upper left")
    fig.savefig(ASSETS / "conductance_graph.png", dpi=180, facecolor="white")
    plt.close(fig)


class PaperDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and getattr(flowable, "toc_level", None) == 0:
            key = flowable.toc_key
            heading_top = self.frame._y + flowable.height + flowable.getSpaceAfter() + 6
            self.canv.bookmarkHorizontalAbsolute(key, heading_top)
            self.canv.addOutlineEntry(flowable.getPlainText(), key, level=0)
            self.notify("TOCEntry", (0, flowable.getPlainText(), self.page, key))


def footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setStrokeColor(colors.HexColor("#c7d9d7"))
        canvas.line(58, 49, 554, 49)
        canvas.setFont("Times", 9)
        canvas.setFillColor(INK)
        canvas.drawString(58, 37, "URBAN HEAT DEMOCRATIZATION · STUDENT SCIENTIFIC PAPER")
        canvas.drawRightString(554, 37, str(doc.page))
    canvas.restoreState()


def read_document() -> dict:
    return json.loads(subprocess.check_output(["pandoc", str(SOURCE), "-t", "json"]))


def cover_text(metadata: dict, key: str) -> str:
    value = metadata[key]
    if value["t"] != "MetaInlines":
        raise ValueError(f"Expected plain cover metadata for {key}")
    return "".join(
        item["c"] if item["t"] == "Str" else " "
        for item in value["c"]
        if item["t"] in ("Str", "Space", "SoftBreak")
    ).strip()


def display_math(block: dict) -> str | None:
    if block["t"] != "Para":
        return None
    visible = [item for item in block["c"] if item["t"] not in ("Space", "SoftBreak")]
    if (len(visible) == 1 and visible[0]["t"] == "Math"
            and visible[0]["c"][0]["t"] == "DisplayMath"):
        return visible[0]["c"][1]
    return None


def render_table(block: dict, math: MathImages) -> list:
    _, _, _, head, bodies, _ = block["c"]
    rows = list(head[1])
    for body in bodies:
        rows.extend(body[2]); rows.extend(body[3])
    data = []
    for row_index, row in enumerate(rows):
        cells = [Paragraph(block_markup(cell[4], math), TABLE_HEAD if row_index == 0 else SMALL)
                 for cell in row[1]]
        data.append(cells)
    widths = [84, 48, 72, 78, 108, 108]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, -1), (-1, -1), .7, TEAL),
    ]))
    return [Spacer(1, 6), table, Spacer(1, 12)]


def render_figure(block: dict, math: MathImages) -> list:
    caption = block_markup(block["c"][1][1], math)
    image_inline = block["c"][2][0]["c"][0]
    relative = image_inline["c"][2][0]
    path = (SOURCE.parent / relative).resolve()
    if not path.is_file() or not path.is_relative_to(SOURCE.parent.resolve()):
        raise ValueError(f"Missing or unsafe figure path: {relative}")
    from PIL import Image as PILImage
    with PILImage.open(path) as im:
        width, height = im.size
    display_width = 320 if path.name == "grid_comparison.png" else 450
    display_height = display_width * height / width
    return [KeepTogether([
        Spacer(1, 7), Image(str(path), width=display_width, height=display_height, hAlign="CENTER"),
        Paragraph(caption, CAPTION),
    ])]


def build_pdf() -> None:
    document = read_document()
    blocks = document["blocks"]
    metadata = document["meta"]
    doc = PaperDoc(str(OUTPUT), pagesize=letter, leftMargin=57, rightMargin=57,
                   topMargin=58, bottomMargin=62, title="Can the Same Heat Values Tell Different Stories?",
                   author="Aarti Sri Ravikumar", subject="Student-facing scientific paper on auditable urban heat graphs")
    frame = Frame(57, 62, 498, 672, id="body", leftPadding=0, rightPadding=0,
                  topPadding=0, bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id="paper", frames=[frame], onPage=footer))
    toc = TableOfContents()
    toc.levelStyles = [TOC_ENTRY]
    story = [
        Spacer(1, 88), Paragraph("Can the Same Heat Values<br/>Tell Different Stories?", TITLE),
        Paragraph("Testing one link in an inspectable, community-centered heat evidence chain", COVER),
        Spacer(1, 60), Paragraph("Aarti Sri Ravikumar", COVER),
        Paragraph(f"School: {html.escape(cover_text(metadata, 'school'))}", COVER),
        Paragraph(f"Grade and class: {html.escape(cover_text(metadata, 'grade_class'))}", COVER),
        Paragraph(f"Teacher: {html.escape(cover_text(metadata, 'teacher'))}", COVER),
        Paragraph(html.escape(cover_text(metadata, "location")), COVER),
        Spacer(1, 55), Paragraph("November 27, 2026", COVER),
        Paragraph("Methods paper · computer experiment · no field measurements", COVER),
        PageBreak(), Paragraph("Table of Contents", TOC_HEADING), toc, PageBreak(),
    ]
    with tempfile.TemporaryDirectory(prefix="final-paper-math-") as directory:
        math = MathImages(Path(directory))
        section = ""
        heading_number = 0
        for index, block in enumerate(blocks):
            kind = block["t"]
            if kind == "Header":
                heading = inline_markup(block["c"][2], math)
                section = html.unescape(heading)
                para = Paragraph(heading, HEADING)
                para.toc_level = 0
                para.toc_key = f"paper-section-{heading_number}"
                heading_number += 1
                story.append(para)
            elif kind == "Para":
                equation = display_math(block)
                if equation is not None:
                    path, width, height = math.get(equation, True)
                    story.append(KeepTogether([
                        Spacer(1, 3), Image(str(path), width=width, height=height, hAlign="CENTER"),
                        Spacer(1, 7),
                    ]))
                else:
                    if section == "Works Cited (MLA)":
                        style = BIBLIOGRAPHY
                    elif section in ("Analysis and Mathematical Proof", "Same-Input Comparison with a Simple Heat Map"):
                        style = MATH_BODY
                    else:
                        style = BODY
                    if index + 1 < len(blocks) and display_math(blocks[index + 1]) is not None:
                        style = ParagraphStyle(f"BeforeEquation{index}", parent=style, keepWithNext=True)
                    story.append(Paragraph(inline_markup(block["c"], math), style))
            elif kind == "OrderedList":
                for index, item in enumerate(block["c"][1], start=1):
                    content = block_markup(item, math)
                    style = ParagraphStyle(f"Step{index}", parent=BODY, leftIndent=24,
                                           firstLineIndent=-20, keepTogether=True)
                    story.append(Paragraph(f"<b>{index}.</b> {content}", style))
            elif kind == "Figure":
                story.extend(render_figure(block, math))
            elif kind == "Table":
                story.extend(render_table(block, math))
            else:
                raise ValueError(f"Unhandled document block: {kind}")
        doc.multiBuild(story)


if __name__ == "__main__":
    results = run_experiment()
    verify_manuscript_data(results)
    create_figures(results)
    build_pdf()
    print(OUTPUT)
