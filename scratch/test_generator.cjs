const fs = require('fs');

const q1 = JSON.parse(fs.readFileSync('content/questions-subject1.json', 'utf8'));
const q2 = JSON.parse(fs.readFileSync('content/questions-subject2.json', 'utf8'));
const reviews = JSON.parse(fs.readFileSync('content/question-reviews.json', 'utf8')).questions;
const rMap = new Map(reviews.map(r => [r.canonicalId, r]));

// Test sample questions
const samples = [
  q1.find(q => q.id === 'L111-01'),
  q1.find(q => q.id === 'L111-02'),
  q1.find(q => q.id === 'L114-06'),
  q1.find(q => q.id === 'L115-01'),
  q1.find(q => q.id === 'L116-01'),
  q2.find(q => q.id === 'L121-04'),
  q2.find(q => q.id === 'L122-01'),
  q2.find(q => q.id === 'L123-01')
].filter(Boolean);

console.log('Sample stems:', samples.map(s => s.stem));
