import { h, div } from '@/utils/render';

const books = [
  { title: '作業管理', subtitle: 'Operations Management 12e', author: 'William J. Stevenson｜何應欽 譯｜華泰', subject: '科目一・生產與作業管理', color: '#164e63', art: 'grid', description: '科目一的作業管理核心教材，整理生產規劃、工作衡量、設施佈置、存貨管理與品質管制等主題。', chapters: ['第 9 章｜品質管制與製程能力：管制圖、Ca、Cp、Cpk', '第 10 章｜工作設計與衡量：測時、評比、寬放率、標準工時', '第 11 章｜位置與設施佈置：節拍時間、流水線平衡', '第 12–13 章｜存貨管理與 MRP／ERP：EOQ、EPQ、安全庫存、再訂購點'] },
  { title: '工業 4.0 理論與實務', subtitle: '智慧製造與系統整合', author: '國立臺北科技大學｜全華圖書', subject: '科目二・智慧製造生產線', color: '#1d4ed8', art: 'network', description: '建立工業 4.0 與智慧工廠的整體概念，理解工廠現場、企業系統和供應鏈如何串接。', chapters: ['工業 4.0 發展與智慧工廠藍圖', '垂直整合與水平整合', 'ISA-95 企業控制架構', 'MES 製造執行系統：排程、派工、追溯與品質管理'] },
  { title: '企業總合效率', subtitle: '工業 4.0 智慧工廠基礎', author: '劉季旋、羅宇容｜白象文化', subject: '科目一・科目二', color: '#166534', art: 'factory', description: '聚焦設備管理與工廠效率，從 TPM 推動、設備損失到 OEE 計算，串起現場改善的核心指標。', chapters: ['全面生產管理（TPM）與自主保全', '設備六大損失與改善方向', 'OEE 時間稼動率、性能稼動率、良品率', '整體設備效率的計算與應用'] },
  { title: '精實現場管理', subtitle: '豐田生產方式 40 年實務', author: '大野義男｜中衛發展中心', subject: '科目一・生產與作業管理', color: '#a16207', art: 'lean', description: '以豐田生產方式為主軸，介紹現場如何辨識浪費、建立拉式生產，並透過改善讓流程更順暢。', chapters: ['豐田生產方式與持續改善', '現場七大浪費與過量生產', '後拉式生產與看板管理', '防呆（Poka-Yoke）與 5S 目視化管理'] },
  { title: '從大數據到智慧生產與服務創新', subtitle: 'CPS・PHM・數位雙生', author: '李傑、倪軍、王安正｜前程文化', subject: '科目二・智慧製造生產線', color: '#5b21b6', art: 'data', description: '說明如何將設備資料轉化為生產與服務價值，涵蓋 CPS 架構、設備健康管理與預測性維護。', chapters: ['CPS 5C：連接、轉換、網路、認知、配置', 'PHM 設備故障預測與健康管理', '剩餘使用壽命（RUL）與振動訊號分析', '事後、預防到預測性維護的演進'] },
  { title: '物聯網實作', subtitle: '工業 4.0 基礎篇', author: '廖裕評、陸瑞強｜五南圖書', subject: '科目二・智慧製造生產線', color: '#0f766e', art: 'iot', description: '從工業感測器和現場資料採集出發，認識常見工業通訊協定與設備連線方式。', chapters: ['工業感測器：溫度、振動、光電與近接感測', 'RS-485、Modbus RTU／TCP', 'OPC UA 節點模型與資訊安全', 'MQTT 發布／訂閱與 QoS'] },
] as const;

const art = (kind: string, color: string) => {
  const patterns: Record<string, string> = {
    grid: '<path d="M0 20h240M0 60h240M0 100h240M40 0v150M90 0v150M140 0v150M190 0v150" stroke="white" stroke-opacity=".22"/><path d="M0 112h70l20-35 24 17h60l25-48 41 28" fill="none" stroke="#a5f3fc" stroke-width="5"/>',
    network: '<g fill="none" stroke="#bfdbfe" stroke-width="2"><path d="M35 35 90 60 145 25 200 62 160 112 90 95 35 35M90 60l-5 70 75-18M145 25l15 87M35 35l50 95"/></g><g fill="#fff"><circle cx="35" cy="35" r="7"/><circle cx="90" cy="60" r="8"/><circle cx="145" cy="25" r="6"/><circle cx="200" cy="62" r="8"/><circle cx="160" cy="112" r="7"/><circle cx="85" cy="130" r="6"/></g>',
    factory: '<path d="M0 120 48 82v24l45-34v32l48-37v53h99v30H0z" fill="#bbf7d0"/><path d="M35 54h24v25H35zm54-20h24v26H89zm54 10h24v30h-24z" fill="#dcfce7"/><path d="M0 145h240" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>',
    lean: '<path d="M0 122h240M30 122V72h54v50m26 0V50h54v72m27 0V82h28v40" fill="none" stroke="#fef3c7" stroke-width="7"/><path d="M25 57h64M105 34h60M180 66h40" stroke="#fff" stroke-opacity=".65" stroke-width="3"/>',
    data: '<path d="M0 125 35 95l30 14 34-55 28 34 35-52 36 25 42-40" fill="none" stroke="#ddd6fe" stroke-width="5"/><g fill="#fff"><circle cx="35" cy="95" r="5"/><circle cx="99" cy="54" r="5"/><circle cx="162" cy="36" r="5"/><circle cx="204" cy="21" r="5"/></g><path d="M0 140h240" stroke="white" stroke-opacity=".35"/>',
    iot: '<g fill="none" stroke="#ccfbf1" stroke-width="3"><circle cx="120" cy="75" r="18"/><path d="M89 75a31 31 0 0 1 62 0M75 75a45 45 0 0 1 90 0M120 94v39m-28 0h56"/></g><circle cx="120" cy="75" r="6" fill="white"/>',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="240" height="150" fill="url(#g)"/>${patterns[kind] ?? ''}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export function createReferenceBooks(): HTMLElement {
  const section = div('reference-books');
  section.append(h('h3', { className: 'reference-books__heading' }, '📚 官方列示參考書目'), h('p', { className: 'reference-books__intro' }, '官方僅列為應考參考方向，並非考試用書。點選封面可查看本教材建議的研讀章節與內容簡介。'));
  const grid = div('reference-books__grid');
  for (const [index, book] of books.entries()) {
    const card = h('button', { className: 'reference-book', type: 'button', 'aria-expanded': 'false' });
    const image = h('img', { className: 'reference-book__art', src: art(book.art, book.color), alt: `${book.title} 封面插圖`, loading: 'lazy' });
    const cover = div('reference-book__cover');
    cover.append(image, h('span', { className: 'reference-book__cover-kicker' }, `iPAS 參考書目 ${String(index + 1).padStart(2, '0')}`), h('span', { className: 'reference-book__cover-title' }, book.title), h('span', { className: 'reference-book__cover-subtitle' }, book.subtitle));
    card.append(cover, div('reference-book__meta', h('span', { className: 'reference-book__subject' }, book.subject), h('strong', {}, book.title), h('span', { className: 'reference-book__author' }, book.author), h('span', { className: 'reference-book__hint' }, '查看章節與簡介　＋')));
    const detail = div('reference-book__detail');
    detail.append(h('p', { className: 'reference-book__description' }, book.description), h('h4', {}, '建議研讀章節'));
    const list = h('ul', { className: 'reference-book__chapters' });
    for (const chapter of book.chapters) list.append(h('li', {}, chapter));
    detail.append(list);
    card.append(detail);
    card.addEventListener('click', () => {
      const open = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', String(!open));
      card.classList.toggle('reference-book--expanded', !open);
    });
    grid.append(card);
  }
  section.append(grid);
  return section;
}
