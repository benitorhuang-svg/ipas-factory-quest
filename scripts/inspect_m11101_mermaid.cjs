const fs = require('fs');

const dataFile = fs.readFileSync('dist/data.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataFile, sandbox);

const sm = sandbox.window.FACTORY_QUEST_DATA.studyMaterials;
const m11101 = sm.find(m => m.topicCode === 'M11101');

const matches = m11101.details.match(/<pre class="mermaid">([\s\S]*?)<\/pre>/g);
console.log('Matches in M11101:', matches ? matches.length : 0);
if (matches) {
  matches.forEach((m, i) => {
    console.log(`--- Match ${i+1} ---`);
    console.log(m.slice(0, 200));
  });
}
