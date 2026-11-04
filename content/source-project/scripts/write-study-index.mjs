import fs from 'fs';
import path from 'path';

/** Write the generated material imports and topic lookup map. */
export function writeStudyIndex(rootDir, exportsMap) {
  const importLines = Object.keys(exportsMap)
    .map(code => `import { material as ${code} } from './study-materials/${code}';`)
    .join('\n');
  const recordLines = Object.keys(exportsMap).map(code => `  ${code},`).join('\n');
  const seedContent = `/**
 * seed-study-materials.ts — iPAS 智慧生產工程師（初級）核心教材聚合
 */

import type { StudyMaterial } from '@/core/types';

${importLines}

export const SEED_STUDY_MATERIALS: Record<string, StudyMaterial> = {
${recordLines}
};
`;

  fs.writeFileSync(path.resolve(rootDir, 'src/data/seed-study-materials.ts'), seedContent, 'utf-8');
  console.log('🎉 聚合檔案 src/data/seed-study-materials.ts 生成完成！');
}
