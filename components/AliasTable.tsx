'use client';
import { useState, useEffect, useMemo } from 'react';
import { Copy, Check, Search } from 'lucide-react';
import type { TableAlias } from '@/lib/tableAliases';
import { loadAliases } from '@/lib/tableAliases';

interface Props { onInsert: (alias: string) => void; }

const CAT_COLOR: Record<string, string> = {
  'Хүн ам, өрх':                    '#60a5fa',
  'Эдийн засаг, байгаль орчин':      '#00c87a',
  'Хөдөлмөр, бизнес':               '#f87171',
  'Боловсрол, эрүүл мэнд':          '#c084fc',
  'Үйлдвэрлэл, үйлчилгээ':          '#fbbf24',
  'Нийгэм, хөгжил':                  '#34d399',
  'Бүсчилсэн хөгжлийн үзүүлэлтүүд': '#fb923c',
  'Түүхэн Статистик':                '#94a3b8',
};

export default function AliasTable({ onInsert }: Props) {
  const [aliases, setAliases] = useState<TableAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState('');

  useEffect(() => { loadAliases().then(d => { setAliases(d); setLoading(false); }); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return null;
    const lq = q.toLowerCase();
    return aliases.filter(a => a.alias.includes(lq) || a.label.toLowerCase().includes(lq) || a.category.toLowerCase().includes(lq)).slice(0, 40);
  }, [q, aliases]);

  const categories = useMemo(() => [...new Set(aliases.map(a => a.category))], [aliases]);
  const byCategory = (cat: string) => aliases.filter(a => a.category === cat);

  const handleCopy = (alias: string) => { onInsert(alias); setCopied(alias); setTimeout(() => setCopied(null), 1200); };

  const ItemRow = ({ a }: { a: TableAlias }) => {
    const color = CAT_COLOR[a.category] ?? '#94a3b8';
    return (
      <button onClick={() => handleCopy(a.alias)} title={a.label + '\n' + a.path}
        style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'5px 7px', borderRadius:5, border:'1px solid #1a3050', background:'#0a1428', cursor:'pointer', textAlign:'left', transition:'all 0.12s', width:'100%' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.background=color+'10'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#1a3050'; e.currentTarget.style.background='#0a1428'; }}>
        <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, fontWeight:700, color, background:color+'15', padding:'1px 5px', borderRadius:3, border:`1px solid ${color}30`, flexShrink:0, lineHeight:1.6 }}>{a.alias}</code>
        <span style={{ fontSize:10.5, color:'#94a3b8', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.4 }}>{a.label}</span>
        <span style={{ color: copied===a.alias ? '#00c87a' : '#334155', flexShrink:0 }}>{copied===a.alias ? <Check size={10}/> : <Copy size={10}/>}</span>
      </button>
    );
  };

  if (loading) return <div style={{fontSize:11,color:'#334155',textAlign:'center',padding:'16px 0'}}>aliases.json ачааллаж байна... ({1282} хүснэгт)</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#475569', letterSpacing:'0.07em', textTransform:'uppercase' }}>{aliases.length} хүснэгтийн alias</div>
      <div style={{ position:'relative' }}>
        <Search size={11} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#334155', pointerEvents:'none' }}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Хайх... (alias, монгол нэр)"
          style={{ width:'100%', padding:'5px 8px 5px 24px', background:'#060c18', border:'1px solid #1a3050', borderRadius:6, color:'#e2e8f0', fontSize:11, outline:'none', fontFamily:'inherit' }}
          onFocus={e=>e.currentTarget.style.borderColor='#00c87a'} onBlur={e=>e.currentTarget.style.borderColor='#1a3050'}/>
      </div>
      {filtered ? (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <div style={{ fontSize:10, color:'#334155' }}>{filtered.length} үр дүн</div>
          {filtered.map(a => <ItemRow key={a.alias} a={a}/>)}
          {!filtered.length && <div style={{fontSize:11,color:'#334155',textAlign:'center',padding:'10px 0'}}>Олдсонгүй</div>}
        </div>
      ) : categories.map(cat => {
        const items = byCategory(cat);
        const color = CAT_COLOR[cat] ?? '#94a3b8';
        const isOpen = !collapsed[cat];
        return (
          <div key={cat}>
            <button onClick={() => setCollapsed(p=>({...p,[cat]:!p[cat]}))}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:5, padding:'4px 7px', borderRadius:5, border:'none', cursor:'pointer', background:color+'12' }}
              onMouseEnter={e=>e.currentTarget.style.background=color+'20'} onMouseLeave={e=>e.currentTarget.style.background=color+'12'}>
              <span style={{fontSize:9,color}}>{isOpen?'▾':'▸'}</span>
              <span style={{fontSize:10.5,fontWeight:700,color,flex:1,textAlign:'left'}}>{cat}</span>
              <span style={{fontSize:10,color:'#334155'}}>{items.length}</span>
            </button>
            {isOpen && (
              <div style={{paddingLeft:4,marginTop:2,display:'flex',flexDirection:'column',gap:1,maxHeight:220,overflowY:'auto'}}>
                {items.map(a => <ItemRow key={a.alias} a={a}/>)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
