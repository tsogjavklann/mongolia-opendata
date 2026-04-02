'use client';

/**
 * SchemaSidebar — Хүснэгтийн бүтэц харуулах sidebar
 *
 * Харуулдаг зүйлс:
 * - Хүснэгтийн нэр
 * - Баганын нэр (Монгол + Англи alias)
 * - Баганын өгөгдлийн төрөл (number / text)
 * - Sample утгууд
 * - Баганыг WHERE clause-д нэмэх товч
 */

import { useState } from 'react';
import { Database, Copy, ChevronDown, ChevronRight, Hash, Type, Zap } from 'lucide-react';

export interface ColumnInfo {
  name: string;
  type: string;
  mongolianName?: string;
  englishAlias?: string;
  sampleValues?: string[];
}

interface SchemaSidebarProps {
  tableName?: string;
  columns: ColumnInfo[];
  loading?: boolean;
  onInsertColumn?: (colName: string) => void;
  onInsertSnippet?: (snippet: string) => void;
  engine?: string;
  timing?: { fetchMs: number; sqlMs: number; totalMs: number };
}

const SQL_SNIPPETS = [
  { label: 'GROUP BY + SUM', snippet: 'SELECT {col}, SUM(VALUE) as total FROM "{tbl}" GROUP BY {col} ORDER BY total DESC' },
  { label: 'WINDOW RANK', snippet: 'SELECT *, RANK() OVER (ORDER BY VALUE DESC) as rank FROM "{tbl}"' },
  { label: 'RUNNING TOTAL', snippet: 'SELECT *, SUM(VALUE) OVER (ORDER BY Он) as cumulative FROM "{tbl}"' },
  { label: 'TOP 10', snippet: 'SELECT * FROM "{tbl}" ORDER BY VALUE DESC LIMIT 10' },
  { label: 'AVG by year', snippet: 'SELECT Он, AVG(VALUE) as avg_val FROM "{tbl}" GROUP BY Он ORDER BY Он' },
];

export default function SchemaSidebar({
  tableName,
  columns,
  loading,
  onInsertColumn,
  onInsertSnippet,
  engine,
  timing,
}: SchemaSidebarProps) {
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());
  const [copiedCol, setCopiedCol] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schema' | 'snippets'>('schema');

  const toggleCol = (name: string) => {
    setExpandedCols(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const copyToClipboard = (text: string, colName: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedCol(colName);
    setTimeout(() => setCopiedCol(null), 1500);
  };

  const numericCols = columns.filter(c => c.type === 'number');
  const textCols = columns.filter(c => c.type !== 'number');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Engine badge */}
      {engine && (
        <div style={{
          padding: '7px 11px',
          background: engine === 'duckdb' ? 'rgba(0,200,122,0.06)' : 'rgba(96,165,250,0.06)',
          border: `1px solid ${engine === 'duckdb' ? 'rgba(0,200,122,0.18)' : 'rgba(96,165,250,0.18)'}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={11} color={engine === 'duckdb' ? '#00c87a' : '#60a5fa'} />
            <span style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: engine === 'duckdb' ? '#00c87a' : '#60a5fa',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.05em',
            }}>
              {engine === 'duckdb' ? '⚡ DuckDB Engine' : engine === 'api-fallback' ? '⚠ API Fallback' : '📡 API Only'}
            </span>
          </div>
          {timing && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {timing.fetchMs > 0 && (
                <span style={{ fontSize: 10, color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
                  📡 {timing.fetchMs}ms
                </span>
              )}
              {timing.sqlMs > 0 && (
                <span style={{ fontSize: 10, color: '#00c87a', fontFamily: 'JetBrains Mono, monospace' }}>
                  🦆 {timing.sqlMs}ms
                </span>
              )}
              <span style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                Нийт: {timing.totalMs}ms
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main schema card */}
      <div style={{
        background: '#0d1424',
        border: '1px solid #1a3050',
        borderRadius: 10,
        overflow: 'hidden',
      }}>

        {/* Header with tabs */}
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid #1a3050',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {tableName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Database size={12} color="#60a5fa" />
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#60a5fa',
                fontFamily: 'JetBrains Mono, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{tableName}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 2, background: '#060c18', borderRadius: 6, padding: 2 }}>
            {(['schema', 'snippets'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  transition: 'all 0.12s',
                  background: activeTab === t ? '#1a3050' : 'transparent',
                  color: activeTab === t ? '#e2e8f0' : '#334155',
                }}>
                {t === 'schema' ? '📐 Schema' : '⚡ SQL Examples'}
              </button>
            ))}
          </div>
        </div>

        {/* Schema tab */}
        {activeTab === 'schema' && (
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: 28, borderRadius: 5, background: '#0a1020', opacity: 0.5 + i * 0.1 }} />
                ))}
              </div>
            ) : columns.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: '#1e3352', fontSize: 12 }}>
                SQL ажиллуулахад schema гарна
              </div>
            ) : (
              <div>
                {/* Stats */}
                <div style={{
                  padding: '7px 12px',
                  display: 'flex',
                  gap: 12,
                  borderBottom: '1px solid rgba(26,48,80,0.5)',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <div style={{ fontSize: 10.5, color: '#475569' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{columns.length}</span> багана
                  </div>
                  <div style={{ fontSize: 10.5, color: '#475569' }}>
                    <span style={{ color: '#00c87a', fontWeight: 700 }}>{numericCols.length}</span> тоо
                  </div>
                  <div style={{ fontSize: 10.5, color: '#475569' }}>
                    <span style={{ color: '#60a5fa', fontWeight: 700 }}>{textCols.length}</span> текст
                  </div>
                </div>

                {/* Column list */}
                {columns.map(col => {
                  const isExpanded = expandedCols.has(col.name);
                  const isCopied = copiedCol === col.name;
                  const displayName = col.englishAlias ?? col.name;
                  const isNumeric = col.type === 'number';

                  return (
                    <div key={col.name} style={{
                      borderBottom: '1px solid rgba(26,48,80,0.4)',
                    }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 10px',
                          gap: 6,
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Type icon */}
                        <span style={{ flexShrink: 0 }}>
                          {isNumeric
                            ? <Hash size={10} color="#00c87a" />
                            : <Type size={10} color="#60a5fa" />}
                        </span>

                        {/* Column name */}
                        <div style={{ flex: 1, minWidth: 0 }} onClick={() => toggleCol(col.name)}>
                          <div style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#e2e8f0',
                            fontFamily: 'JetBrains Mono, monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>{displayName}</div>
                          {col.mongolianName && col.mongolianName !== col.name && (
                            <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>{col.mongolianName}</div>
                          )}
                        </div>

                        {/* Type badge */}
                        <span style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 3,
                          border: `1px solid ${isNumeric ? 'rgba(0,200,122,0.2)' : 'rgba(96,165,250,0.2)'}`,
                          color: isNumeric ? '#00c87a' : '#60a5fa',
                          fontFamily: 'JetBrains Mono, monospace',
                          flexShrink: 0,
                        }}>
                          {isNumeric ? 'NUM' : 'STR'}
                        </span>

                        {/* Copy button */}
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            copyToClipboard(col.name, col.name);
                            onInsertColumn?.(col.name);
                          }}
                          title="SQL-д нэмэх"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isCopied ? '#00c87a' : '#1e3352',
                            padding: 2,
                            flexShrink: 0,
                            transition: 'color 0.15s',
                          }}>
                          <Copy size={11} />
                        </button>

                        {/* Expand toggle */}
                        {(col.sampleValues?.length ?? 0) > 0 && (
                          <button
                            onClick={() => toggleCol(col.name)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e3352', padding: 0, flexShrink: 0 }}>
                            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                          </button>
                        )}
                      </div>

                      {/* Sample values */}
                      {isExpanded && (col.sampleValues?.length ?? 0) > 0 && (
                        <div style={{
                          padding: '4px 10px 8px 26px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 3,
                        }}>
                          <span style={{ fontSize: 9.5, color: '#1e3352', width: '100%', marginBottom: 2 }}>Жишээ утгууд:</span>
                          {col.sampleValues!.map(v => (
                            <button
                              key={v}
                              onClick={() => {
                                const snippet = isNumeric ? `${col.name} = ${v}` : `${col.name} = '${v}'`;
                                onInsertSnippet?.(snippet);
                                copyToClipboard(snippet, col.name + v);
                              }}
                              title="SQL WHERE-д нэмэх"
                              style={{
                                padding: '1px 6px',
                                fontSize: 10,
                                borderRadius: 3,
                                cursor: 'pointer',
                                border: '1px solid #1a3050',
                                background: 'transparent',
                                color: '#475569',
                                fontFamily: 'JetBrains Mono, monospace',
                                transition: 'all 0.1s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#60a5fa';
                                e.currentTarget.style.color = '#60a5fa';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#1a3050';
                                e.currentTarget.style.color = '#475569';
                              }}>
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SQL Snippets tab */}
        {activeTab === 'snippets' && (
          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 10, color: '#1e3352', marginBottom: 2, lineHeight: 1.5 }}>
              DuckDB-д бүрэн ажиллах SQL жишээнүүд.
              Товчийг дарахад SQL editor-т оруулна.
            </div>
            {SQL_SNIPPETS.map(s => (
              <button
                key={s.label}
                onClick={() => {
                  const tbl = tableName ?? 'data';
                  const col = numericCols[0]?.name ?? columns[0]?.name ?? 'VALUE';
                  const filled = s.snippet
                    .replace(/\{tbl\}/g, tbl)
                    .replace(/\{col\}/g, col);
                  onInsertSnippet?.(filled);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '7px 9px',
                  background: 'transparent',
                  border: '1px solid #1a3050',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s',
                  gap: 3,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#00c87a';
                  e.currentTarget.style.background = 'rgba(0,200,122,0.04)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1a3050';
                  e.currentTarget.style.background = 'transparent';
                }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#00c87a' }}>{s.label}</span>
                <code style={{
                  fontSize: 10,
                  color: '#334155',
                  fontFamily: 'JetBrains Mono, monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}>{s.snippet.split('\n')[0].slice(0, 60)}...</code>
              </button>
            ))}

            {/* DuckDB capability note */}
            <div style={{
              marginTop: 4,
              padding: '7px 9px',
              background: 'rgba(0,200,122,0.04)',
              border: '1px solid rgba(0,200,122,0.12)',
              borderRadius: 6,
            }}>
              <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.7 }}>
                <span style={{ color: '#00c87a', fontWeight: 700 }}>DuckDB боломжууд:</span><br />
                ✓ GROUP BY · SUM · AVG · COUNT<br />
                ✓ WINDOW FUNCTIONS · RANK() · NTILE()<br />
                ✓ HAVING · ORDER BY · DISTINCT<br />
                ✓ CTE (WITH ... AS)<br />
                ✓ CASE WHEN · CAST · ROUND
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
