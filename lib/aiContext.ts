/**
 * Claude API-д өгөх context — алдартай хүснэгтүүд + dimension хөтөч.
 * Бүрэн 1282 хүснэгт оруулах боломжгүй (token зардал), тиймээс top 40 алдартай.
 */

export interface AICatalogEntry {
  alias: string;
  label: string;
  dims: string[]; // өргөн хэрэглэгддэг хэмжээсийн нэр
}

export const POPULAR_TABLES_FOR_AI: AICatalogEntry[] = [
  // ─── Хүн ам / нийгэм ───
  { alias: 'population',   label: 'Хүн амын тоо (хүйс, насны бүлэг, жил). Хүйс = "0" (Нийт) бол ШУУД нийт, "1"=Эрэгтэй, "2"=Эмэгтэй',     dims: ['Он', 'Хүйс', 'Насны бүлэг'] },

  // ─── ДНБ / Эдийн засаг ───
  { alias: 'gdp',          label: 'ДНБ салбараар. Нийт ДНБ хүсвэл WHERE "Эдийн засгийн үйл ажиллагааны салбарын ангилал" = \'Бүгд\' нэм',       dims: ['ОН', 'Эдийн засгийн үйл ажиллагааны салбарын ангилал'] },
  { alias: 'inflation',    label: 'Инфляци ХҮИ. ЗААВАЛ Үзүүлэлт-ийг нэгийг сонго: \'Инфляц, оны эцэст\' (стандарт) ЭСВЭЛ \'Инфляц, жилийн дундаж\'. Хоёуланг хэзээ ч нэг VALUE-аар бүү гарга.', dims: ['Он', 'Үзүүлэлт'] },
  { alias: 'unemployment', label: 'Ажилгүйдлийн түвшин (он, бүс, хүйс)',         dims: ['Он', 'Бүс', 'Хүйс'] },

  // ─── Хөдөө аж ахуй ───
  { alias: 'livestock',    label: 'Малын тоо толгой аймаг/жилээр',               dims: ['Он', 'Аймаг', 'Малын төрөл'] },

  // ─── Бэлэн биш alias-ууд (бүтэн зам ашиглана) ───
  // Эдгээрийг ашиглахдаа FROM "<бүтэн зам>" гэж бичнэ
  // Бүтэн зам: "Regional development/National accounts/DT_NSO_0500_011V1.px" гэх мэт
];

/** Бүтэн замаар хандах "хагас alias-тай" хүснэгтүүд — FROM "путь/таблица.px" хэлбэрээр */
export const FULL_PATH_TABLES = [
  {
    label: 'Аймгийн ДНБ (regional)',
    path: 'Regional development/National accounts/DT_NSO_0500_011V1.px',
    dims: ['Он', 'Бүс'],
    note: 'Аймаг тус бүрийн ДНБ-ний түвшин',
  },
  {
    label: 'Гадаад худалдаа (экспорт/импорт жилээр)',
    path: 'Economy, environment/Foreign Trade/DT_NSO_1400_001V1_year.px',
    dims: ['Он', 'Гадаад худалдааны үндсэн үзүүлэлт'],
    note: 'Экспорт vs Импорт тэнцэл тооцоход',
  },
  {
    label: 'Жуулчны тоо улсаар',
    path: 'Industry, service/Tourism/NUMBER OF INBOUND TOURISTS by country/DT_NSO_1800_003V202.px',
    dims: ['Сар', 'Улсын нэр'],
    note: 'Сар тутмын жуулчдын тоо улсаар',
  },
  {
    label: 'Цалин (мэргэжил, хүйсээр)',
    path: 'Labour, business/Wages/MONTHLY AVERAGE NOMINAL WAGES, by occupation and gender/DT_NSO_0400_025V1.px',
    dims: ['Он', 'Хүйс', 'Эрхэлж буй ажил'],
    note: 'Сарын дундаж нэрлэсэн цалин',
  },
  {
    label: 'Аймгийн хүн ам',
    path: 'Regional development/Population and household/DT_NSO_0300_002V4.px',
    dims: ['Он', 'Бүс'],
    note: 'Аймаг тус бүрийн хүн ам',
  },
  {
    label: 'Аймгийн хөрөнгө оруулалт',
    path: 'Regional development/National accounts/DT_NSO_0901_004V1.px',
    dims: ['Он', 'Бүс'],
    note: 'Аймаг бүрийн хөрөнгө оруулалт',
  },
];

/** Dimension-уудын монгол нэрс (PX-Web API-аас ирдэг жинхэнэ нэр) */
export const DIMENSION_GUIDE = `
ЧУХАЛ: Багана/dimension-ы НЭР нь МОНГОЛ-ААР байна. Англи нэр (Year, Zone, Gender) НЭГ Ч ХЭРЭГ БИШ.

Жинхэнэ багануудын нэрс:
- "Он" эсвэл "ОН" эсвэл "Жил" — жил утга нь '2024', '2023', ... (label-аар)
- "Хүйс" — хүйс — утга нь LABEL: 'Нийт дүн', 'Эрэгтэй', 'Эмэгтэй' (тоон '0'/'1'/'2' БУС)
- "Нас" эсвэл "Насны бүлэг" — утга нь label: 'Нийт дүн' (бүгдийн тоо), '0', '1'-'85+' (нас)
- "Аймаг", "Бүс", "Сум", "Дүүрэг" — label-аар: 'Улсын дүн', 'Архангай', 'Улаанбаатар' гэх мэт
- "Салбар", "Үзүүлэлт", "Бүлэг" — label-аар
- "Эдийн засгийн үйл ажиллагааны салбарын ангилал" (ДНБ-д) — 'Бүгд', 'Хөдөө аж ахуй' гэх мэт
- "Гадаад худалдааны үндсэн үзүүлэлт" — 'Экспорт', 'Импорт'
- "Улсын нэр" (жуулчдын) — 'БҮГД', 'Хятад' гэх мэт
- "VALUE" — тоон утгын багана (бүх хүснэгтэд)

# ЯЯ ЧУХАЛ: WHERE-д УТГЫГ LABEL-ээр шүүнэ, КОД БИШ
- Зөв: WHERE Хүйс = 'Нийт дүн'    (Монгол label)
- Буруу: WHERE Хүйс = '0'         (тоон код — DuckDB-д ажиллахгүй)
- Зөв: WHERE Нас = 'Нийт дүн'      (бүх насны нийт)
- Зөв: WHERE Бүс = 'Улсын дүн'    (улсын дүн, аймгийн биш)

SELECT, WHERE, GROUP BY, ORDER BY-д ЯГ энэ нэрс л ажиллана. Хашилтанд орвол: "Эдийн засгийн үйл ажиллагааны салбарын ангилал".
`.trim();

export const SQL_RULES = `
DuckDB SQL зөвхөн SELECT хэрэглэнэ. INSERT/UPDATE/DELETE/DROP хориотой.

# Хүснэгтийн нэр
FROM "population" — alias богино нэр (хашилт ХЭРЭГТЭЙ)
JOIN-д table alias: FROM "gdp" a JOIN "population" b ON a.Он = b.Он

# Багана
SELECT Он, Хүйс, VALUE — Монгол нэр шууд (хашилтгүй боломжтой бол)
SELECT "Эдийн засгийн үйл ажиллагааны салбарын ангилал" — урт нэрийг хашилтанд

# Жилийн хязгаар (ЗААВАЛ)
- ГАЦЛАЛ: WHERE Он BETWEEN '2015' AND '2024' — литерал тоо ашиглах
- ХОРИОТОЙ: strftime, CURRENT_DATE, NOW(), CAST — эдгээр нь WHERE-т API руу очдоггүй
- Жилийг ҮРГЭЛЖ STRING литерал: '2024' (тоо биш)

# Олон утгат хэмжээс (ЯЯЯ ЧУХАЛ)
Хэрэв хүснэгтэд Үзүүлэлт, Хүйс, Бүс, Бүлэг гэх мэт нэмэлт хэмжээс байгаа бол
ЗААВАЛ нэг утгыг сонгож шүүх. Үгүй бол өгөгдөл давхарлаж график буруу гарна.

Жишээ (БҮГД LABEL ашигла, КОД БИШ):
- inflation: WHERE Үзүүлэлт = 'Инфляц, оны эцэст'
- gdp нийт: WHERE "Эдийн засгийн үйл ажиллагааны салбарын ангилал" = 'Бүгд'
- population нийт: WHERE Хүйс = 'Нийт дүн' AND Нас = 'Нийт дүн'  (нийт хүн ам авахад НАСЫГ ч мөн шүүх)
- population хүйсээр: WHERE Хүйс IN ('Эрэгтэй','Эмэгтэй') AND Нас = 'Нийт дүн'
- regional: WHERE Бүс = 'Улсын дүн' эсвэл WHERE Бүс = 'Улаанбаатар' гэх мэт нэр

Хэрэглэгч "харьцуул" гэж хэлвэл л олон утгыг үлдээж GROUP BY эсвэл нэг асуултанд олон series харуулна.

# VALUE багана
NULL-аас сэргийлэх: NULLIF(b.VALUE, 0)
Тооцоонд: ROUND(a.VALUE / NULLIF(b.VALUE, 0) * 100, 2)

# LIMIT
Үргэлж LIMIT 500 нэмэх.
`.trim();

const EXAMPLE_QUERIES = `
# Жишээ зөв SQL-ууд

Хэрэглэгч: "Сүүлийн 10 жилийн инфляц"
SQL: SELECT Он, VALUE AS Инфляци FROM "inflation" WHERE Үзүүлэлт = 'Инфляц, оны эцэст' AND Он BETWEEN '2015' AND '2024' ORDER BY Он LIMIT 500;
(ЧУХАЛ: Үзүүлэлт-ийг шүүхгүй бол хоёр инфляцийн утга давхарлаж график буруу гарна)

Хэрэглэгч: "ДНБ салбараар 2024"
SQL: SELECT "Эдийн засгийн үйл ажиллагааны салбарын ангилал" AS Салбар, VALUE AS ДНБ FROM "gdp" WHERE ОН = '2024' AND "Эдийн засгийн үйл ажиллагааны салбарын ангилал" != 'Бүгд' ORDER BY VALUE DESC LIMIT 12;

Хэрэглэгч: "Эрэгтэй эмэгтэй хүн ам"
SQL: SELECT Он, Хүйс, VALUE FROM "population" WHERE Он BETWEEN '2015' AND '2024' AND Хүйс IN ('Эрэгтэй','Эмэгтэй') AND Нас = 'Нийт дүн' ORDER BY Он LIMIT 500;

Хэрэглэгч: "2015 оноос хойш Монголын хүн ам хэрхэн өөрчлөгдсөн бэ?"
SQL: SELECT Он, VALUE AS Хүн_ам FROM "population" WHERE Он BETWEEN '2015' AND '2025' AND Хүйс = 'Нийт дүн' AND Нас = 'Нийт дүн' ORDER BY Он LIMIT 500;
(Нас-ыг ч мөн 'Нийт дүн' гэж шүүхгүй бол 87 насны утга давхарлана)

Хэрэглэгч: "ДНБ өсөлт жил тутмаар"
SQL: SELECT ОН AS Жил, ROUND((VALUE - LAG(VALUE) OVER (ORDER BY ОН)) * 100.0 / NULLIF(LAG(VALUE) OVER (ORDER BY ОН), 0), 1) AS Өсөлт FROM "gdp" WHERE ОН BETWEEN '2010' AND '2024' AND "Эдийн засгийн үйл ажиллагааны салбарын ангилал" = 'Бүгд' ORDER BY ОН LIMIT 500;
`.trim();

export type AIFormat = 'sql' | 'table' | 'compare' | 'python';

export function buildFormatInstructions(format: AIFormat): string {
  if (format === 'compare') {
    return `# ХАРИУ ХЭЛБЭР — ХАРЬЦУУЛАЛТ
Хэрэглэгч хоёр зүйлийг харьцуулж асуусан. Хоёр SQL гарга. Зөвхөн JSON:
{
  "format": "compare",
  "leftLabel": "Зүүн талын шошго (жш: 2020 он)",
  "rightLabel": "Баруун талын шошго (жш: 2024 он)",
  "leftSql": "SELECT ... LIMIT 500;",
  "rightSql": "SELECT ... LIMIT 500;",
  "explanation": "Хоёр query юуг харьцуулж байгаа тухай 1-2 өгүүлбэр Монголоор"
}

Хоёр SQL ижил schema-тай байх ёстой (тэр чигт нь tabular харьцуулалт хийнэ).`;
  }
  if (format === 'python') {
    return `# ХАРИУ ХЭЛБЭР — PYTHON КОД (BROWSER PYODIDE)
Хэрэглэгчийн код browser дотор Pyodide-аар шууд ажиллана. df ХУВЬСАГЧ АЛЬ ХЭДИЙН бэлэн!

ЧУХАЛ ДҮРЭМ:
- requests, http, urllib бичих ХОРИОТОЙ — Pyodide-д ажиллахгүй
- df = pd.DataFrame(...) гэж дахин үүсгэх ХЭРЭГГҮЙ — df бэлэн байгаа
- "sql" талбараа SQL бич — sistem түүгээр df-ийг автоматаар бэлдэнэ
- "python" талбарт зөвхөн analysis код — pd, plt, np, sklearn, np-уудыг ашиглана

Зөвхөн JSON буцаа:
{
  "format": "python",
  "sql": "SELECT ... LIMIT 500;",
  "python": "<df-ийг ашигласан analysis/график код>",
  "explanation": "Энэ код юу хийдэг тухай 2-3 өгүүлбэр Монголоор"
}

# Жишээ 1 — Энгийн график (df бэлэн)
import matplotlib.pyplot as plt
df['Он'] = df['Он'].astype(int)
df.plot(x='Он', y='Инфляц', kind='line', figsize=(10,5), marker='o', color='#00d68f')
plt.title('Монголын инфляц')
plt.grid(alpha=0.3); plt.tight_layout(); plt.show()
print('Дундаж:', df['Инфляц'].mean())

# Жишээ 2 — Прогноз (sklearn) — sklearn нь Pyodide-д бэлэн
import numpy as np, matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
df['Он'] = df['Он'].astype(int)
X = df[['Он']].values; y = df['Хүн_ам'].values
model = LinearRegression().fit(X, y)
future = np.arange(2026, 2031).reshape(-1, 1)
preds = model.predict(future)
plt.figure(figsize=(10,5))
plt.plot(df['Он'], y, 'o-', label='Бодит', color='#00d68f')
plt.plot(future.flatten(), preds, 's--', color='#a78bfa', label='Прогноз 2026-2030')
plt.legend(); plt.title('Хүн амын прогноз'); plt.grid(alpha=0.3); plt.show()
print(f'2030 оны прогноз: {int(preds[-1]):,} хүн')

# Жишээ 3 — KMeans кластер
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
df['Хүн_ам'] = pd.to_numeric(df['Хүн_ам'], errors='coerce')
df = df.dropna(subset=['Хүн_ам'])
X = StandardScaler().fit_transform(df[['Хүн_ам']])
df['cluster'] = KMeans(n_clusters=3, n_init=10, random_state=42).fit_predict(X)
for c in sorted(df['cluster'].unique()):
    sub = df[df['cluster']==c]
    plt.scatter(range(len(sub)), sub['Хүн_ам'], label=f'Кластер {c}', s=80)
plt.legend(); plt.title('Аймгуудын кластер'); plt.show()
print(df.groupby('cluster')['Бүс'].apply(list))

# Жишээ 4 — Корреляц (хоёрдугаар датасет хэрэгтэй бол)
# Хоёр өгөгдлөөр ажиллах бол одоохондоо нэг л SQL-аар татна
# Олон багана агуулсан df дотор corr() ажилладаг:
df_num = df.select_dtypes(include='number')
print(df_num.corr())
import matplotlib.pyplot as plt
plt.imshow(df_num.corr(), cmap='coolwarm', vmin=-1, vmax=1)
plt.colorbar(); plt.xticks(range(len(df_num.columns)), df_num.columns, rotation=45)
plt.yticks(range(len(df_num.columns)), df_num.columns)
plt.title('Корреляцийн матриц'); plt.tight_layout(); plt.show()

ЧУХАЛ:
- df БЭЛЭН — кодоо шууд df-аас эхэл
- requests/fetch/http ХОРИОТОЙ — Pyodide internet-руу хязгаарлагдмал
- pd, np, plt, sklearn module-ууд import хийх боломжтой
- Cyrillic багана нэр (df['Он'], df['Хүн_ам']) шууд ашиглана
- df['Он'].astype(int) — string year-ыг тоо болгох
- plt.show() — графикыг харуулна (Pyodide PNG болгоно)`;
  }
  if (format === 'table') {
    return `# ХАРИУ ХЭЛБЭР — ХҮСНЭГТ
Хэрэглэгч хүснэгт хэлбэрээр харахыг хүссэн. SQL гаргаад tabular эмхтгэлтэй болго.
Багана нэрсийг тодорхой бичиж, ORDER BY-аар эрэмбэлэх. График тулгах биш — хатуу tabular.

Зөвхөн JSON:
{
  "format": "table",
  "sql": "SELECT ... LIMIT 500;",
  "explanation": "Энэ хүснэгт юуг харуулах тухай 1-2 өгүүлбэр Монголоор",
  "columns": ["Багана 1", "Багана 2"]
}`;
  }
  // default sql
  return `# ХАРИУ ХЭЛБЭР — SQL
Зөвхөн JSON буцаа:
{
  "format": "sql",
  "sql": "SELECT Он, VALUE FROM \\"alias\\" WHERE Он BETWEEN '2015' AND '2024' LIMIT 500;",
  "explanation": "Энэ query юу хийдэг тухай 1-2 өгүүлбэрээр Монголоор",
  "chartHint": "line | bar | pie | area"
}`;
}

export function buildAISystemPrompt(format: AIFormat = 'sql'): string {
  const aliasTables = POPULAR_TABLES_FOR_AI
    .map(t => `- "${t.alias}" — ${t.label} (хэмжээс: ${t.dims.join(', ')})`)
    .join('\n');

  const fullPathTables = FULL_PATH_TABLES
    .map(t => `- "${t.path}" — ${t.label} (хэмжээс: ${t.dims.join(', ')}). ${t.note}`)
    .join('\n');

  const now = new Date();
  const currentYear = now.getFullYear();

  return `Чи Монголын статистикийн өгөгдөл (1212.mn) дээр SQL бичдэг туслах. Хэрэглэгчийн асуултыг DuckDB SQL болгон хөрвүүл.

# Одоогийн он
${currentYear}. "сүүлийн N жил" гэсэн асуулт ирвэл BETWEEN '${currentYear - 10}' AND '${currentYear - 1}' гэх мэт хэрэглэ. Тоог ШУУД литералаар бич, CURRENT_DATE/strftime/CAST хэрэглэх ХЭРЭГГҮЙ.

# Боломжтой хүснэгтүүд (alias-аар хандана — богино нэр)
${aliasTables}

# Бусад хүснэгтүүд (бүтэн замаар хандана)
${fullPathTables}

# Dimension нэр
${DIMENSION_GUIDE}

# Дүрэм
${SQL_RULES}

${EXAMPLE_QUERIES}

${buildFormatInstructions(format)}

Хэрэв асуулт ойлгомжгүй бол: {"error": "Тодруулах асуулт Монголоор"}
`;
}
