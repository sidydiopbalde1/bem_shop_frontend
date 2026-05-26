import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const BACKEND          = process.env.API_URL ?? 'http://localhost:3000';
const NOTIFICATION_FILE = path.join(process.cwd(), 'data', 'notifications.json');

export type StockNotification = {
  id: string;           // productId
  productName: string;
  stock: number;
  threshold: number;
  triggeredAt: string;  // ISO date
  read: boolean;
  emailSent: boolean;
};

function readNotifications(): StockNotification[] {
  if (!existsSync(NOTIFICATION_FILE)) return [];
  try { return JSON.parse(readFileSync(NOTIFICATION_FILE, 'utf-8')); } catch { return []; }
}

function writeNotifications(data: StockNotification[]) {
  writeFileSync(NOTIFICATION_FILE, JSON.stringify(data, null, 2));
}

async function sendEmail(notification: StockNotification) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!host || !user || !pass || !adminEmail) return false;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"BEM Boutique" <${user}>`,
      to: adminEmail,
      subject: `⚠️ Alerte stock — ${notification.productName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#cc1f27">Alerte seuil de stock</h2>
          <p>Le stock du produit <strong>${notification.productName}</strong> a atteint son seuil d'alerte.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr>
              <td style="padding:8px 12px;background:#f7f6f4;font-weight:600">Stock actuel</td>
              <td style="padding:8px 12px;color:#cc1f27;font-weight:700">${notification.stock} unité(s)</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;background:#f7f6f4;font-weight:600">Seuil d'alerte</td>
              <td style="padding:8px 12px">${notification.threshold} unité(s)</td>
            </tr>
          </table>
          <p style="color:#666;font-size:13px">Connectez-vous au tableau de bord BEM Admin pour réapprovisionner le produit.</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error('[BEM] Email notification failed:', e);
    return false;
  }
}

/**
 * GET /api/notifications
 * ?check=1  → interroge GET /products/below-threshold (backend) et synchronise les notifications.
 */
export async function GET(req: NextRequest) {
  const check = req.nextUrl.searchParams.get('check') === '1';
  const stored = readNotifications();

  if (check) {
    const token = req.headers.get('authorization') ?? '';

    try {
      const res = await fetch(`${BACKEND}/products/below-threshold`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: token } : {}),
        },
        cache: 'no-store',
      });

      if (res.ok) {
        type BelowItem = { id: string; productName: string; stock: number; threshold: number };
        const belowItems: BelowItem[] = await res.json();

        const updated: StockNotification[] = [...stored];

        // Ajouter ou mettre à jour les alertes pour chaque produit sous le seuil
        for (const item of belowItems) {
          const idx = updated.findIndex((n) => n.id === item.id);
          const existing = idx >= 0 ? updated[idx] : null;

          const notification: StockNotification = {
            id: item.id,
            productName: item.productName,
            stock: item.stock,
            threshold: item.threshold,
            triggeredAt: existing?.triggeredAt ?? new Date().toISOString(),
            read: existing?.read ?? false,
            emailSent: existing?.emailSent ?? false,
          };

          // Envoyer l'email uniquement à la première détection
          if (!notification.emailSent) {
            notification.emailSent = await sendEmail(notification);
          }

          if (idx >= 0) updated[idx] = notification;
          else updated.push(notification);
        }

        // Supprimer les alertes dont le stock est remonté au-dessus du seuil
        const belowIds = new Set(belowItems.map((i) => i.id));
        const final = updated.filter((n) => belowIds.has(n.id));

        writeNotifications(final);
        return NextResponse.json(final);
      }
    } catch {
      /* En cas d'erreur réseau, retourner les notifications stockées */
    }
  }

  return NextResponse.json(stored);
}

/** PATCH /api/notifications  body: { id, read: true }  →  marquer comme lu */
export async function PATCH(req: NextRequest) {
  const { id, read } = await req.json();
  const notifications = readNotifications();
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx >= 0) {
    notifications[idx].read = read ?? true;
    writeNotifications(notifications);
  }
  return NextResponse.json({ ok: true });
}

/** DELETE /api/notifications?id=xxx  →  rejeter une alerte */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const notifications = readNotifications();
  const filtered = id ? notifications.filter((n) => n.id !== id) : [];
  writeNotifications(filtered);
  return NextResponse.json({ ok: true });
}
