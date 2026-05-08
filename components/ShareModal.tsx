'use client';

import { useEffect, useState } from 'react';
import { Share2, Copy, Check, X, ExternalLink, Image as ImageIcon, Code } from 'lucide-react';
import { exportChartAsPNG, buildEmbedURL, buildEmbedSnippet } from '@/lib/chartExport';

/**
 * Share модал — URL хуваалцах + PNG татах + iframe embed код.
 */
export default function ShareModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'url' | 'embed' | null>(null);
  const [tab, setTab] = useState<'url' | 'embed' | 'png'>('url');
  const [url, setUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [pngStatus, setPngStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [pngError, setPngError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(window.location.href);
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q') ?? '';
      setEmbedUrl(buildEmbedURL(q));
      setEmbedCode(buildEmbedSnippet(q));
      setCopied(null);
      setPngStatus('idle');
      setPngError(null);
    }
  }, [open]);

  const copy = async (text: string, kind: 'url' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  const downloadPNG = async () => {
    setPngStatus('working'); setPngError(null);
    try {
      // Recharts ResponsiveContainer-ийн нэг л зураг хайна
      const charts = document.querySelectorAll('.recharts-responsive-container');
      const target = (charts[0] ?? document.querySelector('svg')) as HTMLElement | null;
      if (!target) throw new Error('Графикийн SVG олдсонгүй');
      await exportChartAsPNG(target, `mongolia-chart-${Date.now()}.png`);
      setPngStatus('done');
      setTimeout(() => setPngStatus('idle'), 2500);
    } catch (e) {
      setPngStatus('error');
      setPngError(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const shareTitle = 'Mongolia OpenData — SQL query';
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(url)}`;
  const ln = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost"
        title="Энэ query-г хуваалцах / татах"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Share2 size={12} /> Хуваалцах
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0c1322',
              border: '1px solid #1a2d4a',
              borderRadius: 14,
              maxWidth: 560, width: '100%',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #1a2d4a',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={15} color="#22c55e" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                  Хуваалцах
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 0, color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1a2d4a' }}>
              {([
                ['url', 'URL', Share2],
                ['embed', 'Embed', Code],
                ['png', 'PNG', ImageIcon],
              ] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    flex: 1, padding: '10px 14px',
                    background: tab === key ? '#0d1424' : 'transparent',
                    border: 0,
                    borderBottom: tab === key ? '2px solid #22c55e' : '2px solid transparent',
                    color: tab === key ? '#e2e8f0' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            <div style={{ padding: 20 }}>
              {tab === 'url' && (
                <>
                  <p style={{ color: '#94a3b8', fontSize: 12.5, marginBottom: 12, lineHeight: 1.6 }}>
                    Энэ link-ийг хуваалцахад хүлээн авагч ижил SQL query + chart-ыг харна.
                  </p>
                  <UrlBox value={url} copied={copied === 'url'} onCopy={() => copy(url, 'url')} />
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Социал сүлжээ
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ShareLink href={fb} label="Facebook" color="#1877F2" />
                      <ShareLink href={tw} label="Twitter / X" color="#000000" />
                      <ShareLink href={ln} label="LinkedIn" color="#0A66C2" />
                    </div>
                  </div>
                </>
              )}

              {tab === 'embed' && (
                <>
                  <p style={{ color: '#94a3b8', fontSize: 12.5, marginBottom: 12, lineHeight: 1.6 }}>
                    Сэтгүүлчид нийтлэлд оруулахад: HTML iframe код. ikon.mn, news.mn гэх мэт сайтад copy/paste.
                  </p>
                  <UrlBox value={embedUrl} copied={false} onCopy={() => copy(embedUrl, 'url')} />
                  <div style={{ height: 12 }} />
                  <CodeBox value={embedCode} copied={copied === 'embed'} onCopy={() => copy(embedCode, 'embed')} />
                  <div style={{ marginTop: 12, padding: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#86efac', marginBottom: 4, fontWeight: 600 }}>Жишээ хэрэглээ</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                      WordPress, Webflow, ihmi.mn зэрэг CMS-д шууд оруулна. Embed нь өөрөө ҮСХ-ын эх сурвалжийг харуулна.
                    </div>
                  </div>
                </>
              )}

              {tab === 'png' && (
                <>
                  <p style={{ color: '#94a3b8', fontSize: 12.5, marginBottom: 12, lineHeight: 1.6 }}>
                    Графикийг өндөр чанартай PNG зураг болгож татах. Twitter post, тайланд оруулахад тохиромжтой.
                  </p>
                  <button
                    onClick={downloadPNG}
                    disabled={pngStatus === 'working'}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: pngStatus === 'done' ? '#22c55e' : 'linear-gradient(135deg,#22c55e,#16a34a)',
                      color: '#fff', border: 0, borderRadius: 10,
                      fontSize: 13, fontWeight: 700,
                      cursor: pngStatus === 'working' ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {pngStatus === 'working' ? 'Боловсруулж байна...'
                      : pngStatus === 'done' ? <><Check size={14} /> Татсан</>
                      : <><ImageIcon size={14} /> PNG татах (2x чанар)</>}
                  </button>
                  {pngError && (
                    <div style={{ marginTop: 10, padding: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 11.5, color: '#fca5a5' }}>
                      {pngError} — графикыг харуулсны дараа дахин оролдоно уу.
                    </div>
                  )}
                  <div style={{ marginTop: 12, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
                    Зөвлөмж: PNG татахын өмнө график нь дэлгэцэн дээр харагдаж байх ёстой.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UrlBox({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div style={{
      display: 'flex', gap: 8,
      background: '#060c18',
      border: '1px solid #1a3050',
      borderRadius: 9,
      padding: '4px 4px 4px 12px',
    }}>
      <input
        type="text"
        readOnly
        value={value}
        onClick={e => e.currentTarget.select()}
        style={{
          flex: 1, background: 'transparent', border: 0, color: '#e2e8f0',
          fontSize: 12, fontFamily: 'monospace', outline: 'none',
        }}
      />
      <button
        onClick={onCopy}
        style={{
          background: copied ? '#22c55e' : '#1a3050',
          color: copied ? '#06120a' : '#e2e8f0',
          border: 0, borderRadius: 7, padding: '6px 12px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Хуулсан' : 'Хуулах'}
      </button>
    </div>
  );
}

function CodeBox({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div style={{
      background: '#060c18',
      border: '1px solid #1a3050',
      borderRadius: 9,
      padding: 12,
      position: 'relative',
    }}>
      <pre style={{
        margin: 0, fontSize: 11, fontFamily: 'monospace', color: '#e2e8f0',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 100, overflow: 'auto',
      }}>{value}</pre>
      <button
        onClick={onCopy}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: copied ? '#22c55e' : '#1a3050',
          color: copied ? '#06120a' : '#e2e8f0',
          border: 0, borderRadius: 6, padding: '4px 10px',
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? 'Хуулсан' : 'Хуулах'}
      </button>
    </div>
  );
}

function ShareLink({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flex: 1, background: color, color: 'white',
        textDecoration: 'none', textAlign: 'center',
        padding: '8px 12px', borderRadius: 7,
        fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      {label} <ExternalLink size={11} />
    </a>
  );
}
