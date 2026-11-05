const fs = require('fs');
const aliases = JSON.parse(fs.readFileSync('content/question-aliases.json', 'utf8'));
const targetIds = [
  'L111-01', 'L111-10', 'L111-11', 'L112-02', 'L112-04', 'L112-12', 'L112-14',
  'L113-01', 'L113-17', 'L114-01', 'L114-16', 'L115-01', 'L115-02', 'L115-04',
  'L115-10', 'L115-16', 'L116-01',
  'L111-B20', 'L111-B22', 'L112-B12', 'L112-B14', 'L112-B18', 'L112-B19', 'L112-B22',
  'L113-B11', 'L113-B13', 'L113-B18', 'L113-B19', 'L113-B23', 'L114-B15', 'L114-B24',
  'L115-B08', 'L115-B21', 'L125-07', 'L125-08', 'L122-04', 'L121-B16', 'L121-B17',
  'L122-B20', 'L122-B21', 'L122-B22', 'L122-B26', 'L122-B27', 'L123-B01', 'L123-B15',
  'L123-B19', 'L123-B21', 'L123-B25', 'L123-B28', 'L124-B12', 'L124-B13', 'L124-B19',
  'L124-B22', 'L125-B10', 'L125-B18', 'L125-B24', 'L126-B09', 'L126-B12', 'L126-B14',
  'L126-B16', 'L126-B18', 'L126-B23'
];

for (const t of targetIds) {
  const group = aliases.find(g => g.canonicalId === t);
  if (group) {
    console.log(`Canonical ${t} has aliases:`, group.aliases);
  }
  for (const g of aliases) {
    if (g.aliases.includes(t)) {
      console.log(`Target ${t} is an ALIAS of canonical ${g.canonicalId}`);
    }
  }
}
