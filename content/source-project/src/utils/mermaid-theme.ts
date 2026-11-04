import mermaid from 'mermaid';

/** Keep labels measurable; CSS variables let existing SVGs respond to theme changes. */
export function initializeStudyMermaid(): void {
  mermaid.initialize({
    startOnLoad: false, securityLevel: 'loose', theme: 'base', htmlLabels: true,
    themeVariables: {
      fontFamily: 'Inter, "Noto Sans TC", sans-serif', fontSize: '16px',
      primaryColor: '#eef2ff', primaryTextColor: '#1e293b', primaryBorderColor: '#a5b4fc',
      lineColor: '#6366f1', secondaryColor: '#f0fdfa', tertiaryColor: '#f8fafc',
      actorBkg: '#eef2ff', actorBorder: '#a5b4fc', actorTextColor: '#1e293b',
      noteBkgColor: '#fffbeb', noteTextColor: '#78350f', noteBorderColor: '#fcd34d',
      signalColor: '#6366f1', signalTextColor: '#334155',
    },
    themeCSS: `foreignObject > div { display:inline-block !important; width:max-content;
      max-width:280px; white-space:normal !important; overflow-wrap:normal; word-break:normal; line-height:1.6; }
      .nodeLabel p { margin:0; }`,
    flowchart: { wrappingWidth: 280, padding: 22, nodeSpacing: 44, rankSpacing: 60, curve: 'linear' },
    sequence: { actorMargin: 56, width: 190, height: 64, messageMargin: 44, noteMargin: 18, useMaxWidth: false, wrap: true },
  });
}
