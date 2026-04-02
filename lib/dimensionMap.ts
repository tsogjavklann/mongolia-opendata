export const ENGLISH_ALIASES: Record<string, string> = {
  'Он': 'Year', 'Жил': 'Year',
  'Сар': 'Month',
  'Улирал': 'Quarter',
  'Огноо': 'Date',
  'Хүйс': 'Gender',
  'Нас': 'Age',
  'Насны бүлэг': 'AgeGroup',
  'Аймаг': 'Province',
  'Аймаг, нийслэл': 'Region',
  'Бүс': 'Zone',
  'Бүс нутаг': 'Zone',
  'Дүүрэг': 'District',
  'Сум': 'Soum',
  'Салбар': 'Sector',
  'Үйл ажиллагааны төрөл': 'ActivityType',
  'Төрөл': 'Type',
  'Ангилал': 'Category',
  'Бүлэг': 'Group',
  'Байдал': 'Status',
  'Үзүүлэлт': 'Indicator',
  'Боловсрол': 'Education',
  'Боловсролын зэрэг': 'EducationLevel',
  'Мэргэжил': 'Profession',
  'Өмчийн хэлбэр': 'Ownership',
  'Валют': 'Currency',
  'Нэгж': 'Unit',
  'Нийт': 'Total',
  'Харьяалал': 'Affiliation',
  'Шалтгаан': 'Reason',
  'Эрхэлж буй ажил': 'Occupation',
};

export const DIMENSION_MAP: Record<string, string[]> = {};
Object.entries(ENGLISH_ALIASES).forEach(([mn, en]) => {
  if (!DIMENSION_MAP[en]) DIMENSION_MAP[en] = [];
  DIMENSION_MAP[en].push(mn);
});

export function resolveEnglishDimension(englishName: string, availableDims: string[]): string {
  if (availableDims.includes(englishName)) return englishName;
  const candidates = DIMENSION_MAP[englishName] ?? [];
  for (const c of candidates) {
    const match = availableDims.find(d => d.toLowerCase() === c.toLowerCase());
    if (match) return match;
  }
  const lower = englishName.toLowerCase();
  const partial = availableDims.find(d => d.toLowerCase().includes(lower) || lower.includes(d.toLowerCase()));
  return partial ?? englishName;
}

export function dimensionDisplayLabel(apiName: string): string {
  return ENGLISH_ALIASES[apiName] ? `${apiName} (${ENGLISH_ALIASES[apiName]})` : apiName;
}
