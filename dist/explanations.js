/* global module */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FactoryExplanations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const groups = {
    正解解析: 'steps', 正解: 'steps', 解題步驟: 'steps', 破題關鍵: 'focus',
    干擾項辨析: 'pitfalls', 重點辨析: 'pitfalls', 常見誤算剖析: 'pitfalls',
    避坑提醒: 'check', 觀念提示: 'check', 結果檢核: 'check',
  };
  const marker = new RegExp(`【(${Object.keys(groups).join('|')})】`, 'g');
  const key = text => text.replace(/[\s。；;•\-*]/g, '');
  function generic(text) {
    return /其他選項均為|與題意核心概念不符|數值計算(?:常見干擾陷阱|干擾項)|常見誤算：未扣抵安全庫存/.test(text);
  }
  function parse(text = '') {
    const parts = { focus: [], steps: [], pitfalls: [], check: [] };
    const matches = [...text.matchAll(marker)];
    let start = 0, group = 'steps';
    const seen = new Set();
    const append = end => {
      for (const line of text.slice(start, end).split(/\r?\n/)) {
        const clean = line.trim().replace(/^[•\-*]\s*/, '');
        if (!clean || generic(clean) || seen.has(key(clean))) continue;
        seen.add(key(clean)); parts[group].push(clean);
      }
    };
    for (const match of matches) {
      append(match.index);
      group = groups[match[1]]; start = match.index + match[0].length;
    }
    append(text.length);
    return parts;
  }
  function scheduleComparison(esc, data) {
    if (!data) return '';
    const { jobs, sequences } = data;
    const total = jobs.reduce((sum, job) => sum + job.duration, 0);
    const horizon = Math.max(total, ...jobs.map(job => job.due));
    const percent = time => 100 * time / horizon;
    const signed = value => value < 0 ? `−${-value}` : value > 0 ? `+${value}` : '0';
    const status = value => value > 0 ? `逾期 ${value} 小時` : value < 0 ? `提早 ${-value} 小時` : '準時';
    const cards = sequences.map(sequence => {
      let time = 0;
      const scheduled = sequence.order.map(id => {
        const job = jobs.find(job => job.id === id), start = time;
        time += job.duration;
        return { ...job, start, end: time, lateness: time - job.due, color: jobs.indexOf(job) };
      });
      const maximum = Math.max(...scheduled.map(job => job.lateness));
      const bars = scheduled.map(job => `<span class="gantt-bar gantt-job-${job.color}" style="left:${percent(job.start)}%;width:${percent(job.duration)}%">${esc(job.id)}</span>`).join('');
      const markers = jobs.map((job, index) => `<span class="gantt-due gantt-due-${index}${job.due === horizon ? ' gantt-at-end' : ''}" style="left:${percent(job.due)}%"><span>${esc(job.id)}交期 ${job.due}</span></span>`).join('');
      const ticks = Array.from({ length: 6 }, (_, index) => `<span style="left:${20 * index}%">${Number((horizon * index / 5).toFixed(2))}</span>`).join('');
      const calculations = jobs.map(job => {
        const item = scheduled.find(item => item.id === job.id);
        return `<li class="${item.lateness === maximum ? 'gantt-worst' : ''}"><strong>${esc(job.id)}</strong><span>${item.end} − ${job.due} ＝ ${signed(item.lateness)}<br><small>${status(item.lateness)}${item.lateness === maximum ? '（本排程最大值）' : ''}</small></span></li>`;
      }).join('');
      const description = scheduled.map(job => `${job.id}：第 ${job.start} 至 ${job.end} 小時加工，${status(job.lateness)}`).join('；');
      return `<figure class="gantt-card"><figcaption>${esc(sequence.label)}<span>${sequence.order.map(esc).join(' → ')}</span></figcaption>
        <div class="gantt-plot" role="img" aria-label="${esc(description)}"><div class="gantt-track">${bars}</div>${markers}<div class="gantt-axis">${ticks}</div></div>
        <p class="gantt-unit">時間軸：從現在起算的小時數；虛線是交期</p>
        <p class="gantt-formula">逐張計算：完工時間 − 交期（小時）</p><ul class="gantt-calculations">${calculations}</ul>
        <p class="gantt-maximum">最大延遲＝<strong>${maximum} 小時</strong></p></figure>`;
    }).join('');
    return `<section class="expl-section expl-schedule"><h4>甘特圖對照：先做誰，差在哪？</h4>
      <ul class="gantt-jobs">${jobs.map((job, index) => `<li><strong class="gantt-key gantt-job-${index}">${esc(job.id)}</strong>工時 ${job.duration} 小時 · 交期第 ${job.due} 小時</li>`).join('')}</ul>
      <div class="gantt-comparison">${cards}</div><p class="gantt-takeaway">${esc(data.takeaway)}</p></section>`;
  }
  function criticalRatio(data) {
    if (!data) return '';
    const { available, required } = data;
    const number = value => Number(value.toFixed(2));
    const horizon = Math.max(available, required), covered = Math.min(available, required);
    const width = time => 100 * time / horizon;
    const gap = number(required - available), ratio = number(available / required);
    const verdict = gap > 0 ? `時間不足 ${gap} 小時` : gap < 0 ? `有 ${-gap} 小時餘裕` : '時間剛好，沒有餘裕';
    const overflow = gap > 0 ? `<span class="cr-shortage" style="width:${width(gap)}%">＋${gap}</span>` : '';
    const ticks = Array.from({ length: 6 }, (_, index) => `<span style="left:${index * 20}%">${number(horizon * index / 5)}</span>`).join('');
    const examples = [
      { time: 8, relation: '＜', meaning: '時間不足', note: '少 2 小時，需處理逾期風險', tone: 'risk' },
      { time: 10, relation: '＝', meaning: '時間剛好', note: '沒有緩衝，等待或停機就可能逾期', tone: 'tight' },
      { time: 12, relation: '＞', meaning: '有時間餘裕', note: '多 2 小時，仍要留意後續變動', tone: 'slack' },
    ].map(row => `<li class="cr-${row.tone}"><strong>CR ${row.relation} 1</strong><span>${row.time} ÷ 10 ＝ ${row.time / 10}</span><b>${row.meaning}</b><small>${row.note}</small></li>`).join('');
    return `<section class="expl-section expl-cr"><h4>時間對照圖：剩 ${available} 小時，還要做 ${required} 小時</h4>
      <div class="cr-formula"><span>CR＝剩餘可用時間 ÷ 剩餘加工時間</span><strong>${available} ÷ ${required} ＝ ${ratio}</strong></div>
      <figure class="cr-figure"><figcaption>兩條長條使用相同時間刻度</figcaption>
        <div class="cr-plot" role="img" aria-label="距交期剩 ${available} 小時，剩餘加工需 ${required} 小時；${verdict}">
          <span class="cr-deadline${available === horizon ? ' cr-at-end' : ''}" style="left:${width(available)}%"><span>交期：第 ${available} 小時</span></span>
          <div class="cr-lane-label">離交期剩餘時間：${available} 小時</div><div class="cr-track"><span class="cr-available" style="width:${width(available)}%">${available} 小時</span></div>
          <div class="cr-lane-label">剩餘加工時間：${required} 小時</div><div class="cr-track"><span class="cr-required" style="width:${width(covered)}%">${covered} 小時</span>${overflow}</div>
          <div class="cr-axis">${ticks}</div>
        </div><p class="cr-axis-note">從現在（0）起算的小時數；虛線是交期</p>
        <p class="cr-verdict"><strong>${verdict}</strong><span>${required} − ${available} ＝ ${gap} 小時</span></p>
        <p class="cr-assumption">示意假設立即開工，按原估工時連續加工；等待或停機會讓可用時間更緊。</p>
      </figure>
      <p class="cr-guide-title">用同樣還需加工 10 小時的工單，對照三種情況</p><ul class="cr-guide">${examples}</ul>
      </section>`;
  }
  function explanationVisual(esc, data) {
    if (!data) return '';
    if (data.type === 'standard-time') {
      const number = value => Number(value.toFixed(6));
      const { normal, allowanceRate } = data;
      const normalShare = number(100 * (1 - allowanceRate)), allowanceShare = number(100 * allowanceRate);
      const standard = number(normal / (1 - allowanceRate)), allowance = number(standard - normal);
      return `<section class="expl-section expl-visual expl-standard-time"><h4>時間組成圖：把標準時間看成 100%</h4>
        <figure class="standard-time-figure"><figcaption>本題寬放率的分母是「標準時間」，整條代表正常時間與寬放時間的合計。</figcaption>
          <div class="standard-time-total">標準時間（ST）<strong>${standard} 秒 ＝ 100%</strong></div>
          <div class="standard-time-bar" role="img" aria-label="標準時間 ${standard} 秒為 100%，正常時間 ${normal} 秒占 ${normalShare}%，寬放時間 ${allowance} 秒占 ${allowanceShare}%">
            <span class="standard-time-normal" style="width:${normalShare}%">${normalShare}%</span><span class="standard-time-allowance" style="width:${allowanceShare}%">${allowanceShare}%</span>
          </div>
          <dl class="standard-time-legend"><div><dt><span class="standard-time-key standard-time-normal" aria-hidden="true"></span>正常時間（NT）</dt><dd>${normal} 秒<span>占整體 ${normalShare}%</span></dd></div><div><dt><span class="standard-time-key standard-time-allowance" aria-hidden="true"></span>寬放時間</dt><dd>${allowance} 秒<span>占整體 ${allowanceShare}%</span></dd></div></dl>
          <p class="standard-time-equation">${normal} 秒 ＋ ${allowance} 秒 ＝ <strong>${standard} 秒</strong></p>
          <p class="visual-takeaway">已知的 ${normal} 秒對應 ${normalShare}%，所以整體 100% ＝ ${normal} ÷ ${number(1 - allowanceRate)} ＝ ${standard} 秒。</p>
        </figure></section>`;
    }
    if (data.type === 'mps') return `<section class="expl-section expl-visual expl-mps"><h4>MPS 流程圖：把大方向變成可用的成品計畫</h4>
      <figure class="planning-flow"><figcaption>用「${esc(data.period)}完成 ${esc(data.product)} ${data.quantity} 件」作示意</figcaption>
        <div class="planning-source"><strong>總體生產計畫（APP）</strong><span>先看產品家族的整體供需與資源</span></div>
        <div class="planning-arrow" aria-hidden="true">↓</div>
        <div class="planning-main"><h5>主生產排程（MPS）</h5><dl><div><dt>做什麼？</dt><dd>${esc(data.product)}成品</dd></div><div><dt>做多少？</dt><dd>${data.quantity} 件</dd></div><div><dt>何時完成？</dt><dd>${esc(data.period)}</dd></div></dl></div>
        <p class="planning-arrow">↓ <span>以這份成品計畫為依據</span></p>
        <div class="planning-downstream"><div><strong>物料需求計畫（MRP）</strong><span>展開需要哪些零組件，以及數量與時間</span></div><div><strong>粗略產能規劃（RCCP）</strong><span>檢查關鍵資源能否支援這份計畫；不足時回饋修正 MPS</span></div></div>
        <p class="visual-takeaway">本題抓住三件事：成品品項、數量、完成期間。各工作站先做哪張工單，則屬更細的現場派工。</p>
      </figure></section>`;
    if (data.type === 'capacity') {
      const { required, available } = data, gap = required - available, share = 100 * available / required;
      return `<section class="expl-section expl-visual expl-capacity"><h4>產能負荷圖：排了 ${required} 小時，不代表做得完</h4>
        <figure class="capacity-figure"><figcaption>同一台機器、同一天；兩條長條使用相同工時刻度</figcaption>
          <div class="capacity-plot" role="img" aria-label="當日可用 ${available} 小時，需求 ${required} 小時，超載 ${gap} 小時，負荷為 ${100 * required / available}%">
            <span class="capacity-limit" style="left:${share}%"><span>當日上限 ${available} 小時</span></span>
            <div class="visual-lane-label">當日可用機時</div><div class="visual-track"><span class="visual-available" style="width:${share}%">${available} 小時</span></div>
            <div class="visual-lane-label">被排入當日的加工需求</div><div class="visual-track"><span class="visual-required" style="width:${share}%">可容納 ${available}</span><span class="visual-overload" style="width:${100 - share}%">超出 ${gap}</span></div>
            <div class="visual-axis"><span>0</span><span>${required} 小時</span></div>
          </div>
          <div class="capacity-metrics"><p>產能負荷<strong>${required} ÷ ${available} × 100% ＝ ${100 * required / available}%</strong></p><p>工時缺口<strong>${required} − ${available} ＝ ${gap} 小時</strong></p></div>
          <p class="visual-takeaway">「無限」是排程計算沒有把產能上限當作硬限制，機器實際仍只有 ${available} 小時可用。要補足或移走超出的 ${gap} 小時，需確認加班、替代設備、外包或改期是否可行。</p>
        </figure></section>`;
    }
    if (data.type === 'backward') {
      const { due, duration } = data, start = due - duration;
      return `<section class="expl-section expl-visual expl-backward"><h4>逆排程時間軸：先固定完工，再往前找開工</h4>
        <figure class="backward-figure"><figcaption>已知第 ${due} 小時要完工，總前置時間為 ${duration} 小時</figcaption>
          <p class="backward-direction">← 從完工時點往回扣 ${duration} 小時</p>
          <div class="backward-plot" role="img" aria-label="第 ${start} 小時開工，經過 ${duration} 小時，第 ${due} 小時完工">
            <div class="visual-track"><span class="backward-idle" style="width:${100 * start / due}%"></span><span class="visual-required" style="width:${100 * duration / due}%">${duration} 小時</span></div>
            <span class="backward-start" style="left:${100 * start / due}%">${start}</span><div class="visual-axis"><span>0</span><span>${due}</span></div>
          </div>
          <dl class="backward-milestones"><div><dt>求出的最晚開工時點</dt><dd>第 ${start} 小時</dd></div><div><dt>題目指定的完工時點</dt><dd>第 ${due} 小時</dd></div></dl>
          <p class="backward-formula">${due} − ${duration} ＝ <strong>${start}</strong><span>反算：${start} ＋ ${duration} ＝ ${due}，剛好準時完成</span></p>
          <p class="visual-takeaway">${duration} 小時是「要花多久」；第 ${start} 小時是「何時開工」。本題填的是時點 ${start}。此示意沿用題設連續 ${duration} 小時的前提。</p>
        </figure></section>`;
    }
    return '';
  }
  function render({ esc, icon }, question, { answer, order } = {}) {
    const detail = question.analysis || parse(question.explanation);
    const focus = (detail.focus || [])
      .filter(line => !detail.steps.some(step => key(step).includes(key(line))));
    const paragraphs = lines => lines.map(line => `<p class="expl-p">${esc(line)}</p>`).join('');
    const section = (title, body, type) => body ? `<section class="expl-section expl-${type}"><h4>${title}</h4>${body}</section>` : '';
    const focusHtml = section('破題關鍵', paragraphs(focus), 'focus');
    const steps = detail.steps || [];
    const solution = section(question.skill === 'calculation' || question.kind === 'number' ? '解題步驟' : '正解解析',
      steps.length > 1 ? `<ol class="expl-steps">${steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>` : paragraphs(steps), 'solution');
    let options = '';
    if (detail.options && question.kind === 'choice') {
      options = (order || question.options.map((_, index) => index)).map((index, slot) => {
        if (index === question.answer) return '';
        const selected = answer === index;
        return `<li class="expl-option${selected ? ' is-selected' : ''}" data-option-index="${index}"><div><strong>${'ABCD'[slot]}. ${esc(question.options[index])}</strong>${selected ? '<span class="expl-selected">你的選擇</span>' : ''}</div><p>${esc(detail.options[index])}</p></li>`;
      }).join('');
      options = `<ul class="expl-options">${options}</ul>`;
    }
    const pitfalls = section(options ? '選項辨析' : '重點辨析', options ||
      (detail.pitfalls?.length ? `<ul class="expl-pitfalls">${detail.pitfalls.map(line => `<li>${esc(line)}</li>`).join('')}</ul>` : ''), 'distinctions');
    const check = section('本題檢核', paragraphs(detail.check || []), 'check');
    const references = (detail.references || []).filter(ref => /^https:\/\//.test(ref.url)).map(ref =>
      `<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.title)}</a>`).join('、');
    const sources = references ? `<p class="expl-p expl-sources">參考依據：${references}</p>` : '';
    return `<div class="explanation-card"><div class="expl-card-head">${icon('bulb')}<strong>試題解析</strong></div>${focusHtml}${solution}${scheduleComparison(esc, detail.scheduleComparison)}${criticalRatio(detail.criticalRatio)}${explanationVisual(esc, detail.visual)}${pitfalls}${check}${sources}</div>`;
  }
  return { parse, render };
});
