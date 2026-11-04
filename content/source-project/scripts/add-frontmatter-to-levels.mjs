import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const LEVELS_DIR = join(import.meta.dirname, '..', 'docs', '遊戲設計', '關卡');

const chapterMeta = {
  'C01_生產管理.md': {
    chapterId: 'C01',
    topicCode: 'M11101',
    subject: '科目一_生產與作業管理基礎',
    title: '生產管理：把訂單變成可執行承諾',
    primaryCardFamilies: ['F01', 'F02'],
    formulaRefs: ['F02'],
    misconceptionRefs: ['E10'],
  },
  'C02_製造流程.md': {
    chapterId: 'C02',
    topicCode: 'M11102',
    subject: '科目一_生產與作業管理基礎',
    title: '製造流程：讓資料與現場使用同一版本',
    primaryCardFamilies: ['F02', 'F03'],
    formulaRefs: [],
    misconceptionRefs: ['E08'],
  },
  'C03_物料管理.md': {
    chapterId: 'C03',
    topicCode: 'M11103',
    subject: '科目一_生產與作業管理基礎',
    title: '物料管理：讓正確物料在正確時點到位',
    primaryCardFamilies: ['F03'],
    formulaRefs: ['F03', 'F04'],
    misconceptionRefs: ['E01', 'E08'],
  },
  'C04_工業工程.md': {
    chapterId: 'C04',
    topicCode: 'M11201',
    subject: '科目一_生產與作業管理基礎',
    title: '工業工程：找到現場的時間真相',
    primaryCardFamilies: ['F04', 'F05'],
    formulaRefs: ['F01', 'F02'],
    misconceptionRefs: ['E09'],
  },
  'C05_品質管理.md': {
    chapterId: 'C05',
    topicCode: 'M11202',
    subject: '科目一_生產與作業管理基礎',
    title: '品質管理：數字會說話但別聽錯',
    primaryCardFamilies: ['F06', 'F07'],
    formulaRefs: ['F07'],
    misconceptionRefs: ['E03', 'E07'],
  },
  'C06_精實與設備績效.md': {
    chapterId: 'C06',
    topicCode: 'M11203',
    subject: '科目一_生產與作業管理基礎',
    title: '精實與設備績效：停止浪費才是真改善',
    primaryCardFamilies: ['F08', 'F09'],
    formulaRefs: ['F05', 'F06'],
    misconceptionRefs: ['E01', 'E02'],
  },
  'C07_智慧製造架構.md': {
    chapterId: 'C07',
    topicCode: 'M12101',
    subject: '科目二_智慧製造生產線管理基礎',
    title: '智慧製造架構：讓資料形成營運決策',
    primaryCardFamilies: ['F10'],
    formulaRefs: [],
    misconceptionRefs: ['E05'],
  },
  'C08_IIoT與通訊.md': {
    chapterId: 'C08',
    topicCode: 'M12102',
    subject: '科目二_智慧製造生產線管理基礎',
    title: 'IIoT 與通訊：把訊號變成可信資料',
    primaryCardFamilies: ['F11', 'F12'],
    formulaRefs: [],
    misconceptionRefs: ['E04'],
  },
  'C09_AI與機器視覺.md': {
    chapterId: 'C09',
    topicCode: 'M12103',
    subject: '科目二_智慧製造生產線管理基礎',
    title: 'AI 與機器視覺：讓模型結果經得起現場判讀',
    primaryCardFamilies: ['F13'],
    formulaRefs: ['F06', 'F07'],
    misconceptionRefs: ['E07'],
  },
  'C10_CPS與數位雙生.md': {
    chapterId: 'C10',
    topicCode: 'M12201',
    subject: '科目二_智慧製造生產線管理基礎',
    title: 'CPS 與數位雙生：讓模型跟現場對話',
    primaryCardFamilies: ['F14'],
    formulaRefs: [],
    misconceptionRefs: ['E05'],
  },
  'C11_智動化設備與搬運.md': {
    chapterId: 'C11',
    topicCode: 'M12202',
    subject: '科目二_智慧製造生產線管理基礎',
    title: '智動化設備與搬運：讓機器在規則內動作',
    primaryCardFamilies: ['F15', 'F09'],
    formulaRefs: ['F05', 'F06'],
    misconceptionRefs: ['E02', 'E04', 'E06'],
  },
  'C12_MES與現場整合.md': {
    chapterId: 'C12',
    topicCode: 'M12203',
    subject: '科目二_智慧製造生產線管理基礎',
    title: 'MES 與現場整合：讓每一筆交易都能重建事實',
    primaryCardFamilies: ['F16'],
    formulaRefs: ['F05', 'F07'],
    misconceptionRefs: ['E08', 'E10'],
  }
};

async function addFrontmatter() {
  console.log('--- 正在為關卡檔案補齊結構化 YAML Frontmatter ---');

  for (const [filename, meta] of Object.entries(chapterMeta)) {
    const filePath = join(LEVELS_DIR, filename);
    let content = await readFile(filePath, 'utf-8');

    // 若已有 frontmatter 先清除避免重複
    if (content.startsWith('---')) {
      content = content.replace(/^---[\s\S]*?---\r?\n\r?\n?/, '');
    }

    const levels = Array.from({ length: 8 }, (_, i) => `${meta.chapterId}-L0${i + 1}`);

    const frontmatter = `---
chapterId: "${meta.chapterId}"
topicCode: "${meta.topicCode}"
subject: "${meta.subject}"
title: "${meta.title}"
levelCount: 8
levels: [${levels.map(l => `"${l}"`).join(', ')}]
primaryCardFamilies: [${meta.primaryCardFamilies.map(f => `"${f}"`).join(', ')}]
formulaRefs: [${meta.formulaRefs.map(f => `"${f}"`).join(', ')}]
misconceptionRefs: [${meta.misconceptionRefs.map(m => `"${m}"`).join(', ')}]
version: "1.1"
status: "design-complete"
---

`;

    await writeFile(filePath, frontmatter + content, 'utf-8');
    console.log(`✅ ${filename} 成功注入 YAML Frontmatter。`);
  }
}

addFrontmatter().catch(err => {
  console.error(err);
  process.exit(1);
});
