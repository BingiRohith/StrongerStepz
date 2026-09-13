import { NextRequest, NextResponse } from 'next/server';

type Point = { date: string; price: number };

function demoResult() {
  const now = new Date();
  const points: Point[] = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (364 - i));
    const seasonal = Math.sin(i / 24) * 1700;
    const noise = Math.sin(i * 0.77) * 500 + Math.sin(i * 0.17) * 350;
    const sale = (i % 83 === 0 || i % 127 === 0) ? -2600 : 0;
    return { date: d.toISOString().slice(0, 10), price: Math.round(29999 + seasonal + noise + sale) };
  });
  points[points.length - 1].price = 24999;
  const prices = points.map(p => p.price);
  const currentPrice = prices.at(-1)!;
  const low = Math.min(...prices), high = Math.max(...prices);
  const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const percentile = prices.filter(p => p >= currentPrice).length / prices.length;
  const score = Math.round(Math.max(0, Math.min(100, percentile * 100)));
  return { source: 'Demo data', title: 'Example product — price intelligence demo', asin: 'DEMO-ASIN', currentPrice, low, high, average, median, score, verdict: score >= 85 ? 'Exceptional price' : score >= 70 ? 'Very good price' : score >= 50 ? 'Fair price' : 'Expensive price', confidence: 'Demo only', points, note: 'Illustrative data — not a real product price.' };
}

function parseAsin(url: string) {
  const match = url.match(/(?:\/dp\/|\/gp\/product\/|\/dp%2F)([A-Z0-9]{10})/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function scorePrice(current: number, prices: number[]) {
  const percentile = prices.filter(p => p >= current).length / prices.length;
  return Math.round(Math.max(0, Math.min(100, percentile * 100)));
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('demo') === '1') return NextResponse.json(demoResult());
  return NextResponse.json({ error: 'Send a product URL with POST.' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return NextResponse.json({ error: 'Paste a valid product URL.' }, { status: 400 });
    const host = new URL(url).hostname.toLowerCase();
    if (!host.includes('amazon.in')) return NextResponse.json({ error: 'MVP currently supports Amazon India links.' }, { status: 400 });
    const asin = parseAsin(url);
    if (!asin) return NextResponse.json({ error: 'Could not identify the Amazon product ID (ASIN) from this link.' }, { status: 400 });

    const apiKey = process.env.KEEPA_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Live price history is not connected yet. Use “Try demo” to test the interface. A price-history provider key is required for accurate historical data.' }, { status: 503 });

    const response = await fetch(`https://api.keepa.com/product?key=${encodeURIComponent(apiKey)}&domain=10&asin=${encodeURIComponent(asin)}&history=1&stats=365`, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'The price-history provider could not be reached.' }, { status: 502 });
    const payload = await response.json();
    const product = payload.products?.[0];
    if (!product) return NextResponse.json({ error: 'No price-history data was found for this product.' }, { status: 404 });

    // Keepa stores Amazon price history in compact integer arrays. We deliberately
    // avoid fabricating missing observations: only provider-recorded prices are used.
    const csv: number[] = product.csv?.[0] ?? [];
    const points: Point[] = [];
    const keepaEpoch = new Date('2011-01-01T00:00:00Z').getTime();
    for (let i = 0; i + 1 < csv.length; i += 2) {
      const minutes = csv[i]; const value = csv[i + 1];
      if (!Number.isFinite(minutes) || !Number.isFinite(value) || value < 0) continue;
      const date = new Date(keepaEpoch + minutes * 60000);
      if (date.getTime() < Date.now() - 365 * 86400000) continue;
      points.push({ date: date.toISOString().slice(0, 10), price: Math.round(value / 100) });
    }
    if (points.length < 2) return NextResponse.json({ error: 'The provider returned insufficient historical price observations.' }, { status: 422 });

    const prices = points.map(p => p.price).filter(p => p > 0);
    const currentPrice = prices.at(-1)!;
    const low = Math.min(...prices), high = Math.max(...prices);
    const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const score = scorePrice(currentPrice, prices);
    return NextResponse.json({ source: 'Keepa', title: product.title ?? 'Amazon product', asin, currentPrice, low, high, average, median, score, verdict: score >= 85 ? 'Exceptional price' : score >= 70 ? 'Very good price' : score >= 50 ? 'Fair price' : 'Expensive price', confidence: points.length >= 100 ? 'High' : points.length >= 30 ? 'Medium' : 'Low', points, note: 'Based on recorded Amazon price history.' });
  } catch {
    return NextResponse.json({ error: 'Could not process that product link.' }, { status: 500 });
  }
}
