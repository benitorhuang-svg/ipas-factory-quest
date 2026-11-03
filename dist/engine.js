(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FactoryEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const UNITS = ['L111','L112','L113','L114','L115','L116','L121','L122','L123','L124','L125','L126'];
  const DAY = 86400000;
  function dateKey(time = Date.now()) {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));
    const get = type => parts.find(p=>p.type===type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function emptyState() { return {version:1,xp:0,earnedCorrectIds:[],passedUnits:[],best:{},ledger:{},history:[],active:null,studyDates:[]}; }
  function parseNumber(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const normalized = String(value).trim().replace(/[０-９]/g,c=>String(c.charCodeAt(0)-65296)).replace(/，|,/g,'').replace(/％/g,'%').replace(/%$/,'').trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  function hasAnswer(q, value) { return q.kind === 'number' ? parseNumber(value) !== null : Number.isInteger(value) && value >= 0 && value < q.options.length; }
  function correct(q, value) { return hasAnswer(q,value) && (q.kind === 'number' ? Math.abs(parseNumber(value)-q.answer) <= (q.tolerance || 0.001)+1e-9 : value === q.answer); }
  function shuffle(items, random = Math.random) {
    const a = [...items];
    for(let i=a.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function select(bank, spec, random = Math.random) {
    if (spec.mode === 'exam') {
      const units = UNITS.filter(u => spec.subject === 1 ? u.startsWith('L11') : u.startsWith('L12'));
      const counts = [9, 9, 8, 8, 8, 8];
      const selected = units.flatMap((unit,i) => {
        const count = counts[i] || 8;
        const pool = bank.filter(q=>q.unit===unit && q.kind==='choice');
        if(pool.length < count) throw new Error(`${unit} 的模擬題數不足`);
        return shuffle(pool,random).slice(0,count);
      });
      return shuffle(selected,random);
    }
    if(spec.mode === 'review') return shuffle(bank.filter(q=>spec.wrongIds.includes(q.id)),random).slice(0,10);
    const pool = shuffle(bank.filter(q=>q.unit===spec.unitId),random);
    const limit = spec.mode === 'quick' ? 5 : 10;
    const counts = spec.mode === 'quick' ? {concept:2,scenario:2,calculation:1} : {concept:4,scenario:4,calculation:2};
    const picked = [];
    for(const [skill,count] of Object.entries(counts)) picked.push(...pool.filter(q=>q.skill===skill).slice(0,count));
    const ids = new Set(picked.map(q=>q.id));
    picked.push(...pool.filter(q=>!ids.has(q.id)).slice(0,Math.max(0,limit-picked.length)));
    return shuffle(picked.slice(0,limit),random);
  }
  function restore(raw, bank) {
    if (!raw || raw.version !== 1 || typeof raw !== 'object') return emptyState();
    const s = emptyState();
    const known = new Set(bank.map(q=>q.id));
    s.earnedCorrectIds = [...new Set((Array.isArray(raw.earnedCorrectIds)?raw.earnedCorrectIds:[]).filter(id=>known.has(id)))];
    for(const id of UNITS) {
      const best = Number(raw.best?.[id]);
      if(Number.isFinite(best) && best>=0 && best<=100) s.best[id] = best;
    }
    s.passedUnits = [...new Set((Array.isArray(raw.passedUnits)?raw.passedUnits:[]).filter(id=>UNITS.includes(id) && s.best[id]>=80))];
    s.xp = s.earnedCorrectIds.length*10+s.passedUnits.length*50;
    if(raw.ledger && typeof raw.ledger==='object') for(const [id,entry] of Object.entries(raw.ledger)) {
      if(!known.has(id) || !entry || typeof entry.lastCorrect!=='boolean') continue;
      s.ledger[id] = {attempts:Math.max(0,Number(entry.attempts)||0),correctCount:Math.max(0,Number(entry.correctCount)||0),lastCorrect:entry.lastCorrect,lastSeen:Number(entry.lastSeen)||0,dueAt:Number(entry.dueAt)||0};
    }
    s.studyDates = [...new Set((Array.isArray(raw.studyDates)?raw.studyDates:[]).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
    s.history = (Array.isArray(raw.history)?raw.history:[]).filter(r=>r && typeof r.runId==='string' && Array.isArray(r.results) && r.results.every(x=>known.has(x.id)) && Number.isFinite(r.score)).slice(-100);
    const a=raw.active;
    if(a && ['mission','quick','review','exam'].includes(a.mode) && typeof a.id==='string' && Array.isArray(a.questionIds) && a.questionIds.length>0 && a.questionIds.length<=50 && a.questionIds.every(id=>known.has(id)) && Number.isFinite(a.startedAt) && a.startedAt>0 && !s.history.some(r=>r.runId===a.id)) {
      s.active={id:a.id,mode:a.mode,unitId:UNITS.includes(a.unitId)?a.unitId:null,subject:[1,2].includes(a.subject)?a.subject:null,questionIds:[...new Set(a.questionIds)],answers:{},startedAt:a.startedAt};
      for(const id of s.active.questionIds) {
        const value=a.answers?.[id];
        if(typeof value==='string' || typeof value==='number') s.active.answers[id]=value;
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
    let earnedXP=0;
    const results=ids.map(id=>{
      const q=map.get(id), answer=run.answers[id], ok=correct(q,answer);
      const old=s.ledger[id] || {attempts:0,correctCount:0};
      s.ledger[id]={attempts:old.attempts+1,correctCount:old.correctCount+(ok?1:0),lastCorrect:ok,lastSeen:now,dueAt:now+(ok?3:1)*DAY};
      if(ok&&!earned.has(id)){earned.add(id);earnedXP+=10;}
      return {id,answer:answer===undefined?null:answer,correct:ok};
    });
    const count=results.filter(x=>x.correct).length,score=Math.round(count/ids.length*100);
    let newBadge=false;
    if(run.mode==='mission' && UNITS.includes(run.unitId)) {
      s.best[run.unitId]=Math.max(s.best[run.unitId]||0,score);
      if(score>=80 && !s.passedUnits.includes(run.unitId)) {s.passedUnits.push(run.unitId);earnedXP+=50;newBadge=true;}
    }
    s.earnedCorrectIds=[...earned];
    s.xp+=earnedXP;
    const key=dateKey(now);if(!s.studyDates.includes(key))s.studyDates.push(key);
    const report={runId:run.id,mode:run.mode,unitId:run.unitId,subject:run.subject,total:ids.length,correct:count,score,results,earnedXP,newBadge,completedAt:now};
    s.history.push(report);s.history=s.history.slice(-100);s.active=null;
    return {state:s,report};
  }
  function wrongIds(state) {return Object.entries(state.ledger).filter(([,v])=>!v.lastCorrect).map(([id])=>id);}
  function streak(state, now=Date.now()) {
    const dates=new Set(state.studyDates), today=dateKey(now);
    let cursor=new Date(`${today}T12:00:00+08:00`).getTime();
    if(!dates.has(today)) cursor-=DAY;
    let count=0;while(dates.has(dateKey(cursor))){count++;cursor-=DAY;}return count;
  }
  function level(xp) {return xp>=3000?'智慧工廠總監':xp>=1800?'智慧工廠廠長':xp>=1000?'營運領航員':xp>=500?'製造工程師':xp>=150?'產線實習生':'見習廠長';}
  return {UNITS,dateKey,emptyState,parseNumber,hasAnswer,correct,shuffle,select,restore,grade,wrongIds,streak,level};
});
