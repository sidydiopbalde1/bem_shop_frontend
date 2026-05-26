import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.API_URL ?? 'http://localhost:3000';

function backendAuth(req: NextRequest): Record<string, string> {
  const token = req.headers.get('authorization') ?? '';
  return token ? { Authorization: token } : {};
}

/**
 * GET /api/thresholds
 * Retourne { [productId]: threshold } pour tous les produits ayant un seuil.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = backendAuth(req);

    // Récupérer les deux listes (approuvés + en attente)
    const [r1, r2] = await Promise.all([
      fetch(`${BACKEND}/products?limit=1000`, { headers: { ...auth, 'Content-Type': 'application/json' }, cache: 'no-store' }),
      fetch(`${BACKEND}/products?limit=1000&isApproved=false`, { headers: { ...auth, 'Content-Type': 'application/json' }, cache: 'no-store' }),
    ]);

    const map: Record<string, number> = {};

    for (const res of [r1, r2]) {
      if (!res.ok) continue;
      const json = await res.json();
      const products: { id: string; stockThreshold?: number | null }[] = json.data ?? [];
      for (const p of products) {
        if (p.stockThreshold != null) map[p.id] = p.stockThreshold;
      }
    }

    return NextResponse.json(map);
  } catch {
    return NextResponse.json({});
  }
}

/**
 * PUT /api/thresholds  body: { productId, threshold }
 * Proxie PATCH /products/:id/threshold sur le backend.
 */
export async function PUT(req: NextRequest) {
  const { productId, threshold } = await req.json();
  if (!productId || typeof threshold !== 'number' || threshold < 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const res = await fetch(`${BACKEND}/products/${productId}/threshold`, {
    method: 'PATCH',
    headers: { ...backendAuth(req), 'Content-Type': 'application/json' },
    body: JSON.stringify({ threshold }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/thresholds?productId=xxx
 * Proxie PATCH /products/:id/threshold avec { threshold: null }.
 */
export async function DELETE(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

  const res = await fetch(`${BACKEND}/products/${productId}/threshold`, {
    method: 'PATCH',
    headers: { ...backendAuth(req), 'Content-Type': 'application/json' },
    body: JSON.stringify({ threshold: null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
