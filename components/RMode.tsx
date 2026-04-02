'use client';

/**
 * Python горим — Pyodide (браузер дотор Python + matplotlib, pandas)
 * WebR-г орлуулсан — 5 секундад ачаална, R syntax-тай төстэй жишээнүүд
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RefreshCw, Download, Database, BookOpen } from 'lucide-react';

const C = {
  green: '#00c87a', blue: '#60a5fa', purple: '#a78bfa',
  yellow: '#fbbf24', red: '#f87171', bg: '#080d17',
  card: '#0d1424', border: '#1a3050', text: '#e2e8f0',
  muted: '#475569', dim: '#334155',
} as const;

const PY_EXAMPLES = [
  {
    label: 'Товч харах',
    code: `print("=== Хэмжээ ===")
print(f"Мөр: {len(df)}  Багана: {len(df.columns)}")
print("\\n=== Баганууд ===")
print(df.dtypes)
print("\\n=== Дүгнэлт ===")
print(df.describe())`,
  },
  {
    label: 'Шугаман график',
    code: `import matplotlib.pyplot as plt
import matplotlib
matplotlib.rcParams['font.family'] = 'DejaVu Sans'

plot_data = df.copy()
plot_data['Period'] = plot_data['Period'].astype(str)

# Жилээр нийлбэр
agg = plot_data.groupby('Period')['VALUE'].sum().reset_index()
agg = agg.sort_values('Period')

fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0d1424')
ax.set_facecolor('#0d1424')
ax.plot(agg['Period'], agg['VALUE'], color='#00c87a', linewidth=2.5, marker='o', markersize=5)
ax.tick_params(colors='#94a3b8')
ax.spines[['top','right']].set_visible(False)
ax.spines[['bottom','left']].set_color('#1a3050')
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
ax.set_title('Цуваа өгөгдлийн өөрчлөлт', color='#f1f5f9', fontsize=13, pad=10)
ax.set_xlabel('Он', color='#94a3b8')
ax.set_ylabel('Утга', color='#94a3b8')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`,
  },
  {
    label: 'Багана диаграм',
    code: `import matplotlib.pyplot as plt
import matplotlib.cm as cm
import numpy as np

# Сүүлийн жилийн өгөгдөл
last_yr = df['Period'].astype(str).max()
sub = df[df['Period'].astype(str) == last_yr]

# Бүлэглэх багана олох
skip = {'VALUE','Period'}
cat_cols = [c for c in df.columns if c not in skip and not c.endswith('_CODE')]
grp = cat_cols[0] if cat_cols else None

if grp is None:
    print("Бүлэглэх багана олдсонгүй")
else:
    agg = sub.groupby(grp)['VALUE'].sum().nlargest(20).sort_values()
    colors = plt.cm.RdYlGn(np.linspace(0.2, 0.9, len(agg)))

    fig, ax = plt.subplots(figsize=(10, 7), facecolor='#0d1424')
    ax.set_facecolor('#0d1424')
    bars = ax.barh(agg.index.astype(str), agg.values, color=colors, alpha=0.9)
    ax.tick_params(colors='#94a3b8')
    ax.spines[['top','right']].set_visible(False)
    ax.spines[['bottom','left']].set_color('#1a3050')
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
    ax.set_title(f'Top 20: {grp} ({last_yr})', color='#f1f5f9', fontsize=13)
    plt.tight_layout()
    plt.show()`,
  },
  {
    label: 'Регресс + Таамаглал',
    code: `import matplotlib.pyplot as plt
import numpy as np
from numpy.polynomial import polynomial as P

agg = df.groupby('Period')['VALUE'].sum().reset_index()
agg['Period'] = agg['Period'].astype(float)
agg = agg.sort_values('Period')

x = agg['Period'].values
y = agg['VALUE'].values

# Шугаман регресс
coef = np.polyfit(x, y, 1)
poly = np.poly1d(coef)

future = np.arange(x.max()+1, x.max()+6)
pred = poly(future)

print("=== Регрессийн коэффициент ===")
print(f"  Жилийн өсөлт: {coef[0]:,.0f}")
print(f"  Суурь утга:   {coef[1]:,.0f}")
print("\\n=== Таамаглал ===")
for yr, val in zip(future, pred):
    print(f"  {int(yr)}: {val:,.0f}")

fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0d1424')
ax.set_facecolor('#0d1424')
ax.plot(x, y, color='#00c87a', linewidth=2, marker='o', markersize=4, label='Бодит')
ax.plot(x, poly(x), color='#60a5fa', linewidth=1.5, linestyle='--', label='Регресс')
ax.scatter(future, pred, color='#a78bfa', s=60, zorder=5, label='Таамаглал')
ax.tick_params(colors='#94a3b8')
ax.spines[['top','right']].set_visible(False)
ax.spines[['bottom','left']].set_color('#1a3050')
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
ax.set_title('Регресс + Таамаглал', color='#f1f5f9', fontsize=13)
ax.legend(facecolor='#0d1424', labelcolor='#e2e8f0', framealpha=0.5)
plt.tight_layout()
plt.show()`,
  },
  {
    label: 'Histogram',
    code: `import matplotlib.pyplot as plt

vals = df['VALUE'].dropna()
fig, ax = plt.subplots(figsize=(9, 5), facecolor='#0d1424')
ax.set_facecolor('#0d1424')
ax.hist(vals, bins=30, color='#00c87a', alpha=0.85, edgecolor='#060c18')
ax.tick_params(colors='#94a3b8')
ax.spines[['top','right']].set_visible(False)
ax.spines[['bottom','left']].set_color('#1a3050')
ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
ax.set_title('Утгын хуваарилалт', color='#f1f5f9', fontsize=13)
ax.set_xlabel('Утга', color='#94a3b8')
ax.set_ylabel('Тоо', color='#94a3b8')
plt.tight_layout()
plt.show()`,
  },
  {
    label: 'Корреляц',
    code: `import matplotlib.pyplot as plt
import numpy as np

num_cols = df.select_dtypes(include='number').columns.tolist()
if len(num_cols) < 2:
    print("Тоон багана хангалтгүй")
else:
    corr = df[num_cols].corr()
    fig, ax = plt.subplots(figsize=(8, 6), facecolor='#0d1424')
    ax.set_facecolor('#0d1424')
    im = ax.imshow(corr.values, cmap='RdYlGn', vmin=-1, vmax=1)
    plt.colorbar(im, ax=ax)
    ax.set_xticks(range(len(num_cols)))
    ax.set_yticks(range(len(num_cols)))
    ax.set_xticklabels(num_cols, rotation=45, ha='right', color='#94a3b8', fontsize=9)
    ax.set_yticklabels(num_cols, color='#94a3b8', fontsize=9)
    for i in range(len(num_cols)):
        for j in range(len(num_cols)):
            ax.text(j, i, f'{corr.values[i,j]:.2f}', ha='center', va='center',
                   color='white', fontsize=9, fontweight='bold')
    ax.set_title('Корреляцийн матриц', color='#f1f5f9', fontsize=13)
    plt.tight_layout()
    plt.show()`,
  },
];

// ── Pyodide iframe HTML ───────────────────────────────────────────────────────
const PYODIDE_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080d17; color: #e2e8f0; font-family: monospace; font-size: 12px; }
  #out { padding: 10px; white-space: pre-wrap; word-break: break-word; line-height: 1.6; }
  #out .err { color: #f87171; }
  #out .ok  { color: #00c87a; }
  #out .img { display: block; max-width: 100%; border-radius: 6px; margin: 8px 0; }
</style>
</head>
<body>
<div id="out"><span class="ok">⏳ Pyodide ачааллаж байна (~5 сек)...</span></div>
<script>
let pyodide = null;
let df_json = null;

function log(msg, cls='') {
  const d = document.getElementById('out');
  const el = document.createElement('span');
  if (cls) el.className = cls;
  el.textContent = msg + '\\n';
  d.appendChild(el);
  d.scrollTop = d.scrollHeight;
}

function clearOut() {
  document.getElementById('out').innerHTML = '';
}

async function init() {
  try {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
    script.onload = async () => {
      try {
        pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/' });
        await pyodide.loadPackage(['pandas', 'matplotlib', 'numpy']);
        
        // matplotlib backend тохируулах
        await pyodide.runPythonAsync(\`
import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import io, base64, sys

class Capture:
    def __init__(self): self.buf = []
    def write(self, s): self.buf.append(s)
    def flush(self): pass
    def getvalue(self): return ''.join(self.buf)

print("✓ Pyodide + pandas + matplotlib бэлэн!")
\`);
        window.parent.postMessage({ type: 'ready' }, '*');
        clearOut();
        log('✓ Python бэлэн! Өгөгдлөө ачааллаад код бичнэ үү.', 'ok');
      } catch(e) {
        log('Алдаа: ' + e.message, 'err');
        window.parent.postMessage({ type: 'error', msg: e.message }, '*');
      }
    };
    document.head.appendChild(script);
  } catch(e) {
    log('Script ачааллах алдаа: ' + e.message, 'err');
  }
}

async function runCode(code, data) {
  if (!pyodide) { log('Pyodide бэлэн болоогүй', 'err'); return; }
  clearOut();
  
  try {
    // DataFrame үүсгэх
    if (data && data.length > 0) {
      const jsonStr = JSON.stringify(data);
      pyodide.globals.set('_raw_json', jsonStr);
      await pyodide.runPythonAsync(\`
import json, pandas as pd
_raw = json.loads(_raw_json)
df = pd.DataFrame(_raw)
# Тоон баганыг автоматаар хөрвүүлэх
for col in df.columns:
    try:
        converted = pd.to_numeric(df[col], errors='coerce')
        if converted.notna().sum() / max(len(df), 1) > 0.7:
            df[col] = converted
    except: pass
print(f"✓ df ачааллаа: {len(df)} мөр, {len(df.columns)} багана")
print(f"  Баганууд: {', '.join(df.columns.tolist())}")
\`);
    } else {
      await pyodide.runPythonAsync('df = pd.DataFrame()\\nprint("⚠️ Өгөгдөл хоосон — эхлээд өгөгдөл ачаална уу")');
    }

    // Stdout capture + matplotlib hook
    await pyodide.runPythonAsync(\`
import sys, io, base64, matplotlib.pyplot as plt

_stdout_capture = io.StringIO()
_old_stdout = sys.stdout
sys.stdout = _stdout_capture

_images = []
_orig_show = plt.show
def _capture_show():
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor=plt.gcf().get_facecolor())
    buf.seek(0)
    _images.append(base64.b64encode(buf.read()).decode())
    plt.close('all')
plt.show = _capture_show
\`);

    // Хэрэглэгчийн код ажиллуулах
    pyodide.globals.set('_user_code', code);
    await pyodide.runPythonAsync(\`
try:
    exec(_user_code, {'df': df, 'plt': plt, 'pd': pd, 'np': np, '__builtins__': __builtins__})
except Exception as e:
    import traceback
    print("❌ Алдаа:", str(e))
    print(traceback.format_exc())
finally:
    sys.stdout = _old_stdout
    plt.show = _orig_show
\`);

    // Output авах
    const stdout = pyodide.globals.get('_stdout_capture').getvalue();
    const images = pyodide.globals.get('_images').toJs();

    if (stdout.trim()) log(stdout);
    
    for (const img of images) {
      const d = document.getElementById('out');
      const el = document.createElement('img');
      el.className = 'img';
      el.src = 'data:image/png;base64,' + img;
      d.appendChild(el);
    }

    if (!stdout.trim() && images.length === 0) {
      log('(гаралт байхгүй)', 'ok');
    }

    window.parent.postMessage({ type: 'done' }, '*');
  } catch(e) {
    log('Runtime алдаа: ' + e.message, 'err');
    window.parent.postMessage({ type: 'done' }, '*');
  }
}

window.addEventListener('message', e => {
  if (e.data?.type === 'run') runCode(e.data.code, e.data.data);
});

init();
</script>
</body>
</html>`;

// ── Main Component ────────────────────────────────────────────────────────────
interface DataRow { [key: string]: string | number }

interface Props {
  initialRows?: DataRow[];
}

export default function RMode({ initialRows }: Props) {
  const [code, setCode] = useState(PY_EXAMPLES[0].code);
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
  const [statusMsg, setStatusMsg] = useState('Pyodide ачааллаж байна... (~5 сек)');
  const [rows, setRows] = useState<DataRow[]>(initialRows ?? []);
  const [dataLoading, setDataLoading] = useState(false);
  const [tblPath, setTblPath] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrl = useRef<string>('');

  // Blob URL үүсгэх
  useEffect(() => {
    const blob = new Blob([PYODIDE_HTML], { type: 'text/html' });
    blobUrl.current = URL.createObjectURL(blob);
    if (iframeRef.current) iframeRef.current.src = blobUrl.current;
    return () => URL.revokeObjectURL(blobUrl.current);
  }, []);

  // iframe message handler
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const { type, msg } = e.data ?? {};
      if (type === 'ready') { setStatus('ready'); setStatusMsg('✓ Python бэлэн'); }
      else if (type === 'error') { setStatus('error'); setStatusMsg(msg ?? 'Алдаа'); }
      else if (type === 'done') setStatus('ready');
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const runCode = useCallback(() => {
    if (status !== 'ready') return;
    setStatus('running');
    iframeRef.current?.contentWindow?.postMessage({ type: 'run', code, data: rows }, '*');
  }, [code, rows, status]);

  const loadData = async () => {
    if (!tblPath.trim()) return;
    setDataLoading(true);
    try {
      const path = tblPath.trim().endsWith('.px') ? tblPath.trim() : tblPath.trim() + '.px';
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tblId: path }),
      });
      const data = await res.json();
      if (data.ok) setRows(data.rows ?? []);
      else alert('Татахад алдаа: ' + data.error);
    } catch (e) {
      alert('Алдаа: ' + String(e));
    } finally {
      setDataLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'data.csv';
    a.click();
  };

  const statusColor = status === 'ready' ? C.green : status === 'error' ? C.red : status === 'running' ? C.yellow : C.muted;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start', minHeight: 600 }}>

      {/* Left: editor + iframe */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block', boxShadow: `0 0 6px ${statusColor}` }} />
          <span style={{ fontSize: 12, color: statusColor, fontFamily: 'JetBrains Mono', flex: 1 }}>{statusMsg}</span>
          <span style={{ fontSize: 10, color: C.dim, fontFamily: 'JetBrains Mono' }}>🐍 Python · pandas · matplotlib · numpy</span>
        </div>

        {/* Code editor */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '0.08em' }}>PYTHON КОД</span>
            <span style={{ fontSize: 10, color: C.dim, marginLeft: 4 }}>df = таны өгөгдөл</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={runCode} disabled={status !== 'ready'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: status === 'ready' ? C.green : C.dim, color: '#000', fontWeight: 700, fontSize: 12, borderRadius: 7, border: 'none', cursor: status === 'ready' ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
                {status === 'running'
                  ? <RefreshCw size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
                  : <Play size={13} />}
                {status === 'running' ? 'Ажиллаж байна...' : 'Ажиллуулах'}
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode(); } }}
            spellCheck={false}
            style={{
              width: '100%', minHeight: 240, padding: '12px 14px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, lineHeight: 1.7,
              color: '#e2e8f0', background: '#060c18', border: 'none', outline: 'none',
              resize: 'vertical', tabSize: 4,
            }}
          />
          <div style={{ padding: '5px 14px', borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.dim }}>
            Ctrl+Enter: ажиллуулах
          </div>
        </div>

        {/* Output iframe */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em' }}>
            ГАРАЛТ
          </div>
          <iframe
            ref={iframeRef}
            style={{ width: '100%', height: 400, border: 'none', background: '#080d17' }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Right: sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Data loader */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            <Database size={11} style={{ display: 'inline', marginRight: 5 }} />
            Өгөгдөл ачаалах
          </div>
          <input
            value={tblPath}
            onChange={e => setTblPath(e.target.value)}
            placeholder='жш: population, gdp, unemployment...'
            style={{ width: '100%', padding: '8px 10px', background: '#060c18', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 11.5, fontFamily: 'JetBrains Mono', outline: 'none', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={loadData} disabled={dataLoading || !tblPath.trim()}
              style={{ flex: 1, padding: '7px 0', background: C.green, color: '#000', fontWeight: 700, fontSize: 12, borderRadius: 7, border: 'none', cursor: 'pointer' }}>
              {dataLoading ? '⏳ Татаж байна...' : '📥 Татах'}
            </button>
            {rows.length > 0 && (
              <button onClick={downloadCSV}
                style={{ padding: '7px 12px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, cursor: 'pointer' }}>
                <Download size={13} />
              </button>
            )}
          </div>
          {rows.length > 0 && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(0,200,122,0.06)', borderRadius: 6, border: `1px solid rgba(0,200,122,0.15)` }}>
              <span style={{ fontSize: 11, color: C.green, fontFamily: 'JetBrains Mono' }}>
                ✓ df: {rows.length.toLocaleString()} мөр · {Object.keys(rows[0] ?? {}).length} багана
              </span>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 3, fontFamily: 'JetBrains Mono' }}>
                {Object.keys(rows[0] ?? {}).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            <BookOpen size={11} style={{ display: 'inline', marginRight: 5 }} />
            Жишээ кодууд
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {PY_EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => setCode(ex.code)}
                style={{ padding: '8px 12px', background: '#0a1428', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.background = 'rgba(96,165,250,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = '#0a1428'; }}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick reference */}
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Лавлах
          </div>
          {[
            ['df', 'Таны өгөгдөл (DataFrame)'],
            ['df.columns', 'Баганы нэрүүд'],
            ['df["VALUE"]', 'VALUE багана'],
            ['df.groupby("Он")["VALUE"].sum()', 'Жилээр нийлбэр'],
            ['df[df["Он"]=="2023"]', 'Жилээр шүүх'],
            ['df.describe()', 'Статистик дүгнэлт'],
            ['plt.show()', 'График харуулах'],
          ].map(([code, desc]) => (
            <div key={code} style={{ marginBottom: 5 }}>
              <code style={{ fontSize: 10, color: C.green, fontFamily: 'JetBrains Mono' }}>{code}</code>
              <div style={{ fontSize: 10, color: C.dim }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
