"""Build an editable Word version of docs/Final_Paper.md.

Pandoc converts the manuscript's LaTeX mathematics to native Word equations.
The front matter and internal contents links are then added as Word elements.
"""
from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/Final_Paper.md"
OUTPUT = ROOT / "docs/Final_Paper.docx"
TITLE = "Urban Heat Democratization: What Can a Heat Map Tell Us?"
SUBTITLE = "A reproducible graph experiment and same-input map comparison"
AUTHOR = "Aarti Sri Ravikumar"
SECTIONS = [
    "Abstract", "Acknowledgements", "Introduction and Background Research",
    "Purpose", "Problem", "Hypothesis and Engineering Goals",
    "Variables and Constraints", "Materials", "Procedure",
    "Pictures and Experiment Checkpoints", "Data", "Graphs",
    "Same-Input Comparison with a Simple Heat Map",
    "Analysis and Mathematical Proof", "Conclusion",
    "Applications and Further Research", "Works Cited (MLA)",
]


def style_font(style, size, *, bold=False, color="142C3D", before=0, after=0, line=1.0):
    style.font.name = "Calibri"
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.color.rgb = RGBColor.from_string(color)
    pf = style.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line


def add_bookmark(paragraph, name, number):
    start = OxmlElement("w:bookmarkStart")
    start.set(qn("w:id"), str(number))
    start.set(qn("w:name"), name)
    end = OxmlElement("w:bookmarkEnd")
    end.set(qn("w:id"), str(number))
    paragraph._p.insert(0, start)
    paragraph._p.append(end)


def add_link(paragraph, label, target):
    link = OxmlElement("w:hyperlink")
    link.set(qn("w:anchor"), target)
    run = OxmlElement("w:r")
    props = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "146D76")
    props.append(color)
    run.append(props)
    text = OxmlElement("w:t")
    text.text = label
    run.append(text)
    link.append(run)
    paragraph._p.append(link)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc_pr = cell._tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tc_pr.append(margins)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        tag = margins.find(qn("w:" + side))
        if tag is None:
            tag = OxmlElement("w:" + side)
            margins.append(tag)
        tag.set(qn("w:w"), str(value))
        tag.set(qn("w:type"), "dxa")


def build():
    source = SOURCE.read_text(encoding="utf-8")
    source = re.sub(r"\A---\n.*?\n---\n", "", source, count=1, flags=re.S)
    source = re.sub(r"^## ", "# ", source, flags=re.M)
    with tempfile.TemporaryDirectory(prefix="urban-heat-final-word-") as tmp:
        markdown = Path(tmp) / "manuscript.md"
        markdown.write_text(source, encoding="utf-8")
        subprocess.run([
            "pandoc", str(markdown), "--from=markdown+tex_math_dollars",
            "--to=docx", "--resource-path", str(SOURCE.parent),
            "--output", str(OUTPUT),
        ], check=True)

    doc = Document(OUTPUT)
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    sec.top_margin = sec.bottom_margin = Inches(0.88)
    sec.left_margin = sec.right_margin = Inches(1)
    sec.header_distance = sec.footer_distance = Inches(0.45)

    style_font(doc.styles["Normal"], 10.5, after=8, line=1.25)
    doc.styles["Normal"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    style_font(doc.styles["Title"], 25, bold=True, color="14354B", after=14, line=1.1)
    style_font(doc.styles["Subtitle"], 13, color="3D6473", after=18, line=1.2)
    for name, size, before, after in (("Heading 1", 15, 18, 9), ("Heading 2", 12.5, 12, 6), ("Heading 3", 11.5, 8, 4)):
        style_font(doc.styles[name], size, bold=True, color="1E6673", before=before, after=after, line=1.1)
        doc.styles[name].paragraph_format.keep_with_next = True
    # Preserve Pandoc's native equation runs and real numbered lists.
    for p in doc.paragraphs:
        if p.style.name in ("Normal", "Body Text", "First Paragraph"):
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.line_spacing = 1.25
        if p.style.name == "Heading 1" and p.text.strip() in SECTIONS:
            add_bookmark(p, "paper_section_" + str(SECTIONS.index(p.text.strip()) + 1), 100 + SECTIONS.index(p.text.strip()))
    for table in doc.tables:
        table.autofit = False
        table.columns[0].width = Inches(1.05)
        for col in list(table.columns)[1:]:
            col.width = Inches(1.09)
        for row_i, row in enumerate(table.rows):
            for cell in row.cells:
                cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
                set_cell_margins(cell)
                for p in cell.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p.paragraph_format.space_after = Pt(0)
                    p.paragraph_format.line_spacing = 1.05
                    for run in p.runs:
                        run.font.size = Pt(8)
                        if row_i == 0:
                            run.bold = True
        table.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))

    # Insert front matter before the first section, retaining all body images/relationships.
    first = doc.paragraphs[0]
    entries = []
    for kind, value in [
        ("kicker", "SCIENTIFIC PAPER"),
        ("title", TITLE),
        ("subtitle", SUBTITLE),
        ("meta", AUTHOR),
        ("meta", "Pioneer Charter School of Science II"),
        ("meta", "9th grade · Ms. Focke's class"),
        ("meta", "Teacher: Ms. Focke"),
        ("meta", "Saugus, MA 01906"),
        ("meta", "November 27, 2026"),
        ("break", ""),
        ("toc_title", "Contents"),
        *[("toc", name) for name in SECTIONS],
        ("break", ""),
    ]:
        p = first.insert_paragraph_before()
        entries.append((p, kind, value))
    for p, kind, value in entries:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if kind in ("kicker", "title", "subtitle", "meta") else WD_ALIGN_PARAGRAPH.LEFT
        if kind == "kicker":
            p.add_run(value).bold = True
            p.paragraph_format.space_before = Pt(82)
            p.paragraph_format.space_after = Pt(25)
            p.runs[0].font.color.rgb = RGBColor(30, 102, 115)
        elif kind == "title":
            p.style = doc.styles["Title"]
            p.add_run(value)
        elif kind == "subtitle":
            p.style = doc.styles["Subtitle"]
            p.add_run(value)
            p.paragraph_format.space_after = Pt(80)
        elif kind == "meta":
            p.add_run(value)
            p.paragraph_format.space_after = Pt(9)
        elif kind == "toc_title":
            p.style = doc.styles["Heading 1"]
            p.add_run(value)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(15)
        elif kind == "toc":
            add_link(p, value, "paper_section_" + str(SECTIONS.index(value) + 1))
            p.paragraph_format.space_after = Pt(5)
            p.paragraph_format.left_indent = Inches(0.18)
        elif kind == "break":
            p.add_run().add_break(WD_BREAK.PAGE)
            p.paragraph_format.space_after = Pt(0)

    header = sec.header.paragraphs[0]
    header.text = "URBAN HEAT DEMOCRATIZATION"
    header.style = doc.styles["Normal"]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    header.paragraph_format.space_after = Pt(0)
    for run in header.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(84, 105, 115)
    footer = sec.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run("Aarti Sri Ravikumar  ·  ")
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    footer._p.append(fld)
    for run in footer.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(84, 105, 115)

    doc.core_properties.title = TITLE
    doc.core_properties.subject = SUBTITLE
    doc.core_properties.author = AUTHOR
    doc.core_properties.keywords = "urban heat; democratization; reproducible graph experiment"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
