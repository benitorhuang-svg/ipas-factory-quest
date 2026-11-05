const fs = require('fs');
const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const all = [...q1, ...q2];

// Look for suspicious words indicating naive distractors
const giveawayWords = [
  '土地', '便當', '尾牙', '廣告', '制服', '座位', '警衛', '盆栽', '旅遊', '吸菸',
  '肉眼', '打電話', '大賣場', '喝水', '放寬', '下游客戶', '簽名',
  '低價', '休假', '潤滑油', '蜂鳴器', '假裝', '膠帶', '無薪',
  '銷毀', '剪斷', '不知名', '粉筆', '磨平', '老花眼鏡', '溜滑梯', '菜籃車',
  '電風扇', '耳塞', '下雨天', '搬至室內', '咖啡', '下午茶', '抽獎', '桌椅',
  '時鐘', '通訊軟體', '最貴', '自然會', '口頭', '手寫', '憑經驗', '記憶',
  '私下', '忽略', '省略', '任意', '隨意', '自行決定', '直接刪除', '不用確認'
];

const flagged = [];
for (const q of all) {
  if (!q.options) continue;
  const badOpts = [];
  q.options.forEach((opt, idx) => {
    for (const w of giveawayWords) {
      if (opt.includes(w)) {
        badOpts.push({ idx, word: w, text: opt });
        break;
      }
    }
  });
  if (badOpts.length > 0) {
    flagged.push({ id: q.id, unit: q.unit, stem: q.stem, badOpts, answer: q.answer });
  }
}

console.log('Total flagged questions with naive distractors:', flagged.length);
for (const f of flagged) {
  console.log(`\n[${f.id}] (${f.unit}) Stem: ${f.stem}`);
  console.log(`Answer: ${f.answer}`);
  for (const b of f.badOpts) {
    console.log(`  BAD Opt ${b.idx} [${b.word}]: "${b.text}"`);
  }
}
