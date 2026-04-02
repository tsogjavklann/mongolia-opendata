/**
 * PX-Web json-stat2 форматыг flat rows болгон хөрвүүлэх
 * https://json-stat.org/format/
 */

export interface DataRow {
  [key: string]: string | number;
}

export interface ChartPoint {
  period: string;
  [series: string]: string | number;
}

/**
 * json-stat2 хариуг flat DataRow[] болгон хөрвүүлэх
 * 
 * json-stat2 бүтэц:
 * {
 *   "dimension": { "Он": { "category": { "index": {"2021":0,"2022":1}, "label": {"2021":"2021",...} } }, ... },
 *   "value": [100, 200, ...],
 *   "id": ["Он", "Хүйс", "Нас", ...],
 *   "size": [4, 3, 2, ...]  // dimension бүрийн утгын тоо
 * }
 */
export function normalizeResponse(raw: unknown): DataRow[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;

  // json-stat2 формат шалгах
  if (r['version'] && r['class'] === 'dataset' && r['value']) {
    return parseJsonStat2(r);
  }

  // Хуучин DataList формат (fallback)
  if (Array.isArray(r['DataList'])) {
    return (r['DataList'] as Record<string, unknown>[]).map(row => {
      const out: DataRow = {};
      for (const [k, v] of Object.entries(row)) {
        if (typeof v === 'number') out[k] = v;
        else if (typeof v === 'string') {
          const n = parseFloat(v);
          out[k] = isNaN(n) ? v : n;
        } else out[k] = String(v ?? '');
      }
      return out;
    });
  }

  return [];
}

function parseJsonStat2(r: Record<string, unknown>): DataRow[] {
  try {
    const ids = r['id'] as string[];
    const sizes = r['size'] as number[];
    const values = r['value'] as (number | null)[];
    const dimension = r['dimension'] as Record<string, unknown>;

    if (!ids || !sizes || !values || !dimension) return [];

    // Dimension бүрийн индексийг label болгон хөрвүүлэх
    const dimLabels: string[][] = ids.map(id => {
      const dim = dimension[id] as Record<string, unknown>;
      const cat = dim?.['category'] as Record<string, unknown>;
      const index = cat?.['index'] as Record<string, number> | undefined;
      const label = cat?.['label'] as Record<string, string> | undefined;
      if (!index && !label) return [];
      // index нь {"2021":0,"2022":1,...} хэлбэртэй
      if (index) {
        const sorted = Object.entries(index).sort((a, b) => a[1] - b[1]);
        return sorted.map(([key]) => label?.[key] ?? key);
      }
      return Object.values(label ?? {});
    });

    const dimCodes: string[][] = ids.map(id => {
      const dim = dimension[id] as Record<string, unknown>;
      const cat = dim?.['category'] as Record<string, unknown>;
      const index = cat?.['index'] as Record<string, number> | undefined;
      const label = cat?.['label'] as Record<string, string> | undefined;
      if (index) {
        return Object.entries(index).sort((a, b) => a[1] - b[1]).map(([key]) => key);
      }
      return Object.keys(label ?? {});
    });

    const rows: DataRow[] = [];
    const total = values.length;

    for (let i = 0; i < total; i++) {
      const val = values[i];
      if (val === null || val === undefined) continue;

      // i → multi-dimensional index
      const row: DataRow = {};
      let rem = i;
      for (let d = ids.length - 1; d >= 0; d--) {
        const idx = rem % sizes[d];
        rem = Math.floor(rem / sizes[d]);
        row[ids[d]] = dimLabels[d][idx] ?? dimCodes[d][idx] ?? String(idx);
        // code талбар нэм
        row[`${ids[d]}_CODE`] = dimCodes[d][idx] ?? String(idx);
      }
      row['VALUE'] = typeof val === 'number' ? val : parseFloat(String(val));

      // Period талбар — "Он" эсвэл "Огноо" dimension-оос авна
      const periodDim = ids.find(id => id === 'Он' || id === 'Огноо' || id === 'Year' || id === 'Period');
      if (periodDim) {
        row['Period'] = row[periodDim];
      } else {
        row['Period'] = String(i);
      }

      rows.push(row);
    }

    return rows;
  } catch (e) {
    console.error('parseJsonStat2 error:', e);
    return [];
  }
}

/**
 * Recharts-д зориулсан chart data үүсгэх
 *
 * Олон dimension логик (Он + Аймаг + Хүйс гэх мэт):
 * - 0 extra dim  → нэг "Нийт" series
 * - 1 extra dim  → тэр dimension series болно
 * - 2+ extra dim → combo ≤12 бол "DimA · DimB" хослол series (мэдээлэл алдагдахгүй)
 *                  combo >12 бол хамгийн бага unique ≤12 dimension-г series болго,
 *                  бусдыг aggregate хийнэ
 *
 * Period: "Он" / "Огноо" / "Year" / "Period" column-аас авна, тоогоор sort
 * Series: нийт дүнгээр эрэмбэлж top-12 харуулна
 */
export function toChartData(rows: DataRow[]): { points: ChartPoint[]; series: string[] } {
  if (rows.length === 0) return { points: [], series: [] };

  const PERIOD_KEYS = new Set(['Period', 'Он', 'Огноо', 'Year']);
  const SKIP_KEYS   = new Set(['VALUE', 'Period', 'Он', 'Огноо', 'Year']);

  // Extra dimension column-ууд (Period, VALUE, _CODE хасна)
  const dimKeys = Object.keys(rows[0]).filter(
    k => !SKIP_KEYS.has(k) && !k.endsWith('_CODE')
  );

  // Series нэр үүсгэх функц
  let getSeriesName: (row: DataRow) => string;

  if (dimKeys.length === 0) {
    getSeriesName = () => 'Нийт';
  } else if (dimKeys.length === 1) {
    const k = dimKeys[0];
    getSeriesName = (row) => String(row[k] ?? 'Нийт');
  } else {
    // 2+ dimension: combo хэдэн unique вэ?
    const uniqueComboCount = new Set(
      rows.map(r => dimKeys.map(k => String(r[k] ?? '')).join('·'))
    ).size;

    if (uniqueComboCount <= 12) {
      // Combo багахан → "Аймаг · Хүйс" хэлбэрийн бүрэн series, мэдээлэл алдагдахгүй
      getSeriesName = (row) => dimKeys.map(k => String(row[k] ?? '')).join(' · ');
    } else {
      // Combo хэт олон → хамгийн цөөн unique (≤12) dimension-г series болго
      // Жишээ: Хүйс(3) < Аймаг(21) → Хүйс series, Аймаг aggregate
      const uniqueCounts = dimKeys.map(k => ({
        key: k,
        count: new Set(rows.map(r => String(r[k] ?? ''))).size,
      }));
      const best =
        uniqueCounts.filter(x => x.count <= 12).sort((a, b) => a.count - b.count)[0]
        ?? uniqueCounts.sort((a, b) => a.count - b.count)[0];
      const k = best.key;
      getSeriesName = (row) => String(row[k] ?? 'Нийт');
    }
  }

  const byPeriod = new Map<string, ChartPoint>();
  const seriesSet = new Set<string>();

  for (const row of rows) {
    const period = String(row['Period'] ?? '');
    if (!period) continue;

    const val = typeof row['VALUE'] === 'number'
      ? row['VALUE']
      : parseFloat(String(row['VALUE'] ?? '0')) || 0;
    if (isNaN(val)) continue;

    const seriesName = getSeriesName(row);
    if (!byPeriod.has(period)) byPeriod.set(period, { period });
    const pt = byPeriod.get(period)!;
    pt[seriesName] = ((pt[seriesName] as number) || 0) + val;
    seriesSet.add(seriesName);
  }

  // Period-ийг тоон жилээр эрэмбэлэх
  const points = Array.from(byPeriod.values()).sort((a, b) => {
    const aNum = parseFloat(String(a.period));
    const bNum = parseFloat(String(b.period));
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return String(a.period).localeCompare(String(b.period));
  });

  // Series-ийг нийт дүнгээр эрэмбэлж top-12 авна
  const series = Array.from(seriesSet)
    .map(s => ({
      name: s,
      total: points.reduce((sum, p) => sum + ((p[s] as number) || 0), 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
    .map(s => s.name);

  return { points, series };
}


// ── Smart Chart Engine ────────────────────────────────────────────────────────

export type ColType = 'period' | 'numeric' | 'categorical' | 'code';

export interface ColInfo {
  name: string;
  type: ColType;
  uniqueCount: number;
  sample: (string | number)[];
  isNumeric: boolean;
}

export interface ChartSuggestion {
  chartType: 'line' | 'bar' | 'multiLine' | 'stackedBar' | 'scatter' | 'pie';
  xKey: string;
  yKey: string;
  seriesKey?: string;
  multiYKeys?: string[];  // олон тоон багана харуулах
  title: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

const PERIOD_NAMES = new Set(['он', 'year', 'period', 'огноо', 'date', 'сар', 'month', 'улирал', 'quarter']);
const CODE_SUFFIX  = '_code';
const SKIP_COLS    = new Set(['value', 'period']);

/** Багана бүрийн төрлийг тодорхойлох */
export function detectColumns(rows: DataRow[]): ColInfo[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.map(name => {
    const lname = name.toLowerCase();
    const vals   = rows.map(r => r[name]).filter(v => v !== null && v !== undefined && v !== '');
    const sample = vals.slice(0, 5);

    // Code багана (жш: Он_CODE, Хүйс_CODE)
    if (lname.endsWith(CODE_SUFFIX)) {
      return { name, type: 'code', uniqueCount: 0, sample, isNumeric: false };
    }

    // Period багана (он, огноо, year, period г.м.)
    if (PERIOD_NAMES.has(lname) || lname === 'period') {
      return { name, type: 'period', uniqueCount: new Set(vals).size, sample, isNumeric: false };
    }

    // Тоон эсэхийг шалгах
    const numericCount = vals.filter(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(parseFloat(v)) && v.trim() !== '')).length;
    const isNumeric = numericCount / vals.length > 0.85;

    if (isNumeric) {
      return { name, type: 'numeric', uniqueCount: new Set(vals).size, sample, isNumeric: true };
    }

    return {
      name,
      type: 'categorical',
      uniqueCount: new Set(vals.map(String)).size,
      sample,
      isNumeric: false,
    };
  });
}

/** Rule-based chart санал болгох */
export function suggestChart(rows: DataRow[], cols: ColInfo[]): ChartSuggestion {
  const periods      = cols.filter(c => c.type === 'period');
  const numerics     = cols.filter(c => c.type === 'numeric');
  const categoricals = cols.filter(c => c.type === 'categorical');

  const periodCol  = periods[0];
  // VALUE биш бусад тоон баганууд (хүн_ам, ажилгүйдэл_хувь гэх мэт)
  const valueCol   = numerics.find(c => c.name.toUpperCase() === 'VALUE');
  const numericCol = valueCol ?? numerics[0];
  const catCol     = categoricals.filter(c => c.uniqueCount >= 2 && c.uniqueCount <= 20)[0];

  // Rule 0: Period + олон тоон багана → multi-series line (хамгийн тэргүүлэх)
  if (periodCol && numerics.length >= 2) {
    // Scale-г шалгах: max утгуудын харьцаа 100-аас их бол normalize санал болгох
    const maxVals = numerics.map(n => {
      const vals = rows.map(r => {
        const v = r[n.name];
        return typeof v === 'number' ? v : parseFloat(String(v ?? '0')) || 0;
      });
      return Math.max(...vals);
    });
    const scaleRatio = maxVals.length >= 2 ? Math.max(...maxVals) / (Math.min(...maxVals.filter(v => v > 0)) || 1) : 1;
    const needsNormalize = scaleRatio > 50;

    return {
      chartType: 'multiLine',
      xKey: periodCol.name,
      yKey: numerics[0].name,
      seriesKey: undefined,
      multiYKeys: numerics.map(n => n.name),
      title: numerics.map(n => n.name).join(' · ') + ' — цаг хугацаагаар',
      reason: needsNormalize
        ? `${numerics.length} багана (scale их зөрүүтэй — тусдаа Y тэнхлэг ашиглавал илүү)`
        : `${numerics.length} тоон багана + цаг → олон шугам`,
      confidence: 'high',
    };
  }

  // Rule 1: Period + Numeric (+ optional series) → Line chart
  if (periodCol && numericCol) {
    if (catCol && catCol.uniqueCount <= 12) {
      return {
        chartType: 'multiLine',
        xKey: periodCol.name,
        yKey: numericCol.name,
        seriesKey: catCol.name,
        title: `${numericCol.name} — ${catCol.name}-аар`,
        reason: `Цаг хугацааны өөрчлөлт, ${catCol.name}-аар ялгасан`,
        confidence: 'high',
      };
    }
    return {
      chartType: 'line',
      xKey: periodCol.name,
      yKey: numericCol.name,
      title: `${numericCol.name} цаг хугацаагаар`,
      reason: 'Он/цаг + тоон утга → шугаман график',
      confidence: 'high',
    };
  }

  // Rule 2: Categorical + Numeric → Bar chart
  if (catCol && numericCol) {
    const uniqueCats = catCol.uniqueCount;
    return {
      chartType: 'bar',
      xKey: catCol.name,
      yKey: numericCol.name,
      title: `${numericCol.name} — ${catCol.name}-аар`,
      reason: `Категори (${uniqueCats} утга) + тоон утга → багана`,
      confidence: 'high',
    };
  }

  // Rule 3: Зөвхөн тоон баганууд → bar
  if (numerics.length >= 2) {
    return {
      chartType: 'bar',
      xKey: numerics[0].name,
      yKey: numerics[1].name,
      multiYKeys: numerics.map(n => n.name),
      title: numerics.map(n => n.name).join(' vs '),
      reason: 'Хоёр тоон багана → харьцуулалт',
      confidence: 'medium',
    };
  }

  // Fallback
  return {
    chartType: 'bar',
    xKey: cols[0]?.name ?? 'x',
    yKey: numericCol?.name ?? cols[1]?.name ?? 'y',
    title: 'Мэдээлэл',
    reason: 'Анхдагч харагдац',
    confidence: 'low',
  };
}

/** Recharts-д зориулж smart chart data бэлтгэх */
export function buildSmartChartData(
  rows: DataRow[],
  suggestion: ChartSuggestion
): { points: ChartPoint[]; series: string[] } {
  const { xKey, yKey, seriesKey, multiYKeys } = suggestion;

  // Олон тоон багана → period-г x болгон, багана бүрийг series болгон харуулах
  if (multiYKeys && multiYKeys.length >= 2 && !seriesKey) {
    const byX = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const x = String(row[xKey] ?? '');
      if (!byX.has(x)) byX.set(x, {});
      const pt = byX.get(x)!;
      for (const yk of multiYKeys) {
        const v = typeof row[yk] === 'number' ? row[yk] as number : parseFloat(String(row[yk] ?? '0')) || 0;
        pt[yk] = (pt[yk] ?? 0) + v;
      }
    }
    const xVals = Array.from(byX.keys());
    const allNumeric = xVals.every(x => !isNaN(parseFloat(x)));
    const sorted = allNumeric
      ? xVals.sort((a, b) => parseFloat(a) - parseFloat(b))
      : xVals;
    const points: ChartPoint[] = sorted.map(x => ({ period: x, ...byX.get(x)! }));
    return { points, series: multiYKeys };
  }

  if (!seriesKey) {
    // Энгийн x → y
    const byX = new Map<string, number>();
    for (const row of rows) {
      const x = String(row[xKey] ?? '');
      const y = typeof row[yKey] === 'number' ? row[yKey] as number : parseFloat(String(row[yKey] ?? '0')) || 0;
      byX.set(x, (byX.get(x) ?? 0) + y);
    }

    // Period бол тоогоор эрэмбэлэх, үгүй бол утгаар буурах
    let points: ChartPoint[];
    const xVals = Array.from(byX.keys());
    const allNumeric = xVals.every(x => !isNaN(parseFloat(x)));

    if (allNumeric) {
      points = xVals
        .sort((a, b) => parseFloat(a) - parseFloat(b))
        .map(x => ({ period: x, [yKey]: byX.get(x)! }));
    } else {
      points = xVals
        .sort((a, b) => (byX.get(b)! - byX.get(a)!))
        .slice(0, 30)
        .map(x => ({ period: x, [yKey]: byX.get(x)! }));
    }
    return { points, series: [yKey] };
  }

  // Series-тэй (multi-line / grouped bar)
  const byXSeries = new Map<string, Map<string, number>>();
  const seriesSet = new Set<string>();

  for (const row of rows) {
    const x = String(row[xKey] ?? '');
    const s = String(row[seriesKey] ?? 'Бусад');
    const y = typeof row[yKey] === 'number' ? row[yKey] as number : parseFloat(String(row[yKey] ?? '0')) || 0;
    if (!byXSeries.has(x)) byXSeries.set(x, new Map());
    const sm = byXSeries.get(x)!;
    sm.set(s, (sm.get(s) ?? 0) + y);
    seriesSet.add(s);
  }

  const xVals = Array.from(byXSeries.keys());
  const allNumeric = xVals.every(x => !isNaN(parseFloat(x)));
  const sortedX = allNumeric
    ? xVals.sort((a, b) => parseFloat(a) - parseFloat(b))
    : xVals;

  const points: ChartPoint[] = sortedX.map(x => {
    const pt: ChartPoint = { period: x };
    const sm = byXSeries.get(x)!;
    for (const [s, v] of sm) pt[s] = v;
    return pt;
  });

  // Series-ийг нийт дүнгээр эрэмбэлж top 12
  const series = Array.from(seriesSet)
    .map(s => ({ name: s, total: points.reduce((sum, p) => sum + ((p[s] as number) || 0), 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
    .map(s => s.name);

  return { points, series };
}

/** CSV экспорт */
export function toCSV(rows: DataRow[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h];
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val ?? '');
      }).join(',')
    ),
  ];
  return '\uFEFF' + lines.join('\n');
}
