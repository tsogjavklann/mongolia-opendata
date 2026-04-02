'use client';

/**
 * Python горим — Pyodide (браузер дотор Python + matplotlib, pandas)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, RefreshCw, Download, Database, BookOpen, Terminal } from 'lucide-react';
import TableSearch from '@/components/TableSearch';
import type { TableEntry } from '@/lib/types';

const PY_EXAMPLES = [
  {
    label: '1. Дата шалгах',
    code: `# Өгөгдлийн бүтцийг хурдан харах
print("=" * 50)
print(f"  Нийт мөр:    {len(df):,}")
print(f"  Нийт багана: {len(df.columns)}")
print("=" * 50)

print("\\nБаганууд:")
for col in df.columns:
    uniqs = df[col].nunique()
    print(f"  {col:30s}  ({df[col].dtype})  — {uniqs} ялгаатай утга")

print("\\nЭхний 5 мөр:")
print(df.head().to_string())

if 'VALUE' in df.columns:
    print(f"\\nVALUE статистик:")
    print(f"  Дундаж:  {df['VALUE'].mean():,.1f}")
    print(f"  Хамгийн их: {df['VALUE'].max():,.1f}")
    print(f"  Хамгийн бага: {df['VALUE'].min():,.1f}")`,
  },
  {
    label: '2. Жилийн тренд',
    code: `import matplotlib.pyplot as plt

# Он/Period баганыг олох
period_col = None
for c in df.columns:
    if c in ('Он', 'Period', 'Year', 'Үе'):
        period_col = c
        break

if period_col is None:
    print("Он/Period багана олдсонгүй")
    print("Байгаа баганууд:", list(df.columns))
else:
    agg = df.groupby(period_col)['VALUE'].sum().reset_index()
    agg[period_col] = agg[period_col].astype(str)
    agg = agg.sort_values(period_col)

    fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0c1322')
    ax.set_facecolor('#0c1322')
    ax.plot(agg[period_col], agg['VALUE'], color='#00d68f',
            linewidth=2.5, marker='o', markersize=6)
    ax.fill_between(range(len(agg)), agg['VALUE'], alpha=0.1, color='#00d68f')
    ax.tick_params(colors='#8898b0', labelsize=9)
    ax.spines[['top','right']].set_visible(False)
    ax.spines[['bottom','left']].set_color('#1a2d4a')
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
    ax.set_title(f'{period_col} дахь өөрчлөлт', color='#d4dae6', fontsize=14, fontweight='bold')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()
    print(f"\\n{period_col} тоо: {len(agg)}")
    print(f"Хамгийн их: {agg.loc[agg['VALUE'].idxmax(), period_col]} = {agg['VALUE'].max():,.0f}")`,
  },
  {
    label: '3. Top 20 харьцуулалт',
    code: `import matplotlib.pyplot as plt
import numpy as np

# VALUE-гаас бусад тоон бус баганыг олох
skip = {'VALUE', 'Period', 'Он', 'Year'}
cat_cols = [c for c in df.columns
            if c not in skip and not c.endswith('_CODE') and df[c].dtype == 'object']

if not cat_cols:
    print("Бүлэглэх багана олдсонгүй")
else:
    grp = cat_cols[0]
    agg = df.groupby(grp)['VALUE'].sum().nlargest(20).sort_values()
    colors = plt.cm.viridis(np.linspace(0.2, 0.9, len(agg)))

    fig, ax = plt.subplots(figsize=(10, max(5, len(agg)*0.35)), facecolor='#0c1322')
    ax.set_facecolor('#0c1322')
    bars = ax.barh(range(len(agg)), agg.values, color=colors)
    ax.set_yticks(range(len(agg)))
    ax.set_yticklabels([str(x)[:35] for x in agg.index], fontsize=9)
    ax.tick_params(colors='#8898b0')
    ax.spines[['top','right']].set_visible(False)
    ax.spines[['bottom','left']].set_color('#1a2d4a')
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
    ax.set_title(f'Top 20: {grp}', color='#d4dae6', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()`,
  },
  {
    label: '4. Pie chart',
    code: `import matplotlib.pyplot as plt

skip = {'VALUE', 'Period', 'Он', 'Year'}
cat_cols = [c for c in df.columns
            if c not in skip and not c.endswith('_CODE') and df[c].dtype == 'object']

if not cat_cols:
    print("Бүлэглэх багана олдсонгүй")
else:
    grp = cat_cols[0]
    agg = df.groupby(grp)['VALUE'].sum().nlargest(8)

    colors = ['#00d68f','#5b9cf6','#f0b040','#f05252','#a78bfa','#34d399','#fb923c','#8898b0']

    fig, ax = plt.subplots(figsize=(8, 6), facecolor='#0c1322')
    ax.set_facecolor('#0c1322')
    wedges, texts, autotexts = ax.pie(
        agg.values, labels=[str(x)[:20] for x in agg.index],
        autopct='%1.1f%%', colors=colors[:len(agg)],
        textprops={'color': '#d4dae6', 'fontsize': 9},
        pctdistance=0.8, labeldistance=1.12
    )
    for t in autotexts:
        t.set_fontsize(8)
        t.set_color('#0c1322')
        t.set_fontweight('bold')
    ax.set_title(f'{grp} хувь', color='#d4dae6', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()`,
  },
  {
    label: '5. Регресс + таамаглал',
    code: `import matplotlib.pyplot as plt
import numpy as np

period_col = None
for c in df.columns:
    if c in ('Он', 'Period', 'Year', 'Үе'):
        period_col = c
        break

if period_col is None:
    print("Он/Period багана олдсонгүй")
else:
    agg = df.groupby(period_col)['VALUE'].sum().reset_index()
    agg[period_col] = pd.to_numeric(agg[period_col], errors='coerce')
    agg = agg.dropna().sort_values(period_col)

    x = agg[period_col].values
    y = agg['VALUE'].values

    coef = np.polyfit(x, y, 1)
    poly = np.poly1d(coef)
    future_x = np.arange(x.max()+1, x.max()+6)
    future_y = poly(future_x)

    print("=== Шугаман регресс ===")
    print(f"  Жилийн өсөлт: {coef[0]:+,.0f}")
    print(f"\\n=== 5 жилийн таамаглал ===")
    for yr, val in zip(future_x, future_y):
        chg = ((val - y[-1]) / y[-1]) * 100
        print(f"  {int(yr)}: {val:>12,.0f}  ({chg:+.1f}%)")

    fig, ax = plt.subplots(figsize=(10, 5), facecolor='#0c1322')
    ax.set_facecolor('#0c1322')
    ax.plot(x, y, color='#00d68f', linewidth=2.5, marker='o', markersize=5, label='Бодит', zorder=3)
    ax.plot(x, poly(x), color='#5b9cf6', linewidth=1.5, linestyle='--', alpha=0.7, label='Тренд')
    ax.scatter(future_x, future_y, color='#a78bfa', s=70, zorder=5, label='Таамаглал', edgecolors='white', linewidth=0.5)
    ax.fill_between(future_x, future_y*0.9, future_y*1.1, alpha=0.1, color='#a78bfa')
    ax.tick_params(colors='#8898b0')
    ax.spines[['top','right']].set_visible(False)
    ax.spines[['bottom','left']].set_color('#1a2d4a')
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x:,.0f}'))
    ax.set_title('Тренд + Таамаглал (5 жил)', color='#d4dae6', fontsize=14, fontweight='bold')
    ax.legend(facecolor='#0c1322', labelcolor='#d4dae6', framealpha=0.5, fontsize=9)
    plt.tight_layout()
    plt.show()`,
  },
  {
    label: '6. Хүснэгтэн дүгнэлт',
    code: `# Нарийвчилсан статистик дүгнэлт
print("=" * 60)
print("  СТАТИСТИК ДҮГНЭЛТ")
print("=" * 60)

if 'VALUE' in df.columns:
    vals = df['VALUE'].dropna()
    print(f"\\n  Тоо:          {len(vals):>12,}")
    print(f"  Дундаж:       {vals.mean():>12,.2f}")
    print(f"  Медиан:       {vals.median():>12,.2f}")
    print(f"  Стандарт хазайлт: {vals.std():>12,.2f}")
    print(f"  Хамгийн бага: {vals.min():>12,.2f}")
    print(f"  25-р хувь:    {vals.quantile(0.25):>12,.2f}")
    print(f"  75-р хувь:    {vals.quantile(0.75):>12,.2f}")
    print(f"  Хамгийн их:   {vals.max():>12,.2f}")

# Бүлэг тус бүрийн дүгнэлт
skip = {'VALUE', 'Period', 'Он', 'Year'}
cat_cols = [c for c in df.columns
            if c not in skip and not c.endswith('_CODE') and df[c].dtype == 'object']

for col in cat_cols[:2]:
    print(f"\\n--- {col} ---")
    grp = df.groupby(col)['VALUE'].agg(['sum','mean','count'])
    grp = grp.sort_values('sum', ascending=False).head(10)
    grp['sum'] = grp['sum'].apply(lambda x: f'{x:,.0f}')
    grp['mean'] = grp['mean'].apply(lambda x: f'{x:,.1f}')
    print(grp.to_string())`,
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
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    script.onerror = () => { log('Pyodide татахад алдаа — интернет шалгана уу', 'err'); parent.postMessage({type:'status',status:'error',msg:'Pyodide load failed'},'*'); };
    script.onload = async () => {
      try {
        pyodide = await loadPyodide();
        await pyodide.loadPackage(['numpy','pandas','matplotlib']);
        document.getElementById('out').innerHTML = '';
        log('Python бэлэн! (pandas, matplotlib, numpy)', 'ok');
        parent.postMessage({ type:'status', status:'ready', msg:'Python бэлэн' }, '*');
      } catch(e) { log('Package ачаалахад алдаа: '+e.message, 'err'); parent.postMessage({type:'status',status:'error',msg:e.message},'*'); }
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
from js import document

_df_raw = json.loads('\${JSON.stringify(df_json).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'")}')
df = pd.DataFrame(_df_raw)
for c in df.columns:
    try: df[c] = pd.to_numeric(df[c])
    except: pass

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

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
        if t and t.strip():
            el = document.createElement('span')
            el.textContent = str(t) + chr(10)
            document.getElementById('out').appendChild(el)
    def flush(self): pass
sys.stdout = _Capture()
sys.stderr = _Capture()
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

interface RModeProps {
  initialData?: { rows: Record<string, unknown>[]; tableName?: string };
}

export default function RMode({ initialData }: RModeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading');
  const [statusMsg, setStatusMsg] = useState('Pyodide ачааллаж байна...');
  const [code, setCode] = useState(PY_EXAMPLES[0].code);
  const [rows, setRows] = useState<Record<string, unknown>[]>(initialData?.rows ?? []);
  const [tableName, setTableName] = useState(initialData?.tableName ?? '');
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
    if (rows.length === 0) {
      alert('Эхлээд баруун талаас өгөгдөл ачаална уу! Хүснэгт хайгаад "Татах" дарна.');
      return;
    }
    iframeRef.current?.contentWindow?.postMessage({ type: 'run', code, data: rows }, '*');
  }, [code, rows, status]);

  const loadData = async (entry?: TableEntry) => {
    const path = entry ? (entry.path.endsWith('.px') ? entry.path : entry.path + '.px') : '';
    if (!path) return;
    setDataLoading(true);
    setTableName(entry?.text ?? entry?.id ?? '');
    try {
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
          <TableSearch onSelect={(t) => loadData(t)} placeholder="Хүснэгт хайх..." compact />
          {dataLoading && (
            <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
              <RefreshCw size={12} className="spin text-accent" /> Татаж байна...
            </div>
          )}
          {rows.length > 0 && (
            <div className="mt-2 p-2.5 bg-accent-dim rounded-lg border border-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-accent font-mono font-bold">
                  df: {rows.length.toLocaleString()} мөр · {Object.keys(rows[0] ?? {}).length} багана
                </span>
                <button onClick={() => {
                  const cols = Object.keys(rows[0]);
                  const csv = [cols.join(','), ...rows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','))].join('\n');
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                  a.download = 'data.csv'; a.click();
                }} className="btn-ghost !py-0.5 !px-1.5 !text-[10px]">
                  <Download size={10} />
                </button>
              </div>
              {tableName && <div className="text-[10px] text-accent/70 mt-0.5 truncate">{tableName}</div>}
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
