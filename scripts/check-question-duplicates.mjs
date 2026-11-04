import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), E = require('../dist/engine.js');
const bank = [1, 2].flatMap(id => JSON.parse(fs.readFileSync(`content/questions-subject${id}.json`, 'utf8')));
const { unique, aliases } = E.catalog(bank);
const duplicates = unique.map(question => ({ canonicalId: question.id, aliases: [...aliases].filter(([id, canonical]) => id !== canonical && canonical === question.id).map(([id]) => id) })).filter(group => group.aliases.length);
const expected = JSON.parse(fs.readFileSync('content/question-aliases.json', 'utf8'));
if (JSON.stringify(duplicates) !== JSON.stringify(expected)) throw new Error('Question duplicates changed; review aliases and progress compatibility before release.');
console.log(`${bank.length} source records; ${unique.length} unique questions; ${duplicates.length} reviewed alias groups; no unreviewed duplicate changes.`);
