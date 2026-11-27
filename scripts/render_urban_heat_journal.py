"""Render the Urban Heat Democratization APA-style manuscript to PDF.

Requires pandoc plus the repository's requirements-research.txt packages.
Run: .venv/bin/python scripts/render_urban_heat_journal.py
"""

from __future__ import annotations

import html
import json
import os
from pathlib import Path
import subprocess
import tempfile

os.environ.setdefault("MPLCONFIGDIR", "/tmp/urban-heat-matplotlib")
os.environ.setdefault("XDG_CACHE_HOME", "/tmp/urban-heat-cache")

from matplotlib.font_manager import FontProperties
from matplotlib.mathtext import math_to_image
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/DEMOCRATIZING_URBAN_HEAT_RESILIENCE_JOURNAL.md"
OUTPUT = SOURCE.with_suffix(".pdf")
FONT_DIR = Path("/System/Library/Fonts/Supplemental")
FONT_FILES = {
    "Times": "Times New Roman.ttf",
    "Times-Bold": "Times New Roman Bold.ttf",
    "Times-Italic": "Times New Roman Italic.ttf",
    "Times-BoldItalic": "Times New Roman Bold Italic.ttf",
}

for name, filename in FONT_FILES.items():
    path = FONT_DIR / filename
    if path.exists():
        pdfmetrics.registerFont(TTFont(name, str(path)))
    else:
        # ReportLab's built-in Times family remains a portable fallback.
        FONT_FILES = {}
        break
pdfmetrics.registerFontFamily(
    "Times", normal="Times", bold="Times-Bold", italic="Times-Italic", boldItalic="Times-BoldItalic"
)

BODY = ParagraphStyle(
    "APA body", fontName="Times", fontSize=12, leading=24, alignment=TA_LEFT,
    firstLineIndent=36, spaceAfter=0,
)
NO_INDENT = ParagraphStyle("APA unindented", parent=BODY, firstLineIndent=0)
TITLE = ParagraphStyle(
    "APA title", parent=BODY, fontName="Times-Bold", alignment=TA_CENTER,
    firstLineIndent=0, spaceAfter=24,
)
TITLE_DETAIL = ParagraphStyle("APA title detail", parent=NO_INDENT, alignment=TA_CENTER)
H1 = ParagraphStyle(
    "APA heading 1", parent=BODY, fontName="Times-Bold", alignment=TA_CENTER,
    firstLineIndent=0, spaceBefore=20, spaceAfter=0, keepWithNext=True,
)
H2 = ParagraphStyle(
    "APA heading 2", parent=BODY, fontName="Times-Bold", alignment=TA_LEFT,
    firstLineIndent=0, spaceBefore=16, spaceAfter=0, keepWithNext=True,
)
REF = ParagraphStyle("APA reference", parent=BODY, firstLineIndent=-36, leftIndent=36)
TABLE_CELL = ParagraphStyle("APA table cell", parent=NO_INDENT, fontSize=8.5, leading=11.5)
TABLE_HEAD = ParagraphStyle("APA table heading", parent=TABLE_CELL, fontName="Times-Bold")


def prepared_math(latex: str) -> str:
    return (
        " ".join(latex.split())
        .replace(r"\mathcal L", r"\mathcal{L}")
        .replace(r"\mathbf 1", r"\mathbf{1}")
        .replace(r"\Pr", r"\mathrm{Pr}")
        .replace(r"\operatorname{", r"\mathrm{")
        .replace(r"\text{", r"\mathrm{")
    )


class MathImages:
    def __init__(self, directory: Path):
        self.directory = directory
        self.cache: dict[tuple[str, bool], tuple[Path, float, float]] = {}

    def get(self, latex: str, display: bool) -> tuple[Path, float, float]:
        key = (latex, display)
        if key not in self.cache:
            expression = prepared_math(latex)
            path = self.directory / f"math-{len(self.cache):03}.png"
            math_to_image(
                f"${expression}$", str(path), prop=FontProperties(size=12),
                dpi=300, format="png", color="black",
            )
            with PILImage.open(path) as img:
                width, height = img.size
            width_pt, height_pt = width * 72 / 300, height * 72 / 300
            if display and width_pt > 468:
                scale = 468 / width_pt
                width_pt, height_pt = 468, height_pt * scale
            if not display and height_pt > 17:
                scale = 17 / height_pt
                width_pt, height_pt = width_pt * scale, 17
            self.cache[key] = (path, width_pt, height_pt)
        return self.cache[key]


def inline_markup(inlines: list[dict], math: MathImages) -> str:
    out: list[str] = []
    for item in inlines:
        kind, value = item["t"], item.get("c")
        if kind == "Str":
            out.append(html.escape(value))
        elif kind in ("Space", "SoftBreak"):
            out.append(" ")
        elif kind == "LineBreak":
            out.append("<br/>")
        elif kind == "Strong":
            out.append(f"<b>{inline_markup(value, math)}</b>")
        elif kind == "Emph":
            out.append(f"<i>{inline_markup(value, math)}</i>")
        elif kind == "Code":
            out.append(f"<font name='Courier' size='9'>{html.escape(value[1])}</font>")
        elif kind == "Link":
            target = html.escape(value[2][0], quote=True)
            out.append(f"<link href='{target}'>{inline_markup(value[1], math)}</link>")
        elif kind == "Math":
            _, latex = value
            path, width, height = math.get(latex, False)
            out.append(
                f"<img src='{path}' width='{width:.2f}' height='{height:.2f}' valign='middle'/>"
            )
        elif kind == "Quoted":
            mark = '“' if value[0]["t"] == "DoubleQuote" else '‘'
            close = '”' if mark == '“' else '’'
            out.append(mark + inline_markup(value[1], math) + close)
        elif kind == "Span":
            out.append(inline_markup(value[1], math))
        elif kind == "RawInline" and value[0] == "html":
            # Only the source's line breaks are needed in the PDF.
            if value[1].strip().lower() == "<br>":
                out.append("<br/>")
    return "".join(out)


def block_markup(blocks: list[dict], math: MathImages) -> str:
    return " ".join(
        inline_markup(block.get("c", []), math)
        for block in blocks if block["t"] in ("Plain", "Para")
    )


def table_flowables(block: dict, math: MathImages, number: int) -> list:
    _, _, _, head, bodies, _ = block["c"]
    header_rows = head[1]
    rows = list(header_rows)
    for body in bodies:
        rows.extend(body[2])
        rows.extend(body[3])
    data = []
    for row_index, row in enumerate(rows):
        cells = []
        for cell in row[1]:
            style = TABLE_HEAD if row_index == 0 else TABLE_CELL
            cells.append(Paragraph(block_markup(cell[4], math), style))
        data.append(cells)
    titles = {
        1: "Evidence States and Requirements for Stronger Claims",
        2: "Repository Evidence Crosswalk",
        3: "Notation and Interpretation Boundaries",
    }
    count = len(data[0])
    widths = [156, 156, 156] if count == 3 else [234, 234]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT", splitByRow=1)
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("LINEABOVE", (0, 0), (-1, 0), 1, colors.black),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.black),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.black),
    ]))
    return [
        Spacer(1, 14),
        Paragraph(f"<b>Table {number}</b>", NO_INDENT),
        Paragraph(f"<i>{titles[number]}</i>", NO_INDENT),
        Spacer(1, 6), table, Spacer(1, 10),
    ]


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Times", 10)
    canvas.drawString(72, 756, "THE RIGHT TO QUESTION THE MAP")
    canvas.drawRightString(540, 756, str(doc.page))
    canvas.restoreState()


def render() -> None:
    parsed = subprocess.check_output(["pandoc", str(SOURCE), "-t", "json"])
    document = json.loads(parsed)
    blocks = document["blocks"]
    assert blocks[0]["t"] == "Header"

    with tempfile.TemporaryDirectory(prefix="urban-heat-math-") as tmp:
        math = MathImages(Path(tmp))
        story: list = []

        # APA professional title page.
        story += [Spacer(1, 115), Paragraph(inline_markup(blocks[0]["c"][2], math), TITLE)]
        story += [Paragraph("Aarti Sri Ravikumar", TITLE_DETAIL)]
        story += [Paragraph("Independent researcher and creator, Urban Heat Democratization", TITLE_DETAIL)]
        story += [Spacer(1, 70), Paragraph("<b>Author Note</b>", TITLE_DETAIL)]
        story += [Paragraph("ORCID: 0009-0009-9807-5273", NO_INDENT)]
        story += [Paragraph("Correspondence: https://urban-heat.ai-aarti.com/", NO_INDENT)]
        story += [Paragraph("Open working manuscript; not peer reviewed. November 27, 2026.", NO_INDENT)]
        story += [Paragraph("Code baseline: 4c073d5. Funding and competing-interest statements require author confirmation before submission.", NO_INDENT)]
        story.append(PageBreak())

        # Source author/version lines repeat the formatted title page.
        index = next(
            i for i, block in enumerate(blocks)
            if block["t"] == "Header" and inline_markup(block["c"][2], math) == "Abstract"
        )
        assert blocks[index]["t"] == "Header" and "Abstract" in inline_markup(blocks[index]["c"][2], math)
        story += [Paragraph("Abstract", H1)]
        story += [Paragraph(inline_markup(blocks[index + 1]["c"], math), NO_INDENT)]
        story += [Spacer(1, 10), Paragraph(inline_markup(blocks[index + 2]["c"], math), NO_INDENT)]
        story.append(PageBreak())

        story += [Paragraph(inline_markup(blocks[0]["c"][2], math), TITLE)]
        section = ""
        table_number = 0
        for block in blocks[index + 3:]:
            kind = block["t"]
            if kind == "Header":
                level = block["c"][0]
                heading = inline_markup(block["c"][2], math)
                section = html.unescape("".join(
                    c["c"] if c["t"] == "Str" else " " if c["t"] == "Space" else ""
                    for c in block["c"][2]
                ))
                if section in ("References", "Appendix A: Reproducibility and Source Crosswalk", "Appendix B: Notation and Interpretation"):
                    story.append(PageBreak())
                story.append(Paragraph(heading, H1 if level == 2 else H2))
            elif kind == "Para":
                inlines = block["c"]
                if len(inlines) == 1 and inlines[0]["t"] == "Math" and inlines[0]["c"][0]["t"] == "DisplayMath":
                    path, width, height = math.get(inlines[0]["c"][1], True)
                    story += [Spacer(1, 12), Image(str(path), width=width, height=height, hAlign="CENTER"), Spacer(1, 12)]
                else:
                    style = REF if section == "References" else BODY
                    story.append(Paragraph(inline_markup(inlines, math), style))
            elif kind == "Table":
                table_number += 1
                story.extend(table_flowables(block, math, table_number))

        pdf = BaseDocTemplate(
            str(OUTPUT), pagesize=letter, leftMargin=72, rightMargin=72,
            topMargin=72, bottomMargin=72, title="The Right to Question the Map",
            author="Aarti Sri Ravikumar", subject="APA-style methods manuscript on Urban Heat Democratization",
        )
        frame = Frame(72, 72, 468, 648, id="body", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        pdf.addPageTemplates(PageTemplate(id="APA", frames=[frame], onPage=header_footer))
        pdf.build(story)


if __name__ == "__main__":
    render()
    print(OUTPUT)
