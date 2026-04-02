'use client';

/**
 * Python горим — Pyodide (браузер дотор Python + matplotlib, pandas)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RefreshCw, Download, Database, BookOpen, Terminal } from 'lucide-react';

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

agg = plot_data.groupby('Period')['VALUE'].sum().reset_index()
agg = agg.sort_values('Period')

fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0c1322')
ax.set_facecolor('#0c1322')
ax.plot(agg['Period'], agg['VALUE'], color='#00d68f', linewidth=2.5, marker='o', markersize=5)
ax.tick_params(colors='#8898b0')
ax.spines[['top','right']].set_visible(False)
ax.spines[['bottom','left']].set_color('#1a2d4a')
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
ax.set_title('Цуваа өгөгдлийн өөрчлөлт', color='#d4dae6', fontsize=13, pad=10)
ax.set_xlabel('Он', color='#8898b0')
ax.set_ylabel('Утга', color='#8898b0')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`,
  },
  {
    label: 'Багана диаграм',
    code: `import matplotlib.pyplot as plt
import numpy as np

last_yr = df['Period'].astype(str).max()
sub = df[df['Period'].astype(str) == last_yr]

skip = {'VALUE','Period'}
cat_cols = [c for c in df.columns if c not in skip and not c.endswith('_CODE')]
grp = cat_cols[0] if cat_cols else None

if grp is None:
    print("Бүлэглэх багана олдсонгүй")
else:
    agg = sub.groupby(grp)['VALUE'].sum().nlargest(20).sort_values()
    colors = plt.cm.RdYlGn(np.linspace(0.2, 0.9, len(agg)))

    fig, ax = plt.subplots(figsize=(10, 7), facecolor='#0c1322')
    ax.set_facecolor('#0c1322')
    bars = ax.barh(agg.index.astype(str), agg.values, color=colors, alpha=0.9)
    ax.tick_params(colors='#8898b0')
    ax.spines[['top','right']].set_visible(False)
    ax.spines[['bottom','left']].set_color('#1a2d4a')
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
    ax.set_title(f'Top 20: {grp} ({last_yr})', color='#d4dae6', fontsize=13)
    plt.tight_layout()
    plt.show()`,
  },
  {
    label: 'Регресс + Таамаглал',
    code: `import matplotlib.pyplot as plt
import numpy as np

agg = df.groupby('Period')['VALUE'].sum().reset_index()
agg['Period'] = agg['Period'].astype(float)
agg = agg.sort_values('Period')

x = agg['Period'].values
y = agg['VALUE'].values

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

fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0c1322')
ax.set_facecolor('#0c1322')
ax.plot(x, y, color='#00d68f', linewidth=2, marker='o', markersize=4, label='Бодит')
ax.plot(x, poly(x), color='#5b9cf6', linewidth=1.5, linestyle='--', label='Регресс')
ax.scatter(future, pred, color='#a78bfa', s=60, zorder=5, label='Таамаглал')
ax.tick_params(colors='#8898b0')
ax.spines[['top','right']].set_visible(False)
ax.spines[['bottom','left']].set_color('#1a2d4a')
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
ax.set_title('Регресс + Таамаглал', color='#d4dae6', fontsize=13)
ax.legend(facecolor='#0c1322', labelcolor='#d4dae6', framealpha=0.5)
plt.tight_layout()
plt.show()`,
  },
  {
    label: 'Histogram',
    code: `import matplotlib.pyplot as plt

vals = df['VALUE'].dropna()
fig, ax = plt.subplots(figsize=(9, 5), facecolor='#0c1322')
ax.set_facecolor('#0c1322')
ax.hist(vals, bins=30, color='#00d68f', alpha=0.85, edgecolor='#070c18')
ax.tick_params(colors='#8898b0')
ax.spines[['top','right']].set_visible(False)
ax.spines[['bottom','left']].set_color('#1a2d4a')
ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
ax.set_title('Утгын хуваарилалт', color='#d4dae6', fontsize=13)
ax.set_xlabel('Утга', color='#8898b0')
ax.set_ylabel('Тоо', color='#8898b0')
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
    fig, ax = plt.subplots(figsize=(8, 6), facecolor='#0c1322')
    ax.set_facecolor('#0c1322')
    im = ax.imshow(corr.values, cmap='RdYlGn', vmin=-1, vmax=1)
    plt.colorbar(im, ax=ax)
    ax.set_xticks(range(len(num_cols)))
    ax.set_yticks(range(len(num_cols)))
    ax.set_xticklabels(num_cols, rotation=45, ha='right', color='#8898b0', fontsize=9)
    ax.set_yticklabels(num_cols, color='#8898b0', fontsize=9)
    for i in range(len(num_cols)):
        for j in range(len(num_cols)):
            ax.text(j, i, f'{corr.values[i,j]:.2f}', ha='center', va='center',
                   color='white', fontsize=9, fontweight='bold')
    ax.set_title('Корреляцийн матриц', color='#d4dae6', fontsize=13)
    plt.tight_layout()
    plt.show()`,
  },
];

const PYODIDE_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050a14; color: #d4dae6; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  #out { padding: 12px; white-space: pre-wrap; word-break: break-word; line-height: 1.7; }
  #out .err { color: #f05252; }
  #out .ok  { color: #00d68f; }
  #out .img { display: block; max-width: 100%; border-radius: 8px; margin: 10px 0; }
</style>
</head>
<body>
<div id="out"><span class="ok">Pyodide ачааллаж байна (~5 сек)...</span></div>
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

async function init() {
  try {
    importScripts ? 0 : 0;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
    script.onload = async () => {
      pyodide = await loadPyodide();
      await pyodide.loadPackage(['numpy','pandas','matplotlib']);
      document.getElementById('out').innerHTML = '';
      log('Python бэлэн! (pandas, matplotlib, numpy)', 'ok');
      parent.postMessage({ type:'status', status:'ready', msg:'Python бэлэн' }, '*');
    };
    document.head.appendChild(script);
  } catch(e) { log('Алдаа: '+e.message, 'err'); parent.postMessage({type:'status',status:'error',msg:e.message},'*'); }
}

window.addEventListener('message', async (ev) => {
  if (ev.data.type === 'loadData') {
    df_json = ev.data.data;
    log('df ачааллаа: ' + df_json.length + ' мөр', 'ok');
  }
  if (ev.data.type === 'run' && pyodide) {
    parent.postMessage({type:'status',status:'running',msg:'Ажиллаж байна...'},'*');
    document.getElementById('out').innerHTML = '';
    try {
      if (ev.data.data && ev.data.data.length > 0) df_json = ev.data.data;
      const setup = df_json ? \`
import pandas as pd, json, io, base64, sys
df = pd.DataFrame(json.loads('\${JSON.stringify(df_json).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'")}'))
for c in df.columns:
    try: df[c] = pd.to_numeric(df[c])
    except: pass
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
_old_show = plt.show
def _new_show(*a,**k):
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor=plt.gcf().get_facecolor())
    buf.seek(0)
    b64 = base64.b64encode(buf.read()).decode()
    el = document.createElement('img')
    el.src = 'data:image/png;base64,' + b64
    el.className = 'img'
    document.getElementById('out').appendChild(el)
    plt.close()
plt.show = _new_show

class _Capture:
    def write(self, t):
        if t.strip():
            el = document.createElement('span')
            el.textContent = t + '\\n'
            document.getElementById('out').appendChild(el)
    def flush(self): pass
sys.stdout = _Capture()
sys.stderr = type('E',(object,),{'write':lambda s,t: log(t,'err'),'flush':lambda s:None})()
\` : '';
      await pyodide.runPythonAsync(setup + '\\n' + ev.data.code);
      parent.postMessage({type:'status',status:'ready',msg:'Дууслаа'},'*');
    } catch(e) {
      log(e.message, 'err');
      parent.postMessage({type:'status',status:'ready',msg:'Алдаа гарлаа'},'*');
    }
  }
});
init();
<\/script>
</body></html>`;

export default function RMode() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
  const [statusMsg, setStatusMsg] = useState('Pyodide ачааллаж байна...');
  const [code, setCode] = useState(PY_EXAMPLES[0].code);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [tblPath, setTblPath] = useState('');
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'status') {
        setStatus(ev.data.status);
        setStatusMsg(ev.data.msg ?? '');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!iframeRef.current) return;
    iframeRef.current.srcdoc = PYODIDE_HTML;
  }, []);

  useEffect(() => {
    if (rows.length > 0 && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({ type: 'loadData', data: rows }, '*');
    }
  }, [rows]);

  const runCode = useCallback(() => {
    if (status !== 'ready') return;
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

  const statusColor = status === 'ready' ? 'text-accent' : status === 'error' ? 'text-danger' : status === 'running' ? 'text-accent3' : 'text-ink-500';
  const statusDot = status === 'ready' ? 'bg-accent shadow-glow-green' : status === 'error' ? 'bg-danger' : status === 'running' ? 'bg-accent3' : 'bg-ink-600';

  return (
    <div className="layout-main grid gap-4 items-start min-h-[600px]" style={{ gridTemplateColumns: '1fr 320px' }}>

      {/* Left: editor + output */}
      <div className="flex flex-col gap-3">

        {/* Status bar */}
        <div className="card flex items-center gap-3 !py-2.5 !px-4">
          <span className={`w-2 h-2 rounded-full ${statusDot} flex-shrink-0`} />
          <span className={`text-xs font-mono flex-1 ${statusColor}`}>{statusMsg}</span>
          <span className="text-[10px] text-ink-600 font-mono tracking-wider">PYTHON / PANDAS / MATPLOTLIB</span>
        </div>

        {/* Code editor */}
        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <Terminal size={12} className="text-accent2" />
            <span className="label-upper text-accent2">Python код</span>
            <span className="text-[10px] text-ink-600 ml-1">df = таны өгөгдөл</span>
            <div className="ml-auto">
              <button onClick={runCode} disabled={status !== 'ready'} className="btn-primary !py-1.5 !px-4 !text-xs">
                {status === 'running' ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
                {status === 'running' ? 'Ажиллаж байна...' : 'Ажиллуулах'}
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode(); } }}
            spellCheck={false}
            className="w-full min-h-[240px] px-4 py-3 font-mono text-code text-ink-200 bg-surface-dark border-none outline-none resize-y"
            style={{ tabSize: 4 }}
          />
          <div className="px-4 py-1.5 border-t border-border text-[10px] text-ink-600 font-mono tracking-wider">
            CTRL+ENTER: АЖИЛЛУУЛАХ
          </div>
        </div>

        {/* Output iframe */}
        <div className="card !p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <span className="label-upper text-ink-500">Гаралт</span>
          </div>
          <iframe
            ref={iframeRef}
            className="w-full border-none bg-surface-darker"
            style={{ height: 400 }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Right sidebar */}
      <div className="flex flex-col gap-3 hide-mobile">

        {/* Data loader */}
        <div className="card">
          <div className="flex items-center gap-1.5 mb-3">
            <Database size={12} className="text-accent" />
            <span className="label-upper text-accent">Өгөгдөл ачаалах</span>
          </div>
          <input
            value={tblPath}
            onChange={e => setTblPath(e.target.value)}
            placeholder="жш: population, gdp..."
            className="input-search !text-xs font-mono mb-2"
          />
          <div className="flex gap-1.5">
            <button onClick={loadData} disabled={dataLoading || !tblPath.trim()} className="btn-primary flex-1 !text-xs !py-2 justify-center">
              {dataLoading ? 'Татаж байна...' : 'Татах'}
            </button>
            {rows.length > 0 && (
              <button onClick={() => {
                const cols = Object.keys(rows[0]);
                const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','))].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = 'data.csv'; a.click();
              }} className="btn-ghost !py-2">
                <Download size={12} />
              </button>
            )}
          </div>
          {rows.length > 0 && (
            <div className="mt-2 p-2.5 bg-accent-dim rounded-lg border border-accent/20">
              <span className="text-[11px] text-accent font-mono font-bold">
                df: {rows.length.toLocaleString()} мөр · {Object.keys(rows[0] ?? {}).length} багана
              </span>
              <div className="text-[10px] text-ink-600 mt-1 font-mono leading-relaxed truncate">
                {Object.keys(rows[0] ?? {}).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="card">
          <div className="flex items-center gap-1.5 mb-3">
            <BookOpen size={12} className="text-accent2" />
            <span className="label-upper text-accent2">Жишээ кодууд</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {PY_EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => setCode(ex.code)}
                className="btn-ghost w-full justify-start !text-xs !py-2">
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick reference */}
        <div className="card">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="label-upper" style={{ color: '#a78bfa' }}>Лавлах</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              ['df', 'Таны өгөгдөл'],
              ['df.columns', 'Баганы нэрүүд'],
              ['df["VALUE"]', 'VALUE багана'],
              ['df.groupby("Он")["VALUE"].sum()', 'Жилээр нийлбэр'],
              ['df.describe()', 'Статистик дүгнэлт'],
              ['plt.show()', 'График харуулах'],
            ].map(([c, desc]) => (
              <div key={c}>
                <code className="text-[10px] text-accent font-mono">{c}</code>
                <div className="text-[10px] text-ink-600">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
