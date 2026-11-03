const fs = require('fs');
const path = require('path');
const srcDir = 'C:\\Users\\benit\\Desktop\\iPAS智慧生產工程師';
const p = path.join(srcDir, 'output', 'imagegen', '單元重點圖解-3D');
if (fs.existsSync(p)) {
  console.log(fs.readdirSync(p));
}
