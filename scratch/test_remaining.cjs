const fs = require('fs');
const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const { upgrades } = require('./prepare_upgrades.cjs');

for (const q of [...q1, ...q2]) {
  if (upgrades[q.id]) {
    q.options = upgrades[q.id].options;
    q.answer = upgrades[q.id].answer;
  }
}

const badWords = [
  '土地', '便當', '尾牙', '廣告', '制服', '座位', '警衛', '盆栽', '旅遊', '吸菸',
  '肉眼', '打電話', '大賣場', '喝水', '放寬', '塞給下游客戶', '簽名留念',
  '低價賣給員工', '休假期間', '次級潤滑油', '蜂鳴器', '假裝沒看見', '膠帶固定', '無薪加班',
  '銷毀', '剪斷', '不知名', '粉筆', '敲打磨平', '老花眼鏡', '溜滑梯', '菜籃車',
  '電風扇', '自備耳塞', '下雨天', '搬至室內', '咖啡', '下午茶', '抽獎', '桌椅',
  '時鐘調快', '通訊軟體', '最貴'
];

const remaining = [];
for (const q of [...q1, ...q2]) {
  if (!q.options) continue;
  q.options.forEach((opt, idx) => {
    for (const b of badWords) {
      if (opt.includes(b)) {
        remaining.push({ id: q.id, unit: q.unit, idx, term: b, opt });
        break;
      }
    }
  });
}
console.log('Remaining bad occurrences after upgrade:', remaining.length);
if (remaining.length > 0) {
  console.log(remaining);
}
