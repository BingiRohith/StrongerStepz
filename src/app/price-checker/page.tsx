'use client';

import { FormEvent, useMemo, useState } from 'react';
import styles from './price-checker.module.css';

type Point = { date: string; price: number };
type Result = {
  source: string;
  title: string;
  asin: string;
  currentPrice: number;
  low: number;
  high: number;
  average: number;
  median: number;
  score: number;
  verdict: string;
  confidence: string;
  points: Point[];
  note?: string;
};

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function ScoreRing({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  return (
    <div className={styles.scoreWrap}>
      <svg viewBox="0 0 120 120" className={styles.scoreSvg} aria-label={`Price score ${score} out of 100`}>
        <circle cx="60" cy="60" r={radius} className={styles.scoreTrack} />
        <circle cx="60" cy="60" r={radius} className={styles.scoreValue} strokeDasharray={`${dash} ${circumference - dash}`} />
      </svg>
      <div className={styles.scoreText}><strong>{score}</strong><span>/100</span></div>
    </div>
  );
}

function PriceChart({ points }: { points: Point[] }) {
  const data = useMemo(() => {
    if (points.length <= 90) return points;
    const step = (points.length - 1) / 89;
    return Array.from({ length: 90 }, (_, i) => points[Math.round(i * step)]);
  }, [points]);

  const width = 720;
  const height = 260;
  const pad = 28;
  const prices = data.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);
  const path = data.map((p, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((p.price - min) / range) * (height - pad * 2);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className={styles.chartBox}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} role="img" aria-label="One year price history">
        <line x1={pad} y1={pad} x2={width - pad} y2={pad} className={styles.grid} />
        <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} className={styles.grid} />
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} className={styles.grid} />
        <path d={path} className={styles.line} fill="none" />
      </svg>
      <div className={styles.chartLabels}><span>{money(max)}</span><span>{money(min)}</span></div>
    </div>
  );
}

export default function PriceCheckerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  async function checkPrice(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/price-checker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not check this product.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setLoading(false); }
  }

  async function demo() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/price-checker?demo=1');
      const data = await response.json();
      setResult(data);
    } finally { setLoading(false); }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.badge}>PRICE INTELLIGENCE</div>
        <h1>Should you buy it now?</h1>
        <p>Paste an Amazon India product link. We compare today&apos;s price with the last 365 days and give you a 0–100 price score.</p>
        <form onSubmit={checkPrice} className={styles.form}>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste Amazon product link" inputMode="url" aria-label="Product URL" />
          <button disabled={loading || !url.trim()}>{loading ? 'Checking…' : 'Check price'}</button>
        </form>
        <button className={styles.demo} onClick={demo} disabled={loading}>Try demo with sample data</button>
        <p className={styles.disclaimer}>MVP currently supports Amazon India. Historical accuracy depends on the connected price-history provider.</p>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      {result && (
        <section className={styles.result}>
          <div className={styles.productHead}>
            <div>
              <span className={styles.source}>{result.source}</span>
              <h2>{result.title}</h2>
              <small>ASIN {result.asin}</small>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className={styles.viewLink}>View product ↗</a>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.scoreCard}><ScoreRing score={result.score} /><div><b>{result.verdict}</b><p>How attractive today&apos;s price is versus the last year.</p></div></div>
            <div className={styles.priceCard}><span>Current price</span><strong>{money(result.currentPrice)}</strong><small>{result.note || 'Latest recorded selling price'}</small></div>
          </div>

          <div className={styles.chartCard}><div className={styles.cardHead}><div><h3>1-year price history</h3><p>Recorded price movements; no invented values.</p></div></div><PriceChart points={result.points} /></div>

          <div className={styles.stats}>
            <div><span>1-year low</span><b>{money(result.low)}</b></div>
            <div><span>1-year average</span><b>{money(result.average)}</b></div>
            <div><span>1-year high</span><b>{money(result.high)}</b></div>
            <div><span>Data confidence</span><b>{result.confidence}</b></div>
          </div>
        </section>
      )}
    </main>
  );
}
