const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const E=require('../dist/engine.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('dist/data.js','utf8'),ctx);
const data=JSON.parse(JSON.stringify(ctx.window.FACTORY_QUEST_DATA));const bank=data.questions;
assert.equal(bank.length,476);assert.equal(new Set(bank.map(q=>q.id)).size,476);assert.equal(data.units.length,12);
for(const u of data.units){assert.ok(bank.filter(q=>q.unit===u.id).length>=25);assert.ok(fs.existsSync('dist/assets/'+u.id+'.png'));}
for(const q of bank){
 assert.ok(E.UNITS.includes(q.unit));assert.ok(q.id.startsWith(q.unit+'-'));assert.ok(q.stem.length>4);assert.ok(q.hint.length>2);assert.ok(q.explanation.length>5);
 assert.ok(['concept','scenario','calculation'].includes(q.skill));
 if(q.kind==='choice'){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(Number.isInteger(q.answer));}
 else{assert.equal(q.kind,'number');assert.ok(Number.isFinite(q.answer));assert.ok(q.answerUnit);assert.ok(q.tolerance>=0);}
 assert.equal(E.correct(q,q.answer),true,q.id+' correct answer rejected');
 assert.equal(E.hasAnswer(q,''),false,q.id+' empty accepted');
}
assert.equal(E.parseNumber('１，２００'),1200);assert.equal(E.parseNumber('68.4%'),68.4);assert.equal(E.parseNumber('1+2'),null);assert.equal(E.parseNumber('Infinity'),null);
assert.equal(E.dateKey(Date.parse('2026-10-28T17:00:00Z')),'2026-10-29');
let state=E.emptyState();let seed=12345;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
for(const unit of E.UNITS){const qs=E.select(bank,{mode:'mission',unitId:unit},rng);assert.equal(qs.length,10);assert.equal(new Set(qs.map(q=>q.id)).size,10);assert.ok(qs.every(q=>q.unit===unit));assert.equal(E.select(bank,{mode:'quick',unitId:unit},rng).length,5);}
for(const subject of [1,2]){const qs=E.select(bank,{mode:'exam',subject},rng);assert.equal(qs.length,50);assert.equal(new Set(qs.map(q=>q.id)).size,50);assert.ok(qs.every(q=>q.kind==='choice'));assert.ok(qs.every(q=>subject===1?q.unit.startsWith('L11'):q.unit.startsWith('L12')));}
const qs=E.select(bank,{mode:'mission',unitId:'L111'},rng);const run={id:'test-mission',mode:'mission',unitId:'L111',subject:null,questionIds:qs.map(q=>q.id),answers:Object.fromEntries(qs.map(q=>[q.id,q.answer])),startedAt:Date.now()};
let graded=E.grade(state,run,bank,Date.parse('2026-10-28T12:00:00Z'));assert.equal(graded.report.score,100);assert.equal(graded.report.earnedXP,150);assert.equal(graded.state.passedUnits.length,1);assert.equal(E.wrongIds(graded.state).length,0);
state=graded.state;const again=E.grade(state,run,bank);assert.equal(again.state.xp,150);assert.equal(again.state.history.length,1);
const repeat={...run,id:'test-repeat'};graded=E.grade(state,repeat,bank);assert.equal(graded.report.earnedXP,0);assert.equal(graded.state.xp,150);state=graded.state;
const wrong={...run,id:'test-wrong',answers:{}};graded=E.grade(state,wrong,bank);assert.equal(graded.report.score,0);assert.equal(E.wrongIds(graded.state).length,10);state=graded.state;
const repair=E.select(bank,{mode:'review',wrongIds:E.wrongIds(state)},rng);graded=E.grade(state,{id:'test-repair',mode:'review',unitId:null,subject:null,questionIds:repair.map(q=>q.id),answers:Object.fromEntries(repair.map(q=>[q.id,q.answer]))},bank);assert.equal(E.wrongIds(graded.state).length,0);assert.equal(graded.report.newBadge,false);assert.equal(graded.report.earnedXP,0);
const draft={...E.emptyState(),active:{...run,id:'draft',answers:{[qs[0].id]:qs[0].answer}}};const restored=E.restore(JSON.parse(JSON.stringify(draft)),bank);assert.equal(restored.active.answers[qs[0].id],qs[0].answer);assert.equal(restored.active.questionIds.length,10);
assert.equal(E.restore({version:9},bank).xp,0);assert.equal(E.restore({...state,xp:999999},bank).xp,state.earnedCorrectIds.length*10+state.passedUnits.length*50);
const invalid=E.restore({...draft,active:{...draft.active,questionIds:['unknown']}},bank);assert.equal(invalid.active,null);
const exam=E.select(bank,{mode:'exam',subject:2},rng);const report=E.grade(E.emptyState(),{id:'exam',mode:'exam',subject:2,unitId:null,questionIds:exam.map(q=>q.id),answers:{}},bank).report;assert.equal(report.total,50);assert.equal(report.score,0);
assert.equal(E.streak({...E.emptyState(),studyDates:['2026-10-26','2026-10-27','2026-10-28']},Date.parse('2026-10-28T12:00:00Z')),3);
console.log('PASS: 476 questions; all 12 missions; both 50-question mocks; numeric grading; XP idempotence; badges; repair; draft restore; import guard; streak.');
