import React from 'react';

// Helper to detect if a string contains corrupted characters / Mojibake from previous encodings
export function hasCorruptedEncoding(str) {
  if (!str || typeof str !== 'string') return false;
  // Box-drawing glyphs (CP437 mojibake) or UTF-8 bytes misread as Latin-1 ("Ã¡", "Ä‘", "á»").
  // Plain Vietnamese letters such as "ã" (đã, xã) must not match.
  return /[├│─┼┬┴└┘┐┌┤]|[ÃÂÄÆ][\u0080-¿‘-›]|á[»º]/.test(str);
}

// Helper to render inline markdown (bold, italic, inline code)
export function renderInlineMarkdown(text = '') {
  const tokens = text.split(/(\*\*[^*]+?\*\*|`[^`]+?`|\*[^*]+?\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-bold text-brand-navy-900 font-sans">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded-md bg-brand-sage-500/15 text-brand-sage-700 font-mono text-[11px] font-semibold border border-brand-sage-500/30"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={i} className="italic text-brand-navy-700">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

// Helper to parse block-level markdown into structured React elements
export function parseFormattedMarkdown(content = '') {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = (keyPrefix) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list-${elements.length}`} className="my-1.5 space-y-1.5 pl-0.5">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-brand-navy-700 leading-relaxed font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500 mt-1.5 shrink-0" />
              <div className="flex-1">{renderInlineMarkdown(item)}</div>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Bullet items
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const itemText = trimmed.replace(/^[\*\-•]\s+/, '');
      currentList.push(itemText);
      return;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList(`line-${lineIndex}`);
      elements.push(
        <div key={`num-${lineIndex}`} className="flex items-start gap-2 my-1.5 pl-0.5 text-xs text-brand-navy-700 leading-relaxed font-sans">
          <span className="w-4 h-4 rounded-full bg-brand-sage-500/20 text-brand-sage-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <div className="flex-1">{renderInlineMarkdown(numMatch[2])}</div>
        </div>
      );
      return;
    }

    flushList(`line-${lineIndex}`);

    if (!trimmed) {
      elements.push(<div key={`empty-${lineIndex}`} className="h-1" />);
      return;
    }

    // Headings: ###
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${lineIndex}`} className="text-xs font-bold text-brand-navy-900 mt-2 mb-1 flex items-center gap-1.5 font-sans">
          <span className="material-symbols-outlined text-[15px] text-brand-sage-500">sports_score</span>
          <span>{trimmed.replace(/^###\s+/, '')}</span>
        </h4>
      );
      return;
    }

    // Headings: ## or #
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={`h2-${lineIndex}`} className="text-xs sm:text-sm font-bold text-brand-navy-900 mt-2.5 mb-1 border-b border-brand-navy-100 pb-0.5 font-sans">
          {trimmed.replace(/^#+\s+/, '')}
        </h3>
      );
      return;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${lineIndex}`} className="p-2.5 my-1.5 bg-brand-sand-50 border-l-3 border-brand-sage-500 rounded-r-xl text-xs text-brand-navy-700 italic font-sans">
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${lineIndex}`} className="my-1 text-xs text-brand-navy-800 leading-relaxed font-sans">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList('final');
  return elements;
}
