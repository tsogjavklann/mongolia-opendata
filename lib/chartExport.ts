/**
 * SVG → PNG export — гадны deps хэрэгтэйгүй.
 * Recharts ResponsiveContainer-аас үүсэх <svg>-ийг canvas руу зурж blob үүсгэнэ.
 */

export async function exportChartAsPNG(
  chartContainer: HTMLElement,
  filename = 'chart.png',
  scale = 2,
): Promise<void> {
  const svg = chartContainer.querySelector('svg.recharts-surface') as SVGSVGElement | null
    ?? chartContainer.querySelector('svg') as SVGSVGElement | null;
  if (!svg) throw new Error('График олдсонгүй');

  // Цэвэр copy үүсгэж background нэмэх
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const width = rect.width || svg.clientWidth || 800;
  const height = rect.height || svg.clientHeight || 400;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Background rect (хар theme)
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#0c1322');
  clone.insertBefore(bg, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG ачаалах амжилтгүй'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context үүсгэж чадсангүй');
    ctx.fillStyle = '#0c1322';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Богино embed URL үүсгэх */
export function buildEmbedURL(sql: string, host?: string): string {
  const base = host ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const q = encodeURIComponent(sql);
  return `${base}/embed?q=${q}`;
}

/** iframe embed код */
export function buildEmbedSnippet(sql: string, host?: string): string {
  const url = buildEmbedURL(sql, host);
  return `<iframe src="${url}" width="100%" height="420" frameborder="0" style="border-radius:12px;background:#0c1322"></iframe>`;
}
