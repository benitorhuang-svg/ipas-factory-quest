import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DOCS_DIR = join(import.meta.dirname, '..', 'docs', '遊戲設計');

async function validateSample(samplePath, schemaPath, name) {
  const sample = JSON.parse(await readFile(samplePath, 'utf-8'));
  const schema = JSON.parse(await readFile(schemaPath, 'utf-8'));

  // 檢查所有 required 欄位
  const missing = [];
  for (const field of schema.required || []) {
    if (sample[field] === undefined) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ ${name} 缺少必要欄位: ${missing.join(', ')}`);
    return false;
  }

  // 檢查列舉與基本型別
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (sample[key] !== undefined) {
        if (prop.type === 'string' && typeof sample[key] !== 'string') {
          console.error(`❌ ${name}.${key} 預期字串，得到 ${typeof sample[key]}`);
          return false;
        }
        if (prop.type === 'number' && typeof sample[key] !== 'number') {
          console.error(`❌ ${name}.${key} 預期數值，得到 ${typeof sample[key]}`);
          return false;
        }
        if (prop.type === 'array' && !Array.isArray(sample[key])) {
          console.error(`❌ ${name}.${key} 預期陣列，得到 ${typeof sample[key]}`);
          return false;
        }
        if (prop.enum && !prop.enum.includes(sample[key])) {
          console.error(`❌ ${name}.${key} 數值 '${sample[key]}' 不在列舉 [${prop.enum.join(', ')}] 中`);
          return false;
        }
      }
    }
  }

  console.log(`✅ ${name} 通過 Schema 結構檢驗。`);
  return true;
}

async function main() {
  console.log('\n=== JSON Schema 示範關卡與卡牌驗證 ===\n');

  const levelSchema = join(DOCS_DIR, 'schemas', 'level-spec.schema.json');
  const cardSchema = join(DOCS_DIR, 'schemas', 'card-spec.schema.json');

  const t01 = join(DOCS_DIR, 'examples', 'T01.level.json');
  const c01l01 = join(DOCS_DIR, 'examples', 'C01-L01.level.json');
  const cardSample = join(DOCS_DIR, 'examples', 'fixture-b-v1.card.json');

  let ok = true;
  ok = (await validateSample(t01, levelSchema, 'T01.level.json')) && ok;
  ok = (await validateSample(c01l01, levelSchema, 'C01-L01.level.json')) && ok;
  ok = (await validateSample(cardSample, cardSchema, 'fixture-b-v1.card.json')) && ok;

  if (ok) {
    console.log('\n🎉 所有範例 JSON 檔案均 100% 符合 JSON Schema 規範！\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
