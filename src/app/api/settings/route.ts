import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');
const DEFAULTS = { font: 'arciform', whatsappNumber: '' };
const ALLOWED_FONTS = ['arciform', 'dm-sans', 'poppins', 'plus-jakarta', 'playfair'];

async function readSettings(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(SETTINGS_PATH, 'utf-8'));
  } catch {
    return { ...DEFAULTS };
  }
}

export async function GET() {
  return NextResponse.json(await readSettings());
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));

  if (body.font && !ALLOWED_FONTS.includes(body.font)) {
    return NextResponse.json({ error: 'Police non reconnue.' }, { status: 400 });
  }

  if (body.whatsappNumber !== undefined) {
    const cleaned = String(body.whatsappNumber).replace(/\D/g, '');
    if (cleaned && cleaned.length < 6) {
      return NextResponse.json({ error: 'Numéro WhatsApp invalide.' }, { status: 400 });
    }
  }

  const current = await readSettings();
  const patch: Record<string, string> = {};
  if (body.font) patch.font = body.font;
  if (body.whatsappNumber !== undefined) patch.whatsappNumber = String(body.whatsappNumber).trim();

  const updated = { ...current, ...patch };
  await writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return NextResponse.json(updated);
}
