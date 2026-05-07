'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Plus, Trash2, X } from 'lucide-react';
import {
  listSavedQueries,
  saveQuery,
  deleteQuery,
  type SavedQuery,
} from '@/lib/savedQueries';

interface Props {
  currentSql: string;
  onLoad: (sql: string) => void;
}

export default function SavedQueriesPanel({ currentSql, onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedQuery[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setItems(listSavedQueries());
  }, [open]);

  const refresh = () => setItems(listSavedQueries());

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || !currentSql.trim()) return;
    saveQuery(trimmed, currentSql);
    setName('');
    setShowSave(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Хадгалсан query-г устгах уу?')) return;
    deleteQuery(id);
    refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost"
        title="Хадгалсан SQL query-ууд"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Bookmark size={12} /> Хадгалсан
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
              maxWidth: 640, width: '100%',
              maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1a2d4a',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bookmark size={16} color="#22c55e" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
                  Хадгалсан SQL query
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>({items.length})</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 0, color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Save form */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a2d4a' }}>
              {showSave ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSave(false); }}
                    placeholder="Query-ийн нэр (жш: ДНБ 2020-2024)"
                    style={{
                      flex: 1,
                      background: '#060c18', color: '#e2e8f0',
                      border: '1px solid #1a3050', borderRadius: 8,
                      padding: '8px 12px', fontSize: 13, outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSave}
                    disabled={!name.trim() || !currentSql.trim()}
                    style={{
                      background: '#22c55e', color: '#06120a',
                      padding: '8px 14px', border: 0, borderRadius: 8,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      opacity: (!name.trim() || !currentSql.trim()) ? 0.5 : 1,
                    }}
                  >
                    Хадгалах
                  </button>
                  <button
                    onClick={() => { setShowSave(false); setName(''); }}
                    style={{
                      background: 'transparent', color: '#94a3b8',
                      padding: '8px 12px', border: '1px solid #1a3050', borderRadius: 8,
                      fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Болих
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSave(true)}
                  disabled={!currentSql.trim()}
                  style={{
                    background: 'transparent', color: '#22c55e',
                    border: '1px dashed #22c55e', borderRadius: 8,
                    padding: '8px 14px', fontSize: 13, fontWeight: 600,
                    cursor: currentSql.trim() ? 'pointer' : 'not-allowed',
                    opacity: currentSql.trim() ? 1 : 0.4,
                    display: 'flex', alignItems: 'center', gap: 6,
                    width: '100%', justifyContent: 'center',
                  }}
                >
                  <Plus size={14} /> Одоогийн SQL-ийг хадгалах
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {items.length === 0 ? (
                <div style={{
                  padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13,
                }}>
                  Хадгалсан query байхгүй байна.<br />
                  SQL бичээд дээрх товчоор хадгалаарай.
                </div>
              ) : (
                items.map(q => (
                  <div
                    key={q.id}
                    style={{
                      padding: '10px 20px',
                      borderBottom: '1px solid rgba(26,45,74,0.3)',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      cursor: 'pointer',
                    }}
                    onClick={() => { onLoad(q.sql); setOpen(false); }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                        marginBottom: 4,
                      }}>{q.name}</div>
                      <div style={{
                        fontSize: 11, color: '#64748b',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{q.sql.slice(0, 100)}{q.sql.length > 100 ? '...' : ''}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                        {new Date(q.updatedAt).toLocaleString('mn-MN')}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(q.id); }}
                      title="Устгах"
                      style={{
                        background: 'none', border: 0, color: '#475569',
                        cursor: 'pointer', padding: 4, borderRadius: 4,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
