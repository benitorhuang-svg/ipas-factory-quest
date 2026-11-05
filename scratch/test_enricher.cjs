const fs = require('fs');
const path = require('path');

const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const reviews = JSON.parse(fs.readFileSync('content/question-reviews.json', 'utf8'));
const aliases = JSON.parse(fs.readFileSync('content/question-aliases.json', 'utf8'));

console.log('Q1 total:', q1.length, 'Q2 total:', q2.length);
console.log('Reviews count:', reviews.questions.length);
console.log('Aliases count:', aliases.length);
