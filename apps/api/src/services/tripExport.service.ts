import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import type { ItineraryItemDto, TripDto } from '@meghjatra/shared';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const LINE_HEIGHT = 16;
const MAX_TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

const TIME_BLOCKS = ['morning', 'afternoon', 'evening'] as const;
const TIME_BLOCK_LABEL: Record<(typeof TIME_BLOCKS)[number], string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

function sanitizeText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/[^\x00-\x7F]/g, '?');
}

function wrapText(text: string, font: PDFFont, size: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > MAX_TEXT_WIDTH) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

export async function generateTripPdf(trip: TripDto): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function ensureSpace() {
    if (y < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function writeLine(
    text: string,
    options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {},
  ) {
    const size = options.size ?? 11;
    const activeFont = options.font ?? font;
    for (const line of wrapText(sanitizeText(text), activeFont, size)) {
      ensureSpace();
      page.drawText(line, {
        x: MARGIN,
        y,
        size,
        font: activeFont,
        color: options.color ?? rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }
  }

  writeLine(`${trip.destination} Itinerary`, { size: 20, font: boldFont });
  writeLine(
    `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()} - ${trip.travelers} traveler${trip.travelers > 1 ? 's' : ''}`,
  );
  writeLine(`Budget: ${trip.budgetTotal} ${trip.budgetCurrency}`);
  y -= LINE_HEIGHT / 2;

  const sortedDays = [...trip.itinerary].sort((a, b) => a.dayIndex - b.dayIndex);

  for (const day of sortedDays) {
    writeLine(`Day ${day.dayIndex + 1}`, { size: 14, font: boldFont });

    const itemsByBlock = new Map<string, ItineraryItemDto[]>();
    for (const item of day.items) {
      const list = itemsByBlock.get(item.timeBlock) ?? [];
      list.push(item);
      itemsByBlock.set(item.timeBlock, list);
    }

    for (const timeBlock of TIME_BLOCKS) {
      const items = itemsByBlock.get(timeBlock);
      if (!items || items.length === 0) continue;

      writeLine(TIME_BLOCK_LABEL[timeBlock], {
        size: 12,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      for (const item of [...items].sort((a, b) => a.order - b.order)) {
        writeLine(`- ${item.activityName} (${item.durationMin} min, ${item.cost} ${trip.budgetCurrency})`);
        if (item.tips) {
          writeLine(`  Tip: ${item.tips}`, { size: 10, color: rgb(0.4, 0.4, 0.4) });
        }
      }
    }
    y -= LINE_HEIGHT / 2;
  }

  return doc.save();
}
