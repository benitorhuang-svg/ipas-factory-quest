(function () { 'use strict';
function cleanMathTex(str) {
    if (!str) return '';
    return str
      .replace(/^\$\$([\s\S]*)\$\$$/, '$1')
      .replace(/^\$([\s\S]*)\$$/, '$1')
      .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
      .replace(/\\\\/g, '\\')
      // Give a degree superscript an explicit empty base after thin spacing.
      .replace(/\\,\s*\^\{\\circ\}/g, '\\,{}^{\\circ}')
      .trim();
  }

function formatMathFallback(tex) {
    let s = cleanMathTex(tex);

    // Escape HTML special characters
    s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Text tags: \text{...}
    s = s.replace(/\\text\{([^{}]+)\}/g, '$1');
    s = s.replace(/\\text\{([^{}]+)\}/g, '$1');

    // Fractions: \frac{A}{B} or \dfrac{A}{B}
    s = s.replace(/\\(?:d?frac)\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span class="math-num">$1</span><span class="math-denom">$2</span></span>');

    // Square roots: \sqrt{A}
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<span class="math-sqrt">&radic;<span class="math-radicand">$1</span></span>');

    // Overline / bar: \bar{X}
    s = s.replace(/\\bar\{([^{}]+)\}/g, '<span style="text-decoration:overline">$1</span>');

    // Math symbols & operators
    s = s.replace(/\\times/g, ' &times; ')
         .replace(/\\pm/g, '&plusmn;')
         .replace(/\\approx/g, '&asymp;')
         .replace(/\\le\b/g, '&le;')
         .replace(/\\ge\b/g, '&ge;')
         .replace(/\\cdot/g, '&middot;')
         .replace(/\\alpha/g, '&alpha;')
         .replace(/\\sigma/g, '&sigma;')
         .replace(/\\mu/g, '&mu;')
         .replace(/\\tau/g, '&tau;')
         .replace(/\\circ\b/g, '&deg;')
         .replace(/\\Delta/g, '&Delta;')
         .replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, '<span class="math-op">&sum;<sub class="math-sub">$1</sub><sup class="math-sup">$2</sup></span>')
         .replace(/\\sum_\{([^{}]+)\}/g, '<span class="math-op">&sum;<sub class="math-sub">$1</sub></span>')
         .replace(/\\sum/g, '&sum; ')
         .replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, '<span class="math-op">&int;<sub class="math-sub">$1</sub><sup class="math-sup">$2</sup></span>')
         .replace(/\\int/g, '&int; ')
         .replace(/\\min\b/g, 'min')
         .replace(/\\max\b/g, 'max')
         .replace(/\\lceil/g, '&lceil;')
         .replace(/\\rceil/g, '&rceil;')
         .replace(/\\lfloor/g, '&lfloor;')
         .replace(/\\rfloor/g, '&rfloor;')
         .replace(/\\left[([|.]/g, '(')
         .replace(/\\right[)\]|.]/g, ')')
         .replace(/\\quad/g, '&emsp;')
         .replace(/\\qquad/g, '&emsp;&emsp;')
         .replace(/\\displaystyle/g, '')
         .replace(/\\%/g, '%')
         .replace(/\\!/g, '')
         .replace(/\\,/g, ' ')
         .replace(/\\ /g, ' ');

    // Subscripts: _{...} or _x
    s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    s = s.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');

    // Superscripts: ^{...} or ^x
    s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    s = s.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');

    // Clean remaining backslashes
    s = s.replace(/\{\}/g, '');
    s = s.replace(/\\([a-zA-Z]+)/g, '$1');

    return s;
  }

function renderMathFormulas() {
    const hasKaTeX = Boolean(window.katex?.render && (!window.FactoryAssets?.mathReady || window.FactoryAssets.mathReady()));
    const blockSelector = hasKaTeX 
      ? '.math-block:not([data-math-done="katex"])' 
      : '.math-block:not([data-math-done])';
    const inlineSelector = hasKaTeX 
      ? '.math-inline:not([data-math-done="katex"])' 
      : '.math-inline:not([data-math-done])';

    const mathBlocks = document.querySelectorAll(blockSelector);
    const mathInlines = document.querySelectorAll(inlineSelector);

    if (mathBlocks.length === 0 && mathInlines.length === 0) return;

    mathBlocks.forEach(el => {
      let raw = el.getAttribute('data-raw-math');
      if (!raw) {
        raw = el.textContent.trim();
        el.setAttribute('data-raw-math', raw);
      }
      const tex = cleanMathTex(raw);
      if (hasKaTeX) {
        try {
          window.katex.render(tex, el, { displayMode: true, throwOnError: false });
          el.setAttribute('data-math-done', 'katex');
          return;
        } catch {}
      }
      el.innerHTML = formatMathFallback(tex);
      el.setAttribute('data-math-done', 'fallback');
    });

    mathInlines.forEach(el => {
      let raw = el.getAttribute('data-raw-math');
      if (!raw) {
        raw = el.textContent.trim();
        el.setAttribute('data-raw-math', raw);
      }
      const tex = cleanMathTex(raw);
      if (hasKaTeX) {
        try {
          window.katex.render(tex, el, { displayMode: false, throwOnError: false });
          el.setAttribute('data-math-done', 'katex');
          return;
        } catch {}
      }
      el.innerHTML = formatMathFallback(tex);
      el.setAttribute('data-math-done', 'fallback');
    });
  }
window.FactoryMath = { render: renderMathFormulas, format: formatMathFallback };
})();
