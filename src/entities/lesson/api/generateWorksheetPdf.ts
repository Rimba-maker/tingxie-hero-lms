import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

import type { VocabEntry } from "@/entities/lesson/model/types";

const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4, points
const PAGE_MARGIN = 40;
const BOX_SIZE = 60;
const BOX_GAP = 10;
const BOXES_PER_ROW = 6;
const ROW_GAP = 30;
const PINYIN_LABEL_HEIGHT = 18;
const ROW_HEIGHT = PINYIN_LABEL_HEIGHT + BOX_SIZE + ROW_GAP;

export type WorksheetPdfParams = {
  // Caller fetches this from /fonts/NotoSansSC-Subset.ttf — kept out of
  // this function so the layout logic stays testable without a fetch.
  fontBytes: ArrayBuffer | Uint8Array;
  weekNumber: number;
  title: string;
  moeLevel: string;
  vocabulary: VocabEntry[];
};

// Draws a Tian Zige (田字格) practice sheet: one row per vocabulary word,
// a reference character in the first box(es) of the row (one box per
// character in the word), blank boxes after it to practice on paper.
export async function generateWorksheetPdf({
  fontBytes,
  weekNumber,
  title,
  moeLevel,
  vocabulary,
}: WorksheetPdfParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(fontBytes, { subset: true });

  let page = pdfDoc.addPage(PAGE_SIZE);
  let cursorY = page.getHeight() - PAGE_MARGIN;

  function drawHeader() {
    page.drawText("TingXie HERO — Practice Worksheet", {
      x: PAGE_MARGIN,
      y: cursorY,
      size: 10,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
    cursorY -= 22;
    page.drawText(`Week ${weekNumber} · ${moeLevel}`, {
      x: PAGE_MARGIN,
      y: cursorY,
      size: 11,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
    cursorY -= 24;
    page.drawText(`《${title}》`, { x: PAGE_MARGIN, y: cursorY, size: 16, font });
    cursorY -= 36;
  }

  drawHeader();

  for (const entry of vocabulary) {
    if (cursorY - ROW_HEIGHT < PAGE_MARGIN) {
      page = pdfDoc.addPage(PAGE_SIZE);
      cursorY = page.getHeight() - PAGE_MARGIN;
    }

    page.drawText(entry.pinyin, {
      x: PAGE_MARGIN,
      y: cursorY,
      size: 11,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    cursorY -= PINYIN_LABEL_HEIGHT;

    const characters = [...entry.character];
    const rowTop = cursorY;
    for (let i = 0; i < BOXES_PER_ROW; i++) {
      const x = PAGE_MARGIN + i * (BOX_SIZE + BOX_GAP);
      const y = rowTop - BOX_SIZE;

      page.drawRectangle({
        x,
        y,
        width: BOX_SIZE,
        height: BOX_SIZE,
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 1,
      });
      page.drawLine({
        start: { x: x + BOX_SIZE / 2, y },
        end: { x: x + BOX_SIZE / 2, y: y + BOX_SIZE },
        color: rgb(0.82, 0.82, 0.82),
        thickness: 0.5,
        dashArray: [3, 3],
      });
      page.drawLine({
        start: { x, y: y + BOX_SIZE / 2 },
        end: { x: x + BOX_SIZE, y: y + BOX_SIZE / 2 },
        color: rgb(0.82, 0.82, 0.82),
        thickness: 0.5,
        dashArray: [3, 3],
      });

      const referenceChar = characters[i];
      if (referenceChar) {
        const fontSize = BOX_SIZE * 0.55;
        const textWidth = font.widthOfTextAtSize(referenceChar, fontSize);
        page.drawText(referenceChar, {
          x: x + (BOX_SIZE - textWidth) / 2,
          y: y + BOX_SIZE * 0.22,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
      }
    }

    cursorY = rowTop - BOX_SIZE - ROW_GAP;
  }

  return pdfDoc.save();
}
