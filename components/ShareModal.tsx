'use client';

import { useEffect, useState } from 'react';
import { Share2, Copy, Check, X, ExternalLink } from 'lucide-react';

/**
 * Share модал — одоогийн URL (query+mode-ыг агуулсан) ил харагдах.
 * Хуулах товч + социал сүлжээний share link-үүд.
 */
export default function ShareModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (open) {
      setUrl(window.location.href);
      setCopied(false);
    }
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
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
        title="Энэ query-г URL-аар хуваалцах"
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
              maxWidth: 520, width: '100%',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1a2d4a',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={16} color="#22c55e" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
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

            <div style={{ padding: 20 }}>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                Энэ link-ийг хуваалцахад хүлээн авагч ижил SQL query + chart-ыг
                харах болно. Login шаардлагагүй.
              </p>

              {/* URL display + copy */}
              <div style={{
                display: 'flex', gap: 8,
                background: '#060c18',
                border: '1px solid #1a3050',
                borderRadius: 9,
                padding: '4px 4px 4px 12px',
                marginBottom: 16,
              }}>
                <input
                  type="text"
                  readOnly
                  value={url}
                  onClick={e => e.currentTarget.select()}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 0,
                    color: '#e2e8f0',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={copy}
                  style={{
                    background: copied ? '#22c55e' : '#1a3050',
                    color: copied ? '#06120a' : '#e2e8f0',
                    border: 0,
                    borderRadius: 7,
                    padding: '6px 12px',
                    fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Хуулсан' : 'Хуулах'}
                </button>
              </div>

              {/* Social share */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Социал сүлжээгээр хуваалцах
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <ShareLink href={fb} label="Facebook" color="#1877F2" />
                  <ShareLink href={tw} label="Twitter / X" color="#000000" />
                  <ShareLink href={ln} label="LinkedIn" color="#0A66C2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShareLink({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flex: 1,
        background: color,
        color: 'white',
        textDecoration: 'none',
        textAlign: 'center',
        padding: '8px 12px',
        borderRadius: 7,
        fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      {label} <ExternalLink size={11} />
    </a>
  );
}
