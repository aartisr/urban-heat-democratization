"""Build an editable Word manuscript from the canonical journal Markdown.

Requires pandoc and python-docx (see requirements-research.txt).
Run: .venv/bin/python scripts/render_urban_heat_journal_docx.py
"""
from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/DEMOCRATIZING_URBAN_HEAT_RESILIENCE_JOURNAL.md"
OUTPUT = SOURCE.with_suffix(".docx")
TITLE = "The Right to Question the Map: Democratizing Urban Heat Decisions Through Auditable Spatial Graphs"


def set_style(style, *, size=12, bold=False, italic=False, before=0, after=0, line=2.0, align=None):
    style.font.name = "Times New Roman"
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.italic = italic
    style.font.color.rgb = RGBColor(20, 30, 40)
    style.paragraph_format.space_before = Pt(before)
    style.paragraph_format.space_after = Pt(after)
    style.paragraph_format.line_spacing = line
    if align is not None:
        style.paragraph_format.alignment = align


def add_page_number(paragraph):
    field = OxmlElement("w:fldSimple")
    field.set(qn("w:instr"), "PAGE")
    paragraph._p.append(field)


def build() -> None:
    source = SOURCE.read_text(encoding="utf-8")
    # The manuscript already has a visible title and author block. Drop YAML
    # metadata here so Pandoc does not print a second cover title above it.
    source = re.sub(r"\A---\n.*?\n---\n", "", source, count=1, flags=re.DOTALL)
    assert source.count("## Abstract") == 1
    assert source.count("**Keywords:**") == 1
    source = re.sub(
        r"(\*\*Keywords:\*\*[^\n]+\n)",
        lambda match: match.group(1) + "\n# " + TITLE + "\n",
        source,
        count=1,
    )

    with tempfile.TemporaryDirectory(prefix="urban-heat-journal-word-") as tmp:
        temp = Path(tmp)
        markdown = temp / "manuscript.md"
        reference = temp / "reference.docx"
        markdown.write_text(source, encoding="utf-8")
        with reference.open("wb") as handle:
            subprocess.run(["pandoc", "--print-default-data-file", "reference.docx"], check=True, stdout=handle)
        ref = Document(reference)
        section = ref.sections[0]
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)
        section.top_margin = section.bottom_margin = Inches(1)
        section.left_margin = section.right_margin = Inches(1)
        section.header_distance = Inches(0.49)
        section.footer_distance = Inches(0.49)
        for name in ("Normal", "Body Text", "First Paragraph"):
            if name in ref.styles:
                set_style(ref.styles[name])
                ref.styles[name].paragraph_format.first_line_indent = Inches(0.5)
        if "Title" in ref.styles:
            set_style(ref.styles["Title"], bold=True, after=24, align=WD_ALIGN_PARAGRAPH.CENTER)
        for name in ("Heading 1", "Heading 2", "Heading 3"):
            if name in ref.styles:
                set_style(ref.styles[name], bold=name != "Heading 3", italic=name == "Heading 3", before=14, after=4, align=WD_ALIGN_PARAGRAPH.CENTER if name == "Heading 1" else WD_ALIGN_PARAGRAPH.LEFT)
                ref.styles[name].paragraph_format.keep_with_next = True
        header = section.header.paragraphs[0]
        header.text = "THE RIGHT TO QUESTION THE MAP"
        header.style = ref.styles["Normal"]
        header.paragraph_format.first_line_indent = Inches(0)
        header.paragraph_format.line_spacing = 1
        header.paragraph_format.tab_stops.add_tab_stop(Inches(6.5))
        header.add_run("\t")
        add_page_number(header)
        ref.save(reference)
        subprocess.run([
            "pandoc", str(markdown), "--from=markdown+raw_attribute", "--to=docx",
            "--reference-doc", str(reference), "--output", str(OUTPUT),
        ], check=True)

    doc = Document(OUTPUT)
    doc.core_properties.title = TITLE
    doc.core_properties.author = "Aarti Sri Ravikumar"
    doc.core_properties.subject = "Open working methods and perspective manuscript; not peer reviewed"
    in_references = False
    for index, paragraph in enumerate(doc.paragraphs):
        if index == 0 and paragraph.text.strip() == TITLE:
            paragraph.style = doc.styles["Title"]
            paragraph.paragraph_format.space_before = Pt(110)
            paragraph.paragraph_format.keep_with_next = True
        if index == 1 and paragraph.text.strip():
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            paragraph.paragraph_format.first_line_indent = Inches(0)
            paragraph.paragraph_format.line_spacing = 1.3
        if paragraph.text.strip() == "Abstract" or (index > 0 and paragraph.text.strip() == TITLE):
            paragraph.paragraph_format.page_break_before = True
        if paragraph.text.strip() == "References" or paragraph.text.startswith(("Appendix A:", "Appendix B:")):
            paragraph.paragraph_format.page_break_before = True
        if paragraph.text.strip() == "References":
            in_references = True
        elif paragraph.text.startswith("Appendix A:"):
            in_references = False
        elif index and in_references and paragraph.text.strip():
            paragraph.paragraph_format.first_line_indent = Inches(-0.5)
            paragraph.paragraph_format.left_indent = Inches(0.5)
    for table_index, table in enumerate(doc.tables):
        table.autofit = False
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        layouts = ([2.0, 2.25, 2.25], [1.9, 2.9, 1.7], [1.2, 2.75, 2.55])
        column_widths = layouts[table_index] if table_index < len(layouts) and len(table.columns) == 3 else [6.5 / len(table.columns)] * len(table.columns)
        for column, width_in in zip(table.columns, column_widths):
            column.width = Inches(width_in)
        for row_index, row in enumerate(table.rows):
            for cell, width_in in zip(row.cells, column_widths):
                cell.width = Inches(width_in)
                for paragraph in cell.paragraphs:
                    paragraph.paragraph_format.first_line_indent = Inches(0)
                    paragraph.paragraph_format.line_spacing = 1
                    paragraph.paragraph_format.space_after = Pt(1)
                    for run in paragraph.runs:
                        run.font.size = Pt(8)
                        if row_index == 0:
                            run.bold = True
        table.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
