const fs = require('fs');
const s1 = fs.readFileSync('content/questions-subject1.json', 'utf8');
const s2 = fs.readFileSync('content/questions-subject2.json', 'utf8');

const checkOpt = (s, opt) => {
  let count = 0;
  let pos = 0;
  while ((pos = s.indexOf(opt, pos)) !== -1) {
    count++;
    pos += opt.length;
  }
  return count;
};

console.log('Testing in s1:');
console.log('廠房未來十年的土地取得方式:', checkOpt(s1, '廠房未來十年的土地取得方式'));
console.log('隨機派工:', checkOpt(s1, '隨機派工'));
console.log('代表機器自然會提升為兩倍速度:', checkOpt(s1, '代表機器自然會提升為兩倍速度'));
