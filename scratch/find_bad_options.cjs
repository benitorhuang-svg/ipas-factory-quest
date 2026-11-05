const fs = require('fs');
const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const all = [...q1, ...q2];

const badTerms = [
  '土地', '便當', '尾牙', '廣告', '制服', '座位', '警衛', '盆栽', '旅遊', '吸菸',
  '肉眼', '打電話', '大賣場', '喝水', '放寬', '下游客戶', '簽名',
  '低價', '休假', '潤滑油', '蜂鳴器', '假裝', '膠帶', '無薪',
  '銷毀', '剪斷', '不知名', '粉筆', '磨平', '老花眼鏡', '溜滑梯', '菜籃車',
  '電風扇', '耳塞', '下雨天', '搬至室內', '咖啡', '下午茶', '抽獎', '桌椅',
  '時鐘', '通訊軟體', '最貴', '隨機', '感覺', '自然會', '口頭', '手寫'
];

const matches = [];
for (const q of all) {
  if (!q.options) continue;
  q.options.forEach((opt, idx) => {
    for (const b of badTerms) {
      if (opt.includes(b)) {
        matches.push({ id: q.id, unit: q.unit, idx, term: b, stem: q.stem, opt });
        break;
      }
    }
  });
}
console.log('Matches:', matches.length);
const seen = new Set();
for (const m of matches) {
  if (!seen.has(m.id + ':' + m.idx)) {
    seen.add(m.id + ':' + m.idx);
    console.log(`[${m.id}] (${m.unit}) Opt ${m.idx} [${m.term}]: "${m.opt}" | Stem: "${m.stem.slice(0, 35)}..."`);
  }
}
