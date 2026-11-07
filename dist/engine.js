(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FactoryEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const UNITS = ['L111','L112','L113','L114','L115','L116','L121','L122','L123','L124','L125','L126'];
  const DAY = 86400000;
  const catalogs = new WeakMap();
  const MODES = ['mission', 'quick', 'review', 'exam'];
  const questionRevision = 'questions-2026-11-07', previousRevision = 'questions-2026-11-05', legacyRevision = 'legacy-v1';
  const revisionOf = (run, state) => {
    const revision = run?.questionRevision || state?.questionRevision;
    return [questionRevision, previousRevision, legacyRevision].includes(revision) ? revision : legacyRevision;
  };
  const questionFor = (question, run) => run?.questionRevision === legacyRevision ? question?.legacy || question : question?.versions?.[run?.questionRevision] || question;
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const finite = (value, max = Number.MAX_SAFE_INTEGER) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max ? value : 0;
  function fingerprint(q) {
    return JSON.stringify([q.unit, q.stem.trim(), q.kind, q.options, q.answer, q.tolerance, q.answerUnit]);
  }
  function catalog(bank) {
    if (catalogs.has(bank)) return catalogs.get(bank);
    const signatures = new Map(), aliases = new Map(), unique = [];
    for (const q of bank) {
      const key = fingerprint(q);
      if (!signatures.has(key)) { signatures.set(key, q.id); unique.push(q); }
      aliases.set(q.id, signatures.get(key));
    }
    const result = { unique, aliases };
    catalogs.set(bank, result);
    return result;
  }
  function masteredIds(state, bank) {
    return [...new Set(state.earnedCorrectIds.map(id => catalog(bank).aliases.get(id)).filter(Boolean))];
  }
  function reviewEntries(state, bank) {
    if (!bank) return Object.entries(state.ledger);
    const entries = new Map(), { aliases } = catalog(bank);
    for (const [id, entry] of Object.entries(state.ledger)) {
      const key = aliases.get(id);
      if (key && (!entries.has(key) || entry.lastSeen > entries.get(key).lastSeen || (entry.lastSeen === entries.get(key).lastSeen && id === key))) entries.set(key, entry);
    }
    return [...entries];
  }
  function reviewIds(state, bank, now = Date.now()) {
    return reviewEntries(state, bank).filter(([, e]) => !e.lastCorrect || (e.dueAt > 0 && e.dueAt <= now))
      .sort((a, b) => Number(a[1].lastCorrect) - Number(b[1].lastCorrect) || a[1].dueAt - b[1].dueAt).map(([id]) => id);
  }
  function reviewPlan(state, bank, now = Date.now(), random = Math.random) {
    const { unique } = catalog(bank), entries = new Map(reviewEntries(state, bank));
    const mastered = new Set(masteredIds(state, bank));
    const qmap = new Map(unique.map(q => [q.id, q]));
    const due = reviewIds(state, bank, now), reserved = new Set(due.slice(0, 10));
    const questions = [], targets = {}, used = new Set();
    for (const targetId of due.slice(0, 10)) {
      const target = qmap.get(targetId);
      if (!target) continue;
      let question = target;
      if (entries.get(targetId).lastCorrect) {
        const pool = unique.filter(q => q.unit === target.unit && q.skill === target.skill &&
          !used.has(q.id) && !reserved.has(q.id) &&
          (!entries.get(q.id)?.lastCorrect || (entries.get(q.id).dueAt > 0 && entries.get(q.id).dueAt <= now)));
        const unseen = pool.filter(q => !entries.has(q.id) && !mastered.has(q.id));
        const candidates = unseen.length ? unseen : pool;
        if (candidates.length) {
          const weights = candidates.map(q => 1 / (1 + (entries.get(q.id)?.correctCount || (mastered.has(q.id) ? 1 : 0))) ** 2);
          let draw = random() * weights.reduce((sum, weight) => sum + weight, 0);
          question = candidates[candidates.length - 1];
          for (let i = 0; i < candidates.length; i++) {
            draw -= weights[i];
            if (draw < 0) { question = candidates[i]; break; }
          }
        }
      }
      used.add(question.id);
      questions.push(question);
      if (question.id !== targetId) targets[question.id] = targetId;
    }
    return { questions, targets };
  }
  function dateKey(time = Date.now()) {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));
    const get = type => parts.find(p=>p.type===type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function emptyState() { return {version:1,questionRevision,xp:0,earnedCorrectIds:[],passedUnits:[],best:{},ledger:{},history:[],active:null,studyDates:[]}; }
  function parseNumber(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const normalized = String(value).trim().replace(/[０-９]/g,c=>String(c.charCodeAt(0)-65296)).replace(/，|,/g,'').replace(/％/g,'%').replace(/%$/,'').trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  function hasAnswer(q, value) { return q.kind === 'number' ? parseNumber(value) !== null : Number.isInteger(value) && value >= 0 && value < q.options.length; }
  function correct(q, value) { return hasAnswer(q,value) && (q.kind === 'number' ? Math.abs(parseNumber(value)-q.answer) <= (q.tolerance ?? 0.001)+1e-9 : value === q.answer); }
  function shuffle(items, random = Math.random) {
    const a = [...items];
    for(let i=a.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  const EXCLUSIONS = [['L114-10', 'L114-11']];
  function filterExclusions(items, chosen) {
    const blocked = new Set();
    for (const q of chosen) for (const pair of EXCLUSIONS) if (pair.includes(q.id)) pair.forEach(x => { if (x !== q.id) blocked.add(x); });
    return items.filter(q => !blocked.has(q.id));
  }
  function pickSafe(candidates, count, random, chosen) {
    if (count <= 0) return [];
    const out = [];
    for (const q of shuffle(candidates, random)) {
      if (filterExclusions([q], [...chosen, ...out]).length) {
        out.push(q);
        if (out.length === count) break;
      }
    }
    return out;
  }
  function select(bank, spec, random = Math.random) {
    const source = bank;
    const { unique, aliases } = catalog(bank);
    bank = unique;
    if (spec.mode === 'exam') {
      const units = UNITS.filter(u => spec.subject === 1 ? u.startsWith('L11') : u.startsWith('L12'));
      const counts = [9, 9, 8, 8, 8, 8];
      const isHardcore = spec.difficulty === 'hardcore' || spec.difficulty === 'hard';
      const pickedAll = [];
      for (let i = 0; i < units.length; i++) {
        const unit = units[i], count = counts[i] || 8;
        const pool = bank.filter(q => q.unit === unit && q.kind === 'choice');
        if (pool.length < count) throw new Error(`${unit} 的模擬題數不足`);
        if (isHardcore) {
          const picked = [];
          const tiers = [q => q.skill === 'calculation', q => q.difficulty === 'hard', q => q.skill === 'scenario', () => true];
          for (const accepts of tiers) {
            const candidates = pool.filter(q => accepts(q) && !picked.includes(q));
            picked.push(...pickSafe(candidates, count - picked.length, random, [...pickedAll, ...picked]));
          }
          pickedAll.push(...picked);
        } else {
          const calcs = pool.filter(q => q.skill === 'calculation');
          const scenarios = pool.filter(q => q.skill === 'scenario');
          const picked = [];
          if (calcs.length) picked.push(...pickSafe(calcs, 1, random, [...pickedAll, ...picked]));
          const wantScenarios = Math.min(count - picked.length, Math.min(3, scenarios.length));
          picked.push(...pickSafe(scenarios, wantScenarios, random, [...pickedAll, ...picked]));
          const remaining = pool.filter(q => !picked.includes(q));
          picked.push(...pickSafe(remaining, count - picked.length, random, [...pickedAll, ...picked]));
          pickedAll.push(...picked);
        }
      }
      return shuffle(pickedAll, random);
    }
    if (spec.mode === 'review') {
      if (spec.state) return reviewPlan(spec.state, source, spec.now, random).questions;
      const ids = [...new Set((spec.wrongIds || []).map(id => aliases.get(id)))];
      const map = new Map(bank.map(q => [q.id, q]));
      return ids.map(id => map.get(id)).filter(Boolean).slice(0, 10);
    }
    const pool = shuffle(bank.filter(q=>q.unit===spec.unitId),random);
    const limit = spec.mode === 'quick' ? 5 : 10;
    const counts = spec.mode === 'quick' ? {concept:2,scenario:2,calculation:1} : {concept:4,scenario:4,calculation:2};
    const picked = [];
    for(const [skill,count] of Object.entries(counts)) {
      picked.push(...pickSafe(pool.filter(q => q.skill === skill), count, random, picked));
    }
    const ids = new Set(picked.map(q=>q.id));
    const remaining = pool.filter(q => !ids.has(q.id));
    picked.push(...pickSafe(remaining, Math.max(0, limit - picked.length), random, picked));
    return shuffle(picked.slice(0,limit),random);
  }
  function restore(raw, bank) {
    if (!record(raw) || raw.version !== 1) return emptyState();
    const s = emptyState();
    const known = new Set(bank.map(q=>q.id));
    const qmap = new Map(bank.map(q => [q.id, q]));
    s.earnedCorrectIds = [...new Set((Array.isArray(raw.earnedCorrectIds)?raw.earnedCorrectIds:[]).filter(id=>known.has(id)))];
    for(const id of UNITS) {
      const best = raw.best?.[id];
      if(typeof best === 'number' && Number.isFinite(best) && best>=0 && best<=100) s.best[id] = best;
    }
    s.passedUnits = [...new Set((Array.isArray(raw.passedUnits)?raw.passedUnits:[]).filter(id=>UNITS.includes(id) && s.best[id]>=80))];
    s.xp = s.earnedCorrectIds.length*10+s.passedUnits.length*50;
    if(record(raw.ledger)) for(const [id,entry] of Object.entries(raw.ledger)) {
      if(!known.has(id) || !entry || typeof entry.lastCorrect!=='boolean') continue;
      const attempts = Math.floor(finite(entry.attempts, 1000000));
      s.ledger[id] = {attempts,correctCount:Math.min(attempts, Math.floor(finite(entry.correctCount, 1000000))),lastCorrect:entry.lastCorrect,lastSeen:finite(entry.lastSeen),dueAt:finite(entry.dueAt)};
    }
    s.studyDates = [...new Set((Array.isArray(raw.studyDates)?raw.studyDates:[]).filter(d=>typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d))))].sort();
    const safeAnswer = (id, answer, revision) => {
      const q = questionFor(qmap.get(id), { questionRevision: revision });
      if (q?.kind === 'number') return typeof answer === 'string' && answer.length <= 128 ? answer : typeof answer === 'number' && Number.isFinite(answer) ? answer : null;
      return q && hasAnswer(q, answer) ? answer : null;
    };
    const history = new Map();
    for (const r of (Array.isArray(raw.history) ? raw.history : []).slice(-100)) {
      if (!record(r) || typeof r.runId !== 'string' || !r.runId.length || r.runId.length > 128 || !MODES.includes(r.mode) || !Array.isArray(r.results) || !r.results.length || r.results.length > 50) continue;
      if (!r.results.every(x => record(x) && known.has(x.id))) continue;
      const seen = new Set();
      const revision = revisionOf(r, raw);
      const results = r.results.filter(x => !seen.has(x.id) && seen.add(x.id)).map(x => {
        const answer = safeAnswer(x.id, x.answer, revision);
        return { id: x.id, answer, correct: correct(questionFor(qmap.get(x.id), { questionRevision: revision }), answer) };
      });
      const count = results.filter(x => x.correct).length, score = Math.round(count / results.length * 100);
      const unitId = UNITS.includes(r.unitId) ? r.unitId : null;
      history.set(r.runId, {runId:r.runId,questionRevision:revision,mode:r.mode,unitId,subject:[1,2].includes(r.subject)?r.subject:null,difficulty:['standard','hardcore','hard'].includes(r.difficulty)?r.difficulty:null,total:results.length,correct:count,score,results,earnedXP:finite(r.earnedXP,550),newBadge:r.newBadge === true && r.mode === 'mission' && !!unitId && score >= 80,completedAt:finite(r.completedAt)});
    }
    s.history = [...history.values()];
    const a=raw.active;
    if(a && ['mission','quick','review','exam'].includes(a.mode) && typeof a.id==='string' && Array.isArray(a.questionIds) && a.questionIds.length>0 && a.questionIds.length<=50 && a.questionIds.every(id=>known.has(id)) && Number.isFinite(a.startedAt) && a.startedAt>0 && !s.history.some(r=>r.runId===a.id)) {
      s.active={id:a.id,questionRevision:revisionOf(a, raw),mode:a.mode,unitId:UNITS.includes(a.unitId)?a.unitId:null,subject:[1,2].includes(a.subject)?a.subject:null,difficulty:['standard','hardcore','hard'].includes(a.difficulty)?a.difficulty:null,questionIds:[...new Set(a.questionIds)],answers:{},startedAt:a.startedAt};
      if (a.mode === 'review' && record(a.reviewTargets)) {
        const entries = new Map(reviewEntries(s, bank)), targets = new Set();
        s.active.reviewTargets = {};
        for (const id of s.active.questionIds) {
          const targetId = a.reviewTargets[id], target = qmap.get(targetId), q = qmap.get(id);
          if (target && id !== targetId && !s.active.questionIds.includes(targetId) && !targets.has(targetId) &&
              q.unit === target.unit && q.skill === target.skill && entries.get(targetId)?.lastCorrect &&
              entries.get(targetId).dueAt > 0 && entries.get(targetId).dueAt <= a.startedAt) {
            s.active.reviewTargets[id] = targetId; targets.add(targetId);
          }
        }
      }
      for(const id of s.active.questionIds) {
        const value=a.answers?.[id];
        const answer = safeAnswer(id, value, s.active.questionRevision);
        if(answer !== null) s.active.answers[id]=answer;
      }
    }
    return s;
  }
  function grade(state, run, bank, now = Date.now()) {
    const previous=state.history.find(r=>r.runId===run.id);
    if(previous) return {state,report:previous};
    const map=new Map(bank.map(q=>[q.id,q]));
    const ids=[...new Set(run.questionIds)].filter(id=>map.has(id));
    if(ids.length===0) throw new Error('沒有可結算的題目');
    const s=JSON.parse(JSON.stringify(state));
    const earned=new Set(s.earnedCorrectIds);
    const { aliases } = catalog(bank);
    const previousEntries = new Map(reviewEntries(state, bank));
    const earnedContent = new Set([...earned].map(id => aliases.get(id)));
    let earnedXP=0;
    const results=ids.map(id=>{
      const q=questionFor(map.get(id),run), answer=run.answers[id], ok=correct(q,answer);
      const ledgerId = aliases.get(id);
      const old=previousEntries.get(ledgerId) || {attempts:0,correctCount:0};
      s.ledger[ledgerId]={attempts:old.attempts+1,correctCount:old.correctCount+(ok?1:0),lastCorrect:ok,lastSeen:now,dueAt:now+(ok?3:1)*DAY};
      if(ok&&!earnedContent.has(aliases.get(id))){earned.add(id);earnedContent.add(aliases.get(id));earnedXP+=10;}
      return {id,answer:answer===undefined?null:answer,correct:ok};
    });
    if (run.mode === 'review' && record(run.reviewTargets)) {
      const entries = new Map(reviewEntries(s, bank)), targets = new Set();
      for (const result of results.filter(result => result.correct)) {
        const q = map.get(result.id), targetId = run.reviewTargets[result.id], target = map.get(targetId);
        const entry = entries.get(targetId);
        if (target && !ids.includes(targetId) && !targets.has(targetId) && q.unit === target.unit &&
            q.skill === target.skill && entry?.lastCorrect && entry.dueAt > 0 && entry.dueAt <= now) {
          entry.dueAt = now + 3 * DAY; targets.add(targetId);
        }
      }
    }
    const count=results.filter(x=>x.correct).length,score=Math.round(count/ids.length*100);
    let newBadge=false;
    if(run.mode==='mission' && UNITS.includes(run.unitId)) {
      s.best[run.unitId]=Math.max(s.best[run.unitId]||0,score);
      if(score>=80 && !s.passedUnits.includes(run.unitId)) {s.passedUnits.push(run.unitId);earnedXP+=50;newBadge=true;}
    }
    s.earnedCorrectIds=[...earned];
    s.xp+=earnedXP;
    const key=dateKey(now);if(!s.studyDates.includes(key))s.studyDates.push(key);
    const report={runId:run.id,questionRevision:run.questionRevision||questionRevision,mode:run.mode,unitId:run.unitId,subject:run.subject,difficulty:run.difficulty||null,total:ids.length,correct:count,score,results,earnedXP,newBadge,completedAt:now};
    s.history.push(report);s.history=s.history.slice(-100);s.active=null;
    return {state:s,report};
  }
  function wrongIds(state, bank) {return reviewEntries(state, bank).filter(([,v])=>!v.lastCorrect).map(([id])=>id);}
  function streak(state, now=Date.now()) {
    const dates=new Set(state.studyDates), today=dateKey(now);
    let cursor=new Date(`${today}T12:00:00+08:00`).getTime();
    if(!dates.has(today)) cursor-=DAY;
    let count=0;while(dates.has(dateKey(cursor))){count++;cursor-=DAY;}return count;
  }
  function level(xp) {return xp>=3000?'智慧工廠總監':xp>=1800?'智慧工廠廠長':xp>=1000?'營運領航員':xp>=500?'製造工程師':xp>=150?'產線實習生':'見習廠長';}
  return {UNITS,questionRevision,previousRevision,legacyRevision,questionFor,dateKey,emptyState,parseNumber,hasAnswer,correct,shuffle,select,restore,grade,wrongIds,reviewIds,reviewEntries,reviewPlan,masteredIds,catalog,fingerprint,streak,level};
});
