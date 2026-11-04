import { expandTerminology } from '@/utils/terminology';

type TrapSection = {
  title: string;
  content: string;
};

const TRAP_META = [
  ['🏭', '精實管理', '辨識七大浪費的核心因果'],
  ['⚙️', 'OEE', '分清六大損失歸屬'],
  ['📊', 'SPC', '選對 p、np、c、u 管制圖'],
  ['🔌', '工業通訊', '判讀 Modbus 暫存器讀寫權限'],
  ['🪞', '數位雙生', '掌握虛實資料流的差異'],
  ['🤖', '智慧物流', '區分固定導引與自主導航'],
  ['🔎', '品質檢測', '避免混淆漏檢與過檢'],
  ['🧾', '製造文件', '辨別 EBOM 與 MBOM 的用途'],
  ['⏱️', '工業工程', '判斷寬放率計算方式'],
  ['🎯', '生產排程', '依績效目標選派工法則'],
] as const;

function extractTrapSections(html: string): TrapSection[] {
  const source = document.createElement('div');
  source.innerHTML = html;
  const sections: TrapSection[] = [];
  let current: TrapSection | null = null;

  for (const child of Array.from(source.children)) {
    if (child.matches('h3.study-h3')) {
      const heading = child.cloneNode(true) as HTMLElement;
      heading.querySelectorAll('.katex-mathml').forEach((node) => node.remove());
      current = { title: heading.textContent?.trim() ?? '考題陷阱', content: '' };
      sections.push(current);
    } else if (current) {
      current.content += child.outerHTML;
    }
  }

  return sections;
}

function createDialog(): {
  dialog: HTMLDialogElement;
  title: HTMLElement;
  content: HTMLElement;
} {
  const dialog = document.createElement('dialog');
  dialog.className = 'trap-dialog';
  dialog.setAttribute('aria-labelledby', 'trap-dialog-title');

  const panel = document.createElement('div');
  panel.className = 'trap-dialog__panel';
  const header = document.createElement('header');
  header.className = 'trap-dialog__header';
  const title = document.createElement('h2');
  title.id = 'trap-dialog-title';
  title.className = 'trap-dialog__title';
  const close = document.createElement('button');
  close.className = 'trap-dialog__close';
  close.type = 'button';
  close.setAttribute('aria-label', '關閉詳解');
  close.textContent = '×';
  close.addEventListener('click', () => dialog.close());
  header.append(title, close);

  const content = document.createElement('div');
  content.className = 'trap-dialog__content';
  panel.append(header, content);
  dialog.appendChild(panel);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  return { dialog, title, content };
}

/** Creates compact cards and a native, keyboard-accessible detail dialog for APPX02. */
export function createTrapStudyCards(renderedHtml: string): HTMLElement {
  const sections = extractTrapSections(renderedHtml);
  const wrapper = document.createElement('section');
  wrapper.className = 'trap-study';
  wrapper.setAttribute('aria-label', '考古題盲點與常見陷阱');

  const intro = document.createElement('div');
  intro.className = 'trap-study__intro';
  intro.innerHTML = '<p>點選卡片查看考點、正解與常見誤區；Esc、右上角按鈕或點擊浮動框外圍皆可關閉。</p>';
  wrapper.appendChild(intro);

  const grid = document.createElement('div');
  grid.className = 'trap-card-grid';
  const { dialog, title, content } = createDialog();

  sections.forEach((section, index) => {
    const [icon, category, summary] = TRAP_META[index] ?? ['📝', '考題辨析', '查看完整解析'];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'trap-card';
    card.setAttribute('aria-haspopup', 'dialog');
    card.innerHTML = `
      <span class="trap-card__top"><span class="trap-card__number">陷阱 ${index + 1}</span><span class="trap-card__icon">${icon}</span></span>
      <span class="trap-card__category">${category}</span>
      <strong class="trap-card__title">${section.title.replace(/^陷阱 \d+：/, '')}</strong>
      <span class="trap-card__summary">${summary}</span>
      <span class="trap-card__action">查看詳解 <span aria-hidden="true">→</span></span>
    `;
    card.addEventListener('click', () => {
      title.textContent = section.title;
      content.innerHTML = section.content;
      expandTerminology(content);
      dialog.showModal();
    });
    grid.appendChild(card);
  });

  wrapper.append(grid, dialog);
  return wrapper;
}
