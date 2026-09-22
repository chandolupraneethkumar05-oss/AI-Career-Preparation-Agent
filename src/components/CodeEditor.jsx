import React, { useRef, useEffect, useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  RotateCcw,
  FileCode,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Badge from './Badge';

export default function CodeEditor({
  value = '',
  onChange = () => {},
  language = 'python',
  onLanguageChange,
  readOnly = false,
  placeholder = 'Write your code here...',
  minRows = 14,
  fileName,
  className = '',
  starterTemplate = '',
  supportedLanguages = [
    { id: 'python', name: 'Python 3', ext: 'py' },
    { id: 'javascript', name: 'JavaScript (Node)', ext: 'js' },
    { id: 'typescript', name: 'TypeScript', ext: 'ts' },
    { id: 'sql', name: 'SQL', ext: 'sql' },
    { id: 'cpp', name: 'C++ 20', ext: 'cpp' },
    { id: 'java', name: 'Java 17', ext: 'java' }
  ]
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Synchronize scroll between textarea and line number gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard handler for Tab, Shift+Tab, and Enter auto-indent
  const handleKeyDown = (e) => {
    if (readOnly) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value: currentVal } = textarea;

    // Handle Tab and Shift+Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabSpace = '  '; // 2 spaces

      if (e.shiftKey) {
        // Shift+Tab: Unindent
        const beforeCursor = currentVal.substring(0, selectionStart);
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        if (currentVal.substring(lineStart, lineStart + 2) === tabSpace) {
          const newVal = currentVal.substring(0, lineStart) + currentVal.substring(lineStart + 2);
          onChange(newVal);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, selectionStart - 2);
            textarea.selectionEnd = Math.max(lineStart, selectionEnd - 2);
          }, 0);
        }
      } else {
        // Tab: Insert 2 spaces
        if (selectionStart === selectionEnd) {
          const newVal = currentVal.substring(0, selectionStart) + tabSpace + currentVal.substring(selectionEnd);
          onChange(newVal);
          setTimeout(() => {
            textarea.selectionStart = selectionStart + 2;
            textarea.selectionEnd = selectionStart + 2;
          }, 0);
        } else {
          // Multi-line indent
          const beforeSelection = currentVal.substring(0, selectionStart);
          const lineStart = beforeSelection.lastIndexOf('\n') + 1;
          const selectedText = currentVal.substring(lineStart, selectionEnd);
          const indentedText = selectedText.split('\n').map(line => tabSpace + line).join('\n');
          const newVal = currentVal.substring(0, lineStart) + indentedText + currentVal.substring(selectionEnd);
          onChange(newVal);
          setTimeout(() => {
            textarea.selectionStart = selectionStart + 2;
            textarea.selectionEnd = lineStart + indentedText.length;
          }, 0);
        }
      }
    }

    // Handle Enter: Preserve indentation
    if (e.key === 'Enter') {
      e.preventDefault();
      const beforeCursor = currentVal.substring(0, selectionStart);
      const currentLine = beforeCursor.substring(beforeCursor.lastIndexOf('\n') + 1);
      const match = currentLine.match(/^(\s+)/);
      const indent = match ? match[1] : '';
      
      // Auto-indent further if line ends with colon or open brace
      const extraIndent = /[:{\[(]\s*$/.test(currentLine) ? '  ' : '';
      const insert = '\n' + indent + extraIndent;

      const newVal = currentVal.substring(0, selectionStart) + insert + currentVal.substring(selectionEnd);
      onChange(newVal);
      setTimeout(() => {
        const newPos = selectionStart + insert.length;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
      }, 0);
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (starterTemplate !== undefined) {
      onChange(starterTemplate);
    }
  };

  const lines = (value || '').split('\n');
  const lineCount = Math.max(lines.length, minRows);
  const currentLangObj = supportedLanguages.find(l => l.id === language) || supportedLanguages[0];
  const displayFileName = fileName || `solution.${currentLangObj?.ext || 'py'}`;
  const wordCount = (value || '').trim().split(/\s+/).filter(Boolean).length;
  const charCount = (value || '').length;

  return (
    <div className={`rounded-md border border-[#E5E0D5] bg-[#FAF8F3] overflow-hidden shadow-xs ${isExpanded ? 'fixed inset-4 z-50 flex flex-col bg-[#FAF8F3]' : ''} ${className}`}>
      {/* Editor Chrome Topbar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2 border-b border-[#E5E0D5] bg-[#F2EFE9] text-xs font-mono text-[#5C554B]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-[#1F1B16]">
            <FileCode className="w-3.5 h-3.5 text-[#1A365D]" />
            <span>{displayFileName}</span>
          </div>

          {onLanguageChange && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={readOnly}
              className="px-2 py-0.5 text-[11px] rounded border border-[#D5CFBF] bg-[#FFFDF9] text-[#1F1B16] font-mono focus:outline-none focus:border-[#1A365D]"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          )}

          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#EAE6DC] text-[#5C554B]">
            Tab = 2 Spaces
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#5C554B] hidden sm:inline">
            {lineCount} lines · {wordCount} words · {charCount} chars
          </span>

          {starterTemplate && !readOnly && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset to starter template"
              className="p-1 rounded hover:bg-[#E5E0D5] text-[#5C554B] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy Code'}
            className="p-1 rounded hover:bg-[#E5E0D5] text-[#5C554B] transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Exit Fullscreen' : 'Expand Editor'}
            className="p-1 rounded hover:bg-[#E5E0D5] text-[#5C554B] transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Body: Gutter + Textarea */}
      <div className={`relative flex font-mono text-xs ${isExpanded ? 'flex-1 overflow-hidden' : ''}`}>
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-11 py-3 pr-2.5 text-right text-[#8A8277] select-none bg-[#F7F4EC] border-r border-[#E5E0D5] leading-6 overflow-hidden shrink-0"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="text-[11px] font-mono">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Input Surface */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          disabled={readOnly}
          placeholder={placeholder}
          rows={minRows}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className={`flex-1 p-3 bg-transparent text-[#1F1B16] font-mono text-xs leading-6 resize-y focus:outline-none selection:bg-[#EAEFF5] border-none whitespace-pre overflow-auto ${
            isExpanded ? 'h-full resize-none' : ''
          }`}
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#F7F4EC] border-t border-[#E5E0D5] text-[10px] text-[#5C554B] font-mono">
        <div className="flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 rounded bg-[#EAE6DC] border border-[#D5CFBF]">Tab</kbd> indent</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#EAE6DC] border border-[#D5CFBF]">Shift+Tab</kbd> outdent</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#EAE6DC] border border-[#D5CFBF]">Enter</kbd> keep indent</span>
        </div>
        <div>
          <span>Deterministic analysis ready</span>
        </div>
      </div>
    </div>
  );
}
