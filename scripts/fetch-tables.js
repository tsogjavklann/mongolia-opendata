/**
 * 1212.mn-ийн бүх хүснэгтийн жагсаалтыг татаж
 * public/tables.json болгон хадгалах скрипт
 * Ажиллуулах: node scripts/fetch-tables.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://data.1212.mn:443/api/v1/mn/NSO';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function buildUrl(p) {
  const parts = p.split('/').map(s => encodeURIComponent(s));
  return BASE + '/' + parts.join('/');
}

async function fetchLevel(p, depth) {
  const url = buildUrl(p);
  const items = await get(url);
  if (!Array.isArray(items)) return [];

  const results = [];
  for (const item of items) {
    const fullPath = p + '/' + item.id;
    if (item.type === 'l') {
      process.stdout.write('  '.repeat(depth) + '📁 ' + item.text + '\n');
      await sleep(400);
      const children = await fetchLevel(fullPath, depth + 1);
      results.push(...children);
    } else if (item.type === 't') {
      process.stdout.write('  '.repeat(depth) + '📊 ' + item.text + '\n');
      results.push({
        id: item.id,
        path: fullPath,
        text: item.text,
      });
    }
  }
  return results;
}

async function main() {
  console.log('1212.mn хүснэгтийн жагсаалт татаж байна...\n');

  const categories = await get(BASE);
  if (!Array.isArray(categories) || categories.length === 0) {
    console.error('Категори татаж чадсангүй. Интернет холболт шалгана уу.');
    process.exit(1);
  }

  const allTables = [];

  for (const cat of categories) {
    console.log('\n🗂️  ' + cat.text);
    await sleep(400);
    const tables = await fetchLevel(cat.id, 1);
    tables.forEach(t => t.category = cat.text);
    allTables.push(...tables);
  }

  console.log('\n✅ Нийт ' + allTables.length + ' хүснэгт олдлоо');

  const outFile = path.join(__dirname, '..', 'public', 'tables.json');
  fs.writeFileSync(outFile, JSON.stringify(allTables, null, 2), 'utf8');
  console.log('📄 Хадгалагдлаа: public/tables.json');
  console.log('Дараа нь npm run dev ажиллуулна уу.');
}

main().catch(console.error);
